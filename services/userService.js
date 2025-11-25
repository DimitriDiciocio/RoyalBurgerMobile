import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ========================================
 * SERVIÇO DE USUÁRIOS E AUTENTICAÇÃO
 * ========================================
 * Gerencia todas as operações relacionadas a usuários:
 * - Login/Logout
 * - Registro de clientes
 * - Redefinição de senha
 * - Gerenciamento de perfil
 */

/**
 * Autentica o usuário e salva o token.
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<{ok: boolean, data?: object, error?: string, status?: number}>}
 */
export const login = async (userData) => {
  try {
    // Faz a requisição já com userData (que deve ter { email, password })
    const response = await api.post("/users/login", userData);

    const { access_token, user, full_name, roles, requires_2fa, user_id } = response.data || {};

    // ALTERAÇÃO: Se 2FA está habilitado, retorna informação especial
    if (requires_2fa) {
      return {
        ok: false,
        requires_2fa: true,
        user_id: user_id,
        error: response.data?.message || "Código de verificação 2FA enviado para seu email",
      };
    }

    if (!access_token) {
      return { ok: false, error: "Token de acesso não recebido." };
    }

    await AsyncStorage.setItem("user_token", access_token);

    // Se a API devolveu o objeto do usuário, salva direto; senão, monta um básico
    const toStoreUser = user || {
      email: userData?.email,
      full_name: full_name || "Usuário",
      role: Array.isArray(roles) && roles.length > 0 ? roles[0] : "customer",
    };

    await AsyncStorage.setItem("user_data", JSON.stringify(toStoreUser));

    return {
      ok: true,
      data: {
        token: access_token,
        user: toStoreUser,
      },
    };
  } catch (error) {
    const status = error?.response?.status;
    const apiMsg =
      error?.response?.data?.msg ||
      error?.response?.data?.error ||
      error?.response?.data?.message;
    const message =
      apiMsg || error?.message || "Não foi possível efetuar o login.";

    return { ok: false, error: message, status };
  }
};

/**
 * Faz logout, invalidando o token no backend e removendo-o localmente.
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Tenta invalidar o token no backend
    await api.post("/users/logout");
  } catch (error) {
    // Mesmo se der erro no backend, remove o token localmente
  } finally {
    // Remove os dados do usuário do armazenamento local
    await AsyncStorage.removeItem("user_token");
    await AsyncStorage.removeItem("user_data");
    
    // ALTERAÇÃO: Limpa o cache de pontos após logout
    try {
      const { clearLoyaltyPointsCache } = require('./customerService');
      if (typeof clearLoyaltyPointsCache === 'function') {
        await clearLoyaltyPointsCache();
      }
    } catch (error) {
      // Ignora erro se o módulo não estiver disponível
    }
    
    // ALTERAÇÃO: Limpa o cache do Header após logout
    try {
      const { clearHeaderUserCache } = require('../components/Header');
      if (typeof clearHeaderUserCache === 'function') {
        clearHeaderUserCache();
      }
    } catch (error) {
      // Ignora erro se o módulo não estiver disponível
    }
  }
};

/**
 * Verifica se o usuário está autenticado.
 * @returns {Promise<boolean>} - True se o usuário estiver autenticado
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem("user_token");
    if (!token) return false;

    try {
      // Verifica token com a API (rota protegida)
      await api.get("/users/profile");
      return true;
    } catch (err) {
      // Se inválido/expirado, limpa storage e retorna false
      const status = err?.response?.status;
      if (status === 401) {
        await AsyncStorage.removeItem("user_token");
        await AsyncStorage.removeItem("user_data");
      }
      return false;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Obtém os dados do usuário armazenados localmente.
 * @returns {Promise<object|null>} - Dados do usuário ou null se não encontrado
 */
export const getStoredUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Obtém o token de acesso armazenado.
 * @returns {Promise<string|null>} - Token de acesso ou null se não encontrado
 */
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem("user_token");
  } catch (error) {
    return null;
  }
};

/**
 * Obtém dados atualizados do usuário da API.
 * @returns {Promise<object|null>} - Dados atualizados do usuário
 */
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get("/users/profile");
    const userData = response.data;

    // Atualiza os dados locais com os dados mais recentes da API
    await AsyncStorage.setItem("user_data", JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error);
    throw error;
  }
};

/**
 * Testa se o token atual é válido fazendo uma requisição simples.
 * @returns {Promise<boolean>} - True se o token é válido
 */
