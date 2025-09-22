import api from "./api";

/**
 * ========================================
 * SERVIÇO DE MENU
 * ========================================
 * Gerencia todas as operações relacionadas ao menu:
 * - Obter menu completo
 * - Menu por categoria
 * - Produtos em destaque
 * - Promoções ativas
 * - Menu personalizado
 */

/**
 * Obtém o menu completo.
 * @param {object} filters - Filtros opcionais (category, status, etc.)
 * @returns {Promise<object>} - Menu completo organizado por seções
 */
export const getFullMenu = async (filters = {}) => {
  try {
    console.log("🍽️ Obtendo menu completo com filtros:", filters);
    const response = await api.get("/menu", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter menu completo:", error);
    throw error;
  }
};

/**
 * Obtém o menu por categoria/seção.
 * @param {number} sectionId - ID da seção
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Produtos da seção
 */
export const getMenuBySection = async (sectionId, filters = {}) => {
  try {
    console.log("📂 Obtendo menu da seção:", sectionId);
    const response = await api.get(`/menu/section/${sectionId}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter menu da seção:", error);
    throw error;
  }
};

/**
 * Obtém produtos em destaque.
 * @param {number} limit - Limite de produtos (padrão: 6)
 * @returns {Promise<Array>} - Lista de produtos em destaque
 */
export const getFeaturedProducts = async (limit = 6) => {
  try {
    console.log("⭐ Obtendo produtos em destaque (limite:", limit, ")");
    const response = await api.get("/menu/featured", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos em destaque:", error);
    throw error;
  }
};

/**
 * Obtém produtos em promoção.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de produtos em promoção
 */
export const getPromotionalProducts = async (filters = {}) => {
  try {
    console.log("🏷️ Obtendo produtos em promoção");
    const response = await api.get("/menu/promotions", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos em promoção:", error);
    throw error;
  }
};

/**
 * Obtém produtos mais vendidos.
 * @param {number} limit - Limite de produtos (padrão: 10)
 * @param {string} period - Período (day, week, month, year)
 * @returns {Promise<Array>} - Lista de produtos mais vendidos
 */
export const getBestSellingProducts = async (limit = 10, period = "month") => {
  try {
    console.log(
      "🏆 Obtendo produtos mais vendidos (limite:",
      limit,
      "período:",
      period,
      ")"
    );
    const response = await api.get("/menu/best-selling", {
      params: { limit, period },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos mais vendidos:", error);
    throw error;
  }
};

/**
 * Obtém produtos recomendados para um usuário.
 * @param {number} userId - ID do usuário
 * @param {number} limit - Limite de produtos (padrão: 5)
 * @returns {Promise<Array>} - Lista de produtos recomendados
 */
export const getRecommendedProducts = async (userId, limit = 5) => {
  try {
    console.log("💡 Obtendo produtos recomendados para usuário:", userId);
    const response = await api.get(`/menu/recommendations/${userId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos recomendados:", error);
    throw error;
  }
};

/**
 * Busca produtos no menu.
 * @param {string} searchTerm - Termo de busca
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos encontrados
 */
export const searchMenuProducts = async (searchTerm, filters = {}) => {
  try {
    console.log("🔍 Buscando produtos no menu:", searchTerm);
    const response = await api.get("/menu/search", {
      params: { q: searchTerm, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos no menu:", error);
    throw error;
  }
};

/**
 * Obtém categorias/seções do menu.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de categorias
 */
export const getMenuCategories = async (filters = {}) => {
  try {
    console.log("📂 Obtendo categorias do menu");
    const response = await api.get("/menu/categories", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter categorias do menu:", error);
    throw error;
  }
};

/**
 * Obtém um produto específico do menu.
 * @param {number} productId - ID do produto
 * @returns {Promise<object>} - Dados do produto
 */
export const getMenuProduct = async (productId) => {
  try {
    console.log("🍔 Obtendo produto do menu:", productId);
    const response = await api.get(`/menu/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produto do menu:", error);
    throw error;
  }
};

/**
 * Obtém ingredientes de um produto do menu.
 * @param {number} productId - ID do produto
 * @returns {Promise<Array>} - Lista de ingredientes
 */
export const getMenuProductIngredients = async (productId) => {
  try {
    console.log("🥬 Obtendo ingredientes do produto:", productId);
    const response = await api.get(`/menu/products/${productId}/ingredients`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter ingredientes do produto:", error);
    throw error;
  }
};

/**
 * Obtém opções de personalização de um produto.
 * @param {number} productId - ID do produto
 * @returns {Promise<Array>} - Lista de opções de personalização
 */
export const getProductCustomizationOptions = async (productId) => {
  try {
    console.log("⚙️ Obtendo opções de personalização do produto:", productId);
    const response = await api.get(
      `/menu/products/${productId}/customizations`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter opções de personalização:", error);
    throw error;
  }
};

/**
 * Obtém produtos similares a um produto.
 * @param {number} productId - ID do produto
 * @param {number} limit - Limite de produtos (padrão: 4)
 * @returns {Promise<Array>} - Lista de produtos similares
 */
export const getSimilarProducts = async (productId, limit = 4) => {
  try {
    console.log("🔄 Obtendo produtos similares ao produto:", productId);
    const response = await api.get(`/menu/products/${productId}/similar`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos similares:", error);
    throw error;
  }
};

/**
 * Obtém produtos por faixa de preço.
 * @param {number} minPrice - Preço mínimo
 * @param {number} maxPrice - Preço máximo
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos na faixa de preço
 */
export const getProductsByPriceRange = async (
  minPrice,
  maxPrice,
  filters = {}
) => {
  try {
    console.log(
      "💰 Obtendo produtos por faixa de preço:",
      minPrice,
      "-",
      maxPrice
    );
    const response = await api.get("/menu/price-range", {
      params: { min_price: minPrice, max_price: maxPrice, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos por faixa de preço:", error);
    throw error;
  }
};

/**
 * Obtém produtos por ingrediente.
 * @param {string} ingredient - Nome do ingrediente
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos com o ingrediente
 */
export const getProductsByIngredient = async (ingredient, filters = {}) => {
  try {
    console.log("🥬 Obtendo produtos por ingrediente:", ingredient);
    const response = await api.get("/menu/by-ingredient", {
      params: { ingredient, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos por ingrediente:", error);
    throw error;
  }
};

/**
 * Obtém produtos sem um ingrediente específico.
 * @param {string} ingredient - Nome do ingrediente a excluir
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos sem o ingrediente
 */
export const getProductsWithoutIngredient = async (
  ingredient,
  filters = {}
) => {
  try {
    console.log("🚫 Obtendo produtos sem ingrediente:", ingredient);
    const response = await api.get("/menu/without-ingredient", {
      params: { ingredient, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos sem ingrediente:", error);
    throw error;
  }
};

/**
 * Obtém produtos vegetarianos.
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos vegetarianos
 */
export const getVegetarianProducts = async (filters = {}) => {
  try {
    console.log("🥬 Obtendo produtos vegetarianos");
    const response = await api.get("/menu/vegetarian", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos vegetarianos:", error);
    throw error;
  }
};

/**
 * Obtém produtos veganos.
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos veganos
 */
export const getVeganProducts = async (filters = {}) => {
  try {
    console.log("🌱 Obtendo produtos veganos");
    const response = await api.get("/menu/vegan", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos veganos:", error);
    throw error;
  }
};

/**
 * Obtém produtos sem glúten.
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos sem glúten
 */
export const getGlutenFreeProducts = async (filters = {}) => {
  try {
    console.log("🌾 Obtendo produtos sem glúten");
    const response = await api.get("/menu/gluten-free", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos sem glúten:", error);
    throw error;
  }
};

/**
 * Obtém produtos sem lactose.
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos sem lactose
 */
export const getLactoseFreeProducts = async (filters = {}) => {
  try {
    console.log("🥛 Obtendo produtos sem lactose");
    const response = await api.get("/menu/lactose-free", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos sem lactose:", error);
    throw error;
  }
};

/**
 * Obtém produtos por nível de picância.
 * @param {string} spiceLevel - Nível de picância (mild, medium, hot, extra_hot)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos com o nível de picância
 */
export const getProductsBySpiceLevel = async (spiceLevel, filters = {}) => {
  try {
    console.log("🌶️ Obtendo produtos por nível de picância:", spiceLevel);
    const response = await api.get("/menu/spice-level", {
      params: { spice_level: spiceLevel, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos por nível de picância:", error);
    throw error;
  }
};

/**
 * Obtém produtos por tempo de preparo.
 * @param {number} maxPrepTime - Tempo máximo de preparo em minutos
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos com tempo de preparo
 */
export const getProductsByPrepTime = async (maxPrepTime, filters = {}) => {
  try {
    console.log(
      "⏱️ Obtendo produtos por tempo de preparo:",
      maxPrepTime,
      "min"
    );
    const response = await api.get("/menu/prep-time", {
      params: { max_prep_time: maxPrepTime, ...filters },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter produtos por tempo de preparo:", error);
    throw error;
  }
};
