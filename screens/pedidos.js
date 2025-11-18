import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import CardPedido from '../components/CardPedido';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getMyOrders, getOrderById } from '../services/orderService';

export default function Pedidos({ navigation }) {
  const isFocused = useIsFocused();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchEnderecos = async (userId) => {
    try {
      const enderecosData = await getCustomerAddresses(userId);
      setEnderecos(enderecosData || []);
      // Selecionar endereço padrão
      const enderecoPadrao = enderecosData?.find(e => e.is_default || e.isDefault);
      setEnderecoAtivo(enderecoPadrao || null);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setEnderecos([]);
      setEnderecoAtivo(null);
    }
  };

  const fetchLoyaltyBalance = async (userId) => {
    try {
      setLoadingPoints(true);
      const balance = await getLoyaltyBalance(userId);
      const points = balance?.current_balance || 0;
      setLoyaltyBalance(points);
      return points;
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      setLoyaltyBalance(0);
      return 0;
    } finally {
      setLoadingPoints(false);
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

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      console.log('[Pedidos] Buscando pedidos...');
      const response = await getMyOrders();
      console.log('[Pedidos] Resposta da API:', response);
      
      // A API retorna um array diretamente ou um objeto com data
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (response && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response && Array.isArray(response.orders)) {
        ordersList = response.orders;
      } else if (response && response.items && Array.isArray(response.items)) {
        ordersList = response.items;
      }
      
      console.log('[Pedidos] Total de pedidos encontrados:', ordersList.length);
      
      // Buscar detalhes completos de cada pedido se não tiver items/total
      const ordersWithDetails = await Promise.all(ordersList.map(async (order) => {
        // Se já tem items e total, retorna como está
        if (order.items && order.items.length > 0 && (order.total_amount || order.total)) {
          return order;
        }
        
        // Caso contrário, busca detalhes completos
        try {
          const orderId = order.order_id || order.id;
          const details = await getOrderById(orderId);
          
          // Combina dados básicos com detalhes completos
          return {
            ...order,
            ...details,
            items: details?.items || order.items || [],
            total: details?.total_amount || order.total_amount || order.total,
            address: details?.address || order.address
          };
        } catch (error) {
          console.error(`Erro ao buscar detalhes do pedido ${order.order_id}:`, error);
          return order;
        }
      }));
      
      // Normalizar os dados para o formato esperado pelo CardPedido
      const normalizedOrders = ordersWithDetails.map(order => {
        // Mapear items para o formato esperado
        const mappedItems = (order.items || []).map(item => ({
          quantity: item.quantity,
          name: item.product_name || item.name,
          product_name: item.product_name || item.name
        }));
        
        // Normalizar endereço
        let address = order.address;
        if (typeof address === 'string') {
          address = { street: address };
        } else if (!address && order.address_id) {
          // Se não tem endereço mas tem address_id, pode buscar depois
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
          total: order.total_amount || order.total,
          order_total: order.total_amount || order.total,
          address: address,
          confirmation_code: order.confirmation_code,
          order_type: order.order_type
        };
      });
      
      // Ordenar pedidos por data (mais recentes primeiro)
      normalizedOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('[Pedidos] Pedidos normalizados:', normalizedOrders.length);
      console.log('[Pedidos] Primeiro pedido:', normalizedOrders[0]);
      
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Separar pedidos em andamento do histórico
  const getOrdersInProgress = () => {
    return orders.filter(pedido => {
      const status = pedido.status?.toLowerCase();
      return status === 'pending' || status === 'processing' || status === 'preparing';
    });
  };

  const getOrdersHistory = () => {
    return orders.filter(pedido => {
      const status = pedido.status?.toLowerCase();
      return !(status === 'pending' || status === 'processing' || status === 'preparing');
    });
  };

  const handleAcompanharPedido = (pedido) => {
    // ALTERAÇÃO: Navegar para a página de acompanhar pedido
    const orderId = pedido.id || pedido.order_id;
    navigation.navigate('Acompanhar', { orderId });
  };

  const handleVerDetalhes = (pedido) => {
    // ALTERAÇÃO: Navegar para a página de acompanhar pedido
    const orderId = pedido.id || pedido.order_id;
    navigation.navigate('Acompanhar', { orderId });
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
        if (ok) {
          const user = await getStoredUserData();
          
          // Buscar endereços e pontos se o usuário estiver logado
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            await fetchOrders();
            
            // Normaliza campos esperados pelo Header APÓS buscar os pontos
            const normalized = {
              name: user.full_name || user.name || 'Usuário',
              points: points.toString(), // Usa os pontos da API
              address: user.address || undefined,
              avatar: undefined,
            };
            setUserInfo(normalized);
            
            // Salvar informações do cliente para usar no CardPedido
            setCustomerInfo({
              name: user.full_name || user.name || 'Usuário',
              nomeCompleto: user.full_name || user.name,
              telefone: user.phone || user.telefone,
              phone: user.phone || user.telefone,
            });
          } else {
            setUserInfo(null);
            setLoadingOrders(false);
          }
        } else {
          setUserInfo(null);
          setEnderecos([]);
          setOrders([]);
          setLoadingOrders(false);
        }
      } catch (e) {
        setLoggedIn(false);
        setUserInfo(null);
        setEnderecos([]);
        setOrders([]);
        setLoadingOrders(false);
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
        loadingPoints={loadingPoints}
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
            {getOrdersInProgress().length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pedidos em andamento</Text>
                {getOrdersInProgress().map((pedido) => (
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
            {getOrdersHistory().length > 0 && (
              <>
                <Text style={[styles.sectionTitle, getOrdersInProgress().length > 0 && styles.sectionTitleWithMargin]}>
                  Histórico de pedidos
                </Text>
                {getOrdersHistory().map((pedido) => (
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
            {getOrdersInProgress().length === 0 && getOrdersHistory().length === 0 && (
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