import api from "./api";

/**
 * ========================================
 * SERVIÇO DE CHAT
 * ========================================
 * Gerencia todas as operações relacionadas ao chat:
 * - Histórico de conversas
 * - Envio de mensagens
 * - Status de mensagens
 * - Chat em tempo real
 */

/**
 * Obtém o histórico de chat de um pedido.
 * @param {number} orderId - ID do pedido
 * @param {object} filters - Filtros opcionais (limit, offset)
 * @returns {Promise<Array>} - Histórico de mensagens
 */
export const getChatHistory = async (orderId, filters = {}) => {
  try {
    "Obtendo histórico de chat do pedido:", orderId;
    const response = await api.get(`/chat/${orderId}`, { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Envia uma mensagem no chat.
 * @param {number} orderId - ID do pedido
 * @param {string} message - Conteúdo da mensagem
 * @param {string} type - Tipo da mensagem (text, image, file)
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<object>} - Mensagem enviada
 */
export const sendMessage = async (
  orderId,
  message,
  type = "text",
  metadata = {}
) => {
  try {
    "Enviando mensagem no chat do pedido:", orderId;
    const response = await api.post(`/chat/${orderId}/message`, {
      message,
      type,
      metadata,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Marca mensagens como lidas.
 * @param {number} orderId - ID do pedido
 * @param {Array} messageIds - IDs das mensagens
 * @returns {Promise<object>} - Resposta da API
 */
export const markMessagesAsRead = async (orderId, messageIds) => {
  try {
    "Marcando mensagens como lidas:", messageIds;
    const response = await api.put(`/chat/${orderId}/mark-read`, {
      message_ids: messageIds,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém mensagens não lidas de um pedido.
 * @param {number} orderId - ID do pedido
 * @returns {Promise<Array>} - Lista de mensagens não lidas
 */
export const getUnreadMessages = async (orderId) => {
  try {
    "Obtendo mensagens não lidas do pedido:", orderId;
    const response = await api.get(`/chat/${orderId}/unread`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém contagem de mensagens não lidas.
 * @param {number} orderId - ID do pedido
 * @returns {Promise<number>} - Contagem de mensagens não lidas
 */
export const getUnreadMessageCount = async (orderId) => {
  try {
    "Obtendo contagem de mensagens não lidas do pedido:", orderId;
    const response = await api.get(`/chat/${orderId}/unread-count`);
    return response.data.count;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém todas as conversas ativas do usuário.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de conversas ativas
 */
export const getActiveConversations = async (filters = {}) => {
  try {
    ("Obtendo conversas ativas");
    const response = await api.get("/chat/conversations", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém uma conversa específica.
 * @param {number} conversationId - ID da conversa
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados da conversa
 */
export const getConversation = async (conversationId, filters = {}) => {
  try {
    "Obtendo conversa:", conversationId;
    const response = await api.get(`/chat/conversations/${conversationId}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cria uma nova conversa.
 * @param {object} conversationData - Dados da conversa
 * @returns {Promise<object>} - Conversa criada
 */
export const createConversation = async (conversationData) => {
  try {
    "Criando nova conversa:", conversationData;
    const response = await api.post("/chat/conversations", conversationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Encerra uma conversa.
 * @param {number} conversationId - ID da conversa
 * @param {string} reason - Motivo do encerramento
 * @returns {Promise<object>} - Resposta da API
 */
export const closeConversation = async (conversationId, reason = "") => {
  try {
    "Encerrando conversa:", conversationId, "motivo:", reason;
    const response = await api.put(
      `/chat/conversations/${conversationId}/close`,
      {
        reason,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reabre uma conversa encerrada.
 * @param {number} conversationId - ID da conversa
 * @returns {Promise<object>} - Resposta da API
 */
export const reopenConversation = async (conversationId) => {
  try {
    "Reabrindo conversa:", conversationId;
    const response = await api.put(
      `/chat/conversations/${conversationId}/reopen`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém mensagens de uma conversa.
 * @param {number} conversationId - ID da conversa
 * @param {object} filters - Filtros opcionais (limit, offset, date_from, date_to)
 * @returns {Promise<Array>} - Lista de mensagens
 */
export const getConversationMessages = async (conversationId, filters = {}) => {
  try {
    "Obtendo mensagens da conversa:", conversationId;
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: filters,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Envia uma mensagem em uma conversa.
 * @param {number} conversationId - ID da conversa
 * @param {string} message - Conteúdo da mensagem
 * @param {string} type - Tipo da mensagem
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<object>} - Mensagem enviada
 */
export const sendConversationMessage = async (
  conversationId,
  message,
  type = "text",
  metadata = {}
) => {
  try {
    "Enviando mensagem na conversa:", conversationId;
    const response = await api.post(
      `/chat/conversations/${conversationId}/messages`,
      {
        message,
        type,
        metadata,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém participantes de uma conversa.
 * @param {number} conversationId - ID da conversa
 * @returns {Promise<Array>} - Lista de participantes
 */
export const getConversationParticipants = async (conversationId) => {
  try {
    "Obtendo participantes da conversa:", conversationId;
    const response = await api.get(
      `/chat/conversations/${conversationId}/participants`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Adiciona um participante a uma conversa.
 * @param {number} conversationId - ID da conversa
 * @param {number} userId - ID do usuário
 * @param {string} role - Papel do participante
 * @returns {Promise<object>} - Resposta da API
 */
export const addConversationParticipant = async (
  conversationId,
  userId,
  role = "member"
) => {
  try {
    "Adicionando participante à conversa:",
      conversationId,
      "usuário:",
      userId;
    const response = await api.post(
      `/chat/conversations/${conversationId}/participants`,
      {
        user_id: userId,
        role,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove um participante de uma conversa.
 * @param {number} conversationId - ID da conversa
 * @param {number} userId - ID do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const removeConversationParticipant = async (conversationId, userId) => {
  try {
    "Removendo participante da conversa:",
      conversationId,
      "usuário:",
      userId;
    const response = await api.delete(
      `/chat/conversations/${conversationId}/participants/${userId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém status de uma mensagem.
 * @param {number} messageId - ID da mensagem
 * @returns {Promise<object>} - Status da mensagem
 */
export const getMessageStatus = async (messageId) => {
  try {
    "Obtendo status da mensagem:", messageId;
    const response = await api.get(`/chat/messages/${messageId}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Edita uma mensagem (apenas se for do próprio usuário e recente).
 * @param {number} messageId - ID da mensagem
 * @param {string} newMessage - Novo conteúdo da mensagem
 * @returns {Promise<object>} - Mensagem editada
 */
export const editMessage = async (messageId, newMessage) => {
  try {
    "Editando mensagem:", messageId;
    const response = await api.put(`/chat/messages/${messageId}`, {
      message: newMessage,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove uma mensagem (apenas se for do próprio usuário e recente).
 * @param {number} messageId - ID da mensagem
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteMessage = async (messageId) => {
  try {
    "Removendo mensagem:", messageId;
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de chat.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas do chat
 */
export const getChatStats = async (filters = {}) => {
  try {
    ("Obtendo estatísticas de chat");
    const response = await api.get("/chat/stats", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém conversas por status.
 * @param {string} status - Status da conversa (active, closed, pending)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de conversas
 */
export const getConversationsByStatus = async (status, filters = {}) => {
  try {
    "Obtendo conversas por status:", status;
    const response = await api.get(`/chat/conversations/status/${status}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém conversas recentes.
 * @param {number} limit - Limite de conversas (padrão: 10)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de conversas recentes
 */
export const getRecentConversations = async (limit = 10, filters = {}) => {
  try {
    "Obtendo conversas recentes (limite:", limit, ")";
    const response = await api.get("/chat/conversations/recent", {
      params: { limit, ...filters },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
