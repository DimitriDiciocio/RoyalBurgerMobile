import api from "./api";

/**
 * ========================================
 * SERVIÇO DE INGREDIENTES
 * ========================================
 * Gerencia todas as operações relacionadas a ingredientes:
 * - Listagem de ingredientes
 * - Criação/edição de ingredientes (admin)
 * - Gerenciamento de disponibilidade
 * - Controle de estoque
 */

/**
 * Obtém todos os ingredientes.
 * @param {string} status - Filtro por status (active, inactive)
 * @returns {Promise<Array>} - Lista de ingredientes
 */
export const getAllIngredients = async (status = null) => {
  try {
    "Obtendo todos os ingredientes";
    const params = status ? { status } : {};
    const response = await api.get("/ingredients", { params });
    return response.data;
  } catch (error) {
    "Erro ao obter ingredientes:", error;
    throw error;
  }
};

/**
 * Cria um novo ingrediente (apenas para admin/manager).
 * @param {object} ingredientData - Dados do ingrediente
 * @returns {Promise<object>} - Ingrediente criado
 */
export const createIngredient = async (ingredientData) => {
  try {
    "Criando ingrediente:", ingredientData;
    const response = await api.post("/ingredients", ingredientData);
    return response.data;
  } catch (error) {
    "Erro ao criar ingrediente:", error;
    throw error;
  }
};

/**
 * Atualiza um ingrediente existente (apenas para admin/manager).
 * @param {number} ingredientId - ID do ingrediente
 * @param {object} ingredientData - Novos dados do ingrediente
 * @returns {Promise<object>} - Ingrediente atualizado
 */
export const updateIngredient = async (ingredientId, ingredientData) => {
  try {
    "Atualizando ingrediente:", ingredientId, ingredientData;
    const response = await api.put(`/ingredients/${ingredientId}`, ingredientData);
    return response.data;
  } catch (error) {
    "Erro ao atualizar ingrediente:", error;
    throw error;
  }
};

/**
 * Remove um ingrediente (apenas para admin/manager).
 * @param {number} ingredientId - ID do ingrediente
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteIngredient = async (ingredientId) => {
  try {
    "Removendo ingrediente:", ingredientId;
    const response = await api.delete(`/ingredients/${ingredientId}`);
    return response.data;
  } catch (error) {
    "Erro ao remover ingrediente:", error;
    throw error;
  }
};

/**
 * Atualiza disponibilidade de um ingrediente (apenas para admin/manager).
 * @param {number} ingredientId - ID do ingrediente
 * @param {boolean} isAvailable - Se está disponível
 * @returns {Promise<object>} - Resposta da API
 */
export const updateIngredientAvailability = async (ingredientId, isAvailable) => {
  try {
    "Atualizando disponibilidade do ingrediente:", ingredientId, "para:", isAvailable;
    const response = await api.patch(`/ingredients/${ingredientId}/availability`, {
      is_available: isAvailable,
    });
    return response.data;
  } catch (error) {
    "Erro ao atualizar disponibilidade:", error;
    throw error;
  }
};

/**
 * Ajusta estoque de um ingrediente (apenas para admin/manager).
 * @param {number} ingredientId - ID do ingrediente
 * @param {number} change - Mudança no estoque (positivo para adicionar, negativo para remover)
 * @returns {Promise<object>} - Resposta da API
 */
export const adjustIngredientStock = async (ingredientId, change) => {
  try {
    "Ajustando estoque do ingrediente:", ingredientId, "mudança:", change;
    const response = await api.post(`/ingredients/${ingredientId}/stock`, {
      change: change,
    });
    return response.data;
  } catch (error) {
    "Erro ao ajustar estoque:", error;
    throw error;
  }
};