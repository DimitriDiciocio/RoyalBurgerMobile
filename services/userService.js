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
 * @returns {Promise<object>} - Dados do usuário e token de acesso
 */
export const login = async (userData) => {
  try {
    // Faz a requisição já com userData (que deve ter { email, password })
    const response = await api.post("/users/login", userData);

    if (response.data.access_token) {
      await AsyncStorage.setItem("user_token", response.data.access_token);

      // Verificar se existem dados do usuário na resposta
      if (response.data.user) {
        await AsyncStorage.setItem(
          "user_data",
          JSON.stringify(response.data.user)
        );
      } else {
        // Se não houver dados do usuário, criar um objeto básico
        const basicUserData = {
          email: userData.email,
          full_name: response.data.full_name || "Usuário",
          role: "customer",
        };
        await AsyncStorage.setItem("user_data", JSON.stringify(basicUserData));
      }
    }

    return response.data;
  } catch (error) {
    throw error;
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
  }
};

/**
 * Verifica se o usuário está autenticado.
 * @returns {Promise<boolean>} - True se o usuário estiver autenticado
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem("user_token");
    return !!token;
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
 * Solicita redefinição de senha.
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Resposta da API
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/users/forgot-password", { email });
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
