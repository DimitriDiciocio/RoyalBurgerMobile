import api from "./api";

/**
 * ========================================
 * SERVIÇO DE CONFIGURAÇÕES
 * ========================================
 * Gerencia configurações do sistema e usuário
 */

export const getPublicSettings = async () => {
  try {
    console.log("Obtendo configurações públicas");
    const response = await api.get("/settings/public");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    ("Obtendo configurações do sistema");
    const response = await api.get("/settings/system");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    "Atualizando configurações do sistema:", settings;
    const response = await api.put("/settings/system", settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserSettings = async () => {
  try {
    ("Obtendo configurações do usuário");
    const response = await api.get("/settings/user");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserSettings = async (settings) => {
  try {
    "Atualizando configurações do usuário:", settings;
    const response = await api.put("/settings/user", settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNotificationSettings = async () => {
  try {
    ("Obtendo configurações de notificação");
    const response = await api.get("/settings/notifications");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNotificationSettings = async (settings) => {
  try {
    "Atualizando configurações de notificação:", settings;
    const response = await api.put("/settings/notifications", settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAppSettings = async () => {
  try {
    ("Obtendo configurações do app");
    const response = await api.get("/settings/app");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAppSettings = async (settings) => {
  try {
    "Atualizando configurações do app:", settings;
    const response = await api.put("/settings/app", settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};
