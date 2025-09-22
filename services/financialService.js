import api from "./api";

/**
 * ========================================
 * SERVIÇO FINANCEIRO
 * ========================================
 * Gerencia operações financeiras: vendas, receitas, despesas, relatórios
 */

export const getFinancialOverview = async (filters = {}) => {
  try {
    ("💰 Obtendo visão geral financeira");
    const response = await api.get("/financial/overview", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRevenue = async (filters = {}) => {
  try {
    ("💵 Obtendo receitas");
    const response = await api.get("/financial/revenue", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getExpenses = async (filters = {}) => {
  try {
    ("💸 Obtendo despesas");
    const response = await api.get("/financial/expenses", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfitLoss = async (filters = {}) => {
  try {
    ("📊 Obtendo lucro/prejuízo");
    const response = await api.get("/financial/profit-loss", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFinancialReport = async (filters = {}) => {
  try {
    ("📋 Gerando relatório financeiro");
    const response = await api.get("/financial/report", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};
