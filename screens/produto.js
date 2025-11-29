    import React, {useState, useRef, useEffect, useMemo} from 'react';
import {StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Keyboard, Modal} from 'react-native';
    import { SvgXml } from 'react-native-svg';
    import { useIsFocused } from '@react-navigation/native';
    import Header from "../components/Header";
    import Input from "../components/Input";
    import IngredienteMenu from "../components/IngredienteMenuSemLogin";
    import LoginButton from "../components/ButtonView";
    import MenuNavigation from "../components/MenuNavigation";
    import Observacoes from "../components/Observacoes";
    import QuantidadePrecoBar from "../components/QuantidadePrecoBar";
import CustomAlert from '../components/CustomAlert';
import { getFriendlyErrorMessage } from '../utils/alertHelper';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getMenuProduct } from '../services/menuService';
import { getProductIngredients, getProductById, checkProductAvailability, simulateProductCapacity } from '../services/productService';
import { getAllIngredients } from '../services/ingredientService';
import { getPromotionByProductId } from '../services/promotionService';
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
        // ALTERAÇÃO: log de fallback removido para evitar ruído no console
        const response = await api.get(`/products/${productId}/availability`, {
            params: { quantity }
        });
        return response.data;
    } catch (error) {
        // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
        const isDev = __DEV__;
        if (isDev) {
            console.error("Erro ao verificar disponibilidade:", error);
        }
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
        // ALTERAÇÃO: removidos logs de depuração que poluíam o console durante a navegação
        
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
        // ALTERAÇÃO: Inicializar promoção com valor do produto se disponível para evitar piscar do preço
        const [promotion, setPromotion] = useState(produto?.promotion || null);
        const [observacoes, setObservacoes] = useState('');
        const [quantity, setQuantity] = useState(1);
        const [keyboardVisible, setKeyboardVisible] = useState(false);
        const [extrasModalVisible, setExtrasModalVisible] = useState(false);
        const [selectedExtras, setSelectedExtras] = useState({}); // {ingredientId: quantity}
        const [tempSelectedExtras, setTempSelectedExtras] = useState({}); // Estado temporário para a modal
        const [ingredientsCache, setIngredientsCache] = useState(null); // Cache de ingredientes da API
        const [defaultIngredientsQuantities, setDefaultIngredientsQuantities] = useState({}); // {ingredientId: quantity}
        // ALTERAÇÃO: Adicionar estados para validação de capacidade
        const [productMaxQuantity, setProductMaxQuantity] = useState(99);
        const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);
        const [capacityData, setCapacityData] = useState(null);
        const [stockLimitMessage, setStockLimitMessage] = useState(null);
        const capacityUpdateTimeoutRef = useRef(null); // ALTERAÇÃO: Ref para timeout do debounce
        // ALTERAÇÃO: Estados para CustomAlert
        const [alertVisible, setAlertVisible] = useState(false);
        const [alertType, setAlertType] = useState('info');
        const [alertTitle, setAlertTitle] = useState('');
        const [alertMessage, setAlertMessage] = useState('');
        const [alertButtons, setAlertButtons] = useState([]);
        const { addToBasket, updateBasketItem, removeFromBasket, basketItems, basketTotal, basketItemCount } = useBasket();

        const productImageSource = useMemo(() => {
            // ALTERAÇÃO: centraliza escolha da imagem e evita piscar enquanto a API carrega
            if (productData?.id && productData?.image_url) {
                return {
                    uri: `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${productData.id}`
                };
            }

            if (produto?.id && produto?.image_url) {
                return {
                    uri: `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${produto.id}`
                };
            }

            if (produto?.imageSource) {
                return produto.imageSource;
            }

            return null;
        }, [productData?.id, productData?.image_url, produto?.id, produto?.image_url, produto?.imageSource]);

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

        const fetchLoyaltyBalance = async (userId) => {
            try {
                setLoadingPoints(true);
                const balance = await getLoyaltyBalance(userId);
                const points = balance?.current_balance || 0;
                setLoyaltyBalance(points);
                return points;
            } catch (error) {
                // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
                const isDev = __DEV__;
                if (isDev) {
                    console.error('Erro ao buscar pontos:', error);
                }
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
                // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
                const isDev = __DEV__;
                if (isDev) {
                    console.error('Erro ao carregar cache de ingredientes:', error);
                }
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
                    // ALTERAÇÃO: Carregar cache de ingredientes em paralelo com outras operações
                    const cachePromise = loadIngredientsCache();
                    
                    // Prioriza productId; se não houver, tenta usar produto.id ou mantém produto
                    const idToFetch = productId || produto?.id;
                    const pid = idToFetch || produto?.id;
                    
                    // ALTERAÇÃO: Buscar ingredientes em paralelo com produto e promoção para carregar mais rápido
                    const fetchIngredients = async () => {
                        if (pid) {
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
                            } catch (e) {
                                // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
                                const isDev = __DEV__;
                                if (isDev) {
                                    console.error('Erro ao buscar ingredientes:', e);
                                }
                                if (!isCancelled) setProductIngredients([]);
                            }
                        } else {
                            if (!isCancelled) setProductIngredients([]);
                        }
                    };
                    
                    // ALTERAÇÃO: Iniciar busca de ingredientes imediatamente (não esperar produto)
                    const ingredientsPromise = fetchIngredients();
                    
                    // ALTERAÇÃO: Buscar promoção imediatamente em paralelo (antes de buscar produto) para evitar piscar do preço
                    const fetchPromotion = async () => {
                        if (pid) {
                            try {
                                const productPromotion = await getPromotionByProductId(pid);
                                if (!isCancelled) setPromotion(productPromotion);
                            } catch (e) {
                                // Ignora erros ao buscar promoção (produto pode não ter promoção)
                                // ALTERAÇÃO: Só atualiza para null se não houver promoção inicial do produto
                                if (!isCancelled && !produto?.promotion) {
                                    setPromotion(null);
                                }
                            }
                        } else if (!produto?.promotion) {
                            setPromotion(null);
                        }
                    };
                    const promotionPromise = fetchPromotion();
                    
                    // Aguardar cache de ingredientes
                    await cachePromise;
                    
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
                                // (já está sendo feito em fetchIngredients acima)
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
                        setProductData(data || produto || null);
                        
                        // ALTERAÇÃO: Aguardar promoção e ingredientes (já iniciados acima)
                        await Promise.all([promotionPromise, ingredientsPromise]);
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
            // ALTERAÇÃO: navega para a tela da cesta quando o botão é pressionado
            navigation.navigate('Cesta');
        };

        // ALTERAÇÃO: Separar ingredientes em produto padrão e extras usando useMemo para otimização
        const defaultIngredients = useMemo(() => {
            return productIngredients.filter((ing) => {
                // ALTERAÇÃO: usa mesma regra de ProdutoEditar para ordenar/filtrar ingredientes padrão
                const portions = parseFloat(ing.portions || 0) || 0;
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                const maxQty = ing.max_quantity || ing.maxQuantity;
                if (portions <= 0) return false;
                if (maxQty !== null && maxQty !== undefined) {
                    const maxQtyNum = parseInt(maxQty, 10);
                    if (minQty === maxQtyNum) return false;
                }
                return true;
            });
        }, [productIngredients]);

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
                    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
                    const isDev = __DEV__;
                    if (isDev) {
                        console.error('Erro ao atualizar dados do produto:', error);
                    }
                }
            }
        };

        // ALTERAÇÃO: Usar useMemo para otimizar filtro de extras
        const extraIngredients = useMemo(() => {
            return productIngredients.filter((ing) => {
                // ALTERAÇÃO: mesma lógica do ProdutoEditar para manter a ordem original dos extras
                const portions = parseFloat(ing.portions || 0) || 0;
                return portions === 0;
            });
        }, [productIngredients]);

        // Somar a quantidade total de extras selecionados (comportamento idêntico ao ProdutoEditar)
        const selectedExtrasCount = extraIngredients.reduce((total, ing) => {
            // ALTERAÇÃO: contagem de extras igual ao ProdutoEditar (inclui quantidade mínima)
            const ingredientId = ing.id || ing.ingredient_id || `extra-${extraIngredients.indexOf(ing)}`;
            const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
            const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
            return total + currentQty;
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

        // ALTERAÇÃO: Handler para mudanças de quantidade com validação
        const handleQuantityChange = (newQuantity) => {
            const delta = newQuantity - quantity;
            setQuantity(newQuantity);
            // ALTERAÇÃO: Atualizar capacidade quando quantidade muda
            debouncedUpdateProductCapacity(delta > 0); // Mostrar mensagem apenas ao aumentar
        };

        // Atualizar ingredientes quando a quantidade do produto mudar
        // A API recalcula max_quantity automaticamente, então precisamos buscar novamente
        useEffect(() => {
            // Só atualiza se já tiver carregado o produto inicialmente
            if ((productId || produto?.id || productData?.id) && productIngredients.length > 0) {
                refreshProductData();
            }
        }, [quantity]);

        // ALTERAÇÃO: Inicializar capacidade quando produto e ingredientes estiverem carregados
        useEffect(() => {
            if ((productData?.id || produto?.id) && productIngredients.length > 0) {
                // Inicializar capacidade sem mostrar mensagem
                updateProductCapacity(false, false);
            }
        }, [productData?.id, produto?.id, productIngredients.length]);

        // ALTERAÇÃO: Atualizar capacidade quando selectedExtras ou defaultIngredientsQuantities mudarem
        useEffect(() => {
            if ((productData?.id || produto?.id) && productIngredients.length > 0) {
                debouncedUpdateProductCapacity(false);
            }
        }, [selectedExtras, defaultIngredientsQuantities]);
        
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

        // ALTERAÇÃO: Calcular preço final do produto com desconto se houver promoção
        const finalProductPrice = useMemo(() => {
            // ALTERAÇÃO: Não usar fallback 0, retornar null se preço não estiver disponível
            const basePriceRaw = productData?.price || produto?.price;
            if (basePriceRaw === null || basePriceRaw === undefined) {
                return null;
            }
            const basePrice = parseFloat(basePriceRaw);
            if (isNaN(basePrice)) {
                return null;
            }
            
            if (promotion) {
                // Priorizar discount_percentage se disponível
                if (promotion.discount_percentage && parseFloat(promotion.discount_percentage) > 0) {
                    const discountPercentage = parseFloat(promotion.discount_percentage);
                    return basePrice * (1 - discountPercentage / 100);
                } else if (promotion.discount_value && parseFloat(promotion.discount_value) > 0) {
                    const discountValue = parseFloat(promotion.discount_value);
                    return basePrice - discountValue;
                }
            }
            
            return basePrice;
        }, [productData?.price, produto?.price, promotion]);

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

        // ALTERAÇÃO: Função para atualizar capacidade quando extras/quantidade mudam
        const updateProductCapacity = async (showMessage = false, immediate = false) => {
            if (!productData?.id && !produto?.id) return null;
            
            const productId = productData?.id || produto?.id;
            
            // ALTERAÇÃO: Se já está atualizando e não é imediato, aguardar debounce
            if (isUpdatingCapacity && !immediate) {
                return null;
            }
            
            try {
                setIsUpdatingCapacity(true);
                
                // ALTERAÇÃO: Preparar extras no formato esperado pela API
                // Filtrar apenas extras com quantidade > 0 para evitar enviar extras removidos
                const extras = Object.entries(selectedExtras || {})
                    .filter(([ingredientId, qty]) => {
                        const id = Number(ingredientId);
                        const quantity = Number(qty);
                        // ALTERAÇÃO: Garantir que quantity seja > 0 (não incluir extras removidos)
                        return !isNaN(id) && id > 0 && !isNaN(quantity) && quantity > 0;
                    })
                    .map(([ingredientId, qty]) => ({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(qty)
                    }));
                
                // Preparar base_modifications no formato esperado pela API
                // ALTERAÇÃO: Calcular defaultIngredients dentro da função para garantir acesso
                const defaultIngredientsLocal = productIngredients.filter((ing) => {
                    const portions = parseFloat(ing.portions || 0) || 0;
                    const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                    const maxQty = ing.max_quantity || ing.maxQuantity;
                    if (portions <= 0) return false;
                    if (maxQty !== null && maxQty !== undefined) {
                        const maxQtyNum = parseInt(maxQty, 10);
                        if (minQty === maxQtyNum) return false;
                    }
                    return true;
                });
                
                // ALTERAÇÃO: Preparar base_modifications filtrando deltas zero corretamente
                const baseModifications = [];
                Object.entries(defaultIngredientsQuantities || {}).forEach(([ingredientId, data]) => {
                    const id = Number(ingredientId);
                    if (isNaN(id) || id <= 0) return;
                    
                    // Encontrar o ingrediente para calcular delta correto
                    const ing = defaultIngredientsLocal.find(ing => 
                        Number(ing.id || ing.ingredient_id) === id
                    );
                    
                    if (!ing) return;
                    
                    const defaultPortions = parseFloat(ing.portions || 0) || 0;
                    let currentQty = 0;
                    
                    // ALTERAÇÃO: Calcular currentQty baseado no tipo de data
                    if (typeof data === 'number') {
                        currentQty = data;
                    } else if (data && typeof data === 'object') {
                        // Se for objeto, usar current se existir, senão calcular de delta
                        if (data.current !== undefined) {
                            currentQty = parseFloat(data.current || 0);
                        } else if (data.delta !== undefined) {
                            currentQty = defaultPortions + parseFloat(data.delta || 0);
                        } else {
                            currentQty = defaultPortions;
                        }
                    } else {
                        currentQty = parseFloat(data || 0);
                    }
                    
                    // Calcular delta
                    const delta = currentQty - defaultPortions;
                    
                    // ALTERAÇÃO: Apenas incluir se delta for diferente de zero
                    if (!isNaN(delta) && delta !== 0) {
                        baseModifications.push({
                            ingredient_id: id,
                            delta: delta
                        });
                    }
                });
                
                const capacityResult = await simulateProductCapacity(
                    productId,
                    extras,
                    quantity,
                    baseModifications
                );
                
                const maxQuantity = capacityResult?.max_quantity ?? 99;
                setProductMaxQuantity(maxQuantity);
                setCapacityData(capacityResult);
                
                // Atualizar limites na UI
                updateQuantityLimits(maxQuantity, capacityResult);
                
                // Exibir mensagem de limite se houver e showMessage=true
                if (showMessage && capacityResult?.limiting_ingredient) {
                    setStockLimitMessage(capacityResult.limiting_ingredient.message);
                } else {
                    setStockLimitMessage(null);
                }
                
                return capacityResult;
            } catch (error) {
                // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
                const isDev = __DEV__;
                if (isDev) {
                    console.error('Erro ao atualizar capacidade:', error);
                }
                return null;
            } finally {
                setIsUpdatingCapacity(false);
            }
        };

        // ALTERAÇÃO: Função para atualizar limites de quantidade na UI
        const updateQuantityLimits = (maxQuantity, capacityData) => {
            // Se maxQuantity for 0 ou null, ainda permitir aumentar para permitir alternar
            // A validação será feita quando tentar adicionar ao carrinho
            if (maxQuantity > 0 && quantity >= maxQuantity) {
                // Desabilitar botão de aumentar quantidade
                // (implementar desabilitação visual do botão)
            } else {
                // Habilitar botão de aumentar quantidade
            }
        };

        // ALTERAÇÃO: Versão com debounce para chamadas não críticas
        const debouncedUpdateProductCapacity = (showMessage = false) => {
            if (capacityUpdateTimeoutRef.current) {
                clearTimeout(capacityUpdateTimeoutRef.current);
            }
            
            capacityUpdateTimeoutRef.current = setTimeout(() => {
                updateProductCapacity(showMessage, false);
            }, 500); // Aguardar 500ms após última mudança
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
            // ALTERAÇÃO: Atualizar capacidade quando extras mudam
            debouncedUpdateProductCapacity(false);
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
                            {productImageSource ? (
                                <View style={styles.imageWrapper}>
                                    <Image
                                        source={productImageSource}
                                        style={styles.centerImage}
                                        resizeMode="cover"
                                        onError={() => {
                                            // ALTERAÇÃO: Log apenas em desenvolvimento
                                            const isDev = __DEV__;
                                            if (isDev) {
                                                console.log('Erro ao carregar imagem do produto:', productImageSource?.uri);
                                            }
                                        }}
                                    />
                                </View>
                            ) : null}
                        </View>
                    </View>
                     {(productData || produto) ? (
                         <View style={styles.produtoContainer}>
                             <Text style={styles.produtoTitle}>{productData?.name || produto?.name || produto?.title}</Text>
                             {!!(productData?.description || produto?.description) && (
                                 <Text style={styles.produtoDescription}>{productData?.description || produto?.description}</Text>
                             )}
                         </View>
                     ) : null}
                     
                     <View style={styles.divisionContainer}>
                         <Image 
                             source={require('../assets/img/division.png')} 
                             style={styles.divisionImage}
                             resizeMode="contain"
                         />
                     </View>
                     
                     <View style={styles.customizeContainer}>
                         <View style={styles.customizeHeader}>
                             <Text style={styles.produtoTitle}>Monte do seu jeito!</Text>
                             {/* ALTERAÇÃO: Adicionar indicador de loading durante validação */}
                             {isUpdatingCapacity && (
                                 <ActivityIndicator 
                                     size="small" 
                                     color="#666" 
                                     style={styles.capacityLoadingIndicator}
                                 />
                             )}
                         </View>
                         {/* ALTERAÇÃO: Exibir mensagem de limite de estoque */}
                         {stockLimitMessage && (
                             <View style={styles.stockLimitMessage}>
                                 <Text style={styles.stockLimitMessageText}>
                                     ⚠️ {stockLimitMessage}
                                 </Text>
                             </View>
                         )}
                             {defaultIngredients && defaultIngredients.length > 0 ? (
                                 defaultIngredients.map((ing, index) => {
                                     const displayName = ing.name || ing.nome;
                                     const ingredientId = ing.id || ing.ingredient_id || index;
                                   // Buscar preço do ingrediente usando cache ou dados do ingrediente
                                   const extra = findIngredientPrice(ing, ingredientId);
                                   // Usa portions como quantidade inicial (padrão do produto)
                                   const initialQty = parseFloat(ing.portions || 0) || 0;
                                   // Quantidade mínima e máxima
                                   const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                   // IMPORTANTE: Usar apenas max_quantity (minúsculo) da API, não maxQuantity (maiúsculo) que pode vir de cache antigo
                                   const maxQty = ing.max_quantity !== undefined && ing.max_quantity !== null ? ing.max_quantity : null;
                                   
                                   // ALTERAÇÃO: logs de depuração de ingredientes removidos para evitar ruído
                                   
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
                                              // ALTERAÇÃO: Atualizar capacidade quando modificações mudam
                                              debouncedUpdateProductCapacity(false);
                                          }}
                                      />
                                     );
                                 })
                             ) : null}
                             
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
                         unitPrice={finalProductPrice} // ALTERAÇÃO: usa preço final com desconto se houver promoção
                         initialQuantity={quantity}
                         additionalTotal={totalAdditionalPrice}
                         onQuantityChange={handleQuantityChange} // ALTERAÇÃO: usar handler com validação
                         onAddPress={({ quantity, total }) => {
                             // TODO: integrar ao carrinho quando disponível
                         }}
                         onAddToBasket={async ({ quantity, total, unitPrice }) => {
                             // ALTERAÇÃO: Preparar dados de forma otimizada (sem processamento pesado de modificações)
                             const productId = productData?.id || produto?.id;
                             
                             // ALTERAÇÃO: Preparar baseModifications de forma otimizada
                             const baseModifications = [];
                             Object.entries(defaultIngredientsQuantities).forEach(([ingredientId, currentQty]) => {
                                 const ing = defaultIngredients.find(ing => 
                                     String(ing.id || ing.ingredient_id) === String(ingredientId)
                                 );
                                 if (ing) {
                                     const minQty = parseFloat(ing.portions || 0) || 0;
                                     let currentQtyNum = typeof currentQty === 'number' 
                                         ? currentQty 
                                         : (currentQty?.current !== undefined ? parseFloat(currentQty.current || 0) : parseFloat(currentQty || 0));
                                     const delta = currentQtyNum - minQty;
                                     if (!isNaN(delta) && delta !== 0) {
                                         baseModifications.push({
                                             ingredient_id: Number(ingredientId),
                                             delta: delta
                                         });
                                     }
                                 }
                             });
                             
                             // ALTERAÇÃO: Preparar extras de forma otimizada
                             const extrasArray = [];
                             Object.entries(selectedExtras || {}).forEach(([ingredientId, qty]) => {
                                 const id = Number(ingredientId);
                                 let qtyNum = Number(qty);
                                 if (isNaN(id) || id <= 0 || isNaN(qtyNum) || qtyNum <= 0) return;
                                 
                                 const ing = extraIngredients.find(ing => 
                                     String(ing.id || ing.ingredient_id) === String(ingredientId)
                                 );
                                 if (!ing) return;
                                 
                                 const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                 const maxQty = ing.max_quantity;
                                 
                                 if (qtyNum < minQty) return;
                                 if (maxQty !== null && maxQty !== undefined && maxQty > 0 && qtyNum > maxQty) {
                                     qtyNum = maxQty;
                                 }
                                 
                                 if (qtyNum >= minQty) {
                                     extrasArray.push({
                                         ingredient_id: id,
                                         quantity: qtyNum
                                     });
                                 }
                             });
                             
                             // ALTERAÇÃO: Navegação otimista - navegar imediatamente após preparar dados
                             // A adição será feita em background para melhor UX (não bloqueia navegação)
                             navigation.navigate('Home');
                             
                             // ALTERAÇÃO: Processar adição em background (não bloqueia navegação)
                             // Usar setTimeout para garantir que a navegação aconteça primeiro
                             setTimeout(async () => {
                                 try {
                                     // Se estiver editando, remover o item antigo primeiro
                                     if (editItem?.id || editItem?.cartItemId) {
                                         await removeFromBasket(editItem.cartItemId || editItem.id);
                                     }
                                     
                                     // Adicionar ao carrinho (a API já valida estoque)
                                     const result = await addToBasket({
                                         productId: productId,
                                         quantity: quantity,
                                         observacoes: observacoes,
                                         selectedExtras: selectedExtras,
                                         baseModifications: baseModifications,
                                         extras: extrasArray
                                     });
                                     
                                     // ALTERAÇÃO: Se houver erro, será tratado pelo backend no checkout
                                     // Não bloqueamos o usuário com validações aqui
                                     if (!result.success) {
                                         const isDev = __DEV__;
                                         if (isDev) {
                                             console.warn('Erro ao adicionar item ao carrinho:', result.error);
                                         }
                                         // O erro será validado quando o usuário tentar finalizar o pedido
                                     }
                                 } catch (error) {
                                     // ALTERAÇÃO: Erro silencioso em background - será validado no checkout
                                     const isDev = __DEV__;
                                     if (isDev) {
                                         console.error('Erro ao adicionar item ao carrinho:', error);
                                     }
                                 }
                             }, 50); // Pequeno delay para garantir que navegação aconteceu primeiro
                         }}
                         style={{ marginBottom: 24 }}
                     />
                    </ScrollView>
                    
                    {/* ALTERAÇÃO: Indicador de loading durante validação de capacidade */}
                    {isUpdatingCapacity && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="small" color="#FFC700" />
                            <Text style={styles.loadingText}>Validando estoque...</Text>
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
                                         const displayName = ing.name || ing.nome;
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
                                          
                                          // ALTERAÇÃO: logs de depuração de extras removidos para evitar ruído
                                          
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
        imageWrapper: {
            width: 280,
            height: 230,
            borderRadius: 16, // ALTERAÇÃO: bordas arredondadas na imagem
            overflow: 'hidden', // ALTERAÇÃO: necessário para borderRadius funcionar
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
        customizeHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        // ALTERAÇÃO: Estilos para validação de capacidade
        capacityLoadingIndicator: {
            marginLeft: 8,
        },
        stockLimitMessage: {
            backgroundColor: '#fff3cd',
            borderColor: '#ffc107',
            borderWidth: 1,
            borderRadius: 4,
            padding: 12,
            marginVertical: 8,
        },
        stockLimitMessageText: {
            fontSize: 14,
            color: '#856404',
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