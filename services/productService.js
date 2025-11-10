import api from "./api";

/**
 * ========================================
 * SERVIÇO DE PRODUTOS
 * ========================================
 * Gerencia todas as operações relacionadas a produtos:
 * - Listagem de produtos
 * - Detalhes de produtos
 * - Criação/edição de produtos (admin)
 * - Gerenciamento de seções
 * - Busca e filtros
 */

/**
 * Obtém todos os produtos.
 * @param {object} filters - Filtros opcionais (category, status, search, etc.)
 * @returns {Promise<Array>} - Lista de produtos
 */
export const getAllProducts = async (filters = {}) => {
  try {
    "Obtendo todos os produtos com filtros:", filters;
    const response = await api.get("/products", { params: filters });
    return response.data;
  } catch (error) {
    "Erro ao obter produtos:", error;
    throw error;
  }
};

/**
 * Obtém um produto específico por ID.
 * @param {number} productId - ID do produto
 * @returns {Promise<object>} - Dados do produto
 */
export const getProductById = async (productId) => {
  try {
    "Obtendo produto por ID:", productId;
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    "Erro ao obter produto:", error;
    throw error;
  }
};

/**
 * Verifica a disponibilidade de um produto (estoque de ingredientes).
 * @param {number} productId - ID do produto
 * @param {number} quantity - Quantidade desejada
 * @returns {Promise<object>} - Status de disponibilidade
 */
