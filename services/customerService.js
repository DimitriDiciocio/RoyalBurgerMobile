import api from "./api";

/**
 * ========================================
 * SERVIÇO DE CLIENTES
 * ========================================
 * Gerencia todas as operações relacionadas a clientes:
 * - Cadastro de novos clientes
 * - Listagem de clientes
 * - Atualização de dados do cliente
 * - Gerenciamento de endereços
 */

/**
 * Registra um novo cliente.
 * @param {object} userData - Objeto com dados do cliente
 * @returns {Promise<object>} - Dados do cliente criado
 */
export const registerCustomer = async (userData) => {
  try {
    // Mapear os dados do formulário para o formato esperado pela API
    // Converte data de DD/MM/AAAA (UI) para DD-MM-AAAA (API)
    const normalizedDob = (userData.dataNascimento || '').replaceAll('/', '-');

    const apiData = {
      full_name: userData.nomeCompleto,
      email: userData.email,
      date_of_birth: normalizedDob,
      phone: userData.telefone,
      password: userData.senha,
      password_confirmation: userData.confirmarSenha,
    };

    const response = await api.post("/customers", apiData);

    // Retornar dados estruturados
    return {
      success: true,
      data: response.data,
      message: "Cadastro realizado com sucesso",
    };
  } catch (error) {
    // Estruturar erro de forma consistente
    const structuredError = {
      success: false,
      message:
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao realizar cadastro",
      status: error.response?.status,
      data: error.response?.data,
    };

    throw structuredError;
  }
};

/**
 * Obtém todos os clientes (apenas para admin/manager).
 * @param {object} filters - Filtros opcionais (status, search, etc.)
 * @returns {Promise<Array>} - Lista de clientes
 */
export const getAllCustomers = async (filters = {}) => {
  try {
    const response = await api.get("/customers", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém um cliente específico por ID.
 * @param {number} customerId - ID do cliente
 * @returns {Promise<object>} - Dados do cliente
 */
export const getCustomerById = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza dados de um cliente.
 * @param {number} customerId - ID do cliente
 * @param {object} customerData - Novos dados do cliente
 * @returns {Promise<object>} - Dados atualizados do cliente
 */
export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Desativa um cliente (soft delete).
 * @param {number} customerId - ID do cliente
 * @returns {Promise<object>} - Resposta da API
 */
export const deactivateCustomer = async (customerId) => {
  try {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica a senha do cliente autenticado antes de operações sensíveis.
 * @param {string} password - Senha atual do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const verifyMyPassword = async (password) => {
  try {
    const response = await api.post(`/customers/me/verify-password`, { password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reativa um cliente.
 * @param {number} customerId - ID do cliente
 * @returns {Promise<object>} - Resposta da API
 */
export const activateCustomer = async (customerId) => {
  try {
    const response = await api.put(`/customers/${customerId}/activate`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de clientes (apenas para admin/manager).
 * @returns {Promise<object>} - Estatísticas dos clientes
 */
export const getCustomerStats = async () => {
  try {
    const response = await api.get("/customers/stats");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém histórico de pedidos de um cliente.
 * @param {number} customerId - ID do cliente
 * @param {object} filters - Filtros opcionais (date_from, date_to, status)
 * @returns {Promise<Array>} - Histórico de pedidos
 */
export const getCustomerOrderHistory = async (customerId, filters = {}) => {
  try {
    const response = await api.get(`/customers/${customerId}/orders`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém endereços de um cliente.
 * @param {number} customerId - ID do cliente
 * @returns {Promise<Array>} - Lista de endereços
 */
export const getCustomerAddresses = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}/addresses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Adiciona um novo endereço para um cliente.
 * @param {number} customerId - ID do cliente
 * @param {object} addressData - Dados do endereço
 * @returns {Promise<object>} - Endereço criado
 */
export const addCustomerAddress = async (customerId, addressData) => {
  try {
    const response = await api.post(
      `/customers/${customerId}/addresses`,
      addressData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza um endereço de um cliente.
 * @param {number} customerId - ID do cliente
 * @param {number} addressId - ID do endereço
 * @param {object} addressData - Novos dados do endereço
 * @returns {Promise<object>} - Endereço atualizado
 */
export const updateCustomerAddress = async (
  customerId,
  addressId,
  addressData
) => {
  try {
    const response = await api.put(
      `/customers/${customerId}/addresses/${addressId}`,
      addressData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove um endereço de um cliente.
 * @param {number} customerId - ID do cliente
 * @param {number} addressId - ID do endereço
 * @returns {Promise<object>} - Resposta da API
 */
export const removeCustomerAddress = async (customerId, addressId) => {
  try {
    const response = await api.delete(
      `/customers/${customerId}/addresses/${addressId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
