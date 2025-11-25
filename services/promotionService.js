import api from "./api";

/**
 * ========================================
 * SERVIÇO DE PROMOÇÕES
 * ========================================
 * Gerencia todas as operações relacionadas a promoções:
 * - Listagem de promoções
 * - Promoções por produto
 * - Detalhes de promoções
 */

/**
 * Obtém todas as promoções ativas.
 * @param {object} options - Opções de filtro
 * @returns {Promise<object>} - Lista de promoções com detalhes dos produtos
 */
export const getAllPromotions = async (options = {}) => {
  try {
    // ALTERAÇÃO: Removido console.log para evitar poluição do console
    const { include_expired = false } = options;
    const response = await api.get("/promotions", {
      params: { include_expired },
    });
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Log apenas em desenvolvimento
    const isDev = __DEV__;
    if (isDev) {
      console.error("Erro ao obter promoções:", error);
    }
    throw error;
  }
};

/**
 * Obtém uma promoção específica por ID.
 * @param {number} promotionId - ID da promoção
 * @returns {Promise<object>} - Dados da promoção
 */
export const getPromotionById = async (promotionId) => {
  try {
    // ALTERAÇÃO: Removido console.log para evitar poluição do console
    const response = await api.get(`/promotions/${promotionId}`);
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Log apenas em desenvolvimento
    const isDev = __DEV__;
    if (isDev) {
      console.error("Erro ao obter promoção:", error);
    }
    throw error;
  }
};

/**
 * Obtém a promoção ativa de um produto específico.
 * @param {number} productId - ID do produto
 * @returns {Promise<object>} - Dados da promoção ou null
 */
export const getPromotionByProductId = async (productId) => {
  try {
    // ALTERAÇÃO: Removido console.log para evitar poluição do console
    const response = await api.get(`/promotions/product/${productId}`);
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Removido console.log - erro 404 é esperado quando produto não tem promoção
    // Se não encontrar promoção, retorna null (não é erro)
    if (error.response && error.response.status === 404) {
      return null;
    }
    // ALTERAÇÃO: Log apenas em caso de erro real (não 404)
    const isDev = __DEV__;
    if (isDev) {
      console.error("Erro ao obter promoção do produto:", error);
    }
    throw error;
  }
};

