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
    console.log("🛒 Criando pedido:", orderData);
    const response = await api.post("/orders", orderData);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao criar pedido:", error);
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
    console.log("📋 Obtendo meus pedidos com filtros:", filters);
    const response = await api.get("/orders", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter pedidos:", error);
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
    console.log("📋 Obtendo todos os pedidos com filtros:", filters);
    const response = await api.get("/orders/all", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter todos os pedidos:", error);
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
    console.log("🛒 Obtendo pedido por ID:", orderId);
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter pedido:", error);
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
    console.log("🔄 Atualizando status do pedido:", orderId, "para:", status);
    const response = await api.put(`/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar status do pedido:", error);
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
    console.log("❌ Cancelando pedido:", orderId, "motivo:", reason);
    const response = await api.put(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao cancelar pedido:", error);
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
    console.log("📊 Obtendo histórico de pedidos do cliente:", customerId);
    const response = await api.get(`/orders/customer/${customerId}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter histórico de pedidos:", error);
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
    console.log("📋 Obtendo pedidos com status:", status);
    const response = await api.get(`/orders/status/${status}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter pedidos por status:", error);
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
    console.log("📅 Obtendo pedidos de hoje");
    const response = await api.get("/orders/today", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter pedidos de hoje:", error);
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
    console.log("📊 Obtendo estatísticas de pedidos");
    const response = await api.get("/orders/stats", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas de pedidos:", error);
    throw error;
  }
};

/**
 * Obtém itens de um pedido.
 * @param {number} orderId - ID do pedido
 * @returns {Promise<Array>} - Lista de itens do pedido
 */
export const getOrderItems = async (orderId) => {
  try {
    console.log("🛍️ Obtendo itens do pedido:", orderId);
    const response = await api.get(`/orders/${orderId}/items`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter itens do pedido:", error);
    throw error;
  }
};

/**
 * Adiciona um item a um pedido (apenas para pedidos em andamento).
 * @param {number} orderId - ID do pedido
 * @param {object} itemData - Dados do item
 * @returns {Promise<object>} - Item adicionado
 */
export const addOrderItem = async (orderId, itemData) => {
  try {
    console.log("➕ Adicionando item ao pedido:", orderId);
    const response = await api.post(`/orders/${orderId}/items`, itemData);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao adicionar item ao pedido:", error);
    throw error;
  }
};

/**
 * Remove um item de um pedido (apenas para pedidos em andamento).
 * @param {number} orderId - ID do pedido
 * @param {number} itemId - ID do item
 * @returns {Promise<object>} - Resposta da API
 */
export const removeOrderItem = async (orderId, itemId) => {
  try {
    console.log("🗑️ Removendo item do pedido:", orderId, "item:", itemId);
    const response = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao remover item do pedido:", error);
    throw error;
  }
};

/**
 * Atualiza a quantidade de um item no pedido.
 * @param {number} orderId - ID do pedido
 * @param {number} itemId - ID do item
 * @param {number} quantity - Nova quantidade
 * @returns {Promise<object>} - Item atualizado
 */
export const updateOrderItemQuantity = async (orderId, itemId, quantity) => {
  try {
    console.log(
      "✏️ Atualizando quantidade do item:",
      itemId,
      "para:",
      quantity
    );
    const response = await api.put(`/orders/${orderId}/items/${itemId}`, {
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar quantidade do item:", error);
    throw error;
  }
};

/**
 * Obtém o rastreamento de um pedido.
 * @param {number} orderId - ID do pedido
 * @returns {Promise<object>} - Dados de rastreamento
 */
export const getOrderTracking = async (orderId) => {
  try {
    console.log("📍 Obtendo rastreamento do pedido:", orderId);
    const response = await api.get(`/orders/${orderId}/tracking`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter rastreamento:", error);
    throw error;
  }
};

/**
 * Atualiza o rastreamento de um pedido (apenas para admin/manager).
 * @param {number} orderId - ID do pedido
 * @param {object} trackingData - Dados de rastreamento
 * @returns {Promise<object>} - Rastreamento atualizado
 */
export const updateOrderTracking = async (orderId, trackingData) => {
  try {
    console.log("📍 Atualizando rastreamento do pedido:", orderId);
    const response = await api.put(`/orders/${orderId}/tracking`, trackingData);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar rastreamento:", error);
    throw error;
  }
};

/**
 * Obtém pedidos próximos ao usuário (para delivery).
 * @param {object} location - Coordenadas do usuário
 * @param {number} radius - Raio em km (padrão: 5)
 * @returns {Promise<Array>} - Lista de pedidos próximos
 */
export const getNearbyOrders = async (location, radius = 5) => {
  try {
    console.log("📍 Obtendo pedidos próximos:", location, "raio:", radius);
    const response = await api.get("/orders/nearby", {
      params: { ...location, radius },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter pedidos próximos:", error);
    throw error;
  }
};

/**
 * Obtém relatório de pedidos.
 * @param {object} filters - Filtros do relatório
 * @returns {Promise<object>} - Relatório de pedidos
 */
export const getOrderReport = async (filters = {}) => {
  try {
    console.log("📊 Gerando relatório de pedidos");
    const response = await api.get("/orders/report", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    throw error;
  }
};
