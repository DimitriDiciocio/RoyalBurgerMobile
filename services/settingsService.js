import api from "./api";

/**
 * ========================================
 * SERVIÇO DE CONFIGURAÇÕES
 * ========================================
 * Gerencia configurações do sistema e usuário
 */

export const getSystemSettings = async () => {
  try {
    console.log("⚙️ Obtendo configurações do sistema");
    const response = await api.get("/settings/system");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter configurações do sistema:", error);
    throw error;
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    console.log("⚙️ Atualizando configurações do sistema:", settings);
    const response = await api.put("/settings/system", settings);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar configurações do sistema:", error);
    throw error;
  }
};

export const getUserSettings = async () => {
  try {
    console.log("👤 Obtendo configurações do usuário");
    const response = await api.get("/settings/user");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter configurações do usuário:", error);
    throw error;
  }
};

export const updateUserSettings = async (settings) => {
  try {
    console.log("👤 Atualizando configurações do usuário:", settings);
    const response = await api.put("/settings/user", settings);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar configurações do usuário:", error);
    throw error;
  }
};

export const getNotificationSettings = async () => {
  try {
    console.log("🔔 Obtendo configurações de notificação");
    const response = await api.get("/settings/notifications");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter configurações de notificação:", error);
    throw error;
  }
};

export const updateNotificationSettings = async (settings) => {
  try {
    console.log("🔔 Atualizando configurações de notificação:", settings);
    const response = await api.put("/settings/notifications", settings);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar configurações de notificação:", error);
    throw error;
  }
};

export const getAppSettings = async () => {
  try {
    console.log("📱 Obtendo configurações do app");
    const response = await api.get("/settings/app");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter configurações do app:", error);
    throw error;
  }
};

export const updateAppSettings = async (settings) => {
  try {
    console.log("📱 Atualizando configurações do app:", settings);
    const response = await api.put("/settings/app", settings);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar configurações do app:", error);
    throw error;
  }
};
