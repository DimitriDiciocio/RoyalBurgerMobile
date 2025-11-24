import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import OrderStatusBar from '../components/OrderStatusBar';
import OrderItemCard from '../components/OrderItemCard';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getPublicSettings } from '../services';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getOrderById } from '../services/orderService';
import { getAllIngredients } from '../services/ingredientService';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#000000"/>
</svg>`;

export default function Acompanhar({ navigation, route }) {
  const isFocused = useIsFocused();
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0); // ALTERAÇÃO: Estado para taxa de entrega da API
  const [loyaltyRates, setLoyaltyRates] = useState({
    gain_rate: 0.1, // valor padrão: 1 ponto vale 0.1 reais (10 centavos por ponto)
  });
  const [ingredientsCache, setIngredientsCache] = useState(null); // ALTERAÇÃO: Cache de ingredientes para buscar preços
  const [storeAddress, setStoreAddress] = useState(null); // ALTERAÇÃO: Endereço da loja para retirada no balcão
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

  // ALTERAÇÃO: Carregar cache de ingredientes
  useEffect(() => {
    const loadIngredientsCache = async () => {
      if (ingredientsCache) return;
      try {
        const response = await getAllIngredients({ page_size: 1000 });
        let ingredientsList = [];
        if (Array.isArray(response)) {
          ingredientsList = response;
        } else if (response && response.items && Array.isArray(response.items)) {
          ingredientsList = response.items;
        }
        
        if (ingredientsList.length > 0) {
          const cache = {};
          ingredientsList.forEach(ingredient => {
            if (ingredient && ingredient.id != null) {
              const id = String(ingredient.id);
              cache[id] = {
                additional_price: parseFloat(ingredient.additional_price) || 0,
                price: parseFloat(ingredient.price) || 0,
                name: ingredient.name || ''
              };
            }
          });
          setIngredientsCache(cache);
        }
      } catch (error) {
        console.error('Erro ao carregar cache de ingredientes:', error);
      }
    };
    loadIngredientsCache();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ALTERAÇÃO: Buscar configurações públicas (taxa de conversão de pontos, taxa de entrega e endereço da loja)
        try {
          const publicSettings = await getPublicSettings();
          
          // Buscar taxa de entrega
          if (publicSettings?.delivery_fee !== undefined) {
            const fee = parseFloat(publicSettings.delivery_fee) || 0;
            setDeliveryFee(fee);
          }
          
          // Buscar taxa de conversão de pontos
          if (publicSettings?.loyalty_rates?.gain_rate) {
            setLoyaltyRates({
              gain_rate: parseFloat(publicSettings.loyalty_rates.gain_rate) || 0.1,
            });
          }
          
          // ALTERAÇÃO: Buscar endereço da loja para exibir em pedidos de retirada no balcão
          if (publicSettings?.company_info?.endereco) {
            setStoreAddress(publicSettings.company_info.endereco);
          }
        } catch (error) {
          console.log('Erro ao buscar configurações públicas:', error);
          // Mantém valores padrão
        }

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
                      // ALTERAÇÃO: Função para buscar preço do ingrediente (com cache)
                      const findIngredientPrice = (ingredientData, ingredientId) => {
                        // Primeiro tentar cache se tiver ID
                        if (ingredientId && ingredientsCache) {
                          const id = String(ingredientId);
                          const cached = ingredientsCache[id];
                          if (cached && cached.additional_price > 0) {
                            return cached.additional_price;
                          }
                          if (cached && cached.price > 0) {
                            return cached.price;
                          }
                        }

                        // Tentar nos dados do ingrediente
                        const priceCandidates = [
                          ingredientData?.additional_price,
                          ingredientData?.extra_price,
                          ingredientData?.preco_extra,
                          ingredientData?.valor_extra,
                          ingredientData?.price,
                          ingredientData?.ingredient_price,
                          ingredientData?.unit_price,
                          ingredientData?.preco,
                          ingredientData?.valor
                        ];

                        for (const candidate of priceCandidates) {
                          if (candidate !== undefined && candidate !== null) {
                            const priceNum = parseFloat(candidate);
                            if (!isNaN(priceNum) && priceNum >= 0) {
                              return priceNum;
                            }
                          }
                        }

                        return 0;
                      };

                      // ALTERAÇÃO: Calcular subtotal somando todos os itens (produto + extras), sem desconto e sem taxa
                      if (order.items && Array.isArray(order.items)) {
                        const subtotal = order.items.reduce((sum, item) => {
                          const unitPrice = parseFloat(item.unit_price || item.price || item.product?.price || 0);
                          const quantity = parseInt(item.quantity || 1, 10);
                          let itemTotal = unitPrice * quantity;
                          
                          // ALTERAÇÃO: Sempre somar extras (usar função melhorada para buscar preço)
                          if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
                            item.extras.forEach(extra => {
                              const ingredientId = extra.ingredient_id || extra.id;
                              const extraQuantity = parseInt(extra.quantity || extra.qty || 1, 10);
                              
                              // Buscar preço usando função melhorada (com cache)
                              let extraPrice = findIngredientPrice(extra, ingredientId);
                              
                              // Se não encontrou, tentar campos específicos
                              if (extraPrice === 0) {
                                const priceCandidates = [
                                  extra.unit_price,
                                  extra.ingredient_price,
                                  extra.price,
                                  extra.additional_price,
                                  extra.extra_price,
                                  extra.total_price ? parseFloat(extra.total_price) / extraQuantity : null
                                ];
                                
                                for (const candidate of priceCandidates) {
                                  if (candidate !== undefined && candidate !== null) {
                                    const priceNum = parseFloat(candidate);
                                    if (!isNaN(priceNum) && priceNum >= 0) {
                                      extraPrice = priceNum;
                                      break;
                                    }
                                  }
                                }
                              }
                              
                              if (extraPrice > 0 && extraQuantity > 0) {
                                itemTotal += extraPrice * extraQuantity;
                              }
                            });
                          }
                          
                          // ALTERAÇÃO: Sempre somar modificações positivas (usar função melhorada para buscar preço)
                          if (item.base_modifications && Array.isArray(item.base_modifications)) {
                            item.base_modifications.forEach(mod => {
                              const delta = parseFloat(mod.delta || 0);
                              if (delta > 0) {
                                const ingredientId = mod.ingredient_id || mod.id;
                                // Buscar preço usando função melhorada (com cache)
                                let modPrice = findIngredientPrice(mod, ingredientId);
                                
                                // Se não encontrou, tentar campos específicos
                                if (modPrice === 0) {
                                  const priceCandidates = [
                                    mod.unit_price,
                                    mod.ingredient_price,
                                    mod.price,
                                    mod.additionalPrice,
                                    mod.additional_price,
                                    mod.extra_price
                                  ];
                                  
                                  for (const candidate of priceCandidates) {
                                    if (candidate !== undefined && candidate !== null) {
                                      const priceNum = parseFloat(candidate);
                                      if (!isNaN(priceNum) && priceNum >= 0) {
                                        modPrice = priceNum;
                                        break;
                                      }
                                    }
                                  }
                                }
                                
                                if (modPrice > 0) {
                                  itemTotal += modPrice * Math.abs(delta);
                                }
                              }
                            });
                          }
                          
                          // ALTERAÇÃO: Se item_subtotal da API for maior que o calculado, usar o maior
                          // Isso garante que se a API já calculou corretamente, usa o valor da API
                          const apiSubtotal = parseFloat(item.item_subtotal || item.subtotal || 0);
                          if (apiSubtotal > itemTotal) {
                            itemTotal = apiSubtotal;
                          }
                          
                          return sum + itemTotal;
                        }, 0);
                        return `R$ ${(subtotal || 0).toFixed(2).replace('.', ',')}`;
                      }
                      
                      // Fallback: usar subtotal da API se disponível
                      if (order.subtotal !== undefined) {
                        return `R$ ${(parseFloat(order.subtotal) || 0).toFixed(2).replace('.', ',')}`;
                      }
                      
                      return 'R$ 0,00';
                    })()}
                  </Text>
                </View>

                {(() => {
                  // ALTERAÇÃO: Taxa de entrega aparece se o pedido não foi feito em balcão
                  const isPickup = order.order_type === 'pickup';
                  
                  if (isPickup) {
                    return null;
                  }
                  
                  // ALTERAÇÃO: Buscar taxa de entrega do pedido ou usar a da API
                  const orderDeliveryFee = order.delivery_fee !== undefined ? order.delivery_fee : 
                    (order.fees !== undefined ? order.fees : null);
                  
                  // Usa a taxa do pedido se disponível, senão usa a da API
                  const finalDeliveryFee = orderDeliveryFee !== null && orderDeliveryFee !== undefined 
                    ? parseFloat(orderDeliveryFee) 
                    : deliveryFee;
                  
                  return (
                    <View style={styles.resumoItem}>
                      <Text style={styles.resumoLabel}>Taxa de entrega</Text>
                      <Text style={styles.resumoValor}>
                        R$ {(finalDeliveryFee || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  );
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

                {/* ALTERAÇÃO: Local de entrega ou retirada embaixo do total */}
                {(() => {
                  const isPickup = order.order_type === 'pickup';
                  
                  // ALTERAÇÃO: Se for pickup, mostrar informações de retirada no balcão
                  if (isPickup) {
                    return (
                      <View style={styles.deliveryInfoSection}>
                        <View style={styles.deliveryInfoRow}>
                          <SvgXml xml={localizationSvg} width={16} height={20} />
                          <View style={styles.deliveryInfoText}>
                            <Text style={styles.deliveryInfoTitle}>Retirada no balcão</Text>
                            {storeAddress ? (
                              <Text style={styles.deliveryInfoSubtitle}>{storeAddress}</Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  }
                  
                  // ALTERAÇÃO: Buscar endereço do pedido ou usar endereço ativo como fallback
                  const deliveryAddress = order.delivery_address || order.address || enderecoAtivo || {};
                  const street = deliveryAddress.street || deliveryAddress.address || '';
                  const number = deliveryAddress.number || '';
                  const neighborhood = deliveryAddress.neighborhood || deliveryAddress.district || '';
                  const city = deliveryAddress.city || '';
                  
                  // Formatar endereço
                  const addressParts = [];
                  if (street) addressParts.push(street);
                  if (number) addressParts.push(number);
                  
                  const addressLine1 = addressParts.length > 0 ? addressParts.join(', ') : '';
                  const addressLine2 = [neighborhood, city].filter(Boolean).join(' - ') || '';
                  
                  // Só mostra se tiver pelo menos uma linha de endereço
                  if (!addressLine1 && !addressLine2) {
                    return null;
                  }
                  
                  return (
                    <View style={styles.deliveryInfoSection}>
                      <View style={styles.deliveryInfoRow}>
                        <SvgXml xml={localizationSvg} width={16} height={20} />
                        <View style={styles.deliveryInfoText}>
                          {addressLine1 ? (
                            <Text style={styles.deliveryInfoTitle}>{addressLine1}</Text>
                          ) : null}
                          {addressLine2 ? (
                            <Text style={styles.deliveryInfoSubtitle}>{addressLine2}</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* ALTERAÇÃO: Meio de pagamento embaixo do local de entrega */}
                {(() => {
                  const paymentMethod = order.payment_method || order.paymentMethod || '';
                  
                  if (!paymentMethod) {
                    return null;
                  }
                  
                  // Mapear método de pagamento para nome amigável
                  const getPaymentMethodName = () => {
                    const method = paymentMethod.toLowerCase();
                    if (method === 'pix') return 'Pix';
                    if (method === 'credit' || method === 'credit_card') return 'Cartão de Crédito';
                    if (method === 'debit' || method === 'debit_card') return 'Cartão de Débito';
                    // ALTERAÇÃO: Incluir 'money' no mapeamento para português
                    if (method === 'cash' || method === 'dinheiro' || method === 'money') return 'Dinheiro';
                    if (method === 'delivery') return 'Pagamento na entrega';
                    return paymentMethod;
                  };
                  
                  const getPaymentSubtitle = () => {
                    const method = paymentMethod.toLowerCase();
                    if (method === 'pix') return 'Pix';
                    if (method === 'credit' || method === 'credit_card') {
                      return order.card_type === 'credit' ? 'Crédito' : 'Cartão';
                    }
                    if (method === 'debit' || method === 'debit_card') {
                      return order.card_type === 'debit' ? 'Débito' : 'Cartão';
                    }
                    // ALTERAÇÃO: Incluir 'money' no mapeamento para português
                    if (method === 'cash' || method === 'dinheiro' || method === 'money') return 'Dinheiro';
                    if (method === 'delivery') return 'Pix';
                    return '';
                  };
                  
                  // SVG do Pix (simplificado)
                  const pixSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.1453 18.2766C15.4828 17.9391 16.0641 17.9391 16.4016 18.2766L21.2141 23.0891C22.1016 23.9766 23.2828 24.4641 24.5328 24.4641H25.4766L19.4078 30.5328C17.5141 32.3766 14.4391 32.3766 12.5453 30.5328L6.45156 24.4453H7.03281C8.28281 24.4453 9.46406 23.9578 10.3516 23.0703L15.1453 18.2766ZM16.4016 13.6766C16.0016 14.0203 15.4891 14.0266 15.1453 13.6766L10.3516 8.88281C9.46406 7.93906 8.28281 7.50781 7.03281 7.50781H6.45156L12.5391 1.42031C14.4391 -0.473438 17.5141 -0.473438 19.4078 1.42031L25.4828 7.48906H24.5328C23.2828 7.48906 22.1016 7.97656 21.2141 8.86406L16.4016 13.6766ZM7.03281 8.91406C7.89531 8.91406 8.68906 9.26406 9.35156 9.87656L14.1453 14.6703C14.5953 15.0641 15.1828 15.3453 15.7766 15.3453C16.3641 15.3453 16.9516 15.0641 17.4016 14.6703L22.2141 9.85781C22.8266 9.25156 23.6703 8.90156 24.5328 8.90156H26.8891L30.5328 12.5453C32.4266 14.4391 32.4266 17.5141 30.5328 19.4078L26.8891 23.0516H24.5328C23.6703 23.0516 22.8266 22.7016 22.2141 22.0891L17.4016 17.2766C16.5328 16.4078 15.0141 16.4078 14.1453 17.2828L9.35156 22.0703C8.68906 22.6828 7.89531 23.0328 7.03281 23.0328H5.04531L1.42031 19.4078C-0.473438 17.5141 -0.473438 14.4391 1.42031 12.5453L5.04531 8.91406H7.03281Z" fill="#000000"/>
</svg>`;
                  
                  // ALTERAÇÃO: SVG do cartão de crédito/débito
                  const cardSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="#000000"/>
