import api from "./api";

/**
 * ========================================
 * SERVIÇO DE RELATÓRIOS
 * ========================================
 * Gerencia geração e visualização de relatórios
 */

export const getSalesReport = async (filters = {}) => {
  try {
    ("Gerando relatório de vendas");
    const response = await api.get("/reports/sales", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderReport = async (filters = {}) => {
  try {
    ("Gerando relatório de pedidos");
    const response = await api.get("/reports/orders", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCustomerReport = async (filters = {}) => {
  try {
    ("Gerando relatório de clientes");
    const response = await api.get("/reports/customers", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductReport = async (filters = {}) => {
  try {
    ("Gerando relatório de produtos");
    const response = await api.get("/reports/products", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getInventoryReport = async (filters = {}) => {
  try {
    ("Gerando relatório de estoque");
    const response = await api.get("/reports/inventory", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFinancialReport = async (filters = {}) => {
  try {
    ("Gerando relatório financeiro");
    const response = await api.get("/reports/financial", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportReport = async (reportType, format, filters = {}) => {
  try {
    "Exportando relatório:", reportType, "formato:", format;
    const response = await api.get(`/reports/export/${reportType}`, {
      params: { format, ...filters },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
