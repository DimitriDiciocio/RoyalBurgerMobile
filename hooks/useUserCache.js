import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUserData, refreshUserProfile, updateUserCache } from '../services/userService';
import { getLoyaltyBalance, getCustomerAddresses } from '../services/customerService';

/**
 * Hook para gerenciar cache do usuário
 * Fornece dados do usuário do AsyncStorage e funções para atualizar
 */
export const useUserCache = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Carrega endereços do cache ou da API
  const loadAddresses = useCallback(async (userId) => {
    if (!userId) {
      setAddresses([]);
      setDefaultAddress(null);
      return;
    }

    try {
      setLoadingAddresses(true);
      
      // Tenta carregar do cache primeiro
      try {
        const cachedAddresses = await AsyncStorage.getItem('user_addresses');
        if (cachedAddresses) {
          const parsedAddresses = JSON.parse(cachedAddresses);
          if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
            setAddresses(parsedAddresses);
            const defaultAddr = parsedAddresses.find(e => e.is_default || e.isDefault);
            setDefaultAddress(defaultAddr || parsedAddresses[0] || null);
          }
        }
      } catch (e) {
        console.warn('Erro ao parsear endereços do cache:', e);
      }
      
      // Busca da API para atualizar (background) - apenas se não tiver cache ou se precisar atualizar
      try {
        const addressesData = await getCustomerAddresses(userId);
        
        // Se retornou array vazio ou null, mantém o que estava no cache ou limpa
        if (Array.isArray(addressesData)) {
          if (addressesData.length > 0) {
            setAddresses(addressesData);
            await AsyncStorage.setItem('user_addresses', JSON.stringify(addressesData));
            
            const defaultAddr = addressesData.find(e => e.is_default || e.isDefault);
            setDefaultAddress(defaultAddr || addressesData[0] || null);
            
            // Atualiza cache do usuário com endereço padrão (sem atualizar tudo para evitar loops)
            if (defaultAddr) {
              const currentUser = await getStoredUserData();
              if (currentUser) {
                await updateUserCache({ 
                  default_address: defaultAddr,
                  id: currentUser.id // Preserva o ID para evitar loops
                });
              }
            }
          } else {
            // Array vazio - limpa cache e estado
            setAddresses([]);
            setDefaultAddress(null);
            await AsyncStorage.removeItem('user_addresses');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar endereços da API:', error);
        // Se falhar, mantém o cache se existir
        // Não limpa os endereços se já tiver carregado do cache
        if (addresses.length === 0) {
          setAddresses([]);
          setDefaultAddress(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      // Em caso de erro geral, limpa se não tiver nada
      if (addresses.length === 0) {
        setAddresses([]);
        setDefaultAddress(null);
      }
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // Carrega dados do usuário do cache
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const cachedUser = await getStoredUserData();
      
      if (!cachedUser?.id) {
        setUserData(null);
        setLoading(false);
        return;
      }
      
      setUserData(cachedUser);
      
      // Carrega pontos do cache primeiro
      const cachedPoints = cachedUser.loyalty_points || cachedUser.loyalty_points_amount;
      if (cachedPoints !== undefined && cachedPoints !== null) {
        setLoyaltyPoints(cachedPoints);
      }
      
      // Carrega endereços do cache primeiro (renderização rápida)
      try {
        await loadAddresses(cachedUser.id);
      } catch (error) {
        console.error('Erro ao carregar endereços:', error);
        // Continua mesmo se falhar ao carregar endereços
      }
      
      // Busca pontos atualizados em background apenas uma vez (se não tiver no cache)
      if (cachedPoints === undefined || cachedPoints === null) {
        // Aguarda um pouco para não sobrecarregar a API
        setTimeout(async () => {
          try {
            setLoadingPoints(true);
            const balance = await getLoyaltyBalance(cachedUser.id);
            const points = balance?.current_balance || 0;
            setLoyaltyPoints(points);
            // Não atualiza o cache aqui para evitar loops, apenas salva os pontos
            const updatedUser = await getStoredUserData();
            if (updatedUser) {
              await updateUserCache({ 
                loyalty_points: points, 
                loyalty_data: balance,
                id: updatedUser.id // Preserva o ID
              });
            }
          } catch (error) {
            console.error('Erro ao buscar pontos:', error);
          } finally {
            setLoadingPoints(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [loadAddresses]);

  // Atualiza pontos de fidelidade (apenas quando explicitamente chamado)
  const refreshPoints = useCallback(async () => {
    const currentUser = await getStoredUserData();
    if (!currentUser?.id) return;
    
    try {
      setLoadingPoints(true);
      const balance = await getLoyaltyBalance(currentUser.id);
      const points = balance?.current_balance || 0;
      setLoyaltyPoints(points);
      
      // Atualiza cache com pontos (sem atualizar tudo para evitar loops)
      await updateUserCache({ 
        loyalty_points: points,
        loyalty_data: balance,
        id: currentUser.id // Preserva o ID
      });
    } catch (error) {
      console.error('Erro ao atualizar pontos:', error);
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  // Atualiza perfil completo do usuário (sincroniza com servidor)
  const refreshUserData = useCallback(async () => {
    try {
      setLoading(true);
      const updatedUser = await refreshUserProfile();
      setUserData(updatedUser);
      
      // Atualiza pontos também (apenas uma vez, sem recursão)
      if (updatedUser?.id) {
        try {
          const balance = await getLoyaltyBalance(updatedUser.id);
          const points = balance?.current_balance || 0;
          setLoyaltyPoints(points);
          // Não chama refreshPoints para evitar loops
        } catch (error) {
          console.error('Erro ao buscar pontos ao atualizar perfil:', error);
        }
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Retorna dados do cache se falhar
      const cachedUser = await getStoredUserData();
      setUserData(cachedUser);
      return cachedUser;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza cache localmente sem buscar do servidor
  const updateCache = useCallback(async (newData) => {
    try {
      await updateUserCache(newData);
      const updatedUser = await getStoredUserData();
      setUserData(updatedUser);
      
      // Se atualizou pontos, atualiza estado também
      if (newData.loyalty_points !== undefined) {
        setLoyaltyPoints(newData.loyalty_points);
      }
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    }
  }, []);

  // Carrega dados na inicialização
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Atualiza endereços
  const refreshAddresses = useCallback(async () => {
    if (!userData?.id) return;
    await loadAddresses(userData.id);
  }, [userData, loadAddresses]);

  // Atualiza endereço padrão no cache
  const updateDefaultAddress = useCallback(async (address) => {
    try {
      setDefaultAddress(address);
      await updateUserCache({ default_address: address });
      
      // Atualiza lista de endereços também
      if (addresses.length > 0) {
        const updatedAddresses = addresses.map(a => ({
          ...a,
          is_default: a.id === address.id,
          isDefault: a.id === address.id,
        }));
        setAddresses(updatedAddresses);
        await AsyncStorage.setItem('user_addresses', JSON.stringify(updatedAddresses));
      }
    } catch (error) {
      console.error('Erro ao atualizar endereço padrão:', error);
    }
  }, [addresses]);

  // Retorna dados formatados para o Header
  const getUserInfo = useCallback(() => {
    if (!userData) return null;
    
    // Formata endereço para exibição
    const formatAddress = (addr) => {
      if (!addr) return undefined;
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.number) parts.push(addr.number);
      return parts.length > 0 ? parts.join(', ') : undefined;
    };
    
    const addressToShow = defaultAddress || userData.default_address;
    
    return {
      name: userData.full_name || userData.name || 'Usuário',
      points: loyaltyPoints?.toString() || userData.loyalty_points?.toString() || '0',
      address: formatAddress(addressToShow) || userData.address || undefined,
      avatar: userData.avatar || undefined,
    };
  }, [userData, loyaltyPoints, defaultAddress]);

  // Verifica se o header está pronto (tem todos os dados necessários)
  const isHeaderReady = useCallback(() => {
    if (loading) return false;
    if (!userData) return false;
    // Não precisa esperar pontos/endereços carregarem completamente para mostrar header
    // Mas precisa ter pelo menos os dados básicos do usuário
    return true;
  }, [loading, userData]);

  return {
    userData,
    userInfo: getUserInfo(),
    loading,
    loyaltyPoints,
    loadingPoints,
    addresses,
    defaultAddress,
    loadingAddresses,
    refreshUserData,
    refreshPoints,
    refreshAddresses,
    updateCache,
    updateDefaultAddress,
    reload: loadUserData,
    isHeaderReady: isHeaderReady(),
  };
};

