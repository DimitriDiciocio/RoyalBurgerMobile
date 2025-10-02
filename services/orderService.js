import api from "./api";

/**
 * ========================================
 * SERVIÇO DE PEDIDOS
 * ========================================
 * Gerencia todas as operações relacionadas a pedidos:
 * - Criação de pedidos
 * - Listagem de pedidos
 * - Atualização de status
 * - Histórico de pedidos
 * - Rastreamento de pedidos
 */

/**
 * Cria um novo pedido.
 * @param {object} orderData - Dados do pedido
 * @returns {Promise<object>} - Pedido criado
 */
export const createOrder = async (orderData) => {
  try {
    "🛒 Criando pedido:", orderData;
    const response = await api.post("/orders", orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém todos os pedidos do usuário logado.
 * @param {object} filters - Filtros opcionais (status, date_from, date_to)
 * @returns {Promise<Array>} - Lista de pedidos
 */
export const getMyOrders = async (filters = {}) => {
  try {
    "📋 Obtendo meus pedidos com filtros:", filters;
    const response = await api.get("/orders", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém todos os pedidos (apenas para admin/manager).
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de todos os pedidos
 */
export const getAllOrders = async (filters = {}) => {
  try {
    "📋 Obtendo todos os pedidos com filtros:", filters;
    const response = await api.get("/orders/all", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém um pedido específico por ID.
 * @param {number} orderId - ID do pedido
 * @returns {Promise<object>} - Dados do pedido
 */
export const getOrderById = async (orderId) => {
  try {
    "🛒 Obtendo pedido por ID:", orderId;
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza o status de um pedido (apenas para admin/manager).
 * @param {number} orderId - ID do pedido
 * @param {string} status - Novo status
 * @param {string} notes - Notas opcionais
 * @returns {Promise<object>} - Pedido atualizado
 */
export const updateOrderStatus = async (orderId, status, notes = "") => {
  try {
    "🔄 Atualizando status do pedido:", orderId, "para:", status;
    const response = await api.patch(`/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancela um pedido.
 * @param {number} orderId - ID do pedido
 * @param {string} reason - Motivo do cancelamento
 * @returns {Promise<object>} - Resposta da API
 */
export const cancelOrder = async (orderId, reason = "") => {
  try {
    "❌ Cancelando pedido:", orderId, "motivo:", reason;
    const response = await api.post(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém o histórico de pedidos de um cliente.
 * @param {number} customerId - ID do cliente
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Histórico de pedidos
 */
export const getCustomerOrderHistory = async (customerId, filters = {}) => {
  try {
    "📊 Obtendo histórico de pedidos do cliente:", customerId;
    const response = await api.get(`/orders/customer/${customerId}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém pedidos por status.
 * @param {string} status - Status dos pedidos
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de pedidos
 */
export const getOrdersByStatus = async (status, filters = {}) => {
  try {
    "📋 Obtendo pedidos com status:", status;
    const response = await api.get(`/orders/status/${status}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém pedidos do dia atual.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de pedidos do dia
 */
export const getTodayOrders = async (filters = {}) => {
  try {
    ("📅 Obtendo pedidos de hoje");
    const response = await api.get("/orders/today", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de pedidos.
 * @param {object} filters - Filtros opcionais (date_from, date_to)
 * @returns {Promise<object>} - Estatísticas dos pedidos
 */
export const getOrderStats = async (filters = {}) => {
  try {
    ("📊 Obtendo estatísticas de pedidos");
    const response = await api.get("/orders/stats", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Funções removidas pois não existem na API atual:
// - getOrderItems
// - addOrderItem
// - removeOrderItem
// - updateOrderItemQuantity
// - getOrderTracking
// - updateOrderTracking
// - getNearbyOrders
// - getOrderReport
