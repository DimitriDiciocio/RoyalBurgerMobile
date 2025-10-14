import api from "./api";

/**
 * ========================================
 * SERVIÇO DE ESTOQUE
 * ========================================
 * Gerencia operações de estoque e inventário
 */

export const getStockOverview = async (filters = {}) => {
  try {
    ("Obtendo visão geral do estoque");
    const response = await api.get("/stock/overview", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLowStockItems = async (threshold = 10) => {
  try {
    "Obtendo itens com estoque baixo (limite:", threshold, ")";
    const response = await api.get("/stock/low-stock", {
      params: { threshold },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOutOfStockItems = async () => {
  try {
    ("Obtendo itens em falta");
    const response = await api.get("/stock/out-of-stock");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateStock = async (itemId, quantity, operation = "set") => {
  try {
    "Atualizando estoque do item:",
      itemId,
      "quantidade:",
      quantity,
      "operação:",
      operation;
    const response = await api.put(`/stock/${itemId}`, {
      quantity,
      operation,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addStock = async (itemId, quantity) => {
  try {
    "Adicionando estoque ao item:", itemId, "quantidade:", quantity;
    return await updateStock(itemId, quantity, "add");
  } catch (error) {
    throw error;
  }
};

export const removeStock = async (itemId, quantity) => {
  try {
    "Removendo estoque do item:", itemId, "quantidade:", quantity;
    return await updateStock(itemId, quantity, "subtract");
  } catch (error) {
    throw error;
  }
};

export const getStockHistory = async (itemId, filters = {}) => {
  try {
    "Obtendo histórico de estoque do item:", itemId;
    const response = await api.get(`/stock/${itemId}/history`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStockAlerts = async () => {
  try {
    ("Obtendo alertas de estoque");
    const response = await api.get("/stock/alerts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStockReport = async (filters = {}) => {
  try {
    ("Gerando relatório de estoque");
    const response = await api.get("/stock/report", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};
