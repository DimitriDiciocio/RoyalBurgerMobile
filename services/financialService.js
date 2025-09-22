import api from "./api";

/**
 * ========================================
 * SERVIÇO FINANCEIRO
 * ========================================
 * Gerencia operações financeiras: vendas, receitas, despesas, relatórios
 */

export const getFinancialOverview = async (filters = {}) => {
  try {
    console.log("💰 Obtendo visão geral financeira");
    const response = await api.get("/financial/overview", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter visão geral financeira:", error);
    throw error;
  }
};

export const getRevenue = async (filters = {}) => {
  try {
    console.log("💵 Obtendo receitas");
    const response = await api.get("/financial/revenue", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter receitas:", error);
    throw error;
  }
};

export const getExpenses = async (filters = {}) => {
  try {
    console.log("💸 Obtendo despesas");
    const response = await api.get("/financial/expenses", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter despesas:", error);
    throw error;
  }
};

export const getProfitLoss = async (filters = {}) => {
  try {
    console.log("📊 Obtendo lucro/prejuízo");
    const response = await api.get("/financial/profit-loss", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao obter lucro/prejuízo:", error);
    throw error;
  }
};

export const getFinancialReport = async (filters = {}) => {
  try {
    console.log("📋 Gerando relatório financeiro");
    const response = await api.get("/financial/report", { params: filters });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao gerar relatório financeiro:", error);
    throw error;
  }
};
