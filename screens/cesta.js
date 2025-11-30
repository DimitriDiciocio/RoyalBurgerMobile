import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import CustomAlert from '../components/CustomAlert';
import { getFriendlyErrorMessage } from '../utils/alertHelper';
import { isAuthenticated, getStoredUserData } from '../services';
import { getLoyaltyBalance, getCustomerAddresses } from '../services/customerService';
import { useBasket } from '../contexts/BasketContext';
import ItensCesta from '../components/itensCesta';
import CardItemVerticalAdd from '../components/CardItemVerticalAdd';
import { getPublicSettings, validateCartForOrder } from '../services';
import { getAllProducts, filterProductsWithStock } from '../services/productService';
import { getPromotionByProductId } from '../services/promotionService';
import api from '../services/api';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

export default function Cesta({ navigation }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [loyaltyRates, setLoyaltyRates] = useState({
        gain_rate: 0.1, // valor padrão: 1 ponto vale 0.1 reais (10 centavos)
    });
    const { basketItems, removeFromBasket, updateBasketItem, clearBasket, addToBasket, basketTotal, loadCart } = useBasket();
    // ALTERAÇÃO: Estados para CustomAlert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState('info');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState([]);
    // ALTERAÇÃO: Estado para produtos sugeridos
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingSuggested, setLoadingSuggested] = useState(false);
    
    // Calcular total real dos itens da cesta (já inclui adicionais pois usa item.total)
    const calculateTotal = () => {
        try {
            const total = basketItems.reduce((total, item) => {
                const itemTotal = item.total || (parseFloat(item.price || 0) * parseFloat(item.quantity || 0));
                return total + (parseFloat(itemTotal) || 0);
            }, 0);
            return total;
        } catch (error) {
            // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
            const isDev = __DEV__;
            if (isDev) {
                console.error('[Cesta] Erro em calculateTotal:', error);
            }
            return 0;
        }
    };

    // ALTERAÇÃO: Calcular descontos de promoções - apenas soma os valores de desconto já definidos nas promoções
    // Não faz cálculos matemáticos, apenas pega o valor de desconto da promoção e multiplica pela quantidade
    const calculatePromotionDiscounts = () => {
        try {
            let totalDiscount = 0;
            
            // Para cada item no carrinho, verificar se tem promoção e somar o desconto
            basketItems.forEach(item => {
                // Verificar se o item tem promoção (vem da API)
                const promotion = item.promotion;
                if (!promotion) return;
                
                // ALTERAÇÃO: Apenas pegar o valor de desconto já definido na promoção
                // Se for desconto em valor fixo, multiplica pela quantidade (pois é desconto por unidade)
                // Exemplo: produto com R$ 20,00 de desconto, quantidade 2 = R$ 40,00 de desconto total
                if (promotion.discount_value && parseFloat(promotion.discount_value) > 0) {
                    const discountValue = parseFloat(promotion.discount_value);
                    const itemQuantity = parseFloat(item.quantity || 1);
                    totalDiscount += discountValue * itemQuantity;
                }
            });
            
            return parseFloat(totalDiscount) || 0;
        } catch (error) {
            // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
            const isDev = __DEV__;
            if (isDev) {
                console.error('[Cesta] Erro em calculatePromotionDiscounts:', error);
            }
            return 0;
        }
    };

    // Calcular pontos ganhos na compra
    // gain_rate é quanto vale 1 ponto em reais (ex: 0.1 = 10 centavos por ponto)
    // Para calcular pontos ganhos: valor gasto (sem taxa de entrega) / valor de cada ponto
    // Ex: R$ 10,00 / R$ 0,10 = 100 pontos
    // IMPORTANTE: A taxa de entrega NÃO conta para ganhar pontos
    // NOTA: Este cálculo é uma estimativa no carrinho e não considera desconto de pontos
    // que será aplicado no checkout (se o usuário decidir usar pontos). O cálculo final
    // será feito na tela de pagamento considerando desconto proporcional ao subtotal.
    const calculateEarnedPoints = () => {
        if (loyaltyRates.gain_rate <= 0) return 0;
        // Calcula apenas o total dos produtos (sem taxa de entrega e sem descontos de promoção)
        // Não considera desconto de pontos pois ainda não foi decidido se o usuário vai usar
        const productsTotal = calculateTotal() - calculatePromotionDiscounts();
        return Math.floor(productsTotal / loyaltyRates.gain_rate);
    };

    const fetchEnderecos = async (userId) => {
        try {
            const enderecosData = await getCustomerAddresses(userId);
            setEnderecos(enderecosData || []);
            // Selecionar endereço padrão
            const enderecoPadrao = enderecosData?.find(e => e.is_default || e.isDefault);
            setEnderecoAtivo(enderecoPadrao || null);
        } catch (error) {
            // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
            const isDev = __DEV__;
            if (isDev) {
                console.error('Erro ao buscar endereços:', error);
            }
            setEnderecos([]);
            setEnderecoAtivo(null);
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
                // Buscar configurações públicas (taxa de entrega e taxas de conversão)
                try {
                    const publicSettings = await getPublicSettings();
                    const fee = parseFloat(publicSettings?.delivery_fee || 0);
                    setDeliveryFee(fee);
                    
                    if (publicSettings?.loyalty_rates) {
                        setLoyaltyRates({
                            gain_rate: parseFloat(publicSettings.loyalty_rates.gain_rate || 0.1),
                        });
                    }
                } catch (error) {
                    // ALTERAÇÃO: Removido console.log em produção - logging condicional apenas em dev
                    const isDev = __DEV__;
                    if (isDev) {
                        console.log('Erro ao buscar configurações públicas:', error);
                    }
                    setDeliveryFee(0);
                }

                const ok = await isAuthenticated();
                setLoggedIn(!!ok);
                if (ok) {
                    const user = await getStoredUserData();
                    let points = '0';
                    
                    // Se for um cliente, busca os pontos atualizados da API
                    if (user && user.role === 'customer' && user.id) {
                        setLoadingPoints(true);
                        try {
                            const loyaltyData = await getLoyaltyBalance(user.id);
                            points = loyaltyData?.current_balance?.toString() || 
                                    loyaltyData?.balance?.toString() || 
                                    loyaltyData?.points?.toString() || 
                                    loyaltyData?.total_points?.toString() || 
                                    loyaltyData?.loyalty_points?.toString() || 
                                    '0';
                        } catch (error) {
                            // ALTERAÇÃO: Removido console.log em produção - logging condicional apenas em dev
                            const isDev = __DEV__;
                            if (isDev) {
                                console.log('Erro ao buscar pontos:', error);
                            }
                            points = user.points || '0';
                        } finally {
                            setLoadingPoints(false);
                        }

                        // Buscar endereços do cliente
                        await fetchEnderecos(user.id);
                    } else {
                        points = user?.points || '0';
                    }
                    
                    const normalized = user ? {
                        name: user.full_name || user.name || 'Usuário',
                        points: points,
                        address: user.address || undefined,
                        avatar: undefined,
                    } : null;
                    setUserInfo(normalized);
                } else {
                    setUserInfo(null);
                    setEnderecos([]);
                    setEnderecoAtivo(null);
                }
            } catch (e) {
                // ALTERAÇÃO: Removido console.log em produção - logging condicional apenas em dev
                const isDev = __DEV__;
                if (isDev) {
                    console.log('Erro ao verificar autenticação:', e);
                }
                setLoggedIn(false);
                setUserInfo(null);
                setEnderecos([]);
                setEnderecoAtivo(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);


    // ALTERAÇÃO: Log para monitorar mudanças no carrinho (apenas em dev)
    useEffect(() => {
        const isDev = __DEV__;
        if (isDev) {
            console.log('[Cesta] Estado do carrinho atualizado:', {
                basketItemsCount: basketItems?.length || 0,
                basketTotal: basketTotal,
                basketTotalType: typeof basketTotal,
                basketTotalIsNaN: isNaN(basketTotal),
                basketItems: basketItems?.map(item => ({
                    id: item.id,
                    cartItemId: item.cartItemId,
                    price: item.price,
                    priceType: typeof item.price,
                    quantity: item.quantity,
                    quantityType: typeof item.quantity,
                    total: item.total,
                    totalType: typeof item.total
                }))
            });
        }
    }, [basketItems, basketTotal]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleLimpar = async () => {
        if (basketItems.length === 0) {
            // ALTERAÇÃO: Usar CustomAlert ao invés de Alert.alert
            setAlertType('info');
            setAlertTitle('Cesta vazia');
            setAlertMessage('Não há itens na cesta para limpar.');
            setAlertButtons([{ text: 'OK' }]);
            setAlertVisible(true);
            return;
        }

        // ALTERAÇÃO: Usar CustomAlert ao invés de Alert.alert
        setAlertType('delete');
        setAlertTitle('Limpar cesta');
        setAlertMessage('Tem certeza que deseja remover todos os itens da cesta?');
        setAlertButtons([
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Limpar',
                onPress: async () => {
                    const result = await clearBasket();
                    if (!result.success) {
                        setAlertType('delete');
                        setAlertTitle('Erro');
                        setAlertMessage(getFriendlyErrorMessage(result.error || 'Não foi possível limpar a cesta'));
                        setAlertButtons([{ text: 'OK' }]);
                        setAlertVisible(true);
                    }
                },
            },
        ]);
        setAlertVisible(true);
    };

    const handleEditItem = (item) => {
        // Navegar para edição do item com todas as informações
        // Usar selectedExtrasObject se disponível (formato objeto), senão converter de array
        let selectedExtrasForEdit = item.selectedExtrasObject || {};
        if (!selectedExtrasForEdit || Object.keys(selectedExtrasForEdit).length === 0) {
            // Se não tiver objeto, converter de array para objeto
            if (Array.isArray(item.selectedExtras)) {
                selectedExtrasForEdit = item.selectedExtras.reduce((acc, extra) => {
                    const ingredientId = String(extra.ingredient_id || extra.id);
                    if (ingredientId && extra.quantity > 0) {
                        acc[ingredientId] = extra.quantity;
                    }
                    return acc;
                }, {});
            } else if (item.selectedExtras && typeof item.selectedExtras === 'object') {
                selectedExtrasForEdit = item.selectedExtras;
            }
        }
        
        // ALTERAÇÃO: Verificar tanto observacoes quanto notes ao passar para edição
        const itemObservacoes = (item.observacoes || item.notes || '').trim();
        
        navigation.navigate('ProdutoEditar', {
            productId: item.originalProductId || item.productId,
            editItem: {
                id: item.id,
                cartItemId: item.cartItemId || item.id, // ID do item no carrinho
                quantity: item.quantity,
                observacoes: itemObservacoes,
                notes: item.notes || item.observacoes || '', // Preservar notes também
                selectedExtras: selectedExtrasForEdit,
                defaultIngredientsQuantities: item.defaultIngredientsQuantities || {},
                modifications: item.modifications || []
            }
        });
    };

    const handleRemoveItem = async (item) => {
        // Remove item usando cartItemId (ID do item no carrinho da API)
        const cartItemId = item.cartItemId || item.id;
        if (cartItemId) {
            const result = await removeFromBasket(cartItemId);
            if (!result.success) {
                // ALTERAÇÃO: Usar CustomAlert ao invés de Alert.alert
                setAlertType('delete');
                setAlertTitle('Erro');
                setAlertMessage(getFriendlyErrorMessage(result.error || 'Não foi possível remover o item'));
                setAlertButtons([{ text: 'OK' }]);
                setAlertVisible(true);
            }
        }
    };

    const handleUpdateQuantity = async (item, newQuantity) => {
        if (newQuantity <= 0) {
            // Remove o item
            await handleRemoveItem(item);
            return;
        }
        
        // Atualizar quantidade via API usando cartItemId
        const cartItemId = item.cartItemId || item.id;
        if (cartItemId) {
            // Converter selectedExtras para formato da API
            // Pode ser array ou objeto, então tratar ambos os casos
            let extras = [];
            if (Array.isArray(item.selectedExtras)) {
                extras = item.selectedExtras
                    .filter(extra => extra.quantity > 0)
                    .map(extra => ({
                        ingredient_id: Number(extra.ingredient_id || extra.id),
                        quantity: Number(extra.quantity)
                    }));
            } else if (item.selectedExtrasObject) {
                extras = Object.entries(item.selectedExtrasObject)
                    .filter(([_, qty]) => qty > 0)
                    .map(([ingredientId, qty]) => ({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(qty)
                    }));
            } else if (item.selectedExtras && typeof item.selectedExtras === 'object') {
                extras = Object.entries(item.selectedExtras)
                    .filter(([_, qty]) => qty > 0)
                    .map(([ingredientId, qty]) => ({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(qty)
                    }));
            }
            
            // ALTERAÇÃO: Usar update otimista e não recarregar todo o carrinho para melhor performance
            const result = await updateBasketItem(cartItemId, {
                quantity: newQuantity,
                extras: extras,
                observacoes: item.observacoes || '',
                baseModifications: item.modifications || []
            }, {
                optimisticUpdate: true, // Atualizar UI imediatamente
                skipFullReload: true // Não recarregar todo o carrinho, apenas atualizar item específico
            });
            
            if (!result.success) {
                // ALTERAÇÃO: Tratamento específico para erro de estoque com CustomAlert
                if (result.errorType === 'INSUFFICIENT_STOCK') {
                    setAlertType('warning');
                    setAlertTitle('Estoque Insuficiente');
                    setAlertMessage(getFriendlyErrorMessage(result.error || 'Estoque insuficiente para esta quantidade.'));
                    setAlertButtons([{ text: 'OK' }]);
                    setAlertVisible(true);
                } else {
                    setAlertType('delete');
                    setAlertTitle('Erro');
                    setAlertMessage(getFriendlyErrorMessage(result.error || 'Não foi possível atualizar a quantidade'));
                    setAlertButtons([{ text: 'OK' }]);
                    setAlertVisible(true);
                }
                // ALTERAÇÃO: Se falhou, o update otimista já foi revertido pelo updateBasketItem
                return;
            }

            // ALTERAÇÃO: Validação apenas em background (não bloqueia UI)
            // Fazer validação de forma assíncrona sem bloquear a interface
            validateCartForOrder()
                .then(validation => {
                    const isValid = validation?.success && (validation.is_valid !== false) && (!(validation.alerts) || validation.alerts.length === 0);
                    if (!isValid) {
                        const alertsText = Array.isArray(validation?.alerts) && validation.alerts.length > 0
                            ? validation.alerts.join('\\n')
                            : 'Alguns itens estão indisponíveis ou com estoque insuficiente.';
                        // ALTERAÇÃO: Usar CustomAlert ao invés de Alert.alert
                        setAlertType('warning');
                        setAlertTitle('Carrinho inválido');
                        setAlertMessage(alertsText);
                        setAlertButtons([{ text: 'OK' }]);
                        setAlertVisible(true);
                        // Recarrega carrinho para refletir estado consistente apenas se necessário
                        loadCart();
                    }
                })
                .catch(() => {
                    // Silencia erro de validação - não é crítico
                });
        }
    };

    const handleAddMoreItems = () => {
        navigation.navigate('Home');
    };

    // ALTERAÇÃO: Função para formatar produto para CardItemVerticalAdd
    const formatProductForSuggested = (product, promotion = null) => {
        const basePrice = parseFloat(product.price || 0);
        
        // Calcular preço com desconto se houver promoção
        let finalPrice = basePrice;
        if (promotion) {
            if (promotion.discount_percentage && parseFloat(promotion.discount_percentage) > 0) {
                const discountPercentage = parseFloat(promotion.discount_percentage);
                finalPrice = basePrice * (1 - discountPercentage / 100);
            } else if (promotion.discount_value && parseFloat(promotion.discount_value) > 0) {
                finalPrice = basePrice - parseFloat(promotion.discount_value);
            }
        }
        
        // Monta URL da imagem
        let imageUrl = null;
        if (product.image_url) {
            if (product.image_url.startsWith('http')) {
                imageUrl = product.image_url;
            } else if (product.id) {
                const baseUrl = api.defaults.baseURL.replace('/api', '');
                imageUrl = `${baseUrl}/api/products/image/${product.id}`;
            }
        }
        
        return {
            id: product.id,
            name: product.name || 'Produto',
            description: product.description || '',
            price: finalPrice,
            originalPrice: promotion ? basePrice : null,
            discountPercentage: promotion?.discount_percentage ? Math.round(parseFloat(promotion.discount_percentage)) : null,
            image: imageUrl ? { uri: imageUrl } : null,
            promotion: promotion
        };
    };

    // ALTERAÇÃO: Ref para armazenar a última assinatura de IDs processada
    const lastProcessedIdsRef = useRef('');

    // ALTERAÇÃO: Carregar produtos sugeridos apenas quando a lista de produtos mudar (não quando quantidade mudar)
    useEffect(() => {
        // ALTERAÇÃO: Criar "assinatura" dos produtos no carrinho (apenas IDs) para evitar recarregar quando apenas quantidade muda
        const currentProductIds = basketItems
            .map(item => item.originalProductId || item.productId)
            .filter(id => id != null)
            .sort((a, b) => a - b)
            .join(',');

        // ALTERAÇÃO: Só recarregar se a lista de IDs de produtos realmente mudou
        if (currentProductIds === lastProcessedIdsRef.current) {
            return; // Não recarregar se apenas a quantidade mudou
        }

        lastProcessedIdsRef.current = currentProductIds;

        const loadSuggestedProducts = async () => {
            if (basketItems.length === 0) {
                setSuggestedProducts([]);
                return;
            }

            try {
                setLoadingSuggested(true);
                
                // Identificar categorias dos produtos no carrinho
                const categoriesInBasket = new Set();
                const productIdsInBasket = new Set();
                
                basketItems.forEach(item => {
                    const productId = item.originalProductId || item.productId;
                    if (productId) {
                        productIdsInBasket.add(productId);
                    }
                    
                    // ALTERAÇÃO: Tentar obter category_id do produto de múltiplas fontes
                    const categoryId = item.product?.category_id || 
                                      item.product?.section_id || 
                                      item.category_id || 
                                      item.section_id;
                    if (categoryId) {
                        categoriesInBasket.add(categoryId);
                    }
                });

                // Buscar todos os produtos disponíveis
                const response = await getAllProducts({
                    page: 1,
                    page_size: 50, // Buscar mais para ter opções após filtrar
                    filter_unavailable: true
                });

                const allProducts = response?.items || (Array.isArray(response) ? response : []);
                
                // ALTERAÇÃO: Filtrar produtos:
                // 1. Não estão no carrinho
                // 2. São de categorias diferentes (se houver categorias no carrinho)
                // 3. Estão ativos
                const filteredProducts = allProducts.filter(product => {
                    // Não incluir produtos que já estão no carrinho
                    if (productIdsInBasket.has(product.id)) {
                        return false;
                    }
                    
                    // ALTERAÇÃO: Não incluir produtos de categorias que já estão no carrinho
                    // Verificar tanto category_id quanto section_id
                    const productCategoryId = product.category_id || product.section_id;
                    if (productCategoryId && categoriesInBasket.size > 0 && categoriesInBasket.has(productCategoryId)) {
                        return false;
                    }
                    
                    // Apenas produtos ativos
                    if (product.is_active === false || product.is_active === 0) {
                        return false;
                    }
                    
                    return true;
                });

                // Validar estoque dos produtos filtrados
                const validatedProducts = await filterProductsWithStock(filteredProducts);
                
                // Limitar a 10 produtos
                const limitedProducts = validatedProducts.slice(0, 10);
                
                // Buscar promoções para os produtos selecionados
                const productsWithPromotions = await Promise.allSettled(
                    limitedProducts.map(async (product) => {
                        let promotion = null;
                        try {
                            if (product.id) {
                                promotion = await getPromotionByProductId(product.id);
                            }
                        } catch (error) {
                            // Ignora erros ao buscar promoção
                        }
                        return { product, promotion };
                    })
                );

                // Formatar produtos para exibição
                const formattedProducts = productsWithPromotions
                    .filter(result => result.status === 'fulfilled')
                    .map(result => {
                        const { product, promotion } = result.value;
                        return formatProductForSuggested(product, promotion);
                    })
                    .filter(product => product !== null);

                setSuggestedProducts(formattedProducts);
            } catch (error) {
                const isDev = __DEV__;
                if (isDev) {
                    console.error('Erro ao carregar produtos sugeridos:', error);
                }
                setSuggestedProducts([]);
            } finally {
                setLoadingSuggested(false);
            }
        };

        loadSuggestedProducts();
    }, [basketItems]);

    const handleAddSuggestedProduct = (product) => {
        // Navegar para a tela de produto para adicionar ao carrinho
        navigation.navigate('Produto', { productId: product.id });
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFC700" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header 
                navigation={navigation} 
                type={loggedIn ? 'logged' : 'home'}
                userInfo={userInfo}
                loadingPoints={loadingPoints}
                enderecos={enderecos}
                onEnderecoAtivoChange={handleEnderecoAtivoChange}
            />
            
             <ScrollView 
                 style={styles.content}
                 contentContainerStyle={styles.scrollContent}
             >
                 <View style={styles.navigationBar}>
                     <TouchableOpacity 
                         style={styles.backButton} 
                         onPress={handleBack}
                         activeOpacity={0.7}
                     >
                         <SvgXml
                             xml={backArrowSvg}
                             width={30}
                             height={30}
                         />
                     </TouchableOpacity>
                     
                     <View style={styles.titleContainer}>
                         <Text style={styles.title}>Cesta</Text>
                     </View>
                     
                     {/* ALTERAÇÃO: Botão Limpar - apenas mostrar se houver itens na cesta */}
                     {basketItems.length > 0 && (
                         <TouchableOpacity 
                             style={styles.limparButton} 
                             onPress={handleLimpar}
                             activeOpacity={0.7}
                         >
                             <Text style={styles.limparButtonText}>Limpar</Text>
                         </TouchableOpacity>
                     )}
                 </View>
                <Text style={styles.sectionTitle}>Itens adicionados</Text>
                
                {basketItems.length > 0 ? (
                    basketItems.map((item, index) => (
                        <ItensCesta
                            key={item.cartItemId || item.id || index}
                            item={item}
                            onEdit={handleEditItem}
                            onRemove={handleRemoveItem}
                            onUpdateQuantity={handleUpdateQuantity}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>Nenhum item na cesta</Text>
                )}

                {basketItems.length > 0 && (
                    <TouchableOpacity 
                        style={styles.addMoreItemsButton}
                        onPress={handleAddMoreItems}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.addMoreItemsText}>Adicionar mais itens</Text>
                    </TouchableOpacity>
                )}

                {suggestedProducts.length > 0 && (
                    <View style={styles.suggestedSection}>
                        <Text style={styles.suggestedTitle}>Peça também</Text>
                        {loadingSuggested ? (
                            <View style={styles.loadingSuggested}>
                                <ActivityIndicator size="small" color="#FFC700" />
                            </View>
                        ) : (
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.suggestedScrollContent}
                            >
                                {suggestedProducts.map((product) => {
                                    const safePrice = parseFloat(product.price) || 0;
                                    const priceFormatted = `R$ ${safePrice.toFixed(2).replace('.', ',')}`;
                                    const originalPriceFormatted = product.originalPrice 
                                        ? `R$ ${parseFloat(product.originalPrice).toFixed(2).replace('.', ',')}`
                                        : null;
                                    
                                    return (
                                        <CardItemVerticalAdd
                                            key={product.id}
                                            title={product.name}
                                            description={product.description}
                                            price={priceFormatted}
                                            originalPrice={originalPriceFormatted}
                                            discountPercentage={product.discountPercentage}
                                            imageSource={product.image}
                                            onAdd={() => handleAddSuggestedProduct(product)}
                                        />
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* ALTERAÇÃO: Resumo de valores - apenas mostrar se houver itens na cesta */}
                {basketItems.length > 0 && (
                    <View style={styles.resumoSection}>
                        <Text style={styles.resumoTitulo}>Resumo de valores</Text>
                        
                        <View style={styles.resumoItem}>
                            <Text style={styles.resumoLabel}>Taxa de entrega</Text>
                            <Text style={styles.resumoValor}>
                                R$ {(parseFloat(deliveryFee) || 0).toFixed(2).replace('.', ',')}
                            </Text>
                        </View>

                        <View style={styles.resumoItem}>
                            <Text style={styles.resumoLabel}>Descontos</Text>
                            <Text style={styles.resumoValor}>
                                - R$ {(parseFloat(calculatePromotionDiscounts()) || 0).toFixed(2).replace('.', ',')}
                            </Text>
                        </View>

                        <View style={styles.resumoItem}>
                            <Text style={styles.resumoTotalLabel}>Total</Text>
                            <Text style={styles.resumoTotalValor}>
                                {(() => {
                                    // ALTERAÇÃO: basketTotal já vem com desconto aplicado (item_subtotal da API já tem desconto)
                                    // Não subtrair desconto novamente, apenas somar taxa de entrega
                                    const safeBasketTotal = parseFloat(basketTotal) || 0;
                                    const safeDeliveryFee = parseFloat(deliveryFee) || 0;
                                    const total = safeBasketTotal + safeDeliveryFee;
                                    return `R$ ${total.toFixed(2).replace('.', ',')}`;
                                })()}
                            </Text>
                        </View>

                         <Text style={styles.pontosText}>
                             Nessa compra, você ganhará <Text style={styles.pontosDestaque}>{calculateEarnedPoints()}</Text> pontos Royal
                         </Text>
                     </View>
                )}
             </ScrollView>

             {/* Footer fixo */}
             {(basketItems && basketItems.length > 0) && (
                 <View style={styles.footer}>
                     <View style={styles.footerLeft}>
                         <Text style={styles.footerTotalLabel}>Total</Text>
                        <Text style={styles.footerTotalValue}>
                            {(() => {
                                // ALTERAÇÃO: basketTotal já vem com desconto aplicado (item_subtotal da API já tem desconto)
                                // Não subtrair desconto novamente, apenas somar taxa de entrega
                                const safeBasketTotal = parseFloat(basketTotal) || 0;
                                const safeDeliveryFee = parseFloat(deliveryFee) || 0;
                                const total = safeBasketTotal + safeDeliveryFee;
                                return `R$ ${total.toFixed(2).replace('.', ',')}`;
                            })()}
                        </Text>
                     </View>
                     <TouchableOpacity 
                         style={styles.continuarButton}
                         onPress={() => {
                             // Verificar se o usuário está logado
                             if (loggedIn) {
                                 // Navegar para tela de pagamento
                                 navigation.navigate('Pagamento');
                             } else {
                                 // Redirecionar para a página de login
                                 navigation.navigate('Login');
                             }
                         }}
                         activeOpacity={0.8}
                     >
                         <Text style={styles.continuarButtonText}>Continuar</Text>
                     </TouchableOpacity>
                 </View>
             )}
             
             {/* ALTERAÇÃO: CustomAlert para substituir Alert.alert */}
             <CustomAlert
                 visible={alertVisible}
                 type={alertType}
                 title={alertTitle}
                 message={alertMessage}
                 buttons={alertButtons}
                 onClose={() => setAlertVisible(false)}
             />
         </View>
     );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
     navigationBar: {
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
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
    },
    limparButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    limparButtonText: {
        fontSize: 16,
        color: '#FF0000',
        fontWeight: '500',
    },
     content: {
         flex: 1,
         paddingHorizontal: 0,
     },
     scrollContent: {
         paddingBottom: 120,
     },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
        textAlign: 'left',
        paddingHorizontal: 16,
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#888888',
        textAlign: 'center',
        marginTop: 40,
    },
    addMoreItemsButton: {
        marginTop: 10,
        marginBottom: 20,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },
    addMoreItemsText: {
        fontSize: 16,
        color: '#000000',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    suggestedSection: {
        marginTop: 30,
        marginBottom: 40,
    },
    suggestedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    suggestedScrollContent: {
        paddingHorizontal: 16,
    },
    resumoSection: {
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
     footer: {
         position: 'absolute',
         bottom: 0,
         left: 0,
         right: 0,
         backgroundColor: '#FFFFFF',
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
         paddingHorizontal: 16,
         paddingVertical: 16,
         borderTopWidth: 1,
         borderTopColor: '#E5E5E5',
         shadowColor: '#000',
         shadowOffset: {
             width: 0,
             height: -2,
         },
         shadowOpacity: 0.1,
         shadowRadius: 4,
         elevation: 8,
         zIndex: 1000,
     },
     footerLeft: {
         flex: 1,
     },
     footerTotalLabel: {
         fontSize: 16,
         color: '#000000',
         fontWeight: 'bold',
         marginBottom: 2,
     },
     footerTotalValue: {
         fontSize: 20,
         color: '#000000',
         fontWeight: 'bold',
     },
     continuarButton: {
         backgroundColor: '#FFC107',
         paddingHorizontal: 24,
         paddingVertical: 12,
         borderRadius: 8,
         marginLeft: 16,
     },
     continuarButtonText: {
         fontSize: 16,
         color: '#000000',
         fontWeight: 'bold',
         textAlign: 'center',
     },
     loadingContainer: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
         backgroundColor: '#F6F6F6',
     },
     loadingSuggested: {
         paddingVertical: 20,
         alignItems: 'center',
         justifyContent: 'center',
     },
 });
