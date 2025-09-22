/**
 * ========================================
 * EXPORTAÇÕES CENTRALIZADAS DOS SERVIÇOS
 * ========================================
 * Este arquivo centraliza todas as exportações dos serviços
 * para facilitar a importação nos componentes
 */

// Serviço de API base
export { default as api } from "./api";

// Serviço de ingredientes (não possui bloco por categoria)
export * from "./ingredientService";

/**
 * ========================================
 * EXPORTAÇÕES POR CATEGORIA
 * ========================================
 * Para facilitar a importação por categoria
 */

// Autenticação e usuários
export {
  login,
  logout,
  isAuthenticated,
  getStoredUserData,
  getStoredToken,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  changePassword,
  getProfile,
  deleteAccount,
} from "./userService";

// Clientes
export {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
  activateCustomer,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  removeCustomerAddress,
} from "./customerService";

// Produtos
export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductsBySection,
  searchProducts,
  getProductIngredients,
  updateProductIngredients,
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
} from "./productService";

// Pedidos
export {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getCustomerOrderHistory,
  getOrdersByStatus,
  getTodayOrders,
  getOrderStats,
  getOrderItems,
  addOrderItem,
  removeOrderItem,
  updateOrderItemQuantity,
  getOrderTracking,
  updateOrderTracking,
  getNearbyOrders,
} from "./orderService";

// Menu
export {
  getFullMenu,
  getMenuBySection,
  getFeaturedProducts,
  getPromotionalProducts,
  getBestSellingProducts,
  getRecommendedProducts,
  searchMenuProducts,
  getMenuCategories,
  getMenuProduct,
  getMenuProductIngredients,
  getProductCustomizationOptions,
  getSimilarProducts,
  getProductsByPriceRange,
  getProductsByIngredient,
  getProductsWithoutIngredient,
  getVegetarianProducts,
  getVeganProducts,
  getGlutenFreeProducts,
  getLactoseFreeProducts,
  getProductsBySpiceLevel,
  getProductsByPrepTime,
} from "./menuService";

// Notificações
export {
  getMyNotifications,
  getUnreadNotifications,
  getNotificationById,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteNotifications,
  deleteAllReadNotifications,
  getNotificationsByType,
  getNotificationsByStatus,
  getRecentNotifications,
  registerPushToken,
  unregisterPushToken,
  sendTestNotification,
  getNotificationStats,
  getNotificationsByPeriod,
  getOrderNotifications,
  getPromotionNotifications,
  getSystemNotifications,
} from "./notificationService";

// Chat
export {
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessages,
  getUnreadMessageCount,
  getActiveConversations,
  getConversation,
  createConversation,
  closeConversation,
  reopenConversation,
  getConversationMessages,
  sendConversationMessage,
  getConversationParticipants,
  addConversationParticipant,
  removeConversationParticipant,
  getMessageStatus,
  editMessage,
  deleteMessage,
  getChatStats,
  getConversationsByStatus,
  getRecentConversations,
} from "./chatService";

// Dashboard
export {
  getDashboardData,
  getSalesStats,
  getOrderStats as getDashboardOrderStats,
  getCustomerStats,
  getProductStats,
  getSalesByPeriod,
  getOrdersByPeriod,
  getTopSellingProducts,
  getTopCustomers,
  getHourlyPerformance,
  getWeeklyPerformance,
  getMonthlyPerformance,
  getYearlyPerformance,
  getConversionMetrics,
  getRetentionMetrics,
  getCustomerSatisfaction,
  getDeliveryTimeMetrics,
  getCancellationMetrics,
  getInventoryMetrics,
  getEmployeeMetrics,
  getPromotionMetrics,
  getPaymentMetrics,
  getFeedbackMetrics,
  getComparisonData,
} from "./dashboardService";

// Financeiro
export {
  getFinancialOverview,
  getRevenue,
  getExpenses,
  getProfitLoss,
} from "./financialService";

// Relatórios
export {
  getSalesReport,
  getOrderReport,
  getCustomerReport,
  getProductReport,
  getInventoryReport,
  getFinancialReport,
  exportReport,
} from "./reportsService";

// Configurações
export {
  getSystemSettings,
  updateSystemSettings,
  getUserSettings,
  updateUserSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getAppSettings,
  updateAppSettings,
} from "./settingsService";

// Estoque
export {
  getStockOverview,
  getLowStockItems,
  getOutOfStockItems,
  updateStock,
  addStock,
  removeStock,
  getStockHistory,
  getStockAlerts,
  getStockReport,
} from "./stockService";
