    import React, {useState, useRef, useEffect, useMemo} from 'react';
import {StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Keyboard, Modal, Alert} from 'react-native';
    import { SvgXml } from 'react-native-svg';
    import { useIsFocused } from '@react-navigation/native';
    import Header from "../components/Header";
    import Input from "../components/Input";
    import IngredienteMenu from "../components/IngredienteMenuSemLogin";
    import LoginButton from "../components/ButtonView";
    import MenuNavigation from "../components/MenuNavigation";
    import Observacoes from "../components/Observacoes";
    import QuantidadePrecoBar from "../components/QuantidadePrecoBar";
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getMenuProduct } from '../services/menuService';
import { getProductIngredients, getProductById, checkProductAvailability } from '../services/productService';
import { getAllIngredients } from '../services/ingredientService';
import { useBasket } from '../contexts/BasketContext';
import BasketFooter from '../components/BasketFooter';
import api from '../services/api';

// Função wrapper para garantir que checkProductAvailability funcione mesmo se houver problema de importação
const safeCheckProductAvailability = async (productId, quantity = 1) => {
    try {
        // Tenta usar a função importada primeiro
        if (typeof checkProductAvailability === 'function') {
            return await checkProductAvailability(productId, quantity);
        }
        // Se não estiver disponível, faz a chamada diretamente à API
        console.warn('checkProductAvailability não disponível, usando chamada direta à API');
        const response = await api.get(`/products/${productId}/availability`, {
            params: { quantity }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao verificar disponibilidade:", error);
        return {
            status: 'unknown',
            message: error.response?.data?.error || 'Erro ao verificar disponibilidade',
            available: false
        };
    }
};

    const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

    export default function Produto({navigation, route}) {
        const { produto, productId, editItem } = route.params || {};
        
        // Debug: log do productId recebido
        console.log('[DEBUG] Produto screen - productId recebido:', productId);
        console.log('[DEBUG] Produto screen - produto recebido:', produto);
        console.log('[DEBUG] Produto screen - editItem recebido:', editItem);
        
        const [isExpanded, setIsExpanded] = useState(false);
        const rotateValue = useRef(new Animated.Value(0)).current;
        const isFocused = useIsFocused();
        const [loggedIn, setLoggedIn] = useState(false);
        const [userInfo, setUserInfo] = useState(null);
        const [enderecos, setEnderecos] = useState([]);
        const [enderecoAtivo, setEnderecoAtivo] = useState(null);
        const [loyaltyBalance, setLoyaltyBalance] = useState(0);
        const [loadingPoints, setLoadingPoints] = useState(false);
        const [loadingProduct, setLoadingProduct] = useState(false);
        const [productData, setProductData] = useState(null);
        const [productIngredients, setProductIngredients] = useState([]);
        const [observacoes, setObservacoes] = useState('');
        const [quantity, setQuantity] = useState(1);
        const [keyboardVisible, setKeyboardVisible] = useState(false);
        const [extrasModalVisible, setExtrasModalVisible] = useState(false);
        const [selectedExtras, setSelectedExtras] = useState({}); // {ingredientId: quantity}
        const [tempSelectedExtras, setTempSelectedExtras] = useState({}); // Estado temporário para a modal
        const [ingredientsCache, setIngredientsCache] = useState(null); // Cache de ingredientes da API
        const [defaultIngredientsQuantities, setDefaultIngredientsQuantities] = useState({}); // {ingredientId: quantity}
        const { addToBasket, updateBasketItem, removeFromBasket, basketItems, basketTotal, basketItemCount } = useBasket();

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

        // Carregar cache de ingredientes da API
        const loadIngredientsCache = async () => {
            if (ingredientsCache) {
                return ingredientsCache;
            }
            try {
                const response = await getAllIngredients({ page_size: 1000 });
                // Validar resposta antes de processar
                let ingredientsList = [];
                if (Array.isArray(response)) {
                    ingredientsList = response;
                } else if (response && response.items && Array.isArray(response.items)) {
                    ingredientsList = response.items;
                }
                
                if (ingredientsList.length > 0) {
                    // Criar mapa de ID -> dados do ingrediente (normalizar IDs como string)
                    const cache = {};
                    ingredientsList.forEach(ingredient => {
                        if (ingredient && ingredient.id != null) {
                            // Normalizar ID para string para garantir busca consistente
                            const id = String(ingredient.id);
                            cache[id] = {
                                additional_price: parseFloat(ingredient.additional_price) || 0,
                                price: parseFloat(ingredient.price) || 0,
                                name: ingredient.name || ''
                            };
                        }
                    });
                    setIngredientsCache(cache);
                    return cache;
                }
                return {};
            } catch (error) {
                console.error('Erro ao carregar cache de ingredientes:', error);
                return {};
            }
        };

        // Buscar preço de ingrediente a partir do cache ou dos dados do ingrediente
        const findIngredientPrice = (ingredientData, ingredientId) => {
            // Primeiro tentar cache se tiver ID
            if (ingredientId && ingredientsCache) {
                const id = String(ingredientId);
                const cached = ingredientsCache[id];
                if (cached && cached.additional_price > 0) {
                    return cached.additional_price;
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
                            
                            // Normaliza campos esperados pelo Header
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

        useEffect(() => {
            let isCancelled = false;
            const fetchProduct = async () => {
                try {
                    setLoadingProduct(true);
                    // Carregar cache de ingredientes primeiro
                    await loadIngredientsCache();
                    
                    // Prioriza productId; se não houver, tenta usar produto.id ou mantém produto
                    const idToFetch = productId || produto?.id;
                    let data = null;
                    if (idToFetch) {
                        try {
                            // Buscar do endpoint do menu (exibe somente ativos)
                            data = await getMenuProduct(idToFetch);
                            // Algumas APIs retornam wrapper { product: {...} }
                            if (data && data.product) {
                                data = data.product;
                            }
                        } catch (errMenu) {
                            // Fallback: tentar serviço de produtos por ID
                            // IMPORTANTE: Passa quantity para calcular max_available corretamente
                            try {
                                const p = await getProductById(idToFetch, quantity);
                                data = p && p.product ? p.product : p;
                            } catch (errProd) {
                                // Se falhar, ainda tentamos obter ingredientes isolados (opcional)
                                try {
                                    const alt = await getProductIngredients(idToFetch);
                                    if (!isCancelled) setProductIngredients(Array.isArray(alt) ? alt : []);
                                } catch (errIng) {
                                    // ignora
                                }
                            }
                        }
                    } else if (produto) {
                        // IMPORTANTE: Se o produto veio de uma listagem, pode ter max_quantity incorreto (valor da regra, não calculado)
                        // Sempre busca da API para garantir que max_quantity está correto (calculado com estoque)
                        if (produto.id) {
                            try {
                                const p = await getProductById(produto.id, quantity);
                                data = p && p.product ? p.product : p;
                            } catch (errProd) {
                                // Se falhar, usa o produto passado como fallback
                                data = produto;
                            }
                        } else {
                            data = produto;
                        }
                    }

                    if (!isCancelled) {
                        // Log para depuração do retorno
                        console.log('[DEBUG] Produto - dados recebidos da API:', data);
                        setProductData(data || produto || null);
                        
                        // IMPORTANTE: Se data veio de getProductById, já tem ingredientes com max_quantity calculado
                        // Se não, busca ingredientes separadamente (mas pode ter max_quantity incorreto)
                        const pid = idToFetch || data?.id;
                        if (pid) {
                            // Se data já tem ingredientes (vindo de getProductById), usa eles
                            if (data && data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
                                console.log('[DEBUG] Usando ingredientes de getProductById (max_quantity calculado)');
                                if (!isCancelled) setProductIngredients(data.ingredients);
                            } else {
                                // Fallback: busca ingredientes separadamente (pode ter max_quantity incorreto)
                                try {
                                    const ingredientsResponse = await getProductIngredients(pid);
                                    // Tratar resposta que pode ser array direto ou objeto com items
                                    let ingredientsList = [];
                                    if (Array.isArray(ingredientsResponse)) {
                                        ingredientsList = ingredientsResponse;
                                    } else if (ingredientsResponse && ingredientsResponse.items && Array.isArray(ingredientsResponse.items)) {
                                        ingredientsList = ingredientsResponse.items;
                                    }
                                    if (!isCancelled) setProductIngredients(ingredientsList);
                                    // Log de diagnóstico: produto sem ingredientes disponíveis
                                    if (!isCancelled && (!ingredientsList || ingredientsList.length === 0)) {
                                        console.warn('[DIAGNOSTICO] Produto sem ingredientes disponíveis:', {
                                            productId: pid,
                                            productName: (data?.name || produto?.name || produto?.title || 'Produto'),
                                            message: 'Nenhum ingrediente retornado pela API'
                                        });
                                    }
                                } catch (e) {
                                    console.error('Erro ao buscar ingredientes:', e);
                                    if (!isCancelled) setProductIngredients([]);
                                }
                            }
                        } else {
                            setProductIngredients([]);
                        }
                    }
                } catch (e) {
                    if (!isCancelled) {
                        setProductData(produto || null);
                        setProductIngredients([]);
                    }
                } finally {
                    if (!isCancelled) setLoadingProduct(false);
                }
            };
            fetchProduct();
            return () => { isCancelled = true; };
        }, [productId, produto]);

        useEffect(() => {
            const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
            const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
            const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
            const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
            return () => {
                showSub?.remove();
                hideSub?.remove();
            };
        }, []);

        const handleBackPress = () => {
            navigation.goBack();
        };

        const handleArrowPress = () => {
            const toValue = isExpanded ? 0 : 1;
            
            Animated.timing(rotateValue, {
                toValue: toValue,
                duration: 300,
                useNativeDriver: true,
            }).start();
            
            setIsExpanded(!isExpanded);
        };

        const handleBasketPress = () => {
            // Por enquanto, não faz nada
            console.log('Ver cesta pressionado na tela de produto');
        };

        // Separar ingredientes em produto padrão e extras
        const defaultIngredients = productIngredients.filter((ing) => {
            const portions = parseFloat(ing.portions || 0) || 0;
            const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
            const maxQty = ing.max_quantity || ing.maxQuantity;
            // Excluir se portions <= 0 ou se min_quantity === max_quantity (sem possibilidade de alteração)
            if (portions <= 0) return false;
            if (maxQty !== null && maxQty !== undefined) {
                const maxQtyNum = parseInt(maxQty, 10);
                if (minQty === maxQtyNum) return false;
            }
            return true;
        });

        // Função para buscar produto atualizado quando quantity mudar
        // A API já calcula max_quantity considerando a quantity, então não precisamos recalcular
        const refreshProductData = async () => {
            const idToFetch = productId || produto?.id || productData?.id;
            if (idToFetch) {
                try {
                    const updatedData = await getProductById(idToFetch, quantity);
                    const finalData = updatedData && updatedData.product ? updatedData.product : updatedData;
                    if (finalData && finalData.ingredients) {
                        setProductIngredients(finalData.ingredients);
                    }
                } catch (error) {
                    console.error('Erro ao atualizar dados do produto:', error);
                }
            }
        };

        const extraIngredients = productIngredients.filter((ing) => {
            const portions = parseFloat(ing.portions || 0) || 0;
            // Só inclui extras (portions === 0)
            if (portions !== 0) return false;
            
            // Verifica se o ingrediente está disponível
            const isAvailable = ing.is_available !== false;
            if (!isAvailable) return false;
            
            // max_quantity já vem calculado pela API considerando estoque e quantidade do produto
            // IMPORTANTE: Só mostra extras que têm estoque disponível (max_quantity > 0) ou sem limite de regra
            const maxAvailable = ing.max_quantity;
            const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
            
            // Se max_quantity é null/undefined, não há limite de regra (pode ter estoque infinito)
            // Se max_quantity é 0, não há estoque disponível - NÃO MOSTRAR
            // Se max_quantity > 0, há estoque disponível - MOSTRAR
            // Se max_quantity é null mas min_quantity > 0, pode mostrar (será validado depois)
            
            // Só mostra se:
            // 1. max_quantity é null (sem limite de regra) - pode ter estoque
            // 2. max_quantity > 0 (tem estoque disponível)
            // 3. max_quantity >= min_quantity (pelo menos pode adicionar o mínimo)
            if (maxAvailable === null || maxAvailable === undefined) {
                // Sem limite de regra, verifica se tem estoque através de availability_info
                const availabilityInfo = ing.availability_info;
                if (availabilityInfo && availabilityInfo.max_available !== undefined) {
                    // Se max_available da availability_info é 0, não tem estoque
                    return availabilityInfo.max_available > 0 || minQty > 0;
                }
                // Se não tem availability_info, assume que pode ter estoque (será validado depois)
                return true;
            }
            
            // Se max_quantity é 0, não tem estoque suficiente
            if (maxAvailable === 0) return false;
            
            // Se max_quantity > 0, tem estoque disponível
            // Mas só mostra se max_quantity >= min_quantity (pode adicionar pelo menos o mínimo)
            return maxAvailable >= minQty;
        });

        // Contar apenas extras com quantidade maior que o mínimo
        const selectedExtrasCount = extraIngredients.reduce((total, ing) => {
            const ingredientId = String(ing.id || ing.ingredient_id || `extra-${extraIngredients.indexOf(ing)}`);
            const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
            const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
            // Contar apenas se quantidade atual é maior que o mínimo
            if (currentQty > minQty) {
                return total + 1; // Conta quantos extras têm quantidade adicional
            }
            return total;
        }, 0);

        // Inicializar quantidades dos ingredientes padrão quando forem carregados
        useEffect(() => {
            if (defaultIngredients.length > 0) {
                const initialQuantities = {};
                defaultIngredients.forEach((ing, index) => {
                    const ingredientId = ing.id || ing.ingredient_id || index;
                    // Se estiver editando, usar os valores salvos; senão usar portions
                    const initialQty = editItem?.defaultIngredientsQuantities?.[ingredientId] !== undefined
                        ? editItem.defaultIngredientsQuantities[ingredientId]
                        : parseFloat(ing.portions || 0) || 0;
                    initialQuantities[ingredientId] = initialQty;
                });
                setDefaultIngredientsQuantities(initialQuantities);
            }
        }, [productIngredients, editItem]);

        // Aplicar dados de edição quando editItem estiver presente
        useEffect(() => {
            if (editItem) {
                // Aplicar quantidade
                if (editItem.quantity) {
                    setQuantity(editItem.quantity);
                }
                // Aplicar observações
                if (editItem.observacoes) {
                    setObservacoes(editItem.observacoes);
                }
                // Aplicar extras selecionados
                if (editItem.selectedExtras) {
                    setSelectedExtras(editItem.selectedExtras);
                }
            }
        }, [editItem]);

        // Atualizar ingredientes quando a quantidade do produto mudar
        // A API recalcula max_quantity automaticamente, então precisamos buscar novamente
        useEffect(() => {
            // Só atualiza se já tiver carregado o produto inicialmente
            if ((productId || produto?.id || productData?.id) && productIngredients.length > 0) {
                refreshProductData();
            }
        }, [quantity]);
        
        // Validar e ajustar extras quando os ingredientes forem atualizados
        useEffect(() => {
            if (productIngredients.length > 0 && Object.keys(selectedExtras).length > 0) {
                const updatedExtras = { ...selectedExtras };
                let hasChanges = false;
                
                extraIngredients.forEach((ing) => {
                    const ingredientId = String(ing.id || ing.ingredient_id);
                    if (updatedExtras[ingredientId] !== undefined) {
                        const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                        const maxQty = ing.max_quantity; // Já vem calculado da API
                        const currentQty = updatedExtras[ingredientId];
                        
                        // Ajustar se exceder o máximo disponível
                        if (maxQty !== null && maxQty !== undefined && currentQty > maxQty) {
                            updatedExtras[ingredientId] = Math.max(minQty, maxQty);
                            hasChanges = true;
                        }
                    }
                });
                
                if (hasChanges) {
                    setSelectedExtras(updatedExtras);
                }
            }
        }, [productIngredients]);

        // Calcular total de adicionais dos ingredientes padrão
        const defaultIngredientsTotal = useMemo(() => {
            let total = 0;
            defaultIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || index;
                const extra = findIngredientPrice(ing, ingredientId);
                const currentQty = defaultIngredientsQuantities[ingredientId] || parseFloat(ing.portions || 0) || 0;
                const initialQty = parseFloat(ing.portions || 0) || 0;
                // Calcular apenas a quantidade adicional além do padrão inicial
                const additionalQty = Math.max(0, currentQty - initialQty);
                total += extra * additionalQty;
            });
            return total;
        }, [defaultIngredients, defaultIngredientsQuantities, ingredientsCache]);

        // Calcular total de adicionais dos extras
        const extrasTotal = useMemo(() => {
            let total = 0;
            extraIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || `extra-${index}`;
                const extra = findIngredientPrice(ing, ingredientId);
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
                // Calcular apenas a quantidade adicional além do mínimo
                const additionalQty = Math.max(0, currentQty - minQty);
                total += extra * additionalQty;
            });
            return total;
        }, [extraIngredients, selectedExtras, ingredientsCache]);

        // Total de adicionais (padrão + extras)
        const totalAdditionalPrice = useMemo(() => {
            return defaultIngredientsTotal + extrasTotal;
        }, [defaultIngredientsTotal, extrasTotal]);

        const handleOpenExtrasModal = () => {
            // Inicializar estado temporário com valores salvos ou valores mínimos de cada ingrediente
            // max_quantity já vem calculado da API considerando a quantity atual
            const initialTempExtras = {};
            extraIngredients.forEach((ing, index) => {
                // IMPORTANTE: Usar String() para garantir consistência nas chaves
                const ingredientId = String(ing.id || ing.ingredient_id || `extra-${index}`);
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                const maxQty = ing.max_quantity; // Já vem calculado da API
                
                // Usa o valor salvo se existir e estiver dentro do limite, senão usa o mínimo
                let initialQty = selectedExtras[ingredientId] !== undefined 
                    ? selectedExtras[ingredientId] 
                    : minQty;
                
                // Garantir que não excede o máximo disponível
                if (maxQty !== null && maxQty !== undefined && initialQty > maxQty) {
                    initialQty = Math.max(minQty, maxQty);
                }
                
                initialTempExtras[ingredientId] = initialQty;
            });
            setTempSelectedExtras(initialTempExtras);
            setExtrasModalVisible(true);
        };

        const handleExtraQuantityChange = (ingredientId, quantity) => {
            // Alterar apenas o estado temporário
            // IMPORTANTE: Garantir que ingredientId seja string para consistência
            setTempSelectedExtras(prev => ({
                ...prev,
                [String(ingredientId)]: Number(quantity)
            }));
        };

        const handleSaveExtras = () => {
            // Salvar as alterações do estado temporário para o permanente
            // IMPORTANTE: Filtrar apenas extras com quantidade > 0 e garantir IDs são strings
            const savedExtras = {};
            Object.entries(tempSelectedExtras).forEach(([ingredientId, qty]) => {
                const id = String(ingredientId);
                const quantity = Number(qty);
                // Só salvar se quantity > 0
                if (!isNaN(quantity) && quantity > 0) {
                    savedExtras[id] = quantity;
                }
            });
            setSelectedExtras(savedExtras);
            setExtrasModalVisible(false);
        };

        const handleCancelExtras = () => {
            // Fechar modal sem salvar (o estado temporário será descartado)
            setExtrasModalVisible(false);
        };

        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Header
                        type={loggedIn ? 'logged' : 'home'}
                        userInfo={userInfo}
                        navigation={navigation}
                        title={loggedIn ? "Personalize seu pedido" : "Faça login para personalizar"}
                        subtitle={loggedIn ? "Monte do seu jeito!" : "E aproveite nossos produtos"}
                        enderecos={enderecos}
                        onEnderecoAtivoChange={handleEnderecoAtivoChange}
                        loadingPoints={loadingPoints}
                    />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent, 
                        keyboardVisible ? { paddingBottom: 20 } : null,
                        basketItems.length > 0 ? { paddingBottom: 180 } : null
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBackPress}
                        >
                            <SvgXml
                                xml={backArrowSvg}
                                width={30}
                                height={30}
                            />
                        </TouchableOpacity>
                        
                        <View style={styles.centerImageContainer}>
                            {loadingProduct ? (
                                <ActivityIndicator size="large" color="#000" />
                            ) : (
                                productData?.image_url ? (
                                    <Image
                                        source={{ uri: `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${productData.id}` }}
                                        style={styles.centerImage}
                                        resizeMode="contain"
                                    />
                                ) : produto?.imageSource ? (
                                    <Image
                                        source={produto.imageSource}
                                        style={styles.centerImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.centerImage} />
                                )
                            )}
                        </View>
                    </View>
                     <View style={styles.produtoContainer}>
                         <Text style={styles.produtoTitle}>{productData?.name || produto?.name || produto?.title || 'Produto'}</Text>
                         {!!(productData?.description || produto?.description) && (
                             <Text style={styles.produtoDescription}>{productData?.description || produto?.description}</Text>
                         )}
                     </View>
                     
                     <View style={styles.divisionContainer}>
                         <Image 
                             source={require('../assets/img/division.png')} 
                             style={styles.divisionImage}
                             resizeMode="contain"
                         />
                     </View>
                     
                                                                 <View style={styles.customizeContainer}>
                          <Text style={styles.produtoTitle}>Monte do seu jeito!</Text>
                                                     {defaultIngredients && defaultIngredients.length > 0 ? (
                               defaultIngredients.map((ing, index) => {
                                   const displayName = ing.name || ing.nome || 'Ingrediente';
                                   const ingredientId = ing.id || ing.ingredient_id || index;
                                   // Buscar preço do ingrediente usando cache ou dados do ingrediente
                                   const extra = findIngredientPrice(ing, ingredientId);
                                   // Usa portions como quantidade inicial (padrão do produto)
                                   const initialQty = parseFloat(ing.portions || 0) || 0;
                                   // Quantidade mínima e máxima
                                   const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                   // IMPORTANTE: Usar apenas max_quantity (minúsculo) da API, não maxQuantity (maiúsculo) que pode vir de cache antigo
                                   const maxQty = ing.max_quantity !== undefined && ing.max_quantity !== null ? ing.max_quantity : null;
                                   
                                   // Debug: log para verificar valores
                                   if (ingredientId === '28' || displayName.includes('Bovino')) {
                                       console.log(`[DEBUG] Ingrediente ${displayName} (${ingredientId}):`, {
                                           max_quantity: ing.max_quantity,
                                           maxQuantity: ing.maxQuantity,
                                           max_quantity_rule: ing.max_quantity_rule,
                                           maxQty_usado: maxQty,
                                           minQty: minQty
                                       });
                                   }
                                   
                                  return (
                                      <IngredienteMenu
                                          key={ingredientId}
                                          nome={displayName}
                                          valorExtra={extra}
                                          initialQuantity={initialQty}
                                          minQuantity={minQty}
                                          maxQuantity={maxQty !== null ? parseInt(maxQty, 10) : null}
                                          onQuantityChange={(newQuantity) => {
                                              // Atualizar a quantidade do ingrediente no estado
                                              setDefaultIngredientsQuantities(prev => ({
                                                  ...prev,
                                                  [ingredientId]: newQuantity
                                              }));
                                          }}
                                      />
                                  );
                              })
                          ) : (
                              null
                          )}
                          
                                                     {/* Botão Adicionar Extras */}
                           {extraIngredients && extraIngredients.length > 0 && (
                               <TouchableOpacity 
                                   style={styles.addExtrasButton}
                                   onPress={handleOpenExtrasModal}
                                   activeOpacity={0.8}
                               >
                                  {selectedExtrasCount > 0 && (
                                      <View style={styles.extrasBadge}>
                                          <Text style={styles.extrasBadgeText}>{selectedExtrasCount}</Text>
                                      </View>
                                  )}
                                  <Text style={styles.addExtrasButtonText}>Adicionar extras</Text>
                              </TouchableOpacity>
                          )}
                      </View>

                     <Observacoes
                         value={observacoes}
                         onChangeText={setObservacoes}
                         maxLength={140}
                         style={{ marginTop: 10, marginBottom: 20 }}
                     />

                     <QuantidadePrecoBar
                         unitPrice={productData?.price || 0}
                         initialQuantity={quantity}
                         additionalTotal={totalAdditionalPrice}
                         onQuantityChange={setQuantity}
                         onAddPress={({ quantity, total }) => {
                             // TODO: integrar ao carrinho quando disponível
                         }}
                         onAddToBasket={async ({ quantity, total, unitPrice }) => {
                             // Se estiver editando, remover o item antigo primeiro
                             if (editItem?.id || editItem?.cartItemId) {
                                 await removeFromBasket(editItem.cartItemId || editItem.id);
                             }
                             
                             // Gerar lista de modificações para exibição
                             const modifications = [];
                             
                             // Ingredientes padrão modificados
                             defaultIngredients.forEach((ing, index) => {
                                 const ingredientId = ing.id || ing.ingredient_id || index;
                                 const currentQty = defaultIngredientsQuantities[ingredientId] || parseFloat(ing.portions || 0) || 0;
                                 const initialQty = parseFloat(ing.portions || 0) || 0;
                                 
                                 if (currentQty > initialQty) {
                                     const extra = findIngredientPrice(ing, ingredientId);
                                     const additionalQty = currentQty - initialQty;
                                     if (additionalQty > 0 && extra > 0) {
                                         modifications.push({
                                             name: ing.name || ing.nome || 'Ingrediente',
                                             quantity: additionalQty,
                                             additionalPrice: extra * additionalQty
                                         });
                                     }
                                 }
                             });
                             
                             // Extras adicionados (quantidade total, não apenas adicional)
                             // IMPORTANTE: No web, os extras são enviados com a quantidade total, não apenas a adicional
                             extraIngredients.forEach((ing, index) => {
                                 // IMPORTANTE: Usar String() para garantir consistência nas chaves
                                 const ingredientId = String(ing.id || ing.ingredient_id || `extra-${index}`);
                                 const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                 const currentQty = selectedExtras[ingredientId] !== undefined ? Number(selectedExtras[ingredientId]) : minQty;
                                 
                                 // Enviar apenas se quantidade atual é maior que o mínimo
                                 if (currentQty > minQty) {
                                     const extra = findIngredientPrice(ing, ingredientId);
                                     // IMPORTANTE: Enviar quantidade total, não apenas a adicional
                                     // A API espera a quantidade total de porções
                                     if (extra > 0) {
                                         modifications.push({
                                             name: ing.name || ing.nome || 'Ingrediente',
                                             quantity: currentQty, // Quantidade total
                                             additionalPrice: extra * (currentQty - minQty) // Preço apenas da parte adicional
                                         });
                                     }
                                 }
                             });
                             
                             // Converter defaultIngredientsQuantities para baseModifications
                             // baseModifications representa mudanças em relação à receita padrão
                             const baseModifications = [];
                             Object.entries(defaultIngredientsQuantities).forEach(([ingredientId, currentQty]) => {
                                 const ing = defaultIngredients.find(ing => 
                                     String(ing.id || ing.ingredient_id) === String(ingredientId)
                                 );
                                 if (ing) {
                                     const minQty = parseFloat(ing.portions || 0) || 0;
                                     const delta = currentQty - minQty; // Diferença em relação ao padrão
                                     if (delta !== 0) {
                                         baseModifications.push({
                                             ingredient_id: Number(ingredientId),
                                             delta: delta
                                         });
                                     }
                                 }
                             });
                             
                            // Função auxiliar para adicionar ao carrinho
                            const addItemToCart = async () => {
                                // IMPORTANTE: Converter selectedExtras para formato da API
                                // A API espera apenas extras com quantity > min_quantity
                                // Validar cada extra antes de enviar
                                const extrasArray = [];
                                
                                Object.entries(selectedExtras || {}).forEach(([ingredientId, qty]) => {
                                    const id = Number(ingredientId);
                                    let quantity = Number(qty);
                                    
                                    // Validar ID e quantidade
                                    if (isNaN(id) || id <= 0 || isNaN(quantity) || quantity <= 0) {
                                        return; // Pula extras inválidos
                                    }
                                    
                                    // Encontrar o ingrediente para validar min/max
                                    const ing = extraIngredients.find(ing => 
                                        String(ing.id || ing.ingredient_id) === String(ingredientId)
                                    );
                                    
                                    if (!ing) {
                                        console.warn(`[Produto] Ingrediente extra não encontrado: ${ingredientId}`);
                                        return; // Pula se não encontrado
                                    }
                                    
                                    const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                    const maxQty = ing.max_quantity; // Já calculado pela API considerando estoque
                                    
                                    // Validar quantidade mínima
                                    if (quantity < minQty) {
                                        console.warn(`[Produto] Quantidade de extra abaixo do mínimo: ${ingredientId}, qty: ${quantity}, min: ${minQty}`);
                                        return; // Pula se abaixo do mínimo
                                    }
                                    
                                    // Validar quantidade máxima (se houver limite)
                                    if (maxQty !== null && maxQty !== undefined && maxQty > 0 && quantity > maxQty) {
                                        console.warn(`[Produto] Quantidade de extra excede o máximo: ${ingredientId}, qty: ${quantity}, max: ${maxQty}`);
                                        // Ajusta para o máximo disponível
                                        quantity = maxQty;
                                    }
                                    
                                    // IMPORTANTE: Adiciona se quantidade >= min_quantity
                                    // A quantidade enviada é a quantidade TOTAL (incluindo min_quantity)
                                    // Se minQty = 1 e quantity = 1, ainda deve ser salvo (é o mínimo permitido)
                                    if (quantity >= minQty) {
                                        extrasArray.push({
                                            ingredient_id: id,
                                            quantity: quantity // Quantidade total (incluindo min_quantity)
                                        });
                                    } else {
                                        console.warn(`[Produto] Quantidade de extra abaixo do mínimo: ${ingredientId}, qty: ${quantity}, min: ${minQty}`);
                                    }
                                });
                                
                                console.log('[Produto] Adicionando ao carrinho:', {
                                    productId: productData?.id || produto?.id,
                                    quantity: quantity,
                                    extrasCount: extrasArray.length,
                                    extras: extrasArray,
                                    baseModificationsCount: baseModifications.length,
                                    selectedExtras: selectedExtras // Para debug
                                });
                                
                                // IMPORTANTE: O BasketContext espera selectedExtras no formato { ingredientId: quantity }
                                // Mas também aceita extras já convertidos no formato da API
                                // Vamos enviar ambos para garantir compatibilidade
                                const result = await addToBasket({
                                    productId: productData?.id || produto?.id,
                                    quantity: quantity,
                                    observacoes: observacoes,
                                    selectedExtras: selectedExtras, // Mantém formato original para compatibilidade
                                    baseModifications: baseModifications,
                                    // Envia também extras já validados no formato da API
                                    extras: extrasArray
                                });
                                
                                if (result.success) {
                                    // Navegar para home após sucesso
                                    navigation.navigate('Home');
                                } else {
                                    // Mostrar erro se falhou
                                    Alert.alert(
                                        'Erro',
                                        result.error || 'Não foi possível adicionar o item à cesta',
                                        [{ text: 'OK' }]
                                    );
                                }
                            };
                             
                             // VALIDAÇÃO PREVENTIVA: Verificar disponibilidade antes de adicionar
                             const productId = productData?.id || produto?.id;
                             if (productId) {
                                 try {
                                     const availability = await safeCheckProductAvailability(productId, quantity);
                                     
                                    if (availability.status === 'unavailable') {
                                        // Log de diagnóstico: detalha quais ingredientes estão bloqueando
                                        try {
                                            const ingredients = Array.isArray(availability.ingredients) ? availability.ingredients : [];
                                            const unavailable = ingredients.filter((ing) => {
                                                if (!ing) return false;
                                                // Alguns backends retornam Decimals como strings; normaliza para número quando possível
                                                const current = typeof ing.current_stock === 'string' ? parseFloat(ing.current_stock) : ing.current_stock;
                                                const required = typeof ing.required === 'string' ? parseFloat(ing.required) : ing.required;
                                                return ing.is_available === false || (typeof current === 'number' && typeof required === 'number' && current < required);
                                            }).map((ing) => {
                                                const current = typeof ing.current_stock === 'string' ? parseFloat(ing.current_stock) : ing.current_stock;
                                                const required = typeof ing.required === 'string' ? parseFloat(ing.required) : ing.required;
                                                return {
                                                    ingredient_id: ing.ingredient_id,
                                                    name: ing.name,
                                                    is_available: !!ing.is_available,
                                                    current_stock: current,
                                                    required: required,
                                                    stock_unit: ing.stock_unit,
                                                    reason: ing.reason || (typeof current === 'number' && typeof required === 'number' && current < required ? 'estoque insuficiente' : undefined)
                                                };
                                            });

                                            const diag = {
                                                productId,
                                                productName: (productData?.name || produto?.name || produto?.title || 'Produto'),
                                                quantity,
                                                unavailable_count: unavailable.length,
                                                unavailable_ingredients: unavailable
                                            };
                                            console.warn('[DIAGNOSTICO] Produto indisponível (estoque/ingredientes): ' + JSON.stringify(diag, null, 2));
                                        } catch (logErr) {
                                            // Fallback em caso de erro ao montar log
                                            console.warn('[DIAGNOSTICO] Produto indisponível (falha ao detalhar ingredientes):', {
                                                productId,
                                                productName: (productData?.name || produto?.name || produto?.title || 'Produto'),
                                                quantity
                                            });
                                        }
                                         Alert.alert(
                                             'Produto Indisponível',
                                             availability.message || 'Este produto não está disponível no momento devido a falta de estoque.',
                                             [{ text: 'OK' }]
                                         );
                                         return; // Não adiciona ao carrinho
                                     }
                                     
                                     // Se status é 'unknown', permite continuar mas mostra aviso
                                     if (availability.status === 'unknown') {
                                         Alert.alert(
                                             'Atenção',
                                             'Não foi possível verificar a disponibilidade completa. O item será adicionado, mas pode não estar disponível no momento da finalização do pedido.',
                                             [
                                                 { text: 'Cancelar', style: 'cancel' },
                                                 { 
                                                     text: 'Continuar', 
                                                     onPress: addItemToCart
                                                 }
                                             ]
                                         );
                                         return;
                                     }
                                 } catch (availabilityError) {
                                     // Se falhar a verificação, permite continuar mas mostra aviso
                                     console.error('Erro ao verificar disponibilidade:', availabilityError);
                                     Alert.alert(
                                         'Atenção',
                                         'Não foi possível verificar a disponibilidade. O item será adicionado, mas pode não estar disponível no momento da finalização do pedido.',
                                         [
                                             { text: 'Cancelar', style: 'cancel' },
                                             { 
                                                 text: 'Continuar', 
                                                 onPress: addItemToCart
                                             }
                                         ]
                                     );
                                     return;
                                 }
                             }
                             
                             // Adiciona à cesta via API (só chega aqui se disponibilidade estiver OK)
                             await addItemToCart();
                         }}
                         style={{ marginBottom: 24 }}
                     />
                     </ScrollView>
                     
                    {!loggedIn && !keyboardVisible && basketItems.length === 0 && (
                        <View style={styles.fixedButtonContainer}>
                            <LoginButton navigation={navigation} />
                        </View>
                    )}

                    {!loggedIn && !keyboardVisible && basketItems.length > 0 && (
                        <View style={styles.fixedButtonContainer}>
                            <BasketFooter 
                                total={basketTotal}
                                itemCount={basketItemCount}
                                onPress={handleBasketPress}
                            />
                        </View>
                    )}
                    
                                         {loggedIn && !keyboardVisible && (
                         <View style={styles.menuNavigationContainer}>
                             <MenuNavigation navigation={navigation} currentRoute="Home" />
                             {basketItems.length > 0 && (
                                 <View style={styles.basketOverlay}>
                                     <BasketFooter 
                                         total={basketTotal}
                                         itemCount={basketItemCount}
                                         onPress={handleBasketPress}
                                     />
                                 </View>
                             )}
                         </View>
                     )}

                     {/* Modal de Extras */}
                     <Modal
                         visible={extrasModalVisible}
                         animationType="slide"
                         transparent={true}
                         onRequestClose={handleCancelExtras}
                     >
                         <View style={styles.modalOverlay}>
                             <View style={styles.modalContent}>
                                 {/* Header */}
                                 <View style={styles.modalHeader}>
                                     <View style={styles.modalHeaderText}>
                                         <Text style={styles.modalTitle}>Adicionar Extras</Text>
                                         <Text style={styles.modalSubtitle}>Personalize seu pedido com ingredientes extras</Text>
                                     </View>
                                     <TouchableOpacity 
                                         style={styles.modalCloseButton}
                                         onPress={handleCancelExtras}
                                     >
                                         <Text style={styles.modalCloseButtonText}>✕</Text>
                                     </TouchableOpacity>
                                 </View>

                                 {/* Lista de Extras */}
                                 <ScrollView 
                                     style={styles.modalScrollView}
                                     contentContainerStyle={styles.modalScrollContent}
                                 >
                                                                           {extraIngredients.map((ing, index) => {
                                          const displayName = ing.name || ing.nome || 'Ingrediente';
                                          // IMPORTANTE: Usar String() para garantir consistência nas chaves
                                          const ingredientId = String(ing.id || ing.ingredient_id || `extra-${index}`);
                                          // Buscar preço do ingrediente usando cache ou dados do ingrediente
                                          const extra = findIngredientPrice(ing, ingredientId);
                                          const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                          
                                          // IMPORTANTE: max_quantity já vem calculado pela API como o menor entre:
                                          // 1. Quantidade máxima da regra (max_quantity_rule)
                                          // 2. Quantidade disponível no estoque (com conversão de unidades)
                                          // Então max_quantity já é o valor correto a ser usado
                                          // NÃO usar maxQuantity (maiúsculo) que pode vir de cache antigo
                                          const maxQty = ing.max_quantity !== undefined && ing.max_quantity !== null ? ing.max_quantity : null;
                                          
                                          // Debug: log para verificar valores
                                          if (ingredientId === '28' || displayName.includes('Bovino')) {
                                              console.log(`[DEBUG] Extra ${displayName} (${ingredientId}):`, {
                                                  max_quantity: ing.max_quantity,
                                                  maxQuantity: ing.maxQuantity,
                                                  max_quantity_rule: ing.max_quantity_rule,
                                                  maxQty_usado: maxQty,
                                                  minQty: minQty,
                                                  availability_info: ing.availability_info
                                              });
                                          }
                                          
                                          const initialExtraQty = minQty || 0;
                                          const currentQuantity = tempSelectedExtras[ingredientId] !== undefined 
                                              ? Number(tempSelectedExtras[ingredientId])
                                              : initialExtraQty;

                                         return (
                                             <View key={ingredientId} style={styles.modalIngredientItem}>
                                                 <View style={styles.modalIngredientInfo}>
                                                    <Text style={styles.modalIngredientName}>{displayName}</Text>
                                                    <Text style={styles.modalIngredientPrice}>
                                                        + R$ {(parseFloat(extra) || 0).toFixed(2).replace('.', ',')}
                                                    </Text>
                                                 </View>
                                                 <View style={styles.modalQuantityContainer}>
                                                     {currentQuantity > minQty && (
                                                         <TouchableOpacity 
                                                             style={styles.modalMinusButton}
                                                             onPress={() => handleExtraQuantityChange(ingredientId, Math.max(minQty, currentQuantity - 1))}
                                                         >
                                                             <Text style={styles.modalMinusText}>-</Text>
                                                         </TouchableOpacity>
                                                     )}
                                                     <View style={styles.modalQuantityBox}>
                                                         <Text style={styles.modalQuantityText}>
                                                             {String(currentQuantity).padStart(2, '0')}
                                                         </Text>
                                                     </View>
                                                     {(() => {
                                                        // IMPORTANTE: max_quantity já vem calculado pela API como o menor entre:
                                                        // 1. Quantidade máxima da regra
                                                        // 2. Quantidade disponível no estoque (com conversão de unidades)
                                                        // Então maxQty já é o valor correto a ser usado
                                                        
                                                        let effectiveMaxQty;
                                                        if (maxQty === null || maxQty === undefined) {
                                                            // Sem limite, verifica availability_info como fallback
                                                            const availabilityInfo = ing.availability_info;
                                                            if (availabilityInfo && availabilityInfo.max_available !== undefined) {
                                                                // max_available é a quantidade máxima de extras (sem incluir min_quantity)
                                                                // Então a quantidade total máxima é: minQty + max_available
                                                                effectiveMaxQty = minQty + availabilityInfo.max_available;
                                                            } else {
                                                                // Sem informação de estoque, permite aumentar (será validado depois)
                                                                effectiveMaxQty = Infinity;
                                                            }
                                                        } else if (maxQty === 0) {
                                                            // Sem estoque disponível
                                                            effectiveMaxQty = minQty; // Só permite o mínimo
                                                        } else {
                                                            // maxQty já é o menor entre regra e estoque, calculado pela API
                                                            effectiveMaxQty = maxQty;
                                                        }
                                                        
                                                        // Só mostra botão + se pode aumentar além da quantidade atual
                                                        const canIncrease = effectiveMaxQty === Infinity || currentQuantity < effectiveMaxQty;
                                                        
                                                        return canIncrease && (
                                                            <TouchableOpacity 
                                                                style={styles.modalPlusButton}
                                                                onPress={() => {
                                                                    // Limita ao máximo disponível (já calculado pela API)
                                                                    const newQty = Math.min(currentQuantity + 1, effectiveMaxQty);
                                                                    handleExtraQuantityChange(ingredientId, newQty);
                                                                }}
                                                            >
                                                                <Text style={styles.modalPlusText}>+</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })()}
                                                 </View>
                                             </View>
                                         );
                                     })}
                                 </ScrollView>

                                 {/* Footer com Botões */}
                                 <View style={styles.modalFooter}>
                                     <TouchableOpacity 
                                         style={styles.modalCancelButton}
                                         onPress={handleCancelExtras}
                                     >
                                         <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity 
                                         style={styles.modalSaveButton}
                                         onPress={handleSaveExtras}
                                     >
                                         <Text style={styles.modalSaveButtonText}>Salvar</Text>
                                     </TouchableOpacity>
                                 </View>
                             </View>
                         </View>
                     </Modal>
             </View>
         );
     }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#F6F6F6',
        },
        header: {
            position: 'absolute',
            zIndex: 1001,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
        },
        backButton: {
            position: 'absolute',
            top: 10,
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
        },
        centerImageContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
        },
        centerImage: {
            width: 280,
            height: 230,
        },
        produtoContainer: {
            margin: 20,
            marginTop: 0,
            marginBottom: 10,
        },
        produtoTitle: {
            fontSize: 24,
        },
        produtoDescription: {
            fontSize: 14,  
            letterSpacing: 0.5,
            textAlign: 'justify',
            color: '#525252',
            marginBottom: 10,
        },
         divisionContainer: {
             alignItems: 'center',
         },
         divisionImage: {
             width: '100%',
             height: 20,
         },
        customizeContainer: {
            margin: 20,
            marginTop: 10,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100,
        },
        fixedButtonContainer: {
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 20,
            zIndex: 999,
        },
        menuNavigationContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
        },
                 basketOverlay: {
             position: 'absolute',
             bottom: 100, // Posiciona acima do MenuNavigation
             left: 16,
             right: 16,
             zIndex: 1001,
             paddingBottom: 16, // Espaçamento entre BasketFooter e MenuNavigation
         },
         // Botão Adicionar Extras
         addExtrasButton: {
             backgroundColor: '#000000',
             borderRadius: 8,
             paddingVertical: 14,
             paddingHorizontal: 20,
             marginTop: 16,
             alignItems: 'center',
             justifyContent: 'center',
             position: 'relative',
         },
         addExtrasButtonText: {
             color: '#FFFFFF',
             fontSize: 16,
             fontWeight: '500',
         },
         extrasBadge: {
             position: 'absolute',
             top: -8,
             left: -8,
             backgroundColor: '#FFD700',
             width: 24,
             height: 24,
             borderRadius: 12,
             alignItems: 'center',
             justifyContent: 'center',
             borderWidth: 2,
             borderColor: '#FFFFFF',
         },
         extrasBadgeText: {
             color: '#000000',
             fontSize: 12,
             fontWeight: '700',
         },
         // Modal de Extras
         modalOverlay: {
             flex: 1,
             backgroundColor: 'rgba(0, 0, 0, 0.5)',
             justifyContent: 'center',
             alignItems: 'center',
         },
         modalContent: {
             backgroundColor: '#FFFFFF',
             borderRadius: 20,
             width: '90%',
             maxHeight: '80%',
             minHeight: 400,
             shadowColor: '#000',
             shadowOffset: {
                 width: 0,
                 height: 2,
             },
             shadowOpacity: 0.25,
             shadowRadius: 3.84,
             elevation: 5,
             overflow: 'hidden',
         },
         modalHeader: {
             flexDirection: 'row',
             justifyContent: 'space-between',
             alignItems: 'flex-start',
             padding: 20,
             borderBottomWidth: 1,
             borderBottomColor: '#E0E0E0',
         },
         modalHeaderText: {
             flex: 1,
             marginRight: 12,
         },
         modalTitle: {
             fontSize: 20,
             fontWeight: 'bold',
             color: '#000000',
             marginBottom: 4,
         },
         modalSubtitle: {
             fontSize: 14,
             color: '#666666',
         },
         modalCloseButton: {
             width: 32,
             height: 32,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalCloseButtonText: {
             fontSize: 24,
             color: '#000000',
             fontWeight: '300',
         },
         modalScrollView: {
             flex: 1,
         },
         modalScrollContent: {
             padding: 20,
         },
         modalIngredientItem: {
             backgroundColor: '#F5F5F5',
             borderRadius: 8,
             padding: 16,
             marginBottom: 12,
             flexDirection: 'row',
             justifyContent: 'space-between',
             alignItems: 'center',
         },
         modalIngredientInfo: {
             flex: 1,
             marginRight: 12,
             flexDirection: 'column',
             alignItems: 'flex-start',
         },
         modalIngredientName: {
             fontSize: 16,
             fontWeight: '600',
             color: '#000000',
             marginBottom: 4,
         },
         modalIngredientPrice: {
             fontSize: 14,
             color: '#666666',
         },
         modalQuantityContainer: {
             flexDirection: 'row',
             alignItems: 'center',
             backgroundColor: '#E0E0E0',
             borderRadius: 8,
             overflow: 'hidden',
             height: 36,
         },
         modalMinusButton: {
             width: 36,
             height: 36,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalMinusText: {
             fontSize: 20,
             fontWeight: '600',
             color: '#FF4444',
         },
         modalQuantityBox: {
             paddingHorizontal: 12,
             height: 36,
             minWidth: 44,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalQuantityText: {
             fontSize: 14,
             fontWeight: '400',
             color: '#000000',
         },
         modalPlusButton: {
             width: 36,
             height: 36,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalPlusText: {
             fontSize: 20,
             fontWeight: '600',
             color: '#FF4444',
         },
         modalFooter: {
             flexDirection: 'row',
             justifyContent: 'space-between',
             padding: 20,
             borderTopWidth: 1,
             borderTopColor: '#E0E0E0',
             gap: 12,
         },
         modalCancelButton: {
             flex: 1,
             backgroundColor: '#E0E0E0',
             borderRadius: 8,
             paddingVertical: 14,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalCancelButtonText: {
             color: '#000000',
             fontSize: 16,
             fontWeight: '500',
         },
         modalSaveButton: {
             flex: 1,
             backgroundColor: '#FFD700',
             borderRadius: 8,
             paddingVertical: 14,
             alignItems: 'center',
             justifyContent: 'center',
         },
         modalSaveButtonText: {
             color: '#000000',
             fontSize: 16,
             fontWeight: '600',
         },
     });