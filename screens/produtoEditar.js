    import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Keyboard, Modal} from 'react-native';
    import { SvgXml } from 'react-native-svg';
    import { useIsFocused } from '@react-navigation/native';
    import Header from "../components/Header";
    import Input from "../components/Input";
    import IngredienteMenu from "../components/IngredienteMenuSemLogin";
    import LoginButton from "../components/ButtonView";
    import MenuNavigation from "../components/MenuNavigation";
    import Observacoes from "../components/Observacoes";
    // QuantidadePrecoBar removido - usando botão Salvar no lugar
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getMenuProduct } from '../services/menuService';
import { getProductIngredients, getProductById } from '../services/productService';
import { getAllIngredients } from '../services/ingredientService';
import { useBasket } from '../contexts/BasketContext';
import BasketFooter from '../components/BasketFooter';
import api from '../services/api';

    const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

    export default function ProdutoEditar({navigation, route}) {
        const { produto, productId, editItem } = route.params || {};
        
        // Debug: log do productId recebido
        console.log('[DEBUG] ProdutoEditar screen - productId recebido:', productId);
        console.log('[DEBUG] ProdutoEditar screen - produto recebido:', produto);
        console.log('[DEBUG] ProdutoEditar screen - editItem recebido:', editItem);
        
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
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Rastrear alterações não salvas
        const [showUnsavedModal, setShowUnsavedModal] = useState(false); // Modal de confirmação
        const initialValuesRef = useRef({ quantity: 1, observacoes: '', selectedExtras: {}, defaultIngredientsQuantities: {} }); // Valores iniciais para comparação
        const isSavingRef = useRef(false); // Flag para indicar que estamos salvando intencionalmente
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
                            try {
                                const p = await getProductById(idToFetch);
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
                        data = produto;
                    }

                    if (!isCancelled) {
                        // Log para depuração do retorno
                        console.log('[DEBUG] Produto - dados recebidos da API:', data);
                        setProductData(data || produto || null);
                        // Buscar ingredientes somente com ID válido
                        const pid = idToFetch || data?.id;
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
                                console.error('Erro ao buscar ingredientes:', e);
                                if (!isCancelled) setProductIngredients([]);
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

        // Interceptar navegação antes de sair
        useEffect(() => {
            const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                // Se está salvando intencionalmente, permitir saída sem mostrar modal
                if (isSavingRef.current) {
                    return;
                }

                if (!hasUnsavedChanges) {
                    // Se não há alterações, permitir saída normalmente
                    return;
                }

                // Prevenir ação padrão de saída
                e.preventDefault();

                // Mostrar modal de confirmação
                setShowUnsavedModal(true);
            });

            return unsubscribe;
        }, [navigation, hasUnsavedChanges]);

        const handleBackPress = () => {
            if (hasUnsavedChanges) {
                setShowUnsavedModal(true);
            } else {
                navigation.goBack();
            }
        };

        const handleSaveAndExit = () => {
            // Calcular total com adicionais
            const unitPrice = parseFloat(productData?.price || 0);
            const baseTotal = unitPrice * quantity;
            const total = baseTotal + totalAdditionalPrice;
            
            // Gerar lista de modificações para exibição
            const modifications = [];
            
            // Ingredientes padrão modificados
            defaultIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || index;
                const initialQty = parseFloat(ing.portions || 0) || 0;
                
                let currentQty = initialQty;
                if (defaultIngredientsQuantities[ingredientId] !== undefined) {
                    const savedValue = defaultIngredientsQuantities[ingredientId];
                    // Se for um objeto, extrair o valor numérico
                    if (typeof savedValue === 'object' && savedValue !== null) {
                        currentQty = parseFloat(savedValue.current || savedValue.quantity || 0) || 0;
                        // Se tiver delta, somar com portions inicial
                        if (savedValue.delta !== undefined) {
                            currentQty = initialQty + parseFloat(savedValue.delta || 0);
                        }
                    } else {
                        // Se for número direto, usar
                        currentQty = parseFloat(savedValue) || 0;
                    }
                }
                
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
            
            // Extras adicionados (quantidade adicional acima do mínimo)
            // IMPORTANTE: Para exibição, mostrar apenas a quantidade adicional acima do mínimo
            // Mas para a API, enviar TODA a quantidade (incluindo o mínimo)
            extraIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || `extra-${index}`;
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
                
                // Mostrar apenas se quantidade atual é maior que o mínimo (para exibição)
                if (currentQty > minQty) {
                    const extra = findIngredientPrice(ing, ingredientId);
                    const additionalQty = currentQty - minQty;
                    if (additionalQty > 0 && extra > 0) {
                        modifications.push({
                            name: ing.name || ing.nome || 'Ingrediente',
                            quantity: additionalQty,
                            additionalPrice: extra * additionalQty
                        });
                    }
                }
            });
            
            // Converter selectedExtras para formato da API (array de {ingredient_id, quantity})
            // IMPORTANTE: Enviar TODA a quantidade dos extras (incluindo o mínimo), não apenas a adicional
            const extrasForAPI = [];
            extraIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || `extra-${index}`;
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
                
                // Enviar para API se quantidade > 0 (incluindo o mínimo)
                if (currentQty > 0) {
                    extrasForAPI.push({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(currentQty)
                    });
                }
            });
            
            // Converter baseModifications para formato da API
            const baseModificationsForAPI = [];
            defaultIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || index;
                const initialQty = parseFloat(ing.portions || 0) || 0;
                
                let currentQty = initialQty;
                if (defaultIngredientsQuantities[ingredientId] !== undefined) {
                    const savedValue = defaultIngredientsQuantities[ingredientId];
                    // Se for um objeto, extrair o valor numérico
                    if (typeof savedValue === 'object' && savedValue !== null) {
                        currentQty = parseFloat(savedValue.current || savedValue.quantity || 0) || 0;
                        // Se tiver delta, somar com portions inicial
                        if (savedValue.delta !== undefined) {
                            currentQty = initialQty + parseFloat(savedValue.delta || 0);
                        }
                    } else {
                        // Se for número direto, usar
                        currentQty = parseFloat(savedValue) || 0;
                    }
                }
                
                // Calcular delta (diferença entre quantidade atual e inicial)
                const delta = currentQty - initialQty;
                
                // Enviar para API apenas se houver mudança
                if (delta !== 0) {
                    baseModificationsForAPI.push({
                        ingredient_id: Number(ingredientId),
                        delta: Number(delta)
                    });
                }
            });
            
            // Atualizar o item existente ao invés de criar um novo
            if (editItem?.id) {
                updateBasketItem(editItem.id, {
                    quantity: quantity,
                    total: total,
                    price: unitPrice,
                    productName: productData?.name || produto?.name || 'Produto',
                    description: productData?.description || produto?.description,
                    image: productData?.image_url ? 
                        `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${productData.id}` : 
                        produto?.imageSource?.uri,
                    observacoes: observacoes,
                    selectedExtras: selectedExtras, // Manter para compatibilidade
                    extras: extrasForAPI, // Enviar extras no formato da API
                    baseModifications: baseModificationsForAPI, // Enviar modificações no formato da API
                    defaultIngredientsQuantities: defaultIngredientsQuantities,
                    modifications: modifications // Para exibição
                });
            } else {
                // Se não houver editItem (não deveria acontecer nesta tela), adiciona normalmente
                addToBasket({ 
                    quantity, 
                    total, 
                    unitPrice, 
                    productName: productData?.name || produto?.name || 'Produto',
                    description: productData?.description || produto?.description,
                    image: productData?.image_url ? 
                        `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${productData.id}` : 
                        produto?.imageSource?.uri,
                    productId: productData?.id || produto?.id,
                    observacoes: observacoes,
                    selectedExtras: selectedExtras, // Manter para compatibilidade
                    extras: extrasForAPI, // Enviar extras no formato da API
                    baseModifications: baseModificationsForAPI, // Enviar modificações no formato da API
                    defaultIngredientsQuantities: defaultIngredientsQuantities,
                    modifications: modifications // Para exibição
                });
            }
            
            // Resetar alterações não salvas e marcar que está salvando
            setHasUnsavedChanges(false);
            setShowUnsavedModal(false);
            isSavingRef.current = true; // Marcar que estamos salvando intencionalmente
            navigation.navigate('Cesta');
            // Resetar a flag após um pequeno delay para garantir que a navegação foi processada
            setTimeout(() => {
                isSavingRef.current = false;
            }, 100);
        };

        const handleExitWithoutSaving = () => {
            setShowUnsavedModal(false);
            setHasUnsavedChanges(false);
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

        const extraIngredients = productIngredients.filter((ing) => {
            const portions = parseFloat(ing.portions || 0) || 0;
            return portions === 0;
        });

        // Somar a quantidade total de extras selecionados
        const selectedExtrasCount = extraIngredients.reduce((total, ing) => {
            const ingredientId = ing.id || ing.ingredient_id || `extra-${extraIngredients.indexOf(ing)}`;
            const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
            const currentQty = selectedExtras[ingredientId] !== undefined ? selectedExtras[ingredientId] : minQty;
            // Soma a quantidade total do extra (incluindo o mínimo)
            return total + currentQty;
        }, 0);

        // Inicializar quantidades dos ingredientes padrão quando forem carregados
        useEffect(() => {
            if (defaultIngredients.length > 0) {
                const initialQuantities = {};
                defaultIngredients.forEach((ing, index) => {
                    const ingredientId = ing.id || ing.ingredient_id || index;
                    // Se estiver editando, usar os valores salvos; senão usar portions
                    let initialQty = parseFloat(ing.portions || 0) || 0;
                    
                    if (editItem?.defaultIngredientsQuantities?.[ingredientId] !== undefined) {
                        const savedValue = editItem.defaultIngredientsQuantities[ingredientId];
                        // Se for um objeto (com delta/current), extrair o valor numérico
                        if (typeof savedValue === 'object' && savedValue !== null) {
                            initialQty = parseFloat(savedValue.current || savedValue.delta || savedValue.quantity || 0) || 0;
                            // Se tiver portions inicial, somar com delta
                            if (savedValue.delta !== undefined) {
                                const basePortions = parseFloat(ing.portions || 0) || 0;
                                initialQty = basePortions + parseFloat(savedValue.delta || 0);
                            }
                        } else {
                            // Se for número direto, usar
                            initialQty = parseFloat(savedValue) || 0;
                        }
                    }
                    
                    initialQuantities[ingredientId] = initialQty;
                });
                setDefaultIngredientsQuantities(initialQuantities);
                
                // Atualizar valores iniciais no ref se estiver editando
                if (editItem) {
                    initialValuesRef.current.defaultIngredientsQuantities = initialQuantities;
                }
            }
        }, [productIngredients, editItem]);

        // Aplicar dados de edição quando editItem estiver presente
        useEffect(() => {
            if (editItem) {
                const initialQuantity = editItem.quantity || 1;
                const initialObservacoes = editItem.observacoes || '';
                const initialSelectedExtras = editItem.selectedExtras || {};
                const initialDefaultQuantities = editItem.defaultIngredientsQuantities || {};
                
                setQuantity(initialQuantity);
                setObservacoes(initialObservacoes);
                setSelectedExtras(initialSelectedExtras);
                
                // Salvar valores iniciais para comparação
                initialValuesRef.current = {
                    quantity: initialQuantity,
                    observacoes: initialObservacoes,
                    selectedExtras: initialSelectedExtras,
                    defaultIngredientsQuantities: initialDefaultQuantities
                };
            }
        }, [editItem]);

        // Detectar mudanças nos valores
        useEffect(() => {
            if (!editItem || Object.keys(defaultIngredientsQuantities).length === 0) return;
            
            const hasChanges = 
                quantity !== initialValuesRef.current.quantity ||
                observacoes !== initialValuesRef.current.observacoes ||
                JSON.stringify(selectedExtras) !== JSON.stringify(initialValuesRef.current.selectedExtras) ||
                JSON.stringify(defaultIngredientsQuantities) !== JSON.stringify(initialValuesRef.current.defaultIngredientsQuantities);
            
            setHasUnsavedChanges(hasChanges);
        }, [quantity, observacoes, selectedExtras, defaultIngredientsQuantities, editItem]);

        // Calcular total de adicionais dos ingredientes padrão
        const defaultIngredientsTotal = useMemo(() => {
            let total = 0;
            defaultIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || index;
                const extra = findIngredientPrice(ing, ingredientId);
                const initialQty = parseFloat(ing.portions || 0) || 0;
                
                let currentQty = initialQty;
                if (defaultIngredientsQuantities[ingredientId] !== undefined) {
                    const savedValue = defaultIngredientsQuantities[ingredientId];
                    // Se for um objeto, extrair o valor numérico
                    if (typeof savedValue === 'object' && savedValue !== null) {
                        currentQty = parseFloat(savedValue.current || savedValue.quantity || 0) || 0;
                        // Se tiver delta, somar com portions inicial
                        if (savedValue.delta !== undefined) {
                            currentQty = initialQty + parseFloat(savedValue.delta || 0);
                        }
                    } else {
                        // Se for número direto, usar
                        currentQty = parseFloat(savedValue) || 0;
                    }
                }
                
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

        // Calcular total temporário para o item sendo editado (sem taxas)
        const temporaryItemTotal = useMemo(() => {
            const unitPrice = parseFloat(productData?.price || 0);
            const baseTotal = unitPrice * quantity;
            return baseTotal + totalAdditionalPrice;
        }, [productData?.price, quantity, totalAdditionalPrice]);

        // Calcular total temporário da cesta (basketTotal - item antigo + novo item)
        const temporaryBasketTotal = useMemo(() => {
            if (!editItem?.id) return basketTotal;
            
            // Encontrar o item atual na cesta
            const currentItem = basketItems.find(item => item.id === editItem.id);
            if (!currentItem) return basketTotal;
            
            // Garantir que os valores são números válidos
            const oldTotal = parseFloat(currentItem.total || 0) || 0;
            const newTotal = parseFloat(temporaryItemTotal || 0) || 0;
            const currentBasketTotal = parseFloat(basketTotal || 0) || 0;
            
            // Subtrair o total do item antigo e adicionar o novo total
            const calculatedTotal = currentBasketTotal - oldTotal + newTotal;
            
            // Garantir que não retorne negativo ou NaN
            return isNaN(calculatedTotal) || calculatedTotal < 0 ? currentBasketTotal : calculatedTotal;
        }, [basketTotal, basketItems, editItem, temporaryItemTotal]);

        const handleOpenExtrasModal = () => {
            // Inicializar estado temporário com valores salvos ou valores mínimos de cada ingrediente
            const initialTempExtras = {};
            extraIngredients.forEach((ing, index) => {
                const ingredientId = ing.id || ing.ingredient_id || `extra-${index}`;
                const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                // Usa o valor salvo se existir, senão usa o mínimo
                initialTempExtras[ingredientId] = selectedExtras[ingredientId] !== undefined 
                    ? selectedExtras[ingredientId] 
                    : minQty;
            });
            setTempSelectedExtras(initialTempExtras);
            setExtrasModalVisible(true);
        };

        const handleExtraQuantityChange = (ingredientId, quantity) => {
            // Alterar apenas o estado temporário
            setTempSelectedExtras(prev => ({
                ...prev,
                [ingredientId]: quantity
            }));
        };

        const handleSaveExtras = () => {
            // Salvar as alterações do estado temporário para o permanente
            setSelectedExtras({ ...tempSelectedExtras });
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
                                   const extra = findIngredientPrice(ing, ingredientId);
                                   // Usar a quantidade do estado (que já foi inicializada com valores editados se existirem)
                                   let currentQty = parseFloat(ing.portions || 0) || 0;
                                   
                                   if (defaultIngredientsQuantities[ingredientId] !== undefined) {
                                       const savedValue = defaultIngredientsQuantities[ingredientId];
                                       // Se for um objeto, extrair o valor numérico
                                       if (typeof savedValue === 'object' && savedValue !== null) {
                                           currentQty = parseFloat(savedValue.current || savedValue.quantity || 0) || 0;
                                           // Se tiver delta, somar com portions inicial
                                           if (savedValue.delta !== undefined) {
                                               const basePortions = parseFloat(ing.portions || 0) || 0;
                                               currentQty = basePortions + parseFloat(savedValue.delta || 0);
                                           }
                                       } else {
                                           // Se for número direto, usar
                                           currentQty = parseFloat(savedValue) || 0;
                                       }
                                   }
                                   
                                   const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                   const maxQty = ing.max_quantity || ing.maxQuantity || null;
                                  return (
                                      <IngredienteMenu
                                          key={ingredientId}
                                          nome={displayName}
                                          valorExtra={extra}
                                          initialQuantity={currentQty}
                                          minQuantity={minQty}
                                          maxQuantity={maxQty ? parseInt(maxQty, 10) : null}
                                          onQuantityChange={(newQuantity) => {
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

                                           {/* Botão Salvar */}
                      <View style={styles.saveButtonContainer}>
                          <TouchableOpacity 
                              style={styles.saveButton}
                              onPress={handleSaveAndExit}
                              activeOpacity={0.8}
                          >
                              <Text style={styles.saveButtonText}>Salvar</Text>
                          </TouchableOpacity>
                      </View>
                     </ScrollView>
                     
                    {!loggedIn && !keyboardVisible && basketItems.length === 0 && (
                        <View style={styles.fixedButtonContainer}>
                            <LoginButton navigation={navigation} />
                        </View>
                    )}

                    {!loggedIn && !keyboardVisible && basketItems.length > 0 && (
                        <View style={styles.fixedButtonContainer}>
                            <BasketFooter 
                                total={editItem?.id ? temporaryBasketTotal : basketTotal}
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
                                         total={editItem?.id ? temporaryBasketTotal : basketTotal}
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
                                          const ingredientId = ing.id || ing.ingredient_id || `extra-${index}`;
                                          // Buscar preço do ingrediente usando cache ou dados do ingrediente
                                          const extra = findIngredientPrice(ing, ingredientId);
                                          const minQty = parseInt(ing.min_quantity || ing.minQuantity || 0, 10) || 0;
                                          
                                          // IMPORTANTE: max_quantity já vem calculado pela API como o menor entre:
                                          // 1. Quantidade máxima da regra (max_quantity_rule)
                                          // 2. Quantidade disponível no estoque (com conversão de unidades)
                                          // Então max_quantity já é o valor correto a ser usado
                                          const maxQty = ing.max_quantity || ing.maxQuantity || null;
                                          const initialExtraQty = minQty || 0;
                                          const currentQuantity = tempSelectedExtras[ingredientId] !== undefined 
                                              ? tempSelectedExtras[ingredientId] 
                                              : initialExtraQty;

                                         return (
                                             <View key={ingredientId} style={styles.modalIngredientItem}>
                                                 <View style={styles.modalIngredientInfo}>
                                                     <Text style={styles.modalIngredientName}>{displayName}</Text>
                                                     <Text style={styles.modalIngredientPrice}>
                                                         + R$ {extra.toFixed(2).replace('.', ',')}
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
                                                            effectiveMaxQty = parseInt(maxQty, 10);
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

                     {/* Modal de Confirmação de Alterações Não Salvas */}
                     <Modal
                         visible={showUnsavedModal}
                         animationType="fade"
                         transparent={true}
                         onRequestClose={() => setShowUnsavedModal(false)}
                     >
                         <View style={styles.unsavedModalOverlay}>
                             <View style={styles.unsavedModalContent}>
                                 {/* Botão X no canto */}
                                 <TouchableOpacity 
                                     style={styles.unsavedModalCloseButton}
                                     onPress={() => setShowUnsavedModal(false)}
                                 >
                                     <Text style={styles.unsavedModalCloseText}>✕</Text>
                                 </TouchableOpacity>

                                 {/* Título */}
                                 <Text style={styles.unsavedModalTitle}>
                                     Você tem alterações não salvas
                                 </Text>

                                 {/* Mensagem */}
                                 <Text style={styles.unsavedModalMessage}>
                                     Deseja salvar as alterações antes de sair?
                                 </Text>

                                 {/* Botões */}
                                 <View style={styles.unsavedModalButtons}>
                                     <TouchableOpacity 
                                         style={styles.unsavedModalExitButton}
                                         onPress={handleExitWithoutSaving}
                                         activeOpacity={0.8}
                                     >
                                         <Text style={styles.unsavedModalExitText}>Sair</Text>
                                     </TouchableOpacity>
                                     
                                     <TouchableOpacity 
                                         style={styles.unsavedModalSaveButton}
                                         onPress={handleSaveAndExit}
                                         activeOpacity={0.8}
                                     >
                                         <Text style={styles.unsavedModalSaveText}>Salvar</Text>
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
          saveButtonContainer: {
              marginHorizontal: 20,
              marginBottom: 24,
              marginTop: 10,
          },
          saveButton: {
              backgroundColor: '#FFC107',
              borderRadius: 8,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
          },
          saveButtonText: {
              color: '#000000',
              fontSize: 16,
              fontWeight: '700',
          },
          // Modal de Alterações Não Salvas
          unsavedModalOverlay: {
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
          },
          unsavedModalContent: {
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              width: '85%',
              maxWidth: 400,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: {
                  width: 0,
                  height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              position: 'relative',
          },
          unsavedModalCloseButton: {
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
          },
          unsavedModalCloseText: {
              fontSize: 24,
              color: '#666666',
              fontWeight: '300',
          },
          unsavedModalTitle: {
              fontSize: 20,
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: 12,
              marginTop: 8,
          },
          unsavedModalMessage: {
              fontSize: 16,
              color: '#666666',
              marginBottom: 24,
              textAlign: 'center',
          },
          unsavedModalButtons: {
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
          },
          unsavedModalExitButton: {
              flex: 1,
              backgroundColor: '#E0E0E0',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
          },
          unsavedModalExitText: {
              color: '#000000',
              fontSize: 16,
              fontWeight: '600',
          },
          unsavedModalSaveButton: {
              flex: 1,
              backgroundColor: '#FFC107',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
          },
          unsavedModalSaveText: {
              color: '#000000',
              fontSize: 16,
              fontWeight: '700',
          },
      });