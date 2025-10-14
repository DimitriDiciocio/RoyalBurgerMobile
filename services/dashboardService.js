import api from "./api";

/**
 * ========================================
 * SERVIÇO DE DASHBOARD
 * ========================================
 * Gerencia todas as operações relacionadas ao dashboard:
 * - Estatísticas gerais
 * - Métricas de vendas
 * - Dados de performance
 * - Gráficos e relatórios
 */

/**
 * Obtém dados gerais do dashboard.
 * @param {object} filters - Filtros opcionais (date_from, date_to, period)
 * @returns {Promise<object>} - Dados do dashboard
 */
export const getDashboardData = async (filters = {}) => {
  try {
    "Obtendo dados do dashboard com filtros:", filters;
    const response = await api.get("/dashboard", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de vendas.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas de vendas
 */
export const getSalesStats = async (filters = {}) => {
  try {
    ("Obtendo estatísticas de vendas");
    const response = await api.get("/dashboard/sales", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de pedidos.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas de pedidos
 */
export const getOrderStats = async (filters = {}) => {
  try {
    ("Obtendo estatísticas de pedidos");
    const response = await api.get("/dashboard/orders", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de clientes.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas de clientes
 */
export const getCustomerStats = async (filters = {}) => {
  try {
    ("Obtendo estatísticas de clientes");
    const response = await api.get("/dashboard/customers", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém estatísticas de produtos.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Estatísticas de produtos
 */
export const getProductStats = async (filters = {}) => {
  try {
    ("Obtendo estatísticas de produtos");
    const response = await api.get("/dashboard/products", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de vendas por período.
 * @param {string} period - Período (day, week, month, year)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Dados de vendas por período
 */
export const getSalesByPeriod = async (period, filters = {}) => {
  try {
    "Obtendo vendas por período:", period;
    const response = await api.get(`/dashboard/sales/${period}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de pedidos por período.
 * @param {string} period - Período (day, week, month, year)
 * @param {object} filters - Filtros adicionais
 * @returns {Promise<Array>} - Dados de pedidos por período
 */
export const getOrdersByPeriod = async (period, filters = {}) => {
  try {
    "Obtendo pedidos por período:", period;
    const response = await api.get(`/dashboard/orders/${period}`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém produtos mais vendidos.
 * @param {object} filters - Filtros opcionais (limit, period)
 * @returns {Promise<Array>} - Lista de produtos mais vendidos
 */
export const getTopSellingProducts = async (filters = {}) => {
  try {
    ("Obtendo produtos mais vendidos");
    const response = await api.get("/dashboard/top-products", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém clientes mais ativos.
 * @param {object} filters - Filtros opcionais (limit, period)
 * @returns {Promise<Array>} - Lista de clientes mais ativos
 */
export const getTopCustomers = async (filters = {}) => {
  try {
    ("Obtendo clientes mais ativos");
    const response = await api.get("/dashboard/top-customers", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de performance por hora.
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} - Dados de performance por hora
 */
export const getHourlyPerformance = async (date) => {
  try {
    "Obtendo performance por hora para:", date;
    const response = await api.get("/dashboard/hourly", {
      params: { date },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de performance por dia da semana.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Dados de performance por dia da semana
 */
export const getWeeklyPerformance = async (filters = {}) => {
  try {
    ("Obtendo performance por dia da semana");
    const response = await api.get("/dashboard/weekly", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de performance por mês.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Dados de performance por mês
 */
export const getMonthlyPerformance = async (filters = {}) => {
  try {
    ("Obtendo performance por mês");
    const response = await api.get("/dashboard/monthly", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de performance por ano.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Dados de performance por ano
 */
export const getYearlyPerformance = async (filters = {}) => {
  try {
    ("Obtendo performance por ano");
    const response = await api.get("/dashboard/yearly", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém métricas de conversão.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Métricas de conversão
 */
export const getConversionMetrics = async (filters = {}) => {
  try {
    ("Obtendo métricas de conversão");
    const response = await api.get("/dashboard/conversion", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém métricas de retenção de clientes.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Métricas de retenção
 */
export const getRetentionMetrics = async (filters = {}) => {
  try {
    ("Obtendo métricas de retenção de clientes");
    const response = await api.get("/dashboard/retention", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de satisfação do cliente.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de satisfação
 */
export const getCustomerSatisfaction = async (filters = {}) => {
  try {
    ("Obtendo dados de satisfação do cliente");
    const response = await api.get("/dashboard/satisfaction", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de tempo de entrega.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de tempo de entrega
 */
export const getDeliveryTimeMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de tempo de entrega");
    const response = await api.get("/dashboard/delivery-time", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de cancelamentos.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de cancelamentos
 */
export const getCancellationMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de cancelamentos");
    const response = await api.get("/dashboard/cancellations", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de estoque.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de estoque
 */
export const getInventoryMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de estoque");
    const response = await api.get("/dashboard/inventory", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de funcionários.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de funcionários
 */
export const getEmployeeMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de funcionários");
    const response = await api.get("/dashboard/employees", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de promoções.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de promoções
 */
export const getPromotionMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de promoções");
    const response = await api.get("/dashboard/promotions", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de pagamento.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de pagamento
 */
export const getPaymentMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de pagamento");
    const response = await api.get("/dashboard/payments", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de feedback.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de feedback
 */
export const getFeedbackMetrics = async (filters = {}) => {
  try {
    ("Obtendo dados de feedback");
    const response = await api.get("/dashboard/feedback", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém dados de comparação com período anterior.
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<object>} - Dados de comparação
 */
export const getComparisonData = async (filters = {}) => {
  try {
    ("Obtendo dados de comparação com período anterior");
    const response = await api.get("/dashboard/comparison", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
