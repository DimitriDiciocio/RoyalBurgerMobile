import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';

export default function Pedidos({ navigation }) {
  const isFocused = useIsFocused();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);

  const fetchEnderecos = async (userId) => {
    try {
      const enderecosData = await getCustomerAddresses(userId);
      setEnderecos(enderecosData || []);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setEnderecos([]);
    }
  };

  const fetchLoyaltyBalance = async (userId) => {
    try {
      const balance = await getLoyaltyBalance(userId);
      const points = balance?.current_balance || 0;
      setLoyaltyBalance(points);
      return points;
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      setLoyaltyBalance(0);
      return 0;
    }
  };

  const handleEnderecoAtivoChange = (data) => {
    // Verificação de segurança para evitar erro quando data é null
    if (!data) return;
    
    if (typeof data === 'object' && data.type === 'refresh') {
      // Atualiza a lista de endereços
      setEnderecos(data.enderecos);
      // Se tem endereço ativo específico, usa ele, senão define baseado na lista
      if (data.enderecoAtivo) {
        setEnderecoAtivo(data.enderecoAtivo);
      } else if (data.enderecos && data.enderecos.length > 0) {
        const enderecoPadrao = data.enderecos.find(e => e.is_default === true || e.isDefault === true);
        if (enderecoPadrao) {
          setEnderecoAtivo(enderecoPadrao);
        } else {
          const enderecosOrdenados = [...data.enderecos].sort((a, b) => 
            new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
          );
          setEnderecoAtivo(enderecosOrdenados[0]);
        }
      }
    } else {
      // Endereço ativo mudou
      setEnderecoAtivo(data);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        setLoggedIn(!!ok);
        if (ok) {
          const user = await getStoredUserData();
          
          // Buscar endereços e pontos se o usuário estiver logado
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            
            // Normaliza campos esperados pelo Header APÓS buscar os pontos
            const normalized = {
              name: user.full_name || user.name || 'Usuário',
              points: points.toString(), // Usa os pontos da API
              address: user.address || undefined,
              avatar: undefined,
            };
            setUserInfo(normalized);
          } else {
            setUserInfo(null);
          }
        } else {
          setUserInfo(null);
          setEnderecos([]);
        }
      } catch (e) {
        setLoggedIn(false);
        setUserInfo(null);
        setEnderecos([]);
      }
    };
    checkAuth();
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Header 
        type="logged"
        userInfo={userInfo}
        navigation={navigation}
        title="Meus Pedidos"
        subtitle="Acompanhe seus pedidos"
        enderecos={enderecos}
        onEnderecoAtivoChange={handleEnderecoAtivoChange}
      />
      
      <View style={styles.content}>
        {/* Conteúdo dos pedidos será adicionado aqui */}
      </View>
      
      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});