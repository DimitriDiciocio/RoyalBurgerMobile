/**
 * Helper para mensagens de erro amigáveis
 * ALTERAÇÃO: Função helper para padronizar mensagens de erro
 * @param {Error|Object|string} error - Objeto de erro ou mensagem
 * @returns {string} Mensagem amigável
 */
export const getFriendlyErrorMessage = (error) => {
  // ALTERAÇÃO: Extrair mensagem de erro de diferentes formatos
  let errorMessage = '';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error) {
    errorMessage = error.error;
  } else if (error?.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else {
    errorMessage = 'Erro desconhecido';
  }
  
  // ALTERAÇÃO: Mensagens específicas para diferentes tipos de erro
  if (errorMessage.includes('Estoque insuficiente') || errorMessage.includes('insuficiente')) {
    return errorMessage; // Já vem formatado do backend
  }
  
  if (errorMessage.includes('INSUFFICIENT_STOCK')) {
    return 'Estoque insuficiente. Verifique a quantidade ou remova alguns extras.';
  }
  
  if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('permissão')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return 'Tempo de espera esgotado. Tente novamente.';
  }
  
  if (errorMessage.includes('authentication') || errorMessage.includes('não autenticado')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  
  // ALTERAÇÃO: Retornar mensagem genérica se não houver match
  return errorMessage || 'Não foi possível processar sua solicitação. Tente novamente.';
};

/**
 * Helper para determinar tipo de alert baseado no erro
 * ALTERAÇÃO: Determina tipo de alert automaticamente
 * @param {Error|Object|string} error - Objeto de erro ou mensagem
 * @returns {string} Tipo do alert: 'error', 'warning', 'info'
 */
export const getAlertTypeFromError = (error) => {
  const errorMessage = getFriendlyErrorMessage(error).toLowerCase();
  
  if (errorMessage.includes('sucesso') || errorMessage.includes('sucesso')) {
    return 'success';
  }
  
  if (errorMessage.includes('atenção') || errorMessage.includes('aviso')) {
    return 'warning';
  }
  
  if (errorMessage.includes('erro') || errorMessage.includes('falha')) {
    return 'delete'; // Usar delete para erros críticos
  }
  
  return 'info';
};

