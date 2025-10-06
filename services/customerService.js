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
 * Registra um novo cliente (criação temporária para verificação de email).
 * @param {object} userData - Objeto com dados do cliente
 * @returns {Promise<object>} - Dados do cliente criado
 */
export const registerCustomer = async (userData) => {
  try {
    // Mapear os dados do formulário para o formato esperado pela API
    // Converte data de DD/MM/AAAA (UI) para DD-MM-AAAA (API)
    const normalizedDob = (userData.dataNascimento || "").replaceAll("/", "-");

    const apiData = {
      full_name: userData.nomeCompleto,
      email: userData.email,
      date_of_birth: normalizedDob,
      phone: userData.telefone,
      password: userData.senha,
      password_confirmation: userData.confirmarSenha,
      // Indica que o usuário ainda não foi verificado
      is_email_verified: false,
    };

    const response = await api.post("/customers", apiData);

    // Retornar dados estruturados
    return {
      success: true,
      data: response.data,
      message: "Cadastro realizado com sucesso. Verifique seu email para ativar a conta.",
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
    const response = await api.post(`/users/verify-password`, { password });
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
    const response = await api.post(`/customers/${customerId}/reactivate`);
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
    const response = await api.get(`/orders/customer/${customerId}`, {
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

/**
 * Obtém saldo do programa de fidelidade.
 * @param {number} customerId - ID do cliente
 * @returns {Promise<object>} - Saldo de pontos
 */
export const getLoyaltyBalance = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}/loyalty/balance`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém histórico do programa de fidelidade.
 * @param {number} customerId - ID do cliente
 * @returns {Promise<Array>} - Histórico de pontos
 */
export const getLoyaltyHistory = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}/loyalty/history`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * ========================================
 * SERVIÇO DE VERIFICAÇÃO DE EMAIL
 * ========================================
 */

/**
 * Solicita verificação de email para um usuário.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const requestEmailVerification = async (email) => {
  try {
    const response = await api.post("/users/request-email-verification", {
      email,
    });
    return {
      success: true,
      data: response.data,
      message: response.data?.msg || "Código de verificação enviado por e-mail",
    };
  } catch (error) {
    const structuredError = {
      success: false,
      message:
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao solicitar verificação de email",
      status: error.response?.status,
      data: error.response?.data,
    };

    throw structuredError;
  }
};

/**
 * Verifica código de email.
 * @param {string} email - Email do usuário
 * @param {string} code - Código de verificação
 * @returns {Promise<object>} - Resposta da API
 */
export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post("/users/verify-email", { 
      email, 
      code 
    });
    return {
      success: true,
      data: response.data,
      message: response.data?.msg || "Email verificado com sucesso",
    };
  } catch (error) {
    const structuredError = {
      success: false,
      message:
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao verificar código",
      status: error.response?.status,
      data: error.response?.data,
    };

    throw structuredError;
  }
};

/**
 * Reenvia código de verificação de email.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const resendVerificationCode = async (email) => {
  try {
    const response = await api.post("/users/request-email-verification", {
      email,
    });
    return {
      success: true,
      data: response.data,
      message: response.data?.msg || "Novo código de verificação enviado",
    };
  } catch (error) {
    const structuredError = {
      success: false,
      message:
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao reenviar código",
      status: error.response?.status,
      data: error.response?.data,
    };

    throw structuredError;
  }
};