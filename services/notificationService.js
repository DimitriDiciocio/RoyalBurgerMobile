import api from "./api";

/**
 * ========================================
 * SERVIÇO DE NOTIFICAÇÕES
 * ========================================
 * Gerencia todas as operações relacionadas a notificações:
 * - Listagem de notificações
 * - Marcar como lida
 * - Configurações de notificação
 * - Push notifications
 */

/**
 * Obtém todas as notificações do usuário logado.
 * @param {object} filters - Filtros opcionais (status, type, date_from, date_to)
 * @returns {Promise<Array>} - Lista de notificações
 */
export const getMyNotifications = async (filters = {}) => {
  try {
    console.log("🔔 Obtendo minhas notificações com filtros:", filters);
    const response = await api.get("/notifications", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações:", error);
    throw error;
  }
};

/**
 * Obtém notificações não lidas.
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de notificações não lidas
 */
export const getUnreadNotifications = async (filters = {}) => {
  try {
    console.log("🔔 Obtendo notificações não lidas");
    const response = await api.get("/notifications/unread", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações não lidas:", error);
    throw error;
  }
};

/**
 * Obtém uma notificação específica por ID.
 * @param {number} notificationId - ID da notificação
 * @returns {Promise<object>} - Dados da notificação
 */
export const getNotificationById = async (notificationId) => {
  try {
    console.log("🔔 Obtendo notificação por ID:", notificationId);
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificação:", error);
    throw error;
  }
};

/**
 * Marca uma notificação como lida.
 * @param {number} notificationId - ID da notificação
 * @returns {Promise<object>} - Resposta da API
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    console.log("✅ Marcando notificação como lida:", notificationId);
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao marcar notificação como lida:", error);
    throw error;
  }
};

/**
 * Marca múltiplas notificações como lidas.
 * @param {Array} notificationIds - IDs das notificações
 * @returns {Promise<object>} - Resposta da API
 */
export const markNotificationsAsRead = async (notificationIds) => {
  try {
    console.log("✅ Marcando notificações como lidas:", notificationIds);
    const response = await api.put("/notifications/mark-read", {
      notification_ids: notificationIds,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao marcar notificações como lidas:", error);
    throw error;
  }
};

/**
 * Marca todas as notificações como lidas.
 * @returns {Promise<object>} - Resposta da API
 */
export const markAllNotificationsAsRead = async () => {
  try {
    console.log("✅ Marcando todas as notificações como lidas");
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao marcar todas as notificações como lidas:", error);
    throw error;
  }
};

/**
 * Remove uma notificação.
 * @param {number} notificationId - ID da notificação
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteNotification = async (notificationId) => {
  try {
    console.log("🗑️ Removendo notificação:", notificationId);
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao remover notificação:", error);
    throw error;
  }
};

/**
 * Remove múltiplas notificações.
 * @param {Array} notificationIds - IDs das notificações
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteNotifications = async (notificationIds) => {
  try {
    console.log("🗑️ Removendo notificações:", notificationIds);
    const response = await api.delete("/notifications/delete-multiple", {
      data: { notification_ids: notificationIds },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao remover notificações:", error);
    throw error;
  }
};

/**
 * Remove todas as notificações lidas.
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteAllReadNotifications = async () => {
  try {
    console.log("🗑️ Removendo todas as notificações lidas");
    const response = await api.delete("/notifications/delete-read");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao remover notificações lidas:", error);
    throw error;
  }
};

/**
 * Obtém notificações por tipo.
 * @param {string} type - Tipo da notificação (order, promotion, system, etc.)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de notificações do tipo
 */
export const getNotificationsByType = async (type, filters = {}) => {
  try {
    console.log("🔔 Obtendo notificações por tipo:", type);
    const response = await api.get(`/notifications/type/${type}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações por tipo:", error);
    throw error;
  }
};

/**
 * Obtém notificações por status.
 * @param {string} status - Status da notificação (read, unread)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de notificações do status
 */
export const getNotificationsByStatus = async (status, filters = {}) => {
  try {
    console.log("🔔 Obtendo notificações por status:", status);
    const response = await api.get(`/notifications/status/${status}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações por status:", error);
    throw error;
  }
};

/**
 * Obtém notificações recentes.
 * @param {number} limit - Limite de notificações (padrão: 10)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de notificações recentes
 */
export const getRecentNotifications = async (limit = 10, filters = {}) => {
  try {
    console.log("🔔 Obtendo notificações recentes (limite:", limit, ")");
    const response = await api.get("/notifications/recent", {
      params: { limit, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações recentes:", error);
    throw error;
  }
};

/**
 * Obtém configurações de notificação do usuário.
 * @returns {Promise<object>} - Configurações de notificação
 */
export const getNotificationSettings = async () => {
  try {
    console.log("⚙️ Obtendo configurações de notificação");
    const response = await api.get("/notifications/settings");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter configurações de notificação:", error);
    throw error;
  }
};

/**
 * Atualiza configurações de notificação do usuário.
 * @param {object} settings - Novas configurações
 * @returns {Promise<object>} - Configurações atualizadas
 */
export const updateNotificationSettings = async (settings) => {
  try {
    console.log("⚙️ Atualizando configurações de notificação:", settings);
    const response = await api.put("/notifications/settings", settings);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar configurações de notificação:", error);
    throw error;
  }
};

/**
 * Registra token de push notification.
 * @param {string} token - Token do dispositivo
 * @param {string} platform - Plataforma (ios, android)
 * @returns {Promise<object>} - Resposta da API
 */
export const registerPushToken = async (token, platform) => {
  try {
    console.log("📱 Registrando token de push notification:", platform);
    const response = await api.post("/notifications/register-token", {
      token,
      platform,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao registrar token de push:", error);
    throw error;
  }
};

/**
 * Remove token de push notification.
 * @param {string} token - Token do dispositivo
 * @returns {Promise<object>} - Resposta da API
 */
export const unregisterPushToken = async (token) => {
  try {
    console.log("📱 Removendo token de push notification:", token);
    const response = await api.delete("/notifications/unregister-token", {
      data: { token },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao remover token de push:", error);
    throw error;
  }
};

/**
 * Envia notificação de teste (apenas para admin/manager).
 * @param {object} notificationData - Dados da notificação
 * @returns {Promise<object>} - Resposta da API
 */
export const sendTestNotification = async (notificationData) => {
  try {
    console.log("🧪 Enviando notificação de teste:", notificationData);
    const response = await api.post(
      "/notifications/send-test",
      notificationData
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao enviar notificação de teste:", error);
    throw error;
  }
};

/**
 * Obtém estatísticas de notificações.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas das notificações
 */
export const getNotificationStats = async (filters = {}) => {
  try {
    console.log("📊 Obtendo estatísticas de notificações");
    const response = await api.get("/notifications/stats", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas de notificações:", error);
    throw error;
  }
};

/**
 * Obtém notificações por período.
 * @param {string} period - Período (today, week, month, year)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de notificações do período
 */
export const getNotificationsByPeriod = async (period, filters = {}) => {
  try {
    console.log("📅 Obtendo notificações por período:", period);
    const response = await api.get(`/notifications/period/${period}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações por período:", error);
    throw error;
  }
};

/**
 * Obtém notificações de pedidos.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de notificações de pedidos
 */
export const getOrderNotifications = async (filters = {}) => {
  try {
    console.log("🛒 Obtendo notificações de pedidos");
    const response = await api.get("/notifications/orders", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações de pedidos:", error);
    throw error;
  }
};

/**
 * Obtém notificações de promoções.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de notificações de promoções
 */
export const getPromotionNotifications = async (filters = {}) => {
  try {
    console.log("🏷️ Obtendo notificações de promoções");
    const response = await api.get("/notifications/promotions", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações de promoções:", error);
    throw error;
  }
};

/**
 * Obtém notificações do sistema.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de notificações do sistema
 */
export const getSystemNotifications = async (filters = {}) => {
  try {
    console.log("⚙️ Obtendo notificações do sistema");
    const response = await api.get("/notifications/system", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter notificações do sistema:", error);
    throw error;
  }
};
