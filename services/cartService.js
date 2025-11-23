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
import { isAuthenticated, getStoredUserData } from './userService';

const GUEST_CART_ID_KEY = 'guest_cart_id';

/**
 * Verifica se o usuário pode adicionar itens ao carrinho
 * ALTERAÇÃO: Apenas clientes e atendentes podem adicionar itens ao carrinho
 * @returns {Promise<Object>} { allowed: boolean, message?: string }
 */
const canUserAddToCart = async () => {
  const isAuth = await isAuthenticated();
  
  // Se não estiver logado, permite (usuário convidado pode adicionar)
  if (!isAuth) {
    return { allowed: true };
  }
  
  // Se estiver logado, verifica o role
  const user = await getStoredUserData();
  if (!user) {
    return { 
      allowed: false, 
      message: 'Não foi possível verificar suas permissões. Faça login novamente.' 
    };
  }
  
  // Verifica diferentes campos possíveis para o tipo/role do usuário
  const userRole = (user.role || user.profile || user.type || user.user_type || 'customer').toLowerCase();
  
  // Permite apenas clientes e atendentes
  const allowedRoles = ['cliente', 'customer', 'atendente', 'attendant'];
  const isAllowed = allowedRoles.includes(userRole);
  
  if (!isAllowed) {
    return { 
      allowed: false, 
      message: 'Apenas clientes e atendentes podem adicionar itens à cesta.' 
    };
  }
  
  return { allowed: true };
};

/**
 * Obtém o ID do carrinho de convidado do AsyncStorage
 * @returns {Promise<string|null>} ID do carrinho ou null
 */
export const getGuestCartId = async () => {
  try {
    return await AsyncStorage.getItem(GUEST_CART_ID_KEY);
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao obter guest_cart_id:', error);
    }
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao salvar guest_cart_id:', error);
    }
  }
};

/**
 * Remove o ID do carrinho de convidado do AsyncStorage
 */
