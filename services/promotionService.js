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
    console.log("Obtendo promoções ativas com opções:", options);
    const { include_expired = false } = options;
    const response = await api.get("/promotions", {
      params: { include_expired },
    });
    return response.data;
  } catch (error) {
    console.log("Erro ao obter promoções:", error);
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
    console.log("Obtendo promoção por ID:", promotionId);
    const response = await api.get(`/promotions/${promotionId}`);
    return response.data;
  } catch (error) {
    console.log("Erro ao obter promoção:", error);
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
    console.log("Obtendo promoção do produto:", productId);
    const response = await api.get(`/promotions/product/${productId}`);
    return response.data;
  } catch (error) {
    console.log("Erro ao obter promoção do produto:", error);
    // Se não encontrar promoção, retorna null (não é erro)
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

