import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    getCart, 
    addItemToCart as addItemToCartAPI, 
    updateCartItem as updateCartItemAPI,
    removeCartItem as removeCartItemAPI,
    clearCart as clearCartAPI,
    claimGuestCart,
    getGuestCartId
} from '../services/cartService';
import { isAuthenticated } from '../services/userService';
import { getAllIngredients } from '../services/ingredientService';
import api from '../services/api';

const BasketContext = createContext();

export const useBasket = () => {
    const context = useContext(BasketContext);
    if (!context) {
        throw new Error('useBasket deve ser usado dentro de um BasketProvider');
    }
    return context;
};

export const BasketProvider = ({ children }) => {
    const [basketItems, setBasketItems] = useState([]);
    const [basketTotal, setBasketTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [cartId, setCartId] = useState(null);
    const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
    // ALTERAÇÃO: Cache de ingredientes para buscar preços dos extras
    const [ingredientsCache, setIngredientsCache] = useState(null);

    // ALTERAÇÃO: Carregar cache de ingredientes
    const loadIngredientsCache = useCallback(async () => {
        // Verificar se já tem cache no estado atual
        if (ingredientsCache) return ingredientsCache;
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
                return cache;
            }
            return {};
        } catch (error) {
            console.error('Erro ao carregar cache de ingredientes:', error);
            return {};
        }
    }, []);

    // ALTERAÇÃO: Função para buscar preço do ingrediente (melhorada com cache)
    const findIngredientPrice = useCallback((ingredientData, ingredientId) => {
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
    }, [ingredientsCache]);

    // Carregar carrinho da API ao inicializar
    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            // ALTERAÇÃO: Carregar cache de ingredientes antes de processar itens
            await loadIngredientsCache();
            
            console.log('[BasketContext] Carregando carrinho...');
            
            const result = await getCart();
            
            console.log('[BasketContext] Resultado do getCart:', {
                success: result.success,
                hasData: !!result.data,
                cartId: result.cartId,
                isAuthenticated: result.isAuthenticated,
                dataStructure: result.data ? Object.keys(result.data) : []
            });
            
            console.log('[BasketContext] Dados completos do carrinho:', JSON.stringify(result.data, null, 2));
            
            if (result.success && result.data) {
                // A estrutura pode ser: result.data.cart.items OU result.data.items
                const items = result.data.cart?.items || result.data.items || [];
                
                console.log('[BasketContext] Itens do carrinho:', items.length);
                console.log('[BasketContext] Estrutura do cart:', {
                    hasCart: !!result.data.cart,
                    hasCartItems: !!result.data.cart?.items,
                    hasDirectItems: !!result.data.items,
                    itemsArray: Array.isArray(items),
                    allItems: items,
                    firstItem: items[0] ? {
                        id: items[0].id,
                        product_id: items[0].product_id,
                        hasProduct: !!items[0].product
                    } : null
                });
                
                // Helper para construir URL da imagem do produto
                const getProductImageUrl = (product) => {
                    const productId = product?.id;
                    const imageUrl = product?.image_url;
                    
                    if (!imageUrl || !productId) return null;
                    
                    // Se a URL já é completa (http/https), usa direto
                    if (imageUrl.startsWith('http')) {
                        return imageUrl;
                    }
                    
                    // Constrói URL para o endpoint de imagem da API
                    const baseUrl = api.defaults.baseURL.replace('/api', '');
                    return `${baseUrl}/api/products/image/${productId}`;
                };
                
                // Converter itens da API para formato local
                const formattedItems = items.map(item => {
                    // Log para debug
                    console.log('[BasketContext] Item da API:', {
                        id: item.id,
                        extras_count: item.extras?.length || 0,
                        extras: item.extras,
                        base_modifications_count: item.base_modifications?.length || 0,
                        base_modifications: item.base_modifications,
                        item_subtotal: item.item_subtotal
                    });
                    
                    // Calcular total do item: preço do produto + extras + modificações base
                    const productPrice = parseFloat(item.product?.price || 0);
                    const itemQuantity = item.quantity || 1;
                    const basePrice = productPrice * itemQuantity;

                        // ALTERAÇÃO: Calcular preço dos extras (buscar preço de várias fontes possíveis + cache)
                        const extrasPrice = (item.extras || []).reduce((sum, extra) => {
                            const ingredientId = extra.ingredient_id || extra.id;
                            // ALTERAÇÃO: Usar função melhorada que busca no cache
                            let extraPrice = findIngredientPrice(extra, ingredientId);
                            
                            // Se não encontrou no cache, tentar campos específicos
                            if (extraPrice === 0) {
                                const priceCandidates = [
                                    extra.unit_price,
                                    extra.ingredient_price,
                                    extra.price,
                                    extra.additional_price,
                                    extra.extra_price,
                                    extra.total_price ? parseFloat(extra.total_price) / parseInt(extra.quantity || 1, 10) : null
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
                            
                            const extraQuantity = parseInt(extra.quantity || 0, 10);
                            return sum + (extraPrice * extraQuantity);
                        }, 0);

                    // ALTERAÇÃO: Calcular preço das modificações base (buscar preço de várias fontes possíveis + cache)
                    // IMPORTANTE: Apenas modificações positivas (adições) alteram o preço
                    // Modificações negativas (remoções) não alteram o preço
                    const baseModsPrice = (item.base_modifications || []).reduce((sum, mod) => {
                        const delta = parseFloat(mod.delta || 0);
                        
                        // ALTERAÇÃO: Apenas processar se delta for positivo (adição)
                        // Remoções (delta negativo) não alteram o preço
                        if (delta <= 0) {
                            return sum;
                        }
                        
                        const ingredientId = mod.ingredient_id || mod.id;
                        // ALTERAÇÃO: Usar função melhorada que busca no cache
                        let modPrice = findIngredientPrice(mod, ingredientId);
                        
                        // Se não encontrou no cache, tentar campos específicos
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
                        
                        // ALTERAÇÃO: Usar delta positivo (já validado acima)
                        const modDelta = parseInt(delta, 10);
                        return sum + (modPrice * modDelta);
                    }, 0);

                    // Total do item = preço base + extras + modificações
                    const itemTotal = basePrice + extrasPrice + baseModsPrice;

                    // ALTERAÇÃO: Priorizar item_subtotal da API se for válido e maior que 0
                    // Se item_subtotal for 0 ou inválido, usar o cálculo manual
                    // Isso evita somar extras que já estão incluídos no subtotal da API
                    const apiSubtotal = parseFloat(item.item_subtotal || 0);
                    const finalTotal = (apiSubtotal > 0) ? apiSubtotal : itemTotal;

                    return {
                        id: item.id, // ID do item no carrinho
                        cartItemId: item.id, // Mesmo ID para compatibilidade
                        originalProductId: item.product?.id || item.product_id,
                        name: item.product?.name || 'Produto',
                        description: item.product?.description || '',
                        image: getProductImageUrl(item.product),
                        price: productPrice,
                        quantity: itemQuantity,
                        total: finalTotal,
                        // ALTERAÇÃO: Mapear notes da API para observacoes, verificando múltiplos campos
                        observacoes: (item.notes || item.observacoes || '').trim(),
                        // ALTERAÇÃO: Preservar informação de promoção do item
                        promotion: item.promotion || null,
                        // Converter extras de array para objeto {ingredientId: quantity}
                        selectedExtras: (item.extras || []).reduce((acc, extra) => {
                            const ingredientId = String(extra.ingredient_id || extra.id);
                            if (ingredientId && extra.quantity > 0) {
                                acc[ingredientId] = extra.quantity;
                            }
                            return acc;
                        }, {}),
                        // Manter base_modifications como array para compatibilidade
                        modifications: (item.base_modifications || []).map(mod => ({
                            ingredient_id: mod.ingredient_id,
                            delta: mod.delta,
                            name: mod.ingredient_name || mod.name,
                            // Calcular preço adicional se disponível
                            additionalPrice: mod.additionalPrice || mod.price || 0
                        })),
                        // Converter base_modifications para objeto {ingredientId: {min, max, current}}
                        defaultIngredientsQuantities: (item.base_modifications || []).reduce((acc, mod) => {
                            const ingredientId = String(mod.ingredient_id || mod.id);
                            if (ingredientId && mod.delta !== undefined) {
                                // Para base_modifications, precisamos calcular o current baseado no delta
                                // Como não temos o valor base, vamos usar o delta diretamente
                                acc[ingredientId] = {
                                    delta: mod.delta,
                                    current: mod.delta // Ajustar depois se necessário
                                };
                            }
                            return acc;
                        }, {})
                    };
                });
                
                setBasketItems(formattedItems);
                
                // Calcular total do carrinho
                // Prioriza summary.total da API, mas se for 0 ou inválido, calcula manualmente
                const apiTotal = parseFloat(result.data.summary?.total || 0);
                const calculatedTotal = formattedItems.reduce((sum, item) => {
                    // Garante que item.total seja calculado corretamente
                    const itemTotal = item.total || (parseFloat(item.price || 0) * parseFloat(item.quantity || 0));
                    return sum + (parseFloat(itemTotal) || 0);
                }, 0);

                // Usa o maior valor entre API e cálculo manual (evita 0 quando API retorna 0 incorretamente)
                const total = apiTotal > 0 ? apiTotal : calculatedTotal;
                setBasketTotal(total);

                console.log('[BasketContext] Total calculado:', {
                    apiTotal,
                    calculatedTotal,
                    finalTotal: total,
                    itemsCount: formattedItems.length,
                    items: formattedItems.map(item => ({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        itemTotal: item.total,
                        calculatedItemTotal: item.total || (parseFloat(item.price || 0) * parseFloat(item.quantity || 0))
                    }))
                });
                
                setCartId(result.cartId);
                setIsAuthenticatedUser(result.isAuthenticated || false);
                
                console.log('[BasketContext] Carrinho carregado:', {
                    itemsCount: formattedItems.length,
                    total,
                    cartId: result.cartId
                });
            } else {
                // Se falhou, limpa carrinho
                console.log('[BasketContext] Falha ao carregar carrinho, limpando...');
                setBasketItems([]);
                setBasketTotal(0);
                setCartId(null);
            }
        } catch (error) {
            console.error('[BasketContext] Erro ao carregar carrinho:', error);
            setBasketItems([]);
            setBasketTotal(0);
            setCartId(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Verificar autenticação e carregar carrinho
    useEffect(() => {
        const checkAuthAndLoadCart = async () => {
            console.log('[BasketContext] Verificando autenticação e carregando carrinho...');
            const authenticated = await isAuthenticated();
            console.log('[BasketContext] Usuário autenticado:', authenticated);
            setIsAuthenticatedUser(authenticated);
            await loadCart();
        };
        
        checkAuthAndLoadCart();
    }, [loadCart]);

    // Adicionar item ao carrinho via API
    const addToBasket = async ({ 
        productId, 
        quantity = 1, 
        observacoes = '', 
        selectedExtras = {}, 
        baseModifications = [],
        extras = null // Permite passar extras já validados no formato da API
    }) => {
        try {
            setLoading(true);
            // ALTERAÇÃO: Carregar cache de ingredientes antes de processar
            await loadIngredientsCache();
            
            // Se extras já foram validados e fornecidos, usa eles
            // Caso contrário, converte selectedExtras para formato da API
            let finalExtras = extras;
            if (!finalExtras || !Array.isArray(finalExtras)) {
                // Converter selectedExtras para formato da API
                // IMPORTANTE: Filtrar apenas extras com quantity > 0 e garantir que IDs são números válidos
                finalExtras = Object.entries(selectedExtras || {})
                    .filter(([ingredientId, qty]) => {
                        const id = Number(ingredientId);
                        const quantity = Number(qty);
                        // Filtrar apenas se ID é válido e quantity > 0
                        return !isNaN(id) && id > 0 && !isNaN(quantity) && quantity > 0;
                    })
                    .map(([ingredientId, qty]) => ({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(qty)
                    }));
            }
            
            // Converter baseModifications para formato da API
            const modifications = baseModifications.map(mod => ({
                ingredient_id: Number(mod.ingredient_id || mod.id),
                delta: Number(mod.delta || 0)
            }));
            
            console.log('[BasketContext] Adicionando item ao carrinho:', {
                productId,
                quantity,
                extrasCount: finalExtras.length,
                modificationsCount: modifications.length,
                extrasProvided: !!extras
            });
            
            // ALTERAÇÃO: Garantir que observações sejam sempre enviadas (mesmo que vazias)
            const notesToSend = String(observacoes || '').trim();
            
            console.log('[BasketContext] Adicionando item com observações:', {
                productId,
                quantity,
                notes: notesToSend,
                notesLength: notesToSend.length,
                hasNotes: notesToSend.length > 0
            });
            
            const result = await addItemToCartAPI({
                productId,
                quantity,
                extras: finalExtras,
                notes: notesToSend,
                baseModifications: modifications
            });
            
            console.log('[BasketContext] Resultado da adição:', {
                success: result.success,
                cartId: result.cartId,
                hasData: !!result.data
            });
            
            if (result.success) {
                // Atualizar cart_id se foi retornado (importante para convidados)
                if (result.cartId) {
                    setCartId(result.cartId);
                    console.log('[BasketContext] Cart ID atualizado:', result.cartId);
                }
                
                // A estrutura da resposta da API é:
                // { cart: { cart: {...}, items: [...], summary: {...} }, cart_id: ..., is_authenticated: ... }
                // OU
                // { cart: { items: [...], summary: {...} }, cart_id: ..., is_authenticated: ... }
                
                const cartData = result.data?.cart;
                if (cartData) {
                    // Os itens podem estar em cartData.items ou cartData.cart.items
                    const items = cartData.items || cartData.cart?.items || [];
                    const summary = cartData.summary || {};
                    
                    console.log('[BasketContext] Processando resposta:', {
                        itemsCount: items.length,
                        hasSummary: !!summary,
                        cartId: result.cartId
                    });
                    
                    // Helper para construir URL da imagem do produto
                    const getProductImageUrl = (product) => {
                        const productId = product?.id;
                        const imageUrl = product?.image_url;
                        
                        if (!imageUrl || !productId) return null;
                        
                        // Se a URL já é completa (http/https), usa direto
                        if (imageUrl.startsWith('http')) {
                            return imageUrl;
                        }
                        
                        // Constrói URL para o endpoint de imagem da API
                        const baseUrl = api.defaults.baseURL.replace('/api', '');
                        return `${baseUrl}/api/products/image/${productId}`;
                    };
                    
                    const formattedItems = items.map(item => {
                        // Calcular total do item: preço do produto + extras + modificações base
                        const productPrice = parseFloat(item.product?.price || 0);
                        const itemQuantity = item.quantity || 1;
                        const basePrice = productPrice * itemQuantity;

                        // ALTERAÇÃO: Calcular preço dos extras (buscar preço de várias fontes possíveis + cache)
                        const extrasPrice = (item.extras || []).reduce((sum, extra) => {
                            const ingredientId = extra.ingredient_id || extra.id;
                            // ALTERAÇÃO: Usar função melhorada que busca no cache
                            let extraPrice = findIngredientPrice(extra, ingredientId);
                            
                            // Se não encontrou no cache, tentar campos específicos
                            if (extraPrice === 0) {
                                const priceCandidates = [
                                    extra.unit_price,
                                    extra.ingredient_price,
                                    extra.price,
                                    extra.additional_price,
                                    extra.extra_price,
                                    extra.total_price ? parseFloat(extra.total_price) / parseInt(extra.quantity || 1, 10) : null
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
                            
                            const extraQuantity = parseInt(extra.quantity || 0, 10);
                            return sum + (extraPrice * extraQuantity);
                        }, 0);

                    // ALTERAÇÃO: Calcular preço das modificações base (buscar preço de várias fontes possíveis + cache)
                    // IMPORTANTE: Apenas modificações positivas (adições) alteram o preço
                    // Modificações negativas (remoções) não alteram o preço
                    const baseModsPrice = (item.base_modifications || []).reduce((sum, mod) => {
                        const delta = parseFloat(mod.delta || 0);
                        
                        // ALTERAÇÃO: Apenas processar se delta for positivo (adição)
                        // Remoções (delta negativo) não alteram o preço
                        if (delta <= 0) {
                            return sum;
                        }
                        
                        const ingredientId = mod.ingredient_id || mod.id;
                        // ALTERAÇÃO: Usar função melhorada que busca no cache
                        let modPrice = findIngredientPrice(mod, ingredientId);
                        
                        // Se não encontrou no cache, tentar campos específicos
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
                        
                        // ALTERAÇÃO: Usar delta positivo (já validado acima)
                        const modDelta = parseInt(delta, 10);
                        return sum + (modPrice * modDelta);
                    }, 0);

                    // Total do item = preço base + extras + modificações
                    const itemTotal = basePrice + extrasPrice + baseModsPrice;

                        // ALTERAÇÃO: Sempre usar o maior entre o calculado e o item_subtotal da API
                        // Isso garante que se a API já calculou corretamente, usa o valor da API
                        // Mas se o calculado for maior (incluindo adicionais), usa o calculado
                        const apiSubtotal = parseFloat(item.item_subtotal || 0);
                        const finalTotal = Math.max(itemTotal, apiSubtotal);

                        return {
                            id: item.id,
                            cartItemId: item.id,
                            originalProductId: item.product?.id || item.product_id,
                            name: item.product?.name || 'Produto',
                            description: item.product?.description || '',
                            image: getProductImageUrl(item.product),
                            price: productPrice,
                            quantity: itemQuantity,
                            total: finalTotal,
                            observacoes: item.notes || '',
                            // ALTERAÇÃO: Preservar informação de promoção do item
                            promotion: item.promotion || null,
                            // Converter extras de array para objeto {ingredientId: quantity}
                            selectedExtras: (item.extras || []).reduce((acc, extra) => {
                                const ingredientId = String(extra.ingredient_id || extra.id);
                                if (ingredientId && extra.quantity > 0) {
                                    acc[ingredientId] = extra.quantity;
                                }
                                return acc;
                            }, {}),
                            // Manter base_modifications como array para compatibilidade
                            modifications: item.base_modifications || [],
                            // Converter base_modifications para objeto {ingredientId: {delta}}
                            defaultIngredientsQuantities: (item.base_modifications || []).reduce((acc, mod) => {
                                const ingredientId = String(mod.ingredient_id || mod.id);
                                if (ingredientId && mod.delta !== undefined) {
                                    acc[ingredientId] = {
                                        delta: mod.delta,
                                        current: mod.delta // Ajustar depois se necessário
                                    };
                                }
                                return acc;
                            }, {})
                        };
                    });
                    
                    setBasketItems(formattedItems);
                    
                    // Calcular total do carrinho após adicionar item
                    const apiTotal = parseFloat(summary?.total || 0);
                    const calculatedTotal = formattedItems.reduce((sum, item) => {
                        const itemTotal = item.total || (parseFloat(item.price || 0) * parseFloat(item.quantity || 0));
                        return sum + (parseFloat(itemTotal) || 0);
                    }, 0);

                    const total = apiTotal > 0 ? apiTotal : calculatedTotal;
                    setBasketTotal(total);

                    console.log('[BasketContext] Total após adicionar item:', {
                        apiTotal,
                        calculatedTotal,
                        finalTotal: total,
                        itemsCount: formattedItems.length
                    });
                    
                    if (result.data.is_authenticated !== undefined) {
                        setIsAuthenticatedUser(result.data.is_authenticated);
                    }
                    
                    console.log('[BasketContext] Estado atualizado:', {
                        itemsCount: formattedItems.length,
                        total,
                        cartId: result.cartId
                    });
                } else {
                    // Se não tem dados do carrinho na resposta, recarrega
                    console.log('[BasketContext] Sem dados do carrinho na resposta, recarregando...');
                    await loadCart();
                }
                
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('[BasketContext] Erro ao adicionar item ao carrinho:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Remover item do carrinho via API
    const removeFromBasket = async (cartItemId) => {
        try {
            setLoading(true);
            
            const result = await removeCartItemAPI(cartItemId);
            
            if (result.success) {
                // Recarregar carrinho da API
                await loadCart();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Erro ao remover item do carrinho:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Atualizar item do carrinho via API
    const updateBasketItem = async (cartItemId, updates = {}) => {
        try {
            setLoading(true);
            
            // Converter selectedExtras se fornecido
            let extras = updates.extras;
            if (updates.selectedExtras) {
                extras = Object.entries(updates.selectedExtras)
                    .filter(([_, qty]) => qty > 0)
                    .map(([ingredientId, qty]) => ({
                        ingredient_id: Number(ingredientId),
                        quantity: Number(qty)
                    }));
            }
            
            // ALTERAÇÃO: Garantir que observações sejam sempre enviadas (mesmo que vazias)
            const notesToUpdate = String(updates.observacoes || updates.notes || '').trim();
            
            console.log('[BasketContext] Atualizando item com observações:', {
                cartItemId,
                quantity: updates.quantity,
                notes: notesToUpdate,
                notesLength: notesToUpdate.length,
                hasNotes: notesToUpdate.length > 0
            });
            
            const result = await updateCartItemAPI(cartItemId, {
                quantity: updates.quantity,
                extras: extras,
                notes: notesToUpdate,
                baseModifications: updates.baseModifications || updates.modifications
            });
            
            if (result.success) {
                // Recarregar carrinho da API
                await loadCart();
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Erro ao atualizar item do carrinho:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Limpar carrinho via API
    const clearBasket = async () => {
        try {
            setLoading(true);
            
            const result = await clearCartAPI();
            
            if (result.success) {
        setBasketItems([]);
        setBasketTotal(0);
                setCartId(null);
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Reivindicar carrinho de convidado após login
    const claimGuestCartAfterLogin = async () => {
        try {
            const guestCartId = await getGuestCartId();
            console.log('[BasketContext] claimGuestCartAfterLogin - guestCartId:', guestCartId);
            
            if (guestCartId) {
                console.log('[BasketContext] Reivindicando carrinho de convidado...');
                const result = await claimGuestCart(guestCartId);
                console.log('[BasketContext] Resultado da reivindicação:', result.success);
                
                if (result.success) {
                    // Recarregar carrinho após reivindicar
                    console.log('[BasketContext] Recarregando carrinho após reivindicação...');
                    await loadCart();
                    return { success: true };
                }
            } else {
                console.log('[BasketContext] Nenhum carrinho de convidado para reivindicar, apenas recarregando...');
                // Mesmo sem carrinho de convidado, recarrega para pegar carrinho do usuário
                await loadCart();
            }
            return { success: false };
        } catch (error) {
            console.error('[BasketContext] Erro ao reivindicar carrinho:', error);
            return { success: false, error: error.message };
        }
    };

    // Calcular quantidade total de itens (soma das quantidades)
    const getTotalItemCount = () => {
        return basketItems.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const value = {
        basketItems,
        basketTotal,
        basketItemCount: getTotalItemCount(),
        loading,
        cartId,
        isAuthenticated: isAuthenticatedUser,
        addToBasket,
        removeFromBasket,
        updateBasketItem,
        clearBasket,
        loadCart,
        claimGuestCartAfterLogin
    };

    return (
        <BasketContext.Provider value={value}>
            {children}
        </BasketContext.Provider>
    );
};
