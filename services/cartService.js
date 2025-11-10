/**
 * Serviço de Carrinho/Cesta
 * Gerencia operações do carrinho híbrido (usuário logado e convidado)
 * 
 * IMPORTANTE: Este serviço gerencia carrinhos tanto para usuários autenticados
 * quanto para convidados (não-autenticados). Para convidados, apenas o cart_id
 * deve ser armazenado no AsyncStorage, nunca os itens completos.
 */

import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthenticated } from './userService';

const GUEST_CART_ID_KEY = 'guest_cart_id';

/**
 * Obtém o ID do carrinho de convidado do AsyncStorage
 * @returns {Promise<string|null>} ID do carrinho ou null
 */
export const getGuestCartId = async () => {
  try {
    return await AsyncStorage.getItem(GUEST_CART_ID_KEY);
  } catch (error) {
    console.error('Erro ao obter guest_cart_id:', error);
    return null;
  }
};

/**
 * Salva o ID do carrinho de convidado no AsyncStorage
 * @param {string|number} cartId - ID do carrinho
 */
export const saveGuestCartId = async (cartId) => {
  try {
    await AsyncStorage.setItem(GUEST_CART_ID_KEY, String(cartId));
  } catch (error) {
    console.error('Erro ao salvar guest_cart_id:', error);
  }
};

/**
 * Remove o ID do carrinho de convidado do AsyncStorage
 */
export const removeGuestCartId = async () => {
  try {
    await AsyncStorage.removeItem(GUEST_CART_ID_KEY);
  } catch (error) {
    console.error('Erro ao remover guest_cart_id:', error);
  }
};

/**
 * Cria um novo carrinho de convidado
 * O carrinho é criado automaticamente ao adicionar o primeiro item
 * Esta função apenas retorna um carrinho vazio localmente
 * @returns {Promise<Object>} Dados do carrinho vazio
 */
export const createGuestCart = async () => {
  // O carrinho será criado automaticamente quando o primeiro item for adicionado
  // Por enquanto, retorna estrutura vazia
  return {
    cart: { items: [] },
    summary: { is_empty: true },
    cart_id: null
  };
};

/**
 * Busca o carrinho atual (usuário logado ou convidado)
 * @returns {Promise<Object>} Dados do carrinho
 */
export const getCart = async () => {
  try {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      // Busca carrinho do usuário logado
      const response = await api.get('/cart/me');
      return {
        success: true,
        data: response.data,
        isAuthenticated: true,
        cartId: response.data?.cart?.id
      };
    } else {
      // Busca carrinho de convidado
      const guestCartId = await getGuestCartId();
      
      if (!guestCartId) {
        // Se não tem carrinho, retorna carrinho vazio
        return {
          success: true,
          data: { cart: { items: [] }, summary: { is_empty: true } },
          isAuthenticated: false,
          cartId: null
        };
      }
      
      const response = await api.get(`/cart/guest/${guestCartId}`);
      return {
        success: true,
        data: response.data,
        isAuthenticated: false,
        cartId: guestCartId
      };
    }
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    
    // Se erro 404, limpa cart_id inválido
    if (error.response?.status === 404) {
      await removeGuestCartId();
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      data: { cart: { items: [] }, summary: { is_empty: true } },
      isAuthenticated: false,
      cartId: null
    };
  }
};

/**
 * Adiciona item ao carrinho
 * @param {Object} itemData - Dados do item
 * @param {number} itemData.productId - ID do produto
 * @param {number} itemData.quantity - Quantidade
 * @param {Array} itemData.extras - Lista de extras
 * @param {string} itemData.notes - Observações
 * @param {Array} itemData.baseModifications - Modificações da receita base
 * @returns {Promise<Object>} Resultado da operação
 */
