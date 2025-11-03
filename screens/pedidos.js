import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import CardPedido from '../components/CardPedido';
import { isAuthenticated } from '../services/userService';
import { useUserCache } from '../hooks/useUserCache';
import { getMyOrders } from '../services/orderService';

export default function Pedidos({ navigation }) {
  const isFocused = useIsFocused();
  const { userInfo: cachedUserInfo, userData, addresses: cachedAddresses, isHeaderReady, loading: cacheLoading } = useUserCache();
  const [loggedIn, setLoggedIn] = useState(false);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Usa endereços do cache primeiro
  useEffect(() => {
    if (cachedAddresses.length > 0) {
      setEnderecos(cachedAddresses);
      const enderecoPadrao = cachedAddresses.find(e => e.is_default || e.isDefault);
      setEnderecoAtivo(enderecoPadrao || cachedAddresses[0] || null);
    }
  }, [cachedAddresses]);

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

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await getMyOrders();
      
      // A API agora retorna um array diretamente com items e total já incluídos (otimizado)
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (response && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response && Array.isArray(response.orders)) {
        ordersList = response.orders;
      }
      
      // Normalizar os dados - a API já retorna items e total, apenas normalizamos formato
      const normalizedOrders = ordersList.map(order => {
        // Items já vêm da API otimizada, apenas garante formato consistente
        const mappedItems = (order.items || []).map(item => ({
          quantity: item.quantity || 1,
          name: item.product_name || item.name,
          product_name: item.product_name || item.name
        }));
        
        // Normalizar endereço (já vem como objeto da API otimizada)
        let address = order.address;
        if (typeof address === 'string') {
          address = { street: address };
        } else if (!address || (typeof address === 'object' && !address.street)) {
          // Se não tem endereço mas tem address_id, usa fallback
          address = { street: 'Endereço não disponível' };
        } else if (address && typeof address === 'object') {
          // Preserva todos os campos do endereço (street, number, neighborhood, complement, etc)
          address = address;
        }
        
        return {
          id: order.order_id || order.id,
          status: order.status,
          created_at: order.created_at,
          order_id: order.order_id || order.id,
          items: mappedItems,
          total: order.total_amount || order.total || 0,
          order_total: order.total_amount || order.total || 0,
          address: address,
          confirmation_code: order.confirmation_code,
          order_type: order.order_type,
        };
      });
      
      // Ordenar pedidos por data (mais recentes primeiro)
      normalizedOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Define pedidos - não precisa mais buscar detalhes em background
      // A API otimizada já retorna tudo necessário
      setOrders(normalizedOrders);
      setLoadingOrders(false);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setOrders([]);
      setLoadingOrders(false);
    }
  };

  // Separar pedidos em andamento do histórico (usando useMemo para otimizar)
  const getOrdersInProgress = useMemo(() => {
    return orders.filter(pedido => {
      const status = pedido.status?.toLowerCase();
      return status === 'pending' || status === 'processing' || status === 'preparing';
    });
  }, [orders]);

  const getOrdersHistory = useMemo(() => {
    return orders.filter(pedido => {
      const status = pedido.status?.toLowerCase();
      return !(status === 'pending' || status === 'processing' || status === 'preparing');
    });
  }, [orders]);

  // Informações do cliente para CardPedido (usa cache) - DEVE VIR ANTES DE QUALQUER RETURN CONDICIONAL
  const customerInfo = useMemo(() => ({
    name: cachedUserInfo?.name || userData?.full_name || userData?.name || 'Usuário',
    nomeCompleto: userData?.full_name || userData?.name || 'Usuário',
    telefone: userData?.phone || userData?.telefone,
    phone: userData?.phone || userData?.telefone,
  }), [cachedUserInfo?.name, userData]);

  const handleAcompanharPedido = (pedido) => {
    // Mock: Por enquanto apenas mostra um alerta
    console.log('Acompanhar pedido:', pedido.id);
    alert(`Acompanhando pedido #${pedido.id}\n\nEm breve, você poderá acompanhar o status do seu pedido em tempo real!`);
    // TODO: navigation.navigate('AcompanharPedido', { orderId: pedido.id });
  };

  const handleVerDetalhes = (pedido) => {
    // TODO: Implementar navegação para tela de detalhes
    console.log('Ver detalhes do pedido:', pedido.id);
    // navigation.navigate('DetalhesPedido', { orderId: pedido.id });
  };

  const handleAdicionarCesta = (pedido) => {
    // TODO: Implementar adição dos itens do pedido à cesta
    console.log('Adicionar à cesta:', pedido.id);
    // Implementar lógica para adicionar itens do pedido ao carrinho
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        setLoggedIn(!!ok);
        if (ok && userData?.id) {
          // Usa endereços do cache se disponíveis
          if (cachedAddresses.length > 0) {
            setEnderecos(cachedAddresses);
            const enderecoPadrao = cachedAddresses.find(e => e.is_default || e.isDefault);
            setEnderecoAtivo(enderecoPadrao || cachedAddresses[0] || null);
          }
          
          // Busca pedidos imediatamente (sem esperar endereços/pontos)
          // Isso permite que a tela carregue mais rápido
          fetchOrders();
        } else {
          setOrders([]);
          setLoadingOrders(false);
        }
      } catch (e) {
        console.error('Erro ao verificar autenticação:', e);
        setLoggedIn(false);
        setOrders([]);
        setLoadingOrders(false);
      }
    };
    checkAuth();
  }, [isFocused, userData?.id, cachedAddresses]);

  // Não renderiza enquanto header não estiver pronto
  if (!isHeaderReady || cacheLoading || !cachedUserInfo?.name) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFC700" style={{ flex: 1, justifyContent: 'center' }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        type="logged"
        navigation={navigation}
        title="Meus Pedidos"
        subtitle="Acompanhe seus pedidos"
        enderecos={enderecos.length > 0 ? enderecos : cachedAddresses}
        onEnderecoAtivoChange={handleEnderecoAtivoChange}
      />
      
      <View style={styles.content}>
        {loadingOrders ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFC107" />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Ainda sem pedidos registrados? O trono da Royal Burger está à sua espera, pronto para um sabor real!
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.ctaButtonText}>Ir para o início</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.ordersList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Pedidos em andamento */}
            {getOrdersInProgress.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pedidos em andamento</Text>
                {getOrdersInProgress.map((pedido) => (
                  <CardPedido
                    key={pedido.id}
                    pedido={pedido}
                    customerInfo={customerInfo}
                    onAcompanhar={handleAcompanharPedido}
                    onVerDetalhes={handleVerDetalhes}
                    onAdicionarCesta={handleAdicionarCesta}
                  />
                ))}
              </>
            )}

            {/* Histórico de pedidos */}
            {getOrdersHistory.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, getOrdersInProgress.length > 0 && styles.sectionTitleWithMargin]}>
                  Histórico de pedidos
                </Text>
                {getOrdersHistory.map((pedido) => (
                  <CardPedido
                    key={pedido.id}
                    pedido={pedido}
                    customerInfo={customerInfo}
                    onAcompanhar={handleAcompanharPedido}
                    onVerDetalhes={handleVerDetalhes}
                    onAdicionarCesta={handleAdicionarCesta}
                  />
                ))}
              </>
            )}

            {/* Mensagem quando não há pedidos */}
            {getOrdersInProgress.length === 0 && getOrdersHistory.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  Ainda sem pedidos registrados? O trono da Royal Burger está à sua espera, pronto para um sabor real!
                </Text>
                <TouchableOpacity
                  style={styles.ctaButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.ctaButtonText}>Ir para o início</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
      
      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} currentRoute="Pedidos" />
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
  ordersList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
    marginBottom: 16,
    marginTop: 0,
  },
  sectionTitleWithMargin: {
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  ctaButton: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '600',
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});