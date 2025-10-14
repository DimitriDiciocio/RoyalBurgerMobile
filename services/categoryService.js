import api from "./api";

/**
 * ========================================
 * SERVIÇO DE CATEGORIAS
 * ========================================
 * Gerencia todas as operações relacionadas a categorias:
 * - Listagem de categorias
 * - Detalhes de categorias
 * - Criação/edição de categorias (admin)
 * - Busca e filtros
 */

/**
 * Obtém todas as categorias.
 * @param {object} filters - Filtros opcionais (name, page, page_size)
 * @returns {Promise<object>} - Lista de categorias com paginação
 */
export const getAllCategories = async (filters = {}) => {
  try {
    console.log("Obtendo todas as categorias com filtros:", filters);
    const response = await api.get("/categories", { params: filters });
    return response.data;
  } catch (error) {
    console.log("Erro ao obter categorias:", error);
    throw error;
  }
};

/**
 * Obtém uma categoria específica por ID.
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<object>} - Dados da categoria
 */
export const getCategoryById = async (categoryId) => {
  try {
    console.log("Obtendo categoria por ID:", categoryId);
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.log("Erro ao obter categoria:", error);
    throw error;
  }
};

/**
 * Obtém categorias para uso em selects (apenas ID e nome).
 * @returns {Promise<Array>} - Lista de categorias simplificada
 */
export const getCategoriesForSelect = async () => {
  try {
    console.log("Obtendo categorias para select");
    const response = await api.get("/categories/select");
    return response.data;
  } catch (error) {
    console.log("Erro ao obter categorias para select:", error);
    throw error;
  }
};

/**
 * Cria uma nova categoria (apenas para admin/manager).
 * @param {object} categoryData - Dados da categoria
 * @returns {Promise<object>} - Categoria criada
 */
export const createCategory = async (categoryData) => {
  try {
    console.log("Criando categoria:", categoryData);
    const response = await api.post("/categories", categoryData);
    return response.data;
  } catch (error) {
    console.log("Erro ao criar categoria:", error);
    throw error;
  }
};

/**
 * Atualiza uma categoria existente (apenas para admin/manager).
 * @param {number} categoryId - ID da categoria
 * @param {object} categoryData - Novos dados da categoria
 * @returns {Promise<object>} - Categoria atualizada
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    console.log("Atualizando categoria:", categoryId, categoryData);
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    console.log("Erro ao atualizar categoria:", error);
    throw error;
  }
};

/**
 * Remove uma categoria (apenas para admin/manager).
 * @param {number} categoryId - ID da categoria
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteCategory = async (categoryId) => {
  try {
    console.log("Removendo categoria:", categoryId);
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.log("Erro ao remover categoria:", error);
    throw error;
  }
};

/**
 * Busca categorias por termo.
 * @param {string} searchTerm - Termo de busca
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Lista de categorias encontradas
 */
export const searchCategories = async (searchTerm, filters = {}) => {
  try {
    console.log("Buscando categorias com termo:", searchTerm);
    const response = await api.get("/categories", {
      params: { name: searchTerm, ...filters },
    });
    return response.data;
  } catch (error) {
    console.log("Erro ao buscar categorias:", error);
    throw error;
  }
};
