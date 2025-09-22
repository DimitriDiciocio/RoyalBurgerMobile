import api from "./api";

/**
 * ========================================
 * SERVIÇO DE INGREDIENTES
 * ========================================
 * Gerencia todas as operações relacionadas a ingredientes:
 * - Listagem de ingredientes
 * - Gerenciamento de estoque
 * - Status de ingredientes
 * - Criação/edição (admin)
 */

/**
 * Obtém todos os ingredientes.
 * @param {object} filters - Filtros opcionais (status, search, etc.)
 * @returns {Promise<Array>} - Lista de ingredientes
 */
export const getAllIngredients = async (filters = {}) => {
  try {
    "🥬 Obtendo todos os ingredientes com filtros:", filters;
    const response = await api.get("/ingredients", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém um ingrediente específico por ID.
 * @param {number} ingredientId - ID do ingrediente
 * @returns {Promise<object>} - Dados do ingrediente
 */
export const getIngredientById = async (ingredientId) => {
  try {
    "🥬 Obtendo ingrediente por ID:", ingredientId;
    const response = await api.get(`/ingredients/${ingredientId}`);
    return response.data;
  } catch (error) {
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
    "➕ Criando ingrediente:", ingredientData;
    const response = await api.post("/ingredients", ingredientData);
    return response.data;
  } catch (error) {
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
    "✏️ Atualizando ingrediente:", ingredientId, ingredientData;
    const response = await api.put(
      `/ingredients/${ingredientId}`,
      ingredientData
    );
    return response.data;
  } catch (error) {
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
    "🗑️ Removendo ingrediente:", ingredientId;
    const response = await api.delete(`/ingredients/${ingredientId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes por status de estoque.
 * @param {string} status - Status do estoque (in_stock, low_stock, out_of_stock)
 * @returns {Promise<Array>} - Lista de ingredientes
 */
export const getIngredientsByStockStatus = async (status) => {
  try {
    "📦 Obtendo ingredientes por status de estoque:", status;
    const response = await api.get(`/ingredients/stock-status/${status}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes com estoque baixo.
 * @param {number} threshold - Limite de estoque baixo (padrão: 10)
 * @returns {Promise<Array>} - Lista de ingredientes com estoque baixo
 */
export const getLowStockIngredients = async (threshold = 10) => {
  try {
    "⚠️ Obtendo ingredientes com estoque baixo (limite:", threshold, ")";
    const response = await api.get("/ingredients/low-stock", {
      params: { threshold },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes em falta.
 * @returns {Promise<Array>} - Lista de ingredientes em falta
 */
export const getOutOfStockIngredients = async () => {
  try {
    ("❌ Obtendo ingredientes em falta");
    const response = await api.get("/ingredients/out-of-stock");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza o estoque de um ingrediente (apenas para admin/manager).
 * @param {number} ingredientId - ID do ingrediente
 * @param {number} quantity - Nova quantidade
 * @param {string} operation - Operação (add, subtract, set)
 * @returns {Promise<object>} - Ingrediente atualizado
 */
export const updateIngredientStock = async (
  ingredientId,
  quantity,
  operation = "set"
) => {
  try {
    "📦 Atualizando estoque do ingrediente:",
      ingredientId,
      "quantidade:",
      quantity,
      "operação:",
      operation;
    const response = await api.put(`/ingredients/${ingredientId}/stock`, {
      quantity,
      operation,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Adiciona quantidade ao estoque de um ingrediente.
 * @param {number} ingredientId - ID do ingrediente
 * @param {number} quantity - Quantidade a adicionar
 * @returns {Promise<object>} - Ingrediente atualizado
 */
export const addIngredientStock = async (ingredientId, quantity) => {
  try {
    "➕ Adicionando estoque ao ingrediente:",
      ingredientId,
      "quantidade:",
      quantity;
    return await updateIngredientStock(ingredientId, quantity, "add");
  } catch (error) {
    throw error;
  }
};

/**
 * Remove quantidade do estoque de um ingrediente.
 * @param {number} ingredientId - ID do ingrediente
 * @param {number} quantity - Quantidade a remover
 * @returns {Promise<object>} - Ingrediente atualizado
 */
export const removeIngredientStock = async (ingredientId, quantity) => {
  try {
    "➖ Removendo estoque do ingrediente:",
      ingredientId,
      "quantidade:",
      quantity;
    return await updateIngredientStock(ingredientId, quantity, "subtract");
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém histórico de movimentação de estoque de um ingrediente.
 * @param {number} ingredientId - ID do ingrediente
 * @param {object} filters - Filtros opcionais (date_from, date_to)
 * @returns {Promise<Array>} - Histórico de movimentação
 */
export const getIngredientStockHistory = async (ingredientId, filters = {}) => {
  try {
    "📊 Obtendo histórico de estoque do ingrediente:", ingredientId;
    const response = await api.get(
      `/ingredients/${ingredientId}/stock-history`,
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
 * Busca ingredientes por nome.
 * @param {string} searchTerm - Termo de busca
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de ingredientes encontrados
 */
export const searchIngredients = async (searchTerm, filters = {}) => {
  try {
    "🔍 Buscando ingredientes:", searchTerm;
    const response = await api.get("/ingredients/search", {
      params: { q: searchTerm, ...filters },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes por categoria.
 * @param {string} category - Categoria do ingrediente
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de ingredientes da categoria
 */
export const getIngredientsByCategory = async (category, filters = {}) => {
  try {
    "📂 Obtendo ingredientes por categoria:", category;
    const response = await api.get(`/ingredients/category/${category}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém categorias de ingredientes.
 * @returns {Promise<Array>} - Lista de categorias
 */
export const getIngredientCategories = async () => {
  try {
    ("📂 Obtendo categorias de ingredientes");
    const response = await api.get("/ingredients/categories");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes que estão próximos do vencimento.
 * @param {number} days - Dias para vencimento (padrão: 7)
 * @returns {Promise<Array>} - Lista de ingredientes próximos do vencimento
 */
export const getIngredientsNearExpiry = async (days = 7) => {
  try {
    "⏰ Obtendo ingredientes próximos do vencimento (dias:", days, ")";
    const response = await api.get("/ingredients/near-expiry", {
      params: { days },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes vencidos.
 * @returns {Promise<Array>} - Lista de ingredientes vencidos
 */
export const getExpiredIngredients = async () => {
  try {
    ("⚠️ Obtendo ingredientes vencidos");
    const response = await api.get("/ingredients/expired");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de ingredientes.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas dos ingredientes
 */
export const getIngredientStats = async (filters = {}) => {
  try {
    ("📊 Obtendo estatísticas de ingredientes");
    const response = await api.get("/ingredients/stats", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes mais utilizados.
 * @param {number} limit - Limite de ingredientes (padrão: 10)
 * @param {string} period - Período (day, week, month, year)
 * @returns {Promise<Array>} - Lista de ingredientes mais utilizados
 */
export const getMostUsedIngredients = async (limit = 10, period = "month") => {
  try {
    "🏆 Obtendo ingredientes mais utilizados (limite:",
      limit,
      "período:",
      period,
      ")";
    const response = await api.get("/ingredients/most-used", {
      params: { limit, period },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes por fornecedor.
 * @param {number} supplierId - ID do fornecedor
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de ingredientes do fornecedor
 */
export const getIngredientsBySupplier = async (supplierId, filters = {}) => {
  try {
    "🏪 Obtendo ingredientes por fornecedor:", supplierId;
    const response = await api.get(`/ingredients/supplier/${supplierId}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém ingredientes por unidade de medida.
 * @param {string} unit - Unidade de medida (kg, g, l, ml, un, etc.)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de ingredientes com a unidade
 */
export const getIngredientsByUnit = async (unit, filters = {}) => {
  try {
    "📏 Obtendo ingredientes por unidade:", unit;
    const response = await api.get(`/ingredients/unit/${unit}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
