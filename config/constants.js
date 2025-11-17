/**
 * Constantes de Configuração do RoyalBurgerMobile
 */

// ALTERAÇÃO: Período em dias para considerar produtos como novidades (padrão: 30 dias)
// Produtos criados nos últimos N dias serão exibidos na seção de novidades
export const RECENTLY_ADDED_DAYS = 30;

// Cache TTL em segundos (60 segundos = 1 minuto)
export const CACHE_TTL = 60;

// Chaves de cache
export const CACHE_KEYS = {
  recentlyAdded: 'recently_added_products',
  promotions: 'promotions',
  mostOrdered: 'most_ordered_products'
};

