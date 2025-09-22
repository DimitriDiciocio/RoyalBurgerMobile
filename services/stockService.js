import api from "./api";

/**
 * ========================================
 * SERVIÇO DE ESTOQUE
 * ========================================
 * Gerencia operações de estoque e inventário
 */

export const getStockOverview = async (filters = {}) => {
  try {
    console.log("📦 Obtendo visão geral do estoque");
    const response = await api.get("/stock/overview", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter visão geral do estoque:", error);
    throw error;
  }
};

export const getLowStockItems = async (threshold = 10) => {
  try {
    console.log("⚠️ Obtendo itens com estoque baixo (limite:", threshold, ")");
    const response = await api.get("/stock/low-stock", {
      params: { threshold },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter itens com estoque baixo:", error);
    throw error;
  }
};

export const getOutOfStockItems = async () => {
  try {
    console.log("❌ Obtendo itens em falta");
    const response = await api.get("/stock/out-of-stock");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter itens em falta:", error);
    throw error;
  }
};

export const updateStock = async (itemId, quantity, operation = "set") => {
  try {
    console.log(
      "📦 Atualizando estoque do item:",
      itemId,
      "quantidade:",
      quantity,
      "operação:",
      operation
    );
    const response = await api.put(`/stock/${itemId}`, {
      quantity,
      operation,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao atualizar estoque:", error);
    throw error;
  }
};

export const addStock = async (itemId, quantity) => {
  try {
    console.log(
      "➕ Adicionando estoque ao item:",
      itemId,
      "quantidade:",
      quantity
    );
    return await updateStock(itemId, quantity, "add");
  } catch (error) {
    console.error("❌ Erro ao adicionar estoque:", error);
    throw error;
  }
};

export const removeStock = async (itemId, quantity) => {
  try {
    console.log(
      "➖ Removendo estoque do item:",
      itemId,
      "quantidade:",
      quantity
    );
    return await updateStock(itemId, quantity, "subtract");
  } catch (error) {
    console.error("❌ Erro ao remover estoque:", error);
    throw error;
  }
};

export const getStockHistory = async (itemId, filters = {}) => {
  try {
    console.log("📊 Obtendo histórico de estoque do item:", itemId);
    const response = await api.get(`/stock/${itemId}/history`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter histórico de estoque:", error);
    throw error;
  }
};

export const getStockAlerts = async () => {
  try {
    console.log("🚨 Obtendo alertas de estoque");
    const response = await api.get("/stock/alerts");
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter alertas de estoque:", error);
    throw error;
  }
};

export const getStockReport = async (filters = {}) => {
  try {
    console.log("📋 Gerando relatório de estoque");
    const response = await api.get("/stock/report", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao gerar relatório de estoque:", error);
    throw error;
  }
};
