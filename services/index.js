/**
 * ========================================
 * EXPORTAÇÕES CENTRALIZADAS DOS SERVIÇOS
 * ========================================
 * Este arquivo centraliza todas as exportações dos serviços
 * para facilitar a importação nos componentes
 */

// Serviço de API base
export { default as api } from "./api";

// Ingredientes
export {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientAvailability,
  adjustIngredientStock,
} from "./ingredientService";

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
  getCurrentUserProfile,
  testTokenValidity,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  changePassword,
  getProfile,
  deleteAccount,
  requestEmailVerification,
  verifyEmail,
  resendVerificationCode,
  verifyPassword,
  verify2FA,
  toggle2FA,
  enable2FAConfirm,
  get2FAStatus,
} from "./userService";

// Clientes
export {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
  verifyMyPassword,
  activateCustomer,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  removeCustomerAddress,
  getLoyaltyBalance,
  getLoyaltyHistory,
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
  getProductsByCategory,
  searchProducts,
  getProductIngredients,
  addIngredientToProduct,
  removeIngredientFromProduct,
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  getMostOrderedProducts,
  getRecentlyAddedProducts,
  checkProductAvailability,
} from "./productService";

// Categorias
export {
  getAllCategories,
  getCategoryById,
  getCategoriesForSelect,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
} from "./categoryService";

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
  getPublicSettings,
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

// Endereços e IBGE
export {
  searchCEP,
  getStates,
  getCitiesByState,
  getCitiesByStateSigla,
  validateCEP,
  formatCEP,
  getCompleteAddressInfo,
} from "./addressService";

// Atualização de senha
export { updatePassword } from "./userService";

// Promoções
export {
  getAllPromotions,
  getPromotionById,
  getPromotionByProductId,
} from "./promotionService";

// Carrinho
export {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  claimGuestCart,
  validateCartForOrder,
  getGuestCartId,
  saveGuestCartId,
  removeGuestCartId,
  createGuestCart,
} from "./cartService";