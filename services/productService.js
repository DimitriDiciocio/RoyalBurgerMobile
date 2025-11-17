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
 * ALTERAÇÃO: Adicionar suporte a filter_unavailable para filtrar produtos sem estoque
 * @param {object} filters - Filtros opcionais (category, status, search, etc.)
 * @param {boolean} filters.filter_unavailable - Filtrar produtos indisponíveis (padrão: true para frontend)
 * @returns {Promise<Array>} - Lista de produtos
 */
export const getAllProducts = async (filters = {}) => {
  try {
    console.log("Obtendo todos os produtos com filtros:", filters);
    
    // ALTERAÇÃO: Adicionar filter_unavailable aos parâmetros
    const params = { ...filters };
    
    // Converter parâmetros booleanos para strings para garantir compatibilidade com Flask
    if (params.include_inactive !== undefined) {
      params.include_inactive = params.include_inactive ? 'true' : 'false';
    }
    
    // ALTERAÇÃO: Adicionar filter_unavailable (padrão: true para frontend)
    if (params.filter_unavailable !== undefined) {
      params.filter_unavailable = params.filter_unavailable ? 'true' : 'false';
    } else {
      // Padrão: true para frontend (filtrar produtos sem estoque)
      params.filter_unavailable = 'true';
    }
    
    console.log("Parâmetros enviados para API:", params);
    const response = await api.get("/products", { params });
    
    console.log("Resposta da API de produtos:", {
      status: response.status,
      hasData: !!response.data,
      hasItems: !!response.data?.items,
      itemsCount: response.data?.items?.length || 0,
      pagination: response.data?.pagination,
      fullResponse: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error("Erro ao obter produtos:", error);
    console.error("Detalhes do erro:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      params: error.config?.params
    });
    throw error;
  }
};

/**
 * Obtém um produto específico por ID.
 * @param {number} productId - ID do produto
 * @param {number} quantity - Quantidade do produto (opcional, padrão: 1) - usado para calcular max_available dos extras
 * @returns {Promise<object>} - Dados do produto
 */
export const getProductById = async (productId, quantity = 1) => {
  try {
    "Obtendo produto por ID:", productId, "com quantidade:", quantity;
    const response = await api.get(`/products/${productId}`, {
      params: { quantity }
    });
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
 * ALTERAÇÃO: Adicionar suporte a filter_unavailable
 * @param {number} categoryId - ID da categoria
 * @param {object} options - Opções de paginação e filtros
 * @param {boolean} options.filter_unavailable - Filtrar produtos indisponíveis (padrão: true)
 * @returns {Promise<object>} - Objeto com produtos, categoria e paginação
 */
export const getProductsByCategory = async (categoryId, options = {}) => {
  try {
    console.log("Obtendo produtos da categoria:", categoryId, "com opções:", options);
    const { page = 1, page_size = 10, include_inactive = false, filter_unavailable = true } = options;
    
    const params = {
      page,
      page_size,
      include_inactive: include_inactive ? 'true' : 'false',
      // ALTERAÇÃO: Adicionar filter_unavailable
      filter_unavailable: filter_unavailable ? 'true' : 'false'
    };
    
    const response = await api.get(`/products/category/${categoryId}`, { params });
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
 * @param {object} options - Opções de paginação e período
 * @param {number} options.page - Número da página (padrão: 1)
 * @param {number} options.page_size - Tamanho da página (padrão: 10)
 * @param {number} options.days - Período em dias para considerar como novidade (padrão: 30)
 * @returns {Promise<object>} - Lista de produtos recentemente adicionados
 */
export const getRecentlyAddedProducts = async (options = {}) => {
  try {
    console.log("Obtendo produtos recentemente adicionados com opções:", options);
    const { page = 1, page_size = 10, days = 30 } = options;
    // ALTERAÇÃO: Passa parâmetro days para API filtrar produtos criados no período
    const response = await api.get("/products/recently-added", {
      params: { page, page_size, days },
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

/**
 * Simula capacidade máxima de um produto com extras e modificações da receita base
 * ALTERAÇÃO: Nova função para validação de estoque dinâmica
 * @param {number} productId - ID do produto
 * @param {Array} extras - Lista de extras [{ingredient_id: number, quantity: number}]
 * @param {number} quantity - Quantidade desejada (opcional, padrão: 1)
 * @param {Array} baseModifications - Modificações da receita base [{ingredient_id: number, delta: number}]
 * @returns {Promise<Object>} Dados de capacidade
 * 
 * Resposta esperada:
 * {
 *   "product_id": number,
 *   "max_quantity": number,
 *   "capacity": number,
 *   "availability_status": "available" | "limited" | "unavailable" | "low_stock",
 *   "is_available": boolean,
 *   "limiting_ingredient": {
 *     "name": string,
 *     "available": number,
 *     "unit": string,
 *     "message": string
 *   } | null,
 *   "message": string
 * }
 */
export const simulateProductCapacity = async (
  productId, 
  extras = [], 
  quantity = 1, 
  baseModifications = []
) => {
  try {
    // ALTERAÇÃO: Validação de parâmetros
    if (!productId || isNaN(productId) || productId <= 0) {
      throw new Error('ID do produto é obrigatório e deve ser um número positivo');
    }
    
    if (productId > 2147483647) {
      throw new Error('ID do produto excede o limite máximo permitido');
    }
    
    // Validação de quantity
    if (quantity !== undefined && quantity !== null) {
      const qtyNum = parseInt(quantity, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        throw new Error('quantity deve ser um número positivo');
      }
      if (qtyNum > 999) {
        throw new Error('quantity excede o limite máximo permitido (999)');
      }
      quantity = qtyNum;
    } else {
      quantity = 1;
    }
    
    if (!Array.isArray(extras)) {
      throw new Error('extras deve ser uma lista');
    }
    
    // Validação de extras
    const validatedExtras = extras.map(extra => {
      if (!extra || typeof extra !== 'object') {
        throw new Error('Cada extra deve ser um objeto');
      }
      
      const ingId = parseInt(extra.ingredient_id, 10);
      const qty = parseInt(extra.quantity, 10) || 1;
      
      if (!ingId || isNaN(ingId) || ingId <= 0) {
        throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
      }
      if (ingId > 2147483647) {
        throw new Error('ingredient_id excede o limite máximo permitido');
      }
      
      if (isNaN(qty) || qty <= 0) {
        throw new Error('quantity deve ser um número positivo');
      }
      if (qty > 999) {
        throw new Error('quantity do extra excede o limite máximo permitido (999)');
      }
      
      return {
        ingredient_id: ingId,
        quantity: qty
      };
    });
    
    // Validação de base_modifications (opcional)
    let validatedBaseModifications = [];
    if (baseModifications && Array.isArray(baseModifications) && baseModifications.length > 0) {
      validatedBaseModifications = baseModifications.map(bm => {
        if (!bm || typeof bm !== 'object') {
          throw new Error('Cada base_modification deve ser um objeto');
        }
        
        const ingId = parseInt(bm.ingredient_id, 10);
        const delta = parseInt(bm.delta, 10);
        
        if (!ingId || isNaN(ingId) || ingId <= 0) {
          throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
        }
        if (ingId > 2147483647) {
          throw new Error('ingredient_id excede o limite máximo permitido');
        }
        
        if (isNaN(delta) || delta === 0) {
          throw new Error('delta deve ser um número diferente de zero');
        }
        if (Math.abs(delta) > 999) {
          throw new Error('delta excede o limite máximo permitido (999)');
        }
        
        return {
          ingredient_id: ingId,
          delta: delta
        };
      });
    }
    
    const requestBody = {
      product_id: productId,
      extras: validatedExtras,
      quantity: quantity
    };
    
    // Adiciona base_modifications apenas se houver
    if (validatedBaseModifications.length > 0) {
      requestBody.base_modifications = validatedBaseModifications;
    }
    
    const response = await api.post('/products/simular_capacidade', requestBody);
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao simular capacidade:', error);
    }
    throw error;
  }
};

/**
 * Obtém capacidade de um produto
 * ALTERAÇÃO: Nova função para obter capacidade sem simulação
 * @param {number} productId - ID do produto
 * @param {Array} extras - Lista de extras (opcional) [{ingredient_id: number, quantity: number}]
 * @returns {Promise<Object>} Dados de capacidade
 */
export const getProductCapacity = async (productId, extras = []) => {
  try {
    // Validação de parâmetros
    if (!productId || isNaN(productId) || productId <= 0) {
      throw new Error('ID do produto é obrigatório e deve ser um número positivo');
    }
    
    const params = {};
    
    // Se houver extras, adiciona como parâmetro JSON
    if (extras && Array.isArray(extras) && extras.length > 0) {
      // Validação de extras
      const validatedExtras = extras.map(extra => {
        if (!extra || typeof extra !== 'object') {
          throw new Error('Cada extra deve ser um objeto');
        }
        
        const ingId = parseInt(extra.ingredient_id, 10);
        const qty = parseInt(extra.quantity, 10) || 1;
        
        if (!ingId || isNaN(ingId) || ingId <= 0) {
          throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
        }
        
        if (isNaN(qty) || qty <= 0) {
          throw new Error('quantity deve ser um número positivo');
        }
        
        return {
          ingredient_id: ingId,
          quantity: qty
        };
      });
      
      params.extras = JSON.stringify(validatedExtras);
    }
    
    const response = await api.get(`/products/${productId}/capacity`, { params });
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao obter capacidade:', error);
    }
    throw error;
  }
};

/**
 * Valida se um produto tem estoque disponível e retorna dados de capacidade
 * ALTERAÇÃO: Verifica capacidade/estoque antes de exibir e retorna dados completos
 * @param {Object} product - Dados do produto
 * @returns {Promise<Object|null>} { isValid: boolean, capacityData: Object } ou null em caso de erro
 */
export const validateProductStockWithCapacity = async (product) => {
  if (!product || !product.id) {
    return { isValid: false, capacityData: null };
  }

  try {
    // Verificar capacidade do produto (quantidade 1, sem extras, sem modificações)
    const capacityData = await simulateProductCapacity(product.id, [], 1, []);
    
    // Produto está disponível se is_available é true e max_quantity >= 1
    const isValid = capacityData?.is_available === true && (capacityData?.max_quantity ?? 0) >= 1;
    
    return { isValid, capacityData };
  } catch (error) {
    // ALTERAÇÃO: Em caso de erro, considerar produto indisponível para segurança
    const isDev = __DEV__;
    if (isDev) {
      console.error(`Erro ao validar estoque do produto ${product.id}:`, error);
    }
    return { isValid: false, capacityData: null };
  }
};

/**
 * Filtra produtos que têm estoque disponível e adiciona availability_status
 * ALTERAÇÃO: Valida estoque de múltiplos produtos em paralelo e adiciona status de disponibilidade
 * @param {Array} products - Lista de produtos para validar
 * @returns {Promise<Array>} Lista de produtos com estoque disponível e availability_status
 */
export const filterProductsWithStock = async (products) => {
  if (!products || products.length === 0) {
    return [];
  }

  // Validar estoque de todos os produtos em paralelo
  const stockValidations = await Promise.allSettled(
    products.map(product => validateProductStockWithCapacity(product))
  );

  // Filtrar apenas produtos com estoque disponível e adicionar availability_status
  const availableProducts = [];
  for (let i = 0; i < products.length; i++) {
    const validation = stockValidations[i];
    if (validation.status === 'fulfilled' && validation.value.isValid) {
      const product = { ...products[i] };
      const capacityData = validation.value.capacityData;
      
      // ALTERAÇÃO: Adicionar availability_status e max_quantity do capacityData ao produto
      if (capacityData) {
        if (capacityData.availability_status) {
          product.availability_status = capacityData.availability_status;
        }
        // Adicionar max_quantity para cálculo de badge se availability_status não estiver presente
        if (capacityData.max_quantity !== undefined && capacityData.max_quantity !== null) {
          product.max_quantity = capacityData.max_quantity;
        }
      }
      availableProducts.push(product);
    }
  }

  return availableProducts;
};
