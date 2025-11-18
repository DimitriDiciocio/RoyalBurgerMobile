import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import OrderStatusBar from '../components/OrderStatusBar';
import OrderItemCard from '../components/OrderItemCard';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getOrderById } from '../services/orderService';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

export default function Acompanhar({ navigation, route }) {
  const isFocused = useIsFocused();
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const orderId = route?.params?.orderId;
  const orderStatusRef = useRef(null);

  const fetchEnderecos = async (userId) => {
    try {
      const enderecosData = await getCustomerAddresses(userId);
      setEnderecos(enderecosData || []);
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
      return points;
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      return 0;
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleEnderecoAtivoChange = (data) => {
    if (!data) return;
    
    if (typeof data === 'object' && data.type === 'refresh') {
      setEnderecos(data.enderecos);
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
      setEnderecoAtivo(data);
    }
  };

  const fetchOrder = async (orderId, silent = false) => {
    if (!orderId) return;
    
    try {
      if (!silent) {
        setLoadingOrder(true);
      }
      const orderData = await getOrderById(orderId);
      
      // Só atualiza o estado se o status mudou ou se é a primeira vez
      const currentStatus = orderStatusRef.current;
      const newStatus = orderData?.status;
      
      if (currentStatus !== newStatus) {
        orderStatusRef.current = newStatus;
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      if (!orderStatusRef.current) {
        setOrder(null);
      }
    } finally {
      if (!silent) {
        setLoadingOrder(false);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        if (ok) {
          const user = await getStoredUserData();
          
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            
            const normalized = {
              name: user.full_name || user.name || 'Usuário',
              points: points.toString(),
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
        setUserInfo(null);
        setEnderecos([]);
      }
    };
    checkAuth();
  }, [isFocused]);

  useEffect(() => {
    if (orderId) {
      // Resetar referência quando mudar de pedido
      orderStatusRef.current = null;
      fetchOrder(orderId);
      
      // Atualizar o pedido a cada 5 segundos para ver mudanças de status (silenciosamente)
      const interval = setInterval(() => {
        fetchOrder(orderId, true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [orderId, isFocused]);

  return (
    <View style={styles.container}>
      <Header 
        type="logged"
        userInfo={userInfo}
        navigation={navigation}
        title="Acompanhar Pedido"
        subtitle="Acompanhe o status do seu pedido"
        enderecos={enderecos}
        onEnderecoAtivoChange={handleEnderecoAtivoChange}
        loadingPoints={loadingPoints}
      />
      
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Barra de navegação */}
          <View style={styles.navigationBar}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.navigate('Pedidos')}
              activeOpacity={0.7}
            >
              <SvgXml
                xml={backArrowSvg}
                width={30}
                height={30}
              />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
            </View>
          </View>
          {loadingOrder ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC700" />
            </View>
          ) : order ? (
            <>
              <View style={styles.statusContainer}>
                <OrderStatusBar status={order.status || 'pending'} />
              </View>

              {/* Lista de itens do pedido */}
              {order.items && order.items.length > 0 && (
                <View style={styles.itemsSection}>
                  {order.items.map((item, index) => (
                    <OrderItemCard 
                      key={item.id || item.item_id || index} 
                      item={item} 
                    />
                  ))}
                </View>
              )}

              {/* Resumo de valores */}
              <View style={styles.resumoSection}>
                <Text style={styles.resumoTitulo}>Resumo de valores</Text>
                
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoLabel}>Subtotal</Text>
                  <Text style={styles.resumoValor}>
                    {(() => {
                      // Se tiver subtotal na API, usar ele
                      if (order.subtotal !== undefined) {
                        return `R$ ${(parseFloat(order.subtotal) || 0).toFixed(2).replace('.', ',')}`;
                      }
                      
                      // Senão, somar todos os item_subtotal dos itens
                      if (order.items && Array.isArray(order.items)) {
                        const subtotal = order.items.reduce((sum, item) => {
                          // item_subtotal já inclui produto + adicionais
                          const itemTotal = parseFloat(item.item_subtotal || item.subtotal || 0);
                          return sum + itemTotal;
                        }, 0);
                        return `R$ ${(subtotal || 0).toFixed(2).replace('.', ',')}`;
                      }
                      
                      return 'R$ 0,00';
                    })()}
                  </Text>
                </View>

                {(() => {
                  // Taxa de entrega só aparece se o pedido não for retirada no balcão
                  const isPickup = order.order_type === 'pickup';
                  const deliveryFee = order.delivery_fee !== undefined ? order.delivery_fee : 
                    (order.fees !== undefined ? order.fees : 0);
                  const hasDeliveryFee = !isPickup && parseFloat(deliveryFee) > 0;
                  
                  return hasDeliveryFee ? (
                    <View style={styles.resumoItem}>
                      <Text style={styles.resumoLabel}>Taxa de entrega</Text>
                      <Text style={styles.resumoValor}>
                        R$ {(parseFloat(deliveryFee) || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  ) : null;
                })()}

                <View style={styles.resumoItem}>
                  <Text style={styles.resumoTotalLabel}>Total</Text>
                  <Text style={styles.resumoTotalValor}>
                    {(() => {
                      const total = order.total_amount !== undefined ? order.total_amount : 
                        (order.total !== undefined ? order.total : 0);
                      return `R$ ${(parseFloat(total) || 0).toFixed(2).replace('.', ',')}`;
                    })()}
                  </Text>
                </View>

                <Text style={styles.pontosText}>
                  Nessa compra, você ganhou <Text style={styles.pontosDestaque}>
                    {(() => {
                      const points = order.loyalty_points_earned || order.points_earned || 0;
                      return points > 0 ? points : '0';
                    })()}
                  </Text> pontos Royal
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Pedido não encontrado</Text>
            </View>
          )}
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  statusContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  itemsSection: {
    marginTop: 20,
  },
  itemsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#888888',
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#F6F6F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  resumoSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  resumoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumoLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  resumoValor: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  resumoTotalLabel: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  resumoTotalValor: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  pontosText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    marginTop: -8,
  },
  pontosDestaque: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
});
