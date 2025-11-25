import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance, getLoyaltyHistory, calculateDaysUntilExpiration, getLoyaltyPointsFromCache } from '../services/customerService';
import { getOrderById } from '../services/orderService';

// SVG do ícone da coroa
const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#FFD700"/>
</svg>`;

export default function HistoricoPontos({ navigation }) {
  const isFocused = useIsFocused();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  // ALTERAÇÃO: Inicializar com pontos do cache (null se não houver)
  const [loyaltyBalance, setLoyaltyBalance] = useState(null);
  
  // ALTERAÇÃO: Carregar pontos do cache ao montar o componente
  useEffect(() => {
    const loadCachedPoints = async () => {
      const cachedPoints = await getLoyaltyPointsFromCache();
      if (cachedPoints !== null) {
        setLoyaltyBalance(cachedPoints);
      }
    };
    loadCachedPoints();
  }, []);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
      // ALTERAÇÃO: Carregar pontos do cache primeiro para exibição imediata
      const cachedPoints = await getLoyaltyPointsFromCache();
      if (cachedPoints !== null) {
        setLoyaltyBalance(cachedPoints);
      }
      
      // Buscar pontos atualizados da API
      const balance = await getLoyaltyBalance(userId);
      const points = balance?.current_balance ?? null;
      setLoyaltyBalance(points);
      setLoyaltyData(balance);
      return points;
    } catch (error) {
      // ALTERAÇÃO: Em caso de erro, usar cache se disponível
      const cachedPoints = await getLoyaltyPointsFromCache();
      setLoyaltyBalance(cachedPoints);
      
      const isDev = __DEV__;
      if (isDev) {
        console.error('Erro ao buscar pontos:', error);
      }
      setLoyaltyBalance(0);
      setLoyaltyData(null);
      return 0;
    } finally {
      setLoadingPoints(false);
    }
  };

  // Função para calcular dias restantes até expiração
  const getDaysUntilExpiration = () => {
    if (!loyaltyData) {
      return 0;
    }
    
    // A API retorna a data de expiração como 'expiration_date' no formato 'YYYY-MM-DD'
    if (loyaltyData.expiration_date) {
      return calculateDaysUntilExpiration(loyaltyData.expiration_date);
    }
    
    // Se não tiver data de expiração, retorna 0 (não mostra mensagem de expiração)
    return 0;
  };

  const fetchLoyaltyHistory = async (userId) => {
    try {
      setLoadingHistory(true);
      const historyData = await getLoyaltyHistory(userId);
      
      console.log('Histórico retornado pela API:', historyData); // Debug
      
      // A API pode retornar um array diretamente ou um objeto com history/data
      let historyList = [];
      if (Array.isArray(historyData)) {
        historyList = historyData;
      } else if (historyData && Array.isArray(historyData.history)) {
        historyList = historyData.history;
      } else if (historyData && Array.isArray(historyData.data)) {
        historyList = historyData.data;
      } else if (historyData && historyData.transactions && Array.isArray(historyData.transactions)) {
        historyList = historyData.transactions;
      }
      
      // Incluir todas as transações (ganhos e gastos)
      // Não filtrar por type, mostrar todas as transações
      const filteredHistory = historyList
        .filter(entry => {
          // Aceita transações com pontos diferentes de zero (positivos = ganho, negativos = gasto)
          const points = entry.points || entry.points_earned || entry.points_amount || 0;
          return points !== 0; // Mostra ganhos e gastos
        })
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.date || a.transaction_date || a.timestamp || 0);
          const dateB = new Date(b.created_at || b.date || b.transaction_date || b.timestamp || 0);
          return dateB - dateA; // Mais recente primeiro
        });
      
      // Buscar detalhes dos pedidos para entradas que têm order_id mas não têm order completo
      // Primeiro, identificamos quais order_ids únicos precisam ser buscados
      const orderIdsToFetch = new Set();
      filteredHistory.forEach(entry => {
        if (!entry.order || !entry.order.items) {
          const orderId = entry.order_id || entry.orderId;
          // Valida se orderId é um número válido
          if (orderId && !isNaN(Number(orderId)) && Number(orderId) > 0) {
            orderIdsToFetch.add(Number(orderId));
          }
        }
      });
      
      // Limita a busca a no máximo 20 pedidos para evitar sobrecarga
      const orderIdsArray = Array.from(orderIdsToFetch).slice(0, 20);
      
      // Busca os detalhes dos pedidos em lote (evita múltiplas chamadas)
      const orderDetailsMap = new Map();
      if (orderIdsArray.length > 0) {
        // Busca pedidos em paralelo, mas com tratamento de erro individual e rate limiting
        const fetchPromises = orderIdsArray.map(async (orderId, index) => {
          try {
            // Adiciona um delay progressivo para evitar rate limiting (máx 200ms por chamada)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, Math.min(index * 50, 200)));
            }
            
            const orderDetails = await getOrderById(orderId);
            if (orderDetails && (orderDetails.id || orderDetails.order_id)) {
              return { orderId, orderDetails };
            }
            return null;
          } catch (error) {
            // Erro silencioso - pode ser que o pedido não exista mais, não tenha permissão, ou já foi deletado
            // Apenas loga erros inesperados (não 404/403 que são esperados)
            const status = error.response?.status;
            if (status !== 404 && status !== 403 && status !== 401) {
              console.warn(`Erro ao buscar pedido ${orderId}:`, status || error.message);
            }
            return null;
          }
        });
        
        // Usa Promise.allSettled para não falhar toda a operação se alguns pedidos falharem
        const results = await Promise.allSettled(fetchPromises);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            orderDetailsMap.set(result.value.orderId, result.value.orderDetails);
          }
        });
      }
      
      // Enriquece o histórico com os detalhes dos pedidos encontrados
      const enrichedHistory = filteredHistory.map(entry => {
        // Se já tem order completo, retorna como está
        if (entry.order && entry.order.items) {
          return entry;
        }
        
        // Se tem order_id, busca nos detalhes já buscados
        const orderId = entry.order_id || entry.orderId;
        if (orderId && orderDetailsMap.has(Number(orderId))) {
          return {
            ...entry,
            order: orderDetailsMap.get(Number(orderId))
          };
        }
        
        return entry;
      });
      
      console.log('Histórico enriquecido:', enrichedHistory); // Debug
      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Erro ao buscar histórico de pontos:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
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

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para formatar valor em Real
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para gerar descrição da transação (compra ou uso de pontos)
  const getPurchaseDescription = (entry) => {
    const isSpent = isPointsSpent(entry);
    
    // Se for gasto de pontos, descrição específica
    if (isSpent) {
      // Tenta buscar items do pedido para mostrar o que foi comprado com desconto
      if (entry.order && entry.order.items && Array.isArray(entry.order.items) && entry.order.items.length > 0) {
        const items = entry.order.items;
        return `Você utilizou pontos como desconto na compra: ${formatItemsDescription(items)}`;
      }
      
      // Se tem order_id, mostra a compra
      if (entry.order_id || entry.orderId) {
        const orderId = entry.order_id || entry.orderId;
        if (entry.reason) {
          return `Você utilizou pontos como desconto: ${entry.reason}`;
        }
        return `Você utilizou pontos como desconto na compra #${orderId}`;
      }
      
      // Fallback para gasto
      if (entry.reason) {
        return `Você utilizou pontos: ${entry.reason}`;
      }
      return 'Você utilizou pontos como desconto';
    }
    
    // Se for ganho de pontos (compra realizada)
    // Tenta buscar items do pedido
    if (entry.order && entry.order.items && Array.isArray(entry.order.items) && entry.order.items.length > 0) {
      const items = entry.order.items;
      return formatItemsDescription(items);
    }
    
    // Tenta buscar items direto na entry
    if (entry.items && Array.isArray(entry.items) && entry.items.length > 0) {
      return formatItemsDescription(entry.items);
    }
    
    // Se tem order_id mas não tem items, tenta usar reason com order_id
    if (entry.order_id || entry.orderId) {
      const orderId = entry.order_id || entry.orderId;
      if (entry.reason) {
        return entry.reason;
      }
      return `Você realizou a compra #${orderId}`;
    }
    
    // Fallback: usar reason ou descrição genérica
    if (entry.reason) {
      // Se reason contém informações sobre a compra, usa ela
      if (entry.reason.toLowerCase().includes('compra') || entry.reason.toLowerCase().includes('pedido')) {
        return entry.reason;
      }
      // Se não, usa reason mesmo assim
      return entry.reason;
    }
    
    // Último fallback
    return 'Você realizou uma compra';
  };

  // Função auxiliar para formatar descrição de items
  const formatItemsDescription = (items) => {
    if (!items || items.length === 0) {
      return 'Você realizou uma compra';
    }
    
    if (items.length === 1) {
      const item = items[0];
      const quantity = item.quantity || 1;
      const name = item.product_name || item.name || 'Item';
      return `Você comprou ${quantity > 1 ? `${quantity} ${name}` : `um ${name}`}`;
    } else if (items.length === 2) {
      const item1 = items[0];
      const item2 = items[1];
      const qty1 = item1.quantity || 1;
      const qty2 = item2.quantity || 1;
      const name1 = item1.product_name || item1.name || 'Item';
      const name2 = item2.product_name || item2.name || 'Item';
      return `Você comprou ${qty1 > 1 ? `${qty1} ${name1}` : `um ${name1}`} e ${qty2 > 1 ? `${qty2} ${name2}` : `um ${name2}`}`;
    } else {
      const firstItem = items[0];
      const remainingCount = items.slice(1).reduce((sum, item) => sum + (item.quantity || 1), 0);
      const qty1 = firstItem.quantity || 1;
      const name1 = firstItem.product_name || firstItem.name || 'Item';
      if (remainingCount === 1) {
        const secondItem = items[1];
        const name2 = secondItem?.product_name || secondItem?.name || 'Item';
        return `Você comprou ${qty1 > 1 ? `${qty1} ${name1}` : `um ${name1}`}, um ${name2}`;
      }
      return `Você comprou ${qty1 > 1 ? `${qty1} ${name1}` : `um ${name1}`} e mais ${remainingCount} ${remainingCount === 1 ? 'item' : 'itens'}`;
    }
  };

  // Função para calcular data de expiração (1 mês após a transação)
  const getExpirationDate = (entry) => {
    const transactionDate = new Date(entry.created_at || entry.date || entry.transaction_date || entry.timestamp);
    if (isNaN(transactionDate.getTime())) {
      // Se a data é inválida, usa data atual + 1 mês
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      return formatDate(expirationDate.toISOString());
    }
    const expirationDate = new Date(transactionDate);
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    return formatDate(expirationDate.toISOString());
  };

  // Função para calcular valor gasto ou desconto aplicado
  const getAmountSpent = (entry) => {
    const isSpent = isPointsSpent(entry);
    
    if (isSpent) {
      // Para gasto de pontos, calcula o desconto aplicado
      // 1 real = 100 pontos (taxa de conversão de resgate)
      // Mas pode variar, então usa os pontos para calcular
      const points = Math.abs(entry.points || entry.points_earned || entry.points_amount || 0);
      // Taxa de conversão padrão: 100 pontos = 1 real
      // Se tiver discount_amount, usa ele
      if (entry.discount_amount !== undefined && entry.discount_amount !== null) {
        return entry.discount_amount;
      }
      if (entry.order && entry.order.discount_from_points) {
        return entry.order.discount_from_points;
      }
      // Calcula: 100 pontos = 1 real (taxa de resgate padrão)
      return points / 100;
    }
    
    // Para ganho de pontos (compra realizada)
    // Se já tem amount_spent ou order.total, usa isso
    if (entry.amount_spent !== undefined && entry.amount_spent !== null) {
      return entry.amount_spent;
    }
    if (entry.order && (entry.order.total_amount || entry.order.total)) {
      return entry.order.total_amount || entry.order.total;
    }
    // Se tem subtotal ou amount no order, usa isso
    if (entry.order && entry.order.subtotal) {
      return entry.order.subtotal;
    }
    // Caso contrário, calcula baseado nos pontos (1 real = 10 pontos para ganho)
    const points = entry.points || entry.points_earned || entry.points_amount || 0;
    return Math.abs(points) / 10;
  };
  
  // Função para obter pontos da entrada (valor absoluto)
  const getPoints = (entry) => {
    const points = entry.points || entry.points_earned || entry.points_amount || 0;
    return Math.abs(points);
  };
  
  // Função para verificar se é transação de gasto
  const isPointsSpent = (entry) => {
    const points = entry.points || entry.points_earned || entry.points_amount || 0;
    const type = entry.type || entry.transaction_type || '';
    // Se pontos negativos OU type indica gasto/spend/redeem
    return points < 0 || 
           type.toLowerCase().includes('spend') || 
           type.toLowerCase().includes('redeem') || 
           type.toLowerCase().includes('gasto') ||
           type.toLowerCase() === 'debit';
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        setLoggedIn(!!ok);
        if (ok) {
          const user = await getStoredUserData();
          
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            await fetchLoyaltyHistory(user.id);
            
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
        title="Histórico de Pontos"
        subtitle="Suas compras e pontos ganhos"
        enderecos={enderecos}
        onEnderecoAtivoChange={handleEnderecoAtivoChange}
        loadingPoints={loadingPoints}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFC700" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Você ainda não possui histórico de pontos.</Text>
            <Text style={styles.emptySubtext}>Realize compras para começar a acumular pontos!</Text>
          </View>
        ) : (
          <>
            {loyaltyData && getDaysUntilExpiration() > 0 && (
              <Text style={styles.expirationInfo}>
                Seus pontos vencem daqui {getDaysUntilExpiration()} dias
              </Text>
            )}
            
            {history.map((entry, index) => {
              const isSpent = isPointsSpent(entry);
              const amountSpent = getAmountSpent(entry);
              const points = getPoints(entry);
              const purchaseDescription = getPurchaseDescription(entry);
              const expirationDate = isSpent ? null : getExpirationDate(entry); // Gastos não têm validade
              
              return (
                <View key={entry.id || entry.transaction_id || index} style={[
                  styles.historyCard,
                  isSpent && styles.historyCardSpent
                ]}>
                  <View style={styles.cardHeader}>
                    <SvgXml xml={crownSvg} width={20} height={20} />
                  </View>
                  <Text style={styles.cardTitle}>
                    {purchaseDescription}
                    {isSpent ? (
                      <>
                        {' e utilizou '}
                        <Text style={styles.highlightTextSpent}>{points} pontos</Text>
                        {' como desconto de '}
                        <Text style={styles.highlightTextSpent}>{formatCurrency(amountSpent)}</Text>
                      </>
                    ) : (
                      <>
                        {' por '}
                        <Text style={styles.highlightText}>{formatCurrency(amountSpent)}</Text>
                        {' e ganhou '}
                        <Text style={styles.highlightText}>{points} pontos</Text>
                      </>
                    )}
                  </Text>
                  <View style={styles.cardDetails}>
                    {isSpent ? (
                      <>
                        <Text style={styles.cardDetailText}>
                          {formatCurrency(amountSpent)} de desconto
                        </Text>
                        <Text style={[styles.cardDetailText, styles.pointsSpent]}>
                          -{points} pontos
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.cardDetailText}>
                          {formatCurrency(amountSpent)} gastos
                        </Text>
                        <Text style={styles.cardDetailText}>
                          +{points} pontos
                        </Text>
                      </>
                    )}
                  </View>
                  {!isSpent && expirationDate && (
                    <Text style={styles.cardExpiration}>
                      Válido até {expirationDate}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      
      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} currentRoute="ClubeRoyal" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  expirationInfo: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardSpent: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  highlightText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  highlightTextSpent: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  pointsSpent: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDetailText: {
    fontSize: 14,
    color: '#888888',
  },
  cardExpiration: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
    marginTop: 4,
  },
});