export const removeGuestCartId = async () => {
  try {
    await AsyncStorage.removeItem(GUEST_CART_ID_KEY);
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao remover guest_cart_id:', error);
    }
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao buscar carrinho:', error);
    }
    
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
    // ALTERAÇÃO: Validar se o usuário pode adicionar itens ao carrinho
    const permissionCheck = await canUserAddToCart();
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.message || 'Você não tem permissão para adicionar itens à cesta.',
        errorType: 'PERMISSION_DENIED',
        cartId: null
      };
    }
    
    // Verificar autenticação
    const authenticated = await isAuthenticated();
    
    const guestCartId = authenticated ? null : await getGuestCartId();
    
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
    
    // A API usa verify_jwt_in_request(optional=True), então aceita requisições sem token
    // Se não autenticado e não tiver guest_cart_id, a API criará automaticamente um carrinho
    // O interceptor do api.js só adiciona token se existir, então está OK
    const response = await api.post('/cart/items', payload);
    
    // IMPORTANTE: Salva cart_id no AsyncStorage se não logado
    // A API sempre retorna cart_id, mesmo quando cria um novo carrinho
    if (!authenticated && response.data?.cart_id) {
      await saveGuestCartId(response.data.cart_id);
    }
    
    return {
      success: true,
      data: response.data,
      cartId: response.data.cart_id,
      isAuthenticated: response.data.is_authenticated || authenticated
    };
  } catch (error) {
    // ALTERAÇÃO: Tratamento específico para erros de estoque
    const errorMessage = error.response?.data?.error || error.message;
    const errorPayload = error.response?.data;
    
    // Detectar erros de estoque
    if (error.response?.status === 400 || error.response?.status === 422) {
      const isStockError = errorMessage.includes('Estoque insuficiente') ||
                          errorMessage.includes('insuficiente') ||
                          errorMessage.includes('INSUFFICIENT_STOCK') ||
                          errorPayload?.error_type === 'INSUFFICIENT_STOCK';
      
      if (isStockError) {
        return {
          success: false,
          error: errorMessage,
          errorType: 'INSUFFICIENT_STOCK',
          cartId: null
        };
      }
    }
    
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('[CartService] Erro ao adicionar item ao carrinho:', error);
    }
    
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
    // ALTERAÇÃO: Validar se o usuário pode atualizar itens no carrinho
    const permissionCheck = await canUserAddToCart();
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.message || 'Você não tem permissão para atualizar itens na cesta.',
        errorType: 'PERMISSION_DENIED'
      };
    }
    
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
    
    // ALTERAÇÃO: Sempre enviar notes, mesmo que vazio, para garantir que observações sejam atualizadas
    if (updates.notes !== undefined) {
      payload.notes = String(updates.notes || '').slice(0, 500);
    } else if (updates.observacoes !== undefined) {
      // Fallback para observacoes caso notes não seja fornecido
      payload.notes = String(updates.observacoes || '').slice(0, 500);
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
    // ALTERAÇÃO: Tratamento específico para erros de estoque
    const errorMessage = error.response?.data?.error || error.message;
    
    if (error.response?.status === 400 || error.response?.status === 422) {
      const isStockError = errorMessage.includes('Estoque insuficiente') ||
                          errorMessage.includes('insuficiente') ||
                          errorMessage.includes('INSUFFICIENT_STOCK') ||
                          error.response?.data?.error_type === 'INSUFFICIENT_STOCK';
      
      if (isStockError) {
        return {
          success: false,
          error: errorMessage,
          errorType: 'INSUFFICIENT_STOCK'
        };
      }
    }
    
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao atualizar item do carrinho:', error);
    }
    
    return {
      success: false,
      error: errorMessage
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao remover item do carrinho:', error);
    }
    
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao limpar carrinho:', error);
    }
    
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao reivindicar carrinho:', error);
    }
    
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
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao validar carrinho:', error);
    }
    
    return {
      success: false,
      is_valid: false,
      alerts: [error.response?.data?.error || 'Erro ao validar carrinho'],
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Valida estoque de todos os itens da cesta antes do checkout
 * ALTERAÇÃO: Validação preventiva de estoque no frontend
 * @returns {Promise<Object>} Resultado da validação { valid: boolean, items?: Array }
 */
export const validateStockBeforeCheckout = async () => {
  try {
    // Buscar carrinho atual
    const cartResult = await getCart();
    const items = cartResult?.data?.cart?.items || cartResult?.data?.items || [];
    
    if (items.length === 0) {
      return { valid: true };
    }
    
    // ALTERAÇÃO: Importar simulateProductCapacity dinamicamente
    const { simulateProductCapacity } = require('./productService');
    
    // Validar estoque de cada item
    const validationPromises = items.map(async (item) => {
      try {
        // Preparar extras no formato esperado pela API
        const extras = (item.extras || []).map(extra => ({
          ingredient_id: extra.ingredient_id || extra.id,
          quantity: extra.quantity || 1
        })).filter(extra => extra.ingredient_id && extra.quantity > 0);
        
        // Preparar base_modifications no formato esperado pela API
        const baseModifications = (item.base_modifications || []).map(bm => ({
          ingredient_id: bm.ingredient_id || bm.id,
          delta: bm.delta || 0
        })).filter(bm => bm.ingredient_id && bm.delta !== 0);
        
        const capacityData = await simulateProductCapacity(
          item.product_id,
          extras,
          item.quantity,
          baseModifications
        );
        
        if (!capacityData.is_available || capacityData.max_quantity < item.quantity) {
          return {
            valid: false,
            cartItemId: item.id,
            product: item.product?.name || `Produto #${item.product_id}`,
            message: capacityData.limiting_ingredient?.message || 
                    'Estoque insuficiente',
            maxQuantity: capacityData.max_quantity || 0
          };
        }
        
        return { valid: true };
      } catch (error) {
        // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
        const isDev = __DEV__;
        if (isDev) {
          console.error('Erro ao validar estoque do item:', error);
        }
        // Em caso de erro, permitir (backend validará)
        return { valid: true };
      }
    });
    
    const results = await Promise.all(validationPromises);
    const invalidItems = results.filter(r => !r.valid);
    
    if (invalidItems.length > 0) {
      return {
        valid: false,
        items: invalidItems
      };
    }
    
    return { valid: true };
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção - logging condicional apenas em dev
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao validar estoque:', error);
    }
    // Em caso de erro, permitir (backend validará no checkout)
    return { valid: true };
  }
};