</svg>`;
                  
                  // ALTERAÇÃO: SVG de dinheiro
                  const cashSvg = `<svg width="20" height="20" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 0C7.79375 0 6 1.79375 6 4V18C6 20.2062 7.79375 22 10 22H32C34.2062 22 36 20.2062 36 18V4C36 1.79375 34.2062 0 32 0H10ZM21 6C23.7625 6 26 8.2375 26 11C26 13.7625 23.7625 16 21 16C18.2375 16 16 13.7625 16 11C16 8.2375 18.2375 6 21 6ZM10 7.5V4.5C10 4.225 10.225 4 10.5 4H13.5C13.775 4 14.0063 4.225 13.9688 4.5C13.7437 6.3125 12.3062 7.74375 10.5 7.96875C10.225 8 10 7.775 10 7.5ZM10 14.5C10 14.225 10.225 13.9937 10.5 14.0312C12.3125 14.2563 13.7437 15.6938 13.9688 17.5C14 17.775 13.775 18 13.5 18H10.5C10.225 18 10 17.775 10 17.5V14.5ZM31.5 7.96875C29.6875 7.74375 28.2563 6.30625 28.0312 4.5C28 4.225 28.225 4 28.5 4H31.5C31.775 4 32 4.225 32 4.5V7.5C32 7.775 31.775 8.00625 31.5 7.96875ZM32 14.5V17.5C32 17.775 31.775 18 31.5 18H28.5C28.225 18 27.9937 17.775 28.0312 17.5C28.2563 15.6875 29.6938 14.2563 31.5 14.0312C31.775 14 32 14.225 32 14.5ZM3 7.5C3 6.66875 2.33125 6 1.5 6C0.66875 6 0 6.66875 0 7.5V24C0 26.2062 1.79375 28 4 28H28.5C29.3312 28 30 27.3312 30 26.5C30 25.6688 29.3312 25 28.5 25H4C3.45 25 3 24.55 3 24V7.5Z" fill="#000000"/>
