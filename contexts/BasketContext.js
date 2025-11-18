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

    // Carregar carrinho da API ao inicializar
    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
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

                    // Calcular preço dos extras
                    const extrasPrice = (item.extras || []).reduce((sum, extra) => {
                        const extraPrice = parseFloat(extra.unit_price || extra.ingredient_price || extra.price || 0);
                        const extraQuantity = parseInt(extra.quantity || 0, 10);
                        return sum + (extraPrice * extraQuantity);
                    }, 0);

                    // Calcular preço das modificações base
                    const baseModsPrice = (item.base_modifications || []).reduce((sum, mod) => {
                        const modPrice = parseFloat(mod.unit_price || mod.ingredient_price || mod.price || mod.additionalPrice || 0);
                        const modDelta = Math.abs(parseInt(mod.delta || 0, 10));
                        return sum + (modPrice * modDelta);
                    }, 0);

                    // Total do item = preço base + extras + modificações
                    const itemTotal = basePrice + extrasPrice + baseModsPrice;

                    // Usa item_subtotal da API se disponível e maior que 0, senão usa cálculo
                    const finalTotal = parseFloat(item.item_subtotal || 0) > 0 
                        ? parseFloat(item.item_subtotal) 
                        : itemTotal;

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
            
            const result = await addItemToCartAPI({
                productId,
                quantity,
                extras: finalExtras,
                notes: observacoes,
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

                        // Calcular preço dos extras
                        const extrasPrice = (item.extras || []).reduce((sum, extra) => {
                            const extraPrice = parseFloat(extra.unit_price || extra.ingredient_price || extra.price || 0);
                            const extraQuantity = parseInt(extra.quantity || 0, 10);
                            return sum + (extraPrice * extraQuantity);
                        }, 0);

                        // Calcular preço das modificações base
                        const baseModsPrice = (item.base_modifications || []).reduce((sum, mod) => {
                            const modPrice = parseFloat(mod.unit_price || mod.ingredient_price || mod.price || mod.additionalPrice || 0);
                            const modDelta = Math.abs(parseInt(mod.delta || 0, 10));
                            return sum + (modPrice * modDelta);
                        }, 0);

                        // Total do item = preço base + extras + modificações
                        const itemTotal = basePrice + extrasPrice + baseModsPrice;

                        // Usa item_subtotal da API se disponível e maior que 0, senão usa cálculo
                        const finalTotal = parseFloat(item.item_subtotal || 0) > 0 
                            ? parseFloat(item.item_subtotal) 
                            : itemTotal;

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
            
            const result = await updateCartItemAPI(cartItemId, {
                quantity: updates.quantity,
                extras: extras,
                notes: updates.observacoes || updates.notes,
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