export const addItemToCart = async ({
  productId,
  quantity = 1,
  extras = [],
  notes = '',
  baseModifications = []
}) => {
  try {
    // Verificar autenticação
    const authenticated = await isAuthenticated();
    console.log('[CartService] Status de autenticação:', authenticated);
    
    const guestCartId = authenticated ? null : await getGuestCartId();
    console.log('[CartService] Guest Cart ID:', guestCartId || 'não existe (será criado)');
    
    // Normalizar extras para garantir formato correto
    const normalizedExtras = Array.isArray(extras) 
      ? extras
          .map(extra => {
            const id = Number(extra?.ingredient_id || extra?.id);
            const qty = Number(extra?.quantity || 0);
            // Retornar null se ID ou quantity inválidos
            if (isNaN(id) || id <= 0 || isNaN(qty) || qty <= 0) {
              return null;
            }
            return {
              ingredient_id: id,
              quantity: qty
            };
          })
          .filter(extra => extra !== null) // Remover extras inválidos
      : [];
    
    const payload = {
      product_id: Number(productId),
      quantity: Number(quantity),
      extras: normalizedExtras,
      notes: String(notes || '').slice(0, 500)
    };
    
    // Adicionar base_modifications apenas se não estiver vazio
    if (baseModifications && baseModifications.length > 0) {
      payload.base_modifications = baseModifications.map(mod => ({
        ingredient_id: Number(mod.ingredient_id || mod.id),
        delta: Number(mod.delta || 0)
      }));
    }
    
    // IMPORTANTE: Se não logado, inclui cart_id no payload APENAS se existir
    // Se não existir, NÃO envia guest_cart_id - a API criará automaticamente um novo carrinho
    if (!authenticated && guestCartId) {
      payload.guest_cart_id = Number(guestCartId);
    }
    
    console.log('[CartService] Adicionando item ao carrinho:', {
      authenticated,
      guestCartId,
      hasGuestCartId: !!guestCartId,
      payload: { 
        product_id: payload.product_id,
        quantity: payload.quantity,
        extras_count: payload.extras.length,
        extras: payload.extras, // Log completo dos extras
        base_modifications_count: payload.base_modifications?.length || 0,
        base_modifications: payload.base_modifications, // Log completo das modificações
        guest_cart_id: payload.guest_cart_id || 'não enviado (será criado pela API)'
      }
    });
    
    // A API usa verify_jwt_in_request(optional=True), então aceita requisições sem token
    // Se não autenticado e não tiver guest_cart_id, a API criará automaticamente um carrinho
    // O interceptor do api.js só adiciona token se existir, então está OK
    const response = await api.post('/cart/items', payload);
    
    console.log('[CartService] Resposta da API:', {
      cart_id: response.data?.cart_id,
      is_authenticated: response.data?.is_authenticated,
      has_cart: !!response.data?.cart
    });
    
    // IMPORTANTE: Salva cart_id no AsyncStorage se não logado
    // A API sempre retorna cart_id, mesmo quando cria um novo carrinho
    if (!authenticated && response.data?.cart_id) {
      await saveGuestCartId(response.data.cart_id);
      console.log('[CartService] Cart ID salvo:', response.data.cart_id);
    }
    
    return {
      success: true,
      data: response.data,
      cartId: response.data.cart_id,
      isAuthenticated: response.data.is_authenticated || authenticated
    };
  } catch (error) {
    console.error('[CartService] Erro ao adicionar item ao carrinho:', error);
    console.error('[CartService] Detalhes do erro:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    const errorMessage = error.response?.data?.error || error.message;
    
    return {
      success: false,
      error: errorMessage,
      cartId: null
    };
  }
};

/**
 * Atualiza item do carrinho
 * @param {number} cartItemId - ID do item no carrinho
 * @param {Object} updates - Dados para atualização
 * @param {number} [updates.quantity] - Nova quantidade
 * @param {Array} [updates.extras] - Novos extras
 * @param {string} [updates.notes] - Novas observações
 * @param {Array} [updates.baseModifications] - Novas modificações
 * @returns {Promise<Object>} Resultado da operação
 */
export const updateCartItem = async (cartItemId, updates = {}) => {
  try {
    const authenticated = await isAuthenticated();
    const guestCartId = authenticated ? null : await getGuestCartId();
    
    const payload = {};
    
    if (updates.quantity !== undefined) {
      payload.quantity = Number(updates.quantity);
    }
    
    if (updates.extras !== undefined) {
      payload.extras = updates.extras.map(extra => ({
        ingredient_id: Number(extra.ingredient_id || extra.id),
        quantity: Number(extra.quantity || 1)
      }));
    }
    
    if (updates.notes !== undefined) {
      payload.notes = String(updates.notes).slice(0, 500);
    }
    
    if (updates.baseModifications !== undefined && updates.baseModifications.length > 0) {
      payload.base_modifications = updates.baseModifications.map(mod => ({
        ingredient_id: Number(mod.ingredient_id || mod.id),
        delta: Number(mod.delta || 0)
      }));
    }
    
    // Se não logado, inclui cart_id no payload
    if (!authenticated && guestCartId) {
      payload.guest_cart_id = Number(guestCartId);
    }
    
    const response = await api.put(`/cart/items/${cartItemId}`, payload);
    
    return {
      success: true,
      data: response.data,
      cartId: response.data.cart_id,
      isAuthenticated: response.data.is_authenticated || authenticated
    };
  } catch (error) {
    console.error('Erro ao atualizar item do carrinho:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Remove item do carrinho
 * @param {number} cartItemId - ID do item no carrinho
 * @returns {Promise<Object>} Resultado da operação
 */
export const removeCartItem = async (cartItemId) => {
  try {
    const authenticated = await isAuthenticated();
    const guestCartId = authenticated ? null : await getGuestCartId();
    
    const payload = {};
    
    // Se não logado, inclui cart_id no payload
    if (!authenticated && guestCartId) {
      payload.guest_cart_id = Number(guestCartId);
    }
    
    const response = await api.delete(`/cart/items/${cartItemId}`, {
      data: payload
    });
    
    return {
      success: true,
      data: response.data,
      cartId: response.data.cart_id,
      isAuthenticated: response.data.is_authenticated || authenticated
    };
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Limpa todo o carrinho
 * @returns {Promise<Object>} Resultado da operação
 */
export const clearCart = async () => {
  try {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      const response = await api.delete('/cart/me/clear');
      return {
        success: true,
        data: response.data
      };
    } else {
      // Para convidado, remove o cart_id e cria novo carrinho vazio
      await removeGuestCartId();
      return {
        success: true,
        data: { message: 'Carrinho limpo' }
      };
    }
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Reivindica um carrinho de convidado para o usuário logado
 * @param {string|number} guestCartId - ID do carrinho de convidado
 * @returns {Promise<Object>} Resultado da operação
 */
export const claimGuestCart = async (guestCartId) => {
  try {
    const response = await api.post('/cart/claim', {
      guest_cart_id: Number(guestCartId)
    });
    
    // Remove cart_id do AsyncStorage após reivindicar
    await removeGuestCartId();
    
    return {
      success: true,
      data: response.data,
      cartId: response.data.cart_id
    };
  } catch (error) {
    console.error('Erro ao reivindicar carrinho:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Valida o carrinho antes de criar pedido
 * @param {string|number} [cartId] - ID do carrinho (opcional, usa carrinho atual se não fornecido)
 * @returns {Promise<Object>} Resultado da validação
 */
export const validateCartForOrder = async (cartId = null) => {
  try {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      const response = await api.get('/cart/me/validate');
      return {
        success: true,
        is_valid: response.data.availability_alerts?.length === 0,
        alerts: response.data.availability_alerts || [],
        data: response.data
      };
    } else {
      const guestCartId = cartId || await getGuestCartId();
      
      if (!guestCartId) {
        return {
          success: false,
          is_valid: false,
          alerts: ['Carrinho vazio'],
          error: 'Carrinho não encontrado'
        };
      }
      
      const response = await api.get(`/cart/guest/${guestCartId}/validate-for-order`);
      return {
        success: true,
        is_valid: response.data.is_valid,
        alerts: response.data.alerts || [],
        total_amount: response.data.total_amount,
        data: response.data
      };
    }
  } catch (error) {
    console.error('Erro ao validar carrinho:', error);
    
    return {
      success: false,
      is_valid: false,
      alerts: [error.response?.data?.error || 'Erro ao validar carrinho'],
      error: error.response?.data?.error || error.message
    };
  }
};

