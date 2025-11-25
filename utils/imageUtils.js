import api from '../services/api';

/**
 * ALTERAÇÃO: Função utilitária centralizada para construir URLs de imagens de produtos
 * Garante consistência em todo o app e trata diferentes formatos de image_url
 * 
 * @param {Object} product - Objeto do produto
 * @param {string|number} product.id - ID do produto
 * @param {string} [product.image_url] - URL da imagem (opcional)
 * @returns {string|null} URL completa da imagem ou null se não disponível
 */
export const getProductImageUrl = (product) => {
    if (!product) return null;

    const productId = product.id;
    const imageUrl = product.image_url;

    // Se já tiver uma URL completa (http/https), usa direto
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        return imageUrl;
    }

    // Se não tiver ID do produto, não pode construir a URL
    if (!productId) {
        return null;
    }

    // ALTERAÇÃO: Construir URL base de forma segura
    // O baseURL do axios já inclui '/api' no final
    let baseUrl = api.defaults.baseURL || '';
    
    // Remove '/api' do final se existir para construir a URL corretamente
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4); // Remove '/api'
    } else if (baseUrl.endsWith('/api/')) {
        baseUrl = baseUrl.slice(0, -5); // Remove '/api/'
    }

    // Remove barra final se existir
    baseUrl = baseUrl.replace(/\/$/, '');

    // ALTERAÇÃO: Construir URL do endpoint de imagem
    // Formato: http://host:port/api/products/image/{id}
    return `${baseUrl}/api/products/image/${productId}`;
};

/**
 * ALTERAÇÃO: Converte URL de imagem para formato de source do React Native Image
 * 
 * @param {Object} product - Objeto do produto
 * @returns {Object|null} Objeto { uri: string } ou null
 */
export const getProductImageSource = (product) => {
    const imageUrl = getProductImageUrl(product);
    return imageUrl ? { uri: imageUrl } : null;
};

/**
 * ALTERAÇÃO: Pré-carrega uma imagem usando Image.prefetch do React Native
 * Útil para garantir que imagens estejam carregadas antes de exibir
 * 
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<boolean>} true se carregou com sucesso, false caso contrário
 */
export const preloadImage = async (imageUrl) => {
    if (!imageUrl) return false;

    try {
        const { Image } = require('react-native');
        await Image.prefetch(imageUrl);
        return true;
    } catch (error) {
        // ALTERAÇÃO: Log apenas em desenvolvimento
        const isDev = __DEV__;
        if (isDev) {
            console.log('Erro ao pré-carregar imagem:', imageUrl, error);
        }
        return false;
    }
};

/**
 * ALTERAÇÃO: Pré-carrega múltiplas imagens
 * 
 * @param {Array<string>} imageUrls - Array de URLs de imagens
 * @returns {Promise<Array<boolean>>} Array de resultados (true/false) para cada imagem
 */
export const preloadImages = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return [];

    const promises = imageUrls.map(url => preloadImage(url));
    return Promise.all(promises);
};