export const testTokenValidity = async () => {
  try {
    const token = await AsyncStorage.getItem("user_token");

    if (!token) {
      return false;
    }

    const response = await api.get("/users/profile");
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Solicita redefinição de senha.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/users/request-password-reset", { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Redefine a senha do usuário.
 * @param {string} token - Token de redefinição
 * @param {string} newPassword - Nova senha
 * @returns {Promise<object>} - Resposta da API
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post("/users/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza o perfil do usuário.
 * @param {object} userData - Dados do usuário para atualizar
 * @returns {Promise<object>} - Dados atualizados do usuário
 */
export const updateProfile = async (userData) => {
  try {
    // Para clientes, usa a rota de customers
    const user = await getStoredUserData();
    if (user && user.role === "customer") {
      const response = await api.put(`/customers/${user.id}`, userData);
      return response.data;
    }

    // Para outros usuários, usa a rota de users
    const response = await api.put("/users/profile", userData);

    // Atualiza os dados locais se a atualização foi bem-sucedida
    if (response.data) {
      await AsyncStorage.setItem("user_data", JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Altera a senha do usuário.
 * @param {string} currentPassword - Senha atual
 * @param {string} newPassword - Nova senha
 * @returns {Promise<object>} - Resposta da API
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put("/users/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém o perfil completo do usuário.
 * @returns {Promise<object>} - Dados completos do usuário
 */
export const getProfile = async () => {
  try {
    const response = await api.get("/users/profile");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Deleta a conta do usuário.
 * @param {string} password - Senha para confirmação
 * @returns {Promise<object>} - Resposta da API
 */
export const deleteAccount = async (password) => {
  try {
    // Para clientes, usa a rota específica de customers
    const user = await getStoredUserData();
    if (user && user.role === "customer") {
      const response = await api.delete("/customers/delete-account");

      // Remove dados locais após deletar a conta
      await AsyncStorage.removeItem("user_token");
      await AsyncStorage.removeItem("user_data");

      return response.data;
    }

    // Para outros usuários, usa a rota de users
    const response = await api.delete("/users/account", {
      data: { password },
    });

    // Remove dados locais após deletar a conta
    await AsyncStorage.removeItem("user_token");
    await AsyncStorage.removeItem("user_data");

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Solicita verificação de email.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const requestEmailVerification = async (email) => {
  try {
    const response = await api.post("/users/request-email-verification", {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica código de email.
 * @param {string} email - Email do usuário
 * @param {string} code - Código de verificação
 * @returns {Promise<object>} - Resposta da API
 */
export const verifyEmail = async (email, code) => {
  try {
    const response = await api.post("/users/verify-email", { email, code });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reenvia código de verificação de email.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const resendVerificationCode = async (email) => {
  try {
    const response = await api.post("/users/resend-verification-code", {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica senha do usuário.
 * @param {string} password - Senha atual
 * @returns {Promise<object>} - Resposta da API
 */
export const verifyPassword = async (password) => {
  try {
    const response = await api.post("/users/verify-password", { password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica código 2FA e faz login.
 * @param {number} userId - ID do usuário
 * @param {string} code - Código 2FA
 * @returns {Promise<object>} - Resposta da API
 */
export const verify2FA = async (userId, code) => {
  try {
    const response = await api.post("/users/verify-2fa", {
      user_id: userId,
      code,
    });

    const { access_token, user } = response.data || {};

    if (access_token) {
      await AsyncStorage.setItem("user_token", access_token);

      if (user) {
        await AsyncStorage.setItem("user_data", JSON.stringify(user));
      }
    }

    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Estruturar erro de forma consistente
    const structuredError = {
      message: error.response?.data?.error || error.message || "Erro ao verificar código 2FA",
      status: error.response?.status,
      data: error.response?.data,
    };
    throw structuredError;
  }
};

/**
 * Ativa/desativa 2FA.
 * @param {boolean} enable - Se deve ativar ou desativar
 * @returns {Promise<object>} - Resposta da API
 */
export const toggle2FA = async (enable) => {
  try {
    const response = await api.post("/users/toggle-2fa", { enable });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Confirma ativação do 2FA.
 * @param {string} code - Código de confirmação
 * @returns {Promise<object>} - Resposta da API
 */
export const enable2FAConfirm = async (code) => {
  try {
    const response = await api.post("/users/enable-2fa-confirm", { code });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém status do 2FA.
 * @returns {Promise<object>} - Status do 2FA
 */
export const get2FAStatus = async () => {
  try {
    const response = await api.get("/users/2fa-status");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza a senha do usuário.
 * @param {object} passwordData - Dados da senha
 * @param {string} passwordData.current_password - Senha atual
 * @param {string} passwordData.new_password - Nova senha
 * @returns {Promise<object>} - Resposta da API
 */
export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put("/users/change-password", passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reenvia código 2FA para o usuário.
 * @param {number} userId - ID do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const resend2FACode = async (userId) => {
  try {
    const response = await api.post("/users/resend-2fa-code", {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém as preferências de notificação do usuário.
 * @param {number} userId - ID do usuário
 * @returns {Promise<object>} - Preferências de notificação { notify_order_updates, notify_promotions }
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const response = await api.get(`/customers/${userId}/notification-preferences`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza as preferências de notificação do usuário.
 * @param {number} userId - ID do usuário
 * @param {object} preferences - Preferências { notify_order_updates?: boolean, notify_promotions?: boolean }
 * @returns {Promise<object>} - Resposta da API
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await api.put(`/customers/${userId}/notification-preferences`, preferences);
    return response.data;
  } catch (error) {
    throw error;
  }
};