</svg>`;
                  
                  const isPix = paymentMethod.toLowerCase() === 'pix' || paymentMethod.toLowerCase() === 'delivery';
                  const isCard = paymentMethod.toLowerCase() === 'credit' || 
                                 paymentMethod.toLowerCase() === 'credit_card' ||
                                 paymentMethod.toLowerCase() === 'debit' || 
                                 paymentMethod.toLowerCase() === 'debit_card';
                  // ALTERAÇÃO: Verificar se é pagamento em dinheiro
                  const isCash = paymentMethod.toLowerCase() === 'cash' || 
                                 paymentMethod.toLowerCase() === 'dinheiro' ||
                                 paymentMethod.toLowerCase() === 'money';
                  
                  return (
                    <View style={styles.paymentInfoSection}>
                      <View style={styles.paymentInfoRow}>
                        {isPix ? (
                          <SvgXml xml={pixSvg} width={20} height={20} />
                        ) : isCard ? (
                          <SvgXml xml={cardSvg} width={20} height={20} />
                        ) : isCash ? (
                          <SvgXml xml={cashSvg} width={20} height={20} />
                        ) : (
                          <View style={styles.paymentIconPlaceholder} />
                        )}
                        <View style={styles.paymentInfoText}>
                          <Text style={styles.paymentInfoTitle}>{getPaymentMethodName()}</Text>
                          {getPaymentSubtitle() ? (
                            <Text style={styles.paymentInfoSubtitle}>{getPaymentSubtitle()}</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })()}

                <Text style={styles.pontosText}>
                  Nessa compra, você ganhou <Text style={styles.pontosDestaque}>
                    {(() => {
                      // ALTERAÇÃO: Calcular pontos corretamente: (Total - Taxa de entrega) / taxa de conversão
                      if (loyaltyRates.gain_rate <= 0) return '0';
                      
                      // Pegar o total do pedido
                      const total = parseFloat(order.total_amount || order.total || 0);
                      
                      // Calcular taxa de entrega (do pedido ou da API)
                      const isPickup = order.order_type === 'pickup';
                      const orderDeliveryFee = order.delivery_fee !== undefined ? order.delivery_fee : 
                        (order.fees !== undefined ? order.fees : null);
                      const finalDeliveryFee = isPickup ? 0 : (orderDeliveryFee !== null && orderDeliveryFee !== undefined 
                        ? parseFloat(orderDeliveryFee) 
                        : deliveryFee);
                      
                      // Valor para cálculo de pontos: Total - Taxa de entrega
                      const totalForPoints = total - finalDeliveryFee;
                      
                      // Calcular pontos: valor gasto / valor de cada ponto
                      // gain_rate = quanto vale 1 ponto em reais (ex: 0.1 = 10 centavos por ponto)
                      const pointsEarned = Math.floor(totalForPoints / loyaltyRates.gain_rate);
                      
                      return pointsEarned > 0 ? pointsEarned : '0';
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
    marginBottom: 12, // ALTERAÇÃO: Reduzido de 20 para 12 para diminuir espaçamento
    paddingHorizontal: 20,
  },
  itemsSection: {
    marginTop: 0, // ALTERAÇÃO: Removido marginTop para diminuir espaçamento
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
  // ALTERAÇÃO: Estilos para local de entrega
  deliveryInfoSection: {
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  deliveryInfoSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  // ALTERAÇÃO: Estilos para meio de pagamento
  paymentInfoSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paymentIconPlaceholder: {
    width: 20,
    height: 20,
  },
  paymentInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  paymentInfoSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});