export const checkProductAvailability = async (productId, quantity = 1) => {
  try {
    const response = await api.get(`/products/${productId}/availability`, {
      params: { quantity }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    // Retorna status unknown em caso de erro
    return {
      status: 'unknown',
      message: error.response?.data?.error || 'Erro ao verificar disponibilidade',
      available: false
    };
  }
};

/**
 * Cria um novo produto (apenas para admin/manager).
 * @param {object} productData - Dados do produto
 * @returns {Promise<object>} - Produto criado
 */
export const createProduct = async (productData) => {
  try {
    "Criando produto:", productData;
    const response = await api.post("/products", productData);
    return response.data;
  } catch (error) {
    "Erro ao criar produto:", error;
    throw error;
  }
};

/**
 * Atualiza um produto existente (apenas para admin/manager).
 * @param {number} productId - ID do produto
 * @param {object} productData - Novos dados do produto
 * @returns {Promise<object>} - Produto atualizado
 */
export const updateProduct = async (productId, productData) => {
  try {
    "Atualizando produto:", productId, productData;
    const response = await api.put(`/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    "Erro ao atualizar produto:", error;
    throw error;
  }
};

/**
 * Remove um produto (apenas para admin/manager).
 * @param {number} productId - ID do produto
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteProduct = async (productId) => {
  try {
    "Removendo produto:", productId;
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    "Erro ao remover produto:", error;
    throw error;
  }
};

/**
 * Ativa/desativa um produto (apenas para admin/manager).
 * @param {number} productId - ID do produto
 * @param {boolean} isActive - Status de ativação
 * @returns {Promise<object>} - Resposta da API
 */
export const toggleProductStatus = async (productId, isActive) => {
  try {
    "Alterando status do produto:", productId, "para:", isActive;
    // A API não tem endpoint específico para toggle, usa update
    const response = await api.put(`/products/${productId}`, {
      is_active: isActive,
    });
    return response.data;
  } catch (error) {
    "Erro ao alterar status do produto:", error;
    throw error;
  }
};

/**
 * Obtém produtos por categoria/seção.
 * @param {number} sectionId - ID da seção
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos da seção
 */
export const getProductsBySection = async (sectionId, filters = {}) => {
  try {
    "Obtendo produtos da seção:", sectionId;
    const response = await api.get(`/sections/${sectionId}/products`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    "Erro ao obter produtos da seção:", error;
    throw error;
  }
};

/**
 * Obtém produtos por ID da categoria.
 * @param {number} categoryId - ID da categoria
 * @param {object} options - Opções de paginação e filtros
 * @returns {Promise<object>} - Objeto com produtos, categoria e paginação
 */
export const getProductsByCategory = async (categoryId, options = {}) => {
  try {
    console.log("Obtendo produtos da categoria:", categoryId, "com opções:", options);
    const { page = 1, page_size = 10, include_inactive = false } = options;
    
    const response = await api.get(`/products/category/${categoryId}`, {
      params: {
        page,
        page_size,
        include_inactive
      }
    });
    return response.data;
  } catch (error) {
    console.log("Erro ao obter produtos da categoria:", error);
    throw error;
  }
};

/**
 * Busca produtos por termo.
 * @param {string} searchTerm - Termo de busca
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de produtos encontrados
 */
export const searchProducts = async (searchTerm, filters = {}) => {
  try {
    "Buscando produtos com termo:", searchTerm;
    // A API não tem endpoint de busca específico, usa getAllProducts com filtros
    const response = await api.get("/products", {
      params: { search: searchTerm, ...filters },
    });
    return response.data;
  } catch (error) {
    "Erro ao buscar produtos:", error;
    throw error;
  }
};

/**
 * Obtém ingredientes de um produto.
 * @param {number} productId - ID do produto
 * @returns {Promise<Array>} - Lista de ingredientes
 */
export const getProductIngredients = async (productId) => {
  try {
    "Obtendo ingredientes do produto:", productId;
    const response = await api.get(`/products/${productId}/ingredients`);
    return response.data;
  } catch (error) {
    "Erro ao obter ingredientes do produto:", error;
    throw error;
  }
};

/**
 * Adiciona ingrediente a um produto (apenas para admin/manager).
 * @param {number} productId - ID do produto
 * @param {number} ingredientId - ID do ingrediente
 * @param {number} quantity - Quantidade do ingrediente
 * @returns {Promise<object>} - Resposta da API
 */
export const addIngredientToProduct = async (
  productId,
  ingredientId,
  quantity
) => {
  try {
    "Adicionando ingrediente ao produto:", productId;
    const response = await api.post(`/products/${productId}/ingredients`, {
      ingredient_id: ingredientId,
      quantity: quantity,
    });
    return response.data;
  } catch (error) {
    "Erro ao adicionar ingrediente:", error;
    throw error;
  }
};

/**
 * Remove ingrediente de um produto (apenas para admin/manager).
 * @param {number} productId - ID do produto
 * @param {number} ingredientId - ID do ingrediente
 * @returns {Promise<object>} - Resposta da API
 */
export const removeIngredientFromProduct = async (productId, ingredientId) => {
  try {
    "Removendo ingrediente do produto:", productId;
    const response = await api.delete(
      `/products/${productId}/ingredients/${ingredientId}`
    );
    return response.data;
  } catch (error) {
    "Erro ao remover ingrediente:", error;
    throw error;
  }
};

/**
 * Obtém produtos mais pedidos.
 * @param {object} options - Opções de paginação
 * @returns {Promise<object>} - Lista de produtos mais pedidos
 */
export const getMostOrderedProducts = async (options = {}) => {
  try {
    console.log("Obtendo produtos mais pedidos com opções:", options);
    const { page = 1, page_size = 10 } = options;
    const response = await api.get("/products/most-ordered", {
      params: { page, page_size },
    });
    return response.data;
  } catch (error) {
    console.log("Erro ao obter produtos mais pedidos:", error);
    throw error;
  }
};

/**
 * Obtém produtos recentemente adicionados (novidades).
 * @param {object} options - Opções de paginação
 * @returns {Promise<object>} - Lista de produtos recentemente adicionados
 */
export const getRecentlyAddedProducts = async (options = {}) => {
  try {
    console.log("Obtendo produtos recentemente adicionados com opções:", options);
    const { page = 1, page_size = 10 } = options;
    const response = await api.get("/products/recently-added", {
      params: { page, page_size },
    });
    return response.data;
  } catch (error) {
    console.log("Erro ao obter produtos recentemente adicionados:", error);
    throw error;
  }
};

/**
 * Obtém todas as seções de produtos.
 * @returns {Promise<Array>} - Lista de seções
 */
export const getAllSections = async () => {
  try {
    ("Obtendo todas as seções");
    const response = await api.get("/sections");
    return response.data;
  } catch (error) {
    "Erro ao obter seções:", error;
    throw error;
  }
};

/**
 * Cria uma nova seção (apenas para admin/manager).
 * @param {object} sectionData - Dados da seção
 * @returns {Promise<object>} - Seção criada
 */
export const createSection = async (sectionData) => {
  try {
    "Criando seção:", sectionData;
    const response = await api.post("/sections", sectionData);
    return response.data;
  } catch (error) {
    "Erro ao criar seção:", error;
    throw error;
  }
};

/**
 * Atualiza uma seção (apenas para admin/manager).
 * @param {number} sectionId - ID da seção
 * @param {object} sectionData - Novos dados da seção
 * @returns {Promise<object>} - Seção atualizada
 */
export const updateSection = async (sectionId, sectionData) => {
  try {
    "Atualizando seção:", sectionId, sectionData;
    const response = await api.put(`/sections/${sectionId}`, sectionData);
    return response.data;
  } catch (error) {
    "Erro ao atualizar seção:", error;
    throw error;
  }
};

/**
 * Remove uma seção (apenas para admin/manager).
 * @param {number} sectionId - ID da seção
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteSection = async (sectionId) => {
  try {
    "Removendo seção:", sectionId;
    const response = await api.delete(`/sections/${sectionId}`);
    return response.data;
  } catch (error) {
    "Erro ao remover seção:", error;
    throw error;
  }
};
