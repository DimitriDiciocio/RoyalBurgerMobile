import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Header from "./components/Header";
import CarouselImg from "./components/CarouselImg";
import LoginButton from "./components/ButtonView";
import ViewCardItem from "./components/ViewCardItem";
import MenuCategory from "./components/MenuCategory";
import MenuNavigation from "./components/MenuNavigation";
import BasketFooter from "./components/BasketFooter";
import Login from "./screens/login";
import Cadastro from "./screens/cadastro";
import VerificacaoEmail from "./screens/verificacaoEmail";
import EsqueciSenha from "./screens/esqueciSenha";
import VerificarCodigoSenha from "./screens/verificarCodigoSenha";
import RedefinirSenha from "./screens/redefinirSenha";
import Produto from "./screens/produto";
import ProdutoEditar from "./screens/produtoEditar";
import Perfil from "./screens/perfil";
import ClubeRoyal from "./screens/clubeRoyal";
import HistoricoPontos from "./screens/historicoPontos";
import Pedidos from "./screens/pedidos";
import Acompanhar from "./screens/acompanhar";
import Config from "./screens/config";
import Cesta from "./screens/cesta";
import Pagamento from "./screens/pagamento";
import React, { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUserData, logout, getCurrentUserProfile } from "./services";
import { getLoyaltyBalance, getCustomerAddresses } from "./services/customerService";
import { getAllProducts, getMostOrderedProducts, getRecentlyAddedProducts, filterProductsWithStock } from "./services/productService";
import { getAllPromotions, getPromotionByProductId } from "./services/promotionService";
import { BasketProvider, useBasket } from "./contexts/BasketContext";
import { RECENTLY_ADDED_DAYS } from "./config/constants";
import api from "./services/api";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
    const isFocused = useIsFocused();
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);
    const { basketItems, basketTotal, basketItemCount, addToBasket, loadCart } = useBasket();
    
    // Estados para as seções da home
    const [mostOrderedData, setMostOrderedData] = useState([]);
    const [promotionsData, setPromotionsData] = useState([]);
    const [comboData, setComboData] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);
    // ALTERAÇÃO: Estado para armazenar maior tempo de validade das promoções
    const [promoLongestExpiry, setPromoLongestExpiry] = useState(null);

    const fetchEnderecos = async (userId) => {
        try {
            const enderecosData = await getCustomerAddresses(userId);
            setEnderecos(enderecosData || []);
            // Selecionar endereço padrão
            const enderecoPadrao = enderecosData?.find(e => e.is_default || e.isDefault);
            setEnderecoAtivo(enderecoPadrao || null);
        } catch (error) {
            console.error('Erro ao buscar endereços:', error);
            setEnderecos([]);
            setEnderecoAtivo(null);
        }
    };

    const handleEnderecoAtivoChange = (data) => {
        // Verificação de segurança para evitar erro quando data é null
        if (!data) return;
        
        if (typeof data === 'object' && data.type === 'refresh') {
            // Atualiza a lista de endereços
            setEnderecos(data.enderecos);
            // Se tem endereço ativo específico, usa ele, senão define baseado na lista
            if (data.enderecoAtivo) {
                setEnderecoAtivo(data.enderecoAtivo);
            } else if (data.enderecos && data.enderecos.length > 0) {
                const enderecoPadrao = data.enderecos.find(e => e.is_default === true || e.isDefault === true);
                if (enderecoPadrao) {
                    setEnderecoAtivo(enderecoPadrao);
                } else {
                    const enderecosOrdenados = [...data.enderecos].sort((a, b) => 
                        new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
                    );
                    setEnderecoAtivo(enderecosOrdenados[0]);
                }
            }
        } else {
            // Endereço ativo mudou
            setEnderecoAtivo(data);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const ok = await isAuthenticated();
                const wasLoggedIn = loggedIn;
                setLoggedIn(!!ok);
                
                if (ok) {
                    const user = await getStoredUserData();
                    let points = '0';
                    
                    // Se for um cliente, busca os pontos atualizados da API
                    if (user && user.role === 'customer' && user.id) {
                        setLoadingPoints(true);
                        try {
                            console.log('Buscando pontos para cliente ID:', user.id);
                            const loyaltyData = await getLoyaltyBalance(user.id);
                            console.log('Dados de fidelidade recebidos:', loyaltyData);
                            
                            // Tenta diferentes estruturas de dados que a API pode retornar
                            points = loyaltyData?.current_balance?.toString() || 
                                    loyaltyData?.balance?.toString() || 
                                    loyaltyData?.points?.toString() || 
                                    loyaltyData?.total_points?.toString() || 
                                    loyaltyData?.loyalty_points?.toString() || 
                                    '0';
                            
                            console.log('Pontos extraídos:', points);
                        } catch (error) {
                            console.log('Erro ao buscar pontos:', error);
                            // Fallback para pontos salvos localmente
                            points = user.points || '0';
                        } finally {
                            setLoadingPoints(false);
                        }

                        // Buscar endereços do cliente
                        await fetchEnderecos(user.id);
                    } else {
                        // Para outros tipos de usuário, usa os pontos salvos
                        points = user?.points || '0';
                    }
                    
                    // Normaliza campos esperados pelo Header
                    const normalized = user ? {
                        name: user.full_name || user.name || 'Usuário',
                        points: points,
                        address: user.address || undefined,
                        avatar: undefined,
                    } : null;
                    setUserInfo(normalized);
                    
                    // Se o usuário acabou de fazer login (estava deslogado antes), recarrega o carrinho
                    if (!wasLoggedIn) {
                        console.log('[HomeScreen] Usuário fez login, recarregando carrinho...');
                        await loadCart();
                    }
                } else {
                    setUserInfo(null);
                    setEnderecos([]);
                    setEnderecoAtivo(null);
                }
            } catch (e) {
                console.log('Erro ao verificar autenticação:', e);
                setLoggedIn(false);
                setUserInfo(null);
                setEnderecos([]);
                setEnderecoAtivo(null);
            }
        };
        checkAuth();
    }, [isFocused, loadCart]);

    // Função helper para formatar produtos da API para o formato esperado pelo ViewCardItem
    const formatProductForCard = (product, promotion = null) => {
        // Filtrar produtos sem ingredientes disponíveis na receita base
        const availabilityStatus = product.availability_status || 'unknown';
        if (availabilityStatus === 'unavailable') {
            // Retorna null para ser filtrado depois
            return null;
        }
        
        const basePrice = parseFloat(product.price || 0);
        
        // ALTERAÇÃO: Calcular desconto corretamente usando discount_percentage ou discount_value
        let finalPrice = basePrice;
        let discountPercentage = null;
        let discountValue = 0;
        
        if (promotion) {
            // Priorizar discount_percentage se disponível
            if (promotion.discount_percentage && parseFloat(promotion.discount_percentage) > 0) {
                discountPercentage = parseFloat(promotion.discount_percentage);
                finalPrice = basePrice * (1 - discountPercentage / 100);
                discountValue = basePrice - finalPrice;
            } else if (promotion.discount_value && parseFloat(promotion.discount_value) > 0) {
                discountValue = parseFloat(promotion.discount_value);
                finalPrice = basePrice - discountValue;
                // Calcular percentual para exibição
                if (basePrice > 0) {
                    discountPercentage = (discountValue / basePrice) * 100;
                }
            }
        }
        
        const priceFormatted = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
        const originalPriceFormatted = `R$ ${basePrice.toFixed(2).replace('.', ',')}`;
        
        // Monta URL da imagem - usa o baseURL da API
        let imageUrl = null;
        if (product.image_url) {
            // Se a URL já contém http, usa direto
            if (product.image_url.startsWith('http')) {
                imageUrl = product.image_url;
            } else if (product.id) {
                // Usa o endpoint de imagem da API (igual ao MenuCategory)
                const baseUrl = api.defaults.baseURL.replace('/api', '');
                imageUrl = `${baseUrl}/api/products/image/${product.id}`;
            } else {
                // Fallback: constrói URL manualmente
                const baseUrl = api.defaults.baseURL.replace('/api', '');
                imageUrl = product.image_url.startsWith('/') 
                    ? `${baseUrl}${product.image_url}` 
                    : `${baseUrl}/api/${product.image_url}`;
            }
        }
        
        // Limitar tamanho do nome e descrição como no web
        const MAX_NAME_LENGTH = 200;
        const MAX_DESCRIPTION_LENGTH = 500;
        const safeName = (product.name || 'Produto').substring(0, MAX_NAME_LENGTH);
        const safeDescription = (product.description || 'Descrição rápida...').substring(0, MAX_DESCRIPTION_LENGTH);
        
        return {
            ...product, // Inclui todos os dados originais para uso na tela de produto
            // ALTERAÇÃO: Sobrescrever campos formatados após o spread para garantir prioridade
            id: product.id,
            title: safeName,
            description: safeDescription,
            price: priceFormatted, // ALTERAÇÃO: Preço final formatado (com desconto se houver) - deve vir depois do spread
            originalPrice: promotion ? originalPriceFormatted : null, // Preço original (apenas se houver promoção)
            discountPercentage: discountPercentage ? Math.round(discountPercentage) : null, // Percentual de desconto arredondado
            deliveryTime: `${product.preparation_time_minutes || 30} - ${(product.preparation_time_minutes || 30) + 10} min`,
            deliveryPrice: "R$ 5,00", // Valor fixo por enquanto, pode vir das settings depois
            imageSource: imageUrl ? { uri: imageUrl } : null,
            expires_at: promotion?.expires_at || null, // Para o timer de promoção
            promotion: promotion, // ALTERAÇÃO: Passa objeto completo da promoção
            // ALTERAÇÃO: Preservar availability_status e max_quantity para badges
            availability_status: product.availability_status,
            availabilityStatus: product.availability_status, // Compatibilidade com diferentes nomes
            max_quantity: product.max_quantity
        };
    };

    // ALTERAÇÃO: Função para carregar produtos recentemente adicionados (novidades)
    const loadRecentlyAddedProducts = async () => {
        try {
            // ALTERAÇÃO: Chamar API com parâmetro days para filtrar por período
            const response = await getRecentlyAddedProducts({
                page: 1,
                page_size: 10,
                days: RECENTLY_ADDED_DAYS // Usar constante configurável
            });
            
            const allProducts = response?.items || [];
            
            // ALTERAÇÃO: Validar estoque de cada produto antes de exibir
            // Garante que apenas produtos com estoque disponível aparecem em novidades
            const validatedProducts = await filterProductsWithStock(allProducts);
            
            // ALTERAÇÃO: Formatar produtos para exibição
            const formattedProducts = validatedProducts
                .map(product => formatProductForCard(product))
                .filter(product => product !== null); // Remove produtos indisponíveis
            
            return formattedProducts;
        } catch (error) {
            // ALTERAÇÃO: Removido console.error em produção
            const isDev = __DEV__;
            if (isDev) {
                console.error('Erro ao carregar novidades:', error);
            }
            return [];
        }
    };

    // ALTERAÇÃO: Função para carregar promoções especiais
    const loadPromotionsSection = async () => {
        try {
            // Buscar promoções ativas
            const response = await getAllPromotions({ include_expired: false });
            const promotions = response?.items || response || [];
            
            if (!promotions || promotions.length === 0) {
                return { products: [], longestExpiry: null };
            }
            
            // Filtrar promoções expiradas e produtos inativos
            const now = new Date();
            const validPromotions = promotions
                .filter(promo => {
                    // Verificar se produto está ativo
                    if (!promo.product || !promo.product.is_active) {
                        return false;
                    }
                    // Verificar se promoção não está expirada
                    if (promo.expires_at) {
                        const expiresAt = new Date(promo.expires_at);
                        if (expiresAt <= now) {
                            return false;
                        }
                    }
                    return true;
                })
                .slice(0, 10); // Limitar a 10 promoções
            
            // Preparar produtos com dados de promoção
            const productsWithPromotion = validPromotions.map(promo => ({
                product: {
                    ...promo.product,
                    id: promo.product_id || promo.product?.id,
                    price: promo.product.price,
                    image_url: promo.product.image_url,
                },
                promotion: promo
            }));
            
            // ALTERAÇÃO: Validar estoque de produtos com promoção
            const productsToDisplay = productsWithPromotion.map(({ product }) => product);
            const productsWithStock = await filterProductsWithStock(productsToDisplay);
            
            // Combinar produtos validados com suas promoções
            const availableProductsWithPromotion = productsWithPromotion
                .map(({ product, promotion }) => {
                    const validatedProduct = productsWithStock.find(p => p.id === product.id);
                    if (validatedProduct) {
                        return { product: validatedProduct, promotion };
                    }
                    return null;
                })
                .filter(item => item !== null);
            
            // ALTERAÇÃO: Encontrar a promoção com maior tempo de validade para o cronômetro
            const promotionWithLongestValidity = availableProductsWithPromotion
                .filter(({ promotion }) => promotion && promotion.expires_at)
                .reduce((longest, current) => {
                    if (!longest) return current;
                    const longestExpiry = new Date(longest.promotion.expires_at);
                    const currentExpiry = new Date(current.promotion.expires_at);
                    return currentExpiry > longestExpiry ? current : longest;
                }, null);
            
            // Formatar produtos para exibição
            const formattedProducts = availableProductsWithPromotion
                .map(({ product, promotion }) => formatProductForCard(product, promotion))
                .filter(product => product !== null);
            
            return {
                products: formattedProducts,
                longestExpiry: promotionWithLongestValidity?.promotion?.expires_at || null
            };
        } catch (error) {
            // ALTERAÇÃO: Removido console.error em produção
            const isDev = __DEV__;
            if (isDev) {
                console.error('Erro ao carregar promoções:', error);
            }
            return { products: [], longestExpiry: null };
        }
    };

    // Carrega dados das seções da home (seguindo o padrão do web)
    useEffect(() => {
        const loadHomeSections = async () => {
            try {
                setLoadingSections(true);
                
                // Carregar produtos mais pedidos
                try {
                    console.log('[App.js] Carregando produtos mais pedidos...');
                    // ALTERAÇÃO: Filtrar produtos indisponíveis na API
                    const allProductsResponse = await getAllProducts({ 
                        page_size: 1000,
                        include_inactive: false,
                        filter_unavailable: true // Filtrar produtos sem estoque na API
                    });
                    const allProducts = allProductsResponse?.items || (Array.isArray(allProductsResponse) ? allProductsResponse : []);
                    
                    // ALTERAÇÃO: Filtrar apenas produtos ativos
                    const activeProducts = allProducts.filter((product) => {
                        const isActive = 
                            product.is_active !== false &&
                            product.is_active !== 0 &&
                            product.is_active !== "false";
                        return isActive;
                    });
                    
                    // ALTERAÇÃO: Validar estoque de cada produto e adicionar availability_status
                    const validatedProducts = await filterProductsWithStock(activeProducts);
                    
                    // Pegar os primeiros 6 produtos para "Os mais pedidos"
                    const firstProducts = validatedProducts.slice(0, 6);
                    
                    // ALTERAÇÃO: Buscar promoções para os produtos mais pedidos
                    const productsWithPromotions = await Promise.allSettled(
                        firstProducts.map(async (product) => {
                            let promotion = null;
                            try {
                                if (product.id) {
                                    promotion = await getPromotionByProductId(product.id);
                                }
                            } catch (error) {
                                // Ignora erros ao buscar promoção (produto pode não ter promoção)
                            }
                            return { product, promotion };
                        })
                    );
                    
                    // Formatar produtos para as seções com suas promoções
                    const formattedProducts = productsWithPromotions
                        .filter(result => result.status === 'fulfilled')
                        .map(result => {
                            const { product, promotion } = result.value;
                            return formatProductForCard(product, promotion);
                        })
                        .filter(product => product !== null);
                    
                    setMostOrderedData(formattedProducts);
                } catch (error) {
                    console.log('Erro ao carregar produtos mais pedidos:', error);
                    setMostOrderedData([]);
                }
                
                // ALTERAÇÃO: Carregar produtos recentemente adicionados (novidades)
                const recentlyAddedProducts = await loadRecentlyAddedProducts();
                setComboData(recentlyAddedProducts);
                
                // ALTERAÇÃO: Carregar promoções especiais
                const promotionsData = await loadPromotionsSection();
                setPromotionsData(promotionsData.products);
                setPromoLongestExpiry(promotionsData.longestExpiry);
            } catch (error) {
                console.log('Erro ao carregar seções da home:', error);
            } finally {
                setLoadingSections(false);
            }
        };

        loadHomeSections();
    }, [isFocused]);

    // ALTERAÇÃO: Calcula tempo de expiração da promoção com maior validade
    const getPromoEndTime = () => {
        if (promoLongestExpiry) {
            return new Date(promoLongestExpiry);
        }
        // Fallback: 1 hora a partir de agora
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        return defaultTime;
    };

    const handlePromoExpire = () => {
        console.log('Promoção expirou!');
        // ALTERAÇÃO: Recarrega promoções quando uma expira
        const reloadPromotions = async () => {
            try {
                const promotionsData = await loadPromotionsSection();
                setPromotionsData(promotionsData.products);
                setPromoLongestExpiry(promotionsData.longestExpiry);
            } catch (error) {
                const isDev = __DEV__;
                if (isDev) {
                    console.error('Erro ao recarregar promoções:', error);
                }
            }
        };
        reloadPromotions();
    };

    const handleLogout = async () => {
        try {
            await logout();
            setLoggedIn(false);
            setUserInfo(null);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const handleBasketPress = () => {
        navigation.navigate('Cesta');
    };

    // Conteúdo sections
    const renderPromotionalHeader = () => (
        <View style={styles.promotionalContent}>
            <View style={styles.carouselImg}>
                <CarouselImg />
            </View>

            {mostOrderedData.length > 0 && (
                <ViewCardItem
                    title="Os mais pedidos"
                    data={mostOrderedData}
                    navigation={navigation}
                />
            )}

            {promotionsData.length > 0 && (
                <ViewCardItem
                    title="Promoções especiais"
                    data={promotionsData}
                    promoTimer={{
                        endTime: getPromoEndTime(),
                        onExpire: handlePromoExpire
                    }}
                    navigation={navigation}
                />
            )}

            {comboData.length > 0 && (
                <ViewCardItem
                    title="Novidades"
                    data={comboData}
                    navigation={navigation}
                />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Header 
                    navigation={navigation} 
                    type={loggedIn ? 'logged' : 'home'}
                    userInfo={userInfo}
                    loadingPoints={loadingPoints}
                    enderecos={enderecos}
                    onEnderecoAtivoChange={handleEnderecoAtivoChange}
                />
            </View>

            <View style={[styles.menuContainer, loggedIn && styles.menuContainerWithNavigation]}>
                <MenuCategory
                    ListHeaderComponent={renderPromotionalHeader}
                    showFixedButton={true}
                    navigation={navigation}
                />
            </View>

            {!loggedIn && basketItems.length === 0 && (
                <View style={styles.fixedButtonContainer}>
                    <LoginButton navigation={navigation} />
                </View>
            )}

            {!loggedIn && basketItems.length > 0 && (
                <View style={styles.fixedButtonContainer}>
                    <BasketFooter 
                        total={basketTotal}
                        itemCount={basketItemCount}
                        onPress={handleBasketPress}
                    />
                </View>
            )}

            {loggedIn && (
                <View style={styles.menuNavigationContainer}>
                    <MenuNavigation navigation={navigation} />
                    {basketItems.length > 0 && (
                        <View style={styles.basketOverlay}>
                            <BasketFooter 
                                total={basketTotal}
                                itemCount={basketItemCount}
                                onPress={handleBasketPress}
                            />
                        </View>
                    )}
                </View>
            )}
    
            <StatusBar style="auto" />
        </View>
    );
}

export default function App() {
    return (
        <BasketProvider>
            <NavigationContainer>
                <Stack.Navigator 
                    initialRouteName="Home"
                    screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                        animationDuration: 200
                    }}
                >
                <Stack.Screen 
                    name="Home" 
                    component={HomeScreen}
                />
                <Stack.Screen 
                    name="Login" 
                    component={Login}
                />
                <Stack.Screen 
                    name="Cadastro" 
                    component={Cadastro}
                />
                <Stack.Screen 
                    name="VerificacaoEmail" 
                    component={VerificacaoEmail}
                />
                <Stack.Screen 
                    name="EsqueciSenha" 
                    component={EsqueciSenha}
                />
                <Stack.Screen 
                    name="VerificarCodigoSenha" 
                    component={VerificarCodigoSenha}
                />
                <Stack.Screen 
                    name="RedefinirSenha" 
                    component={RedefinirSenha}
                />
                <Stack.Screen 
                    name="Produto" 
                    component={Produto}
                />
                <Stack.Screen 
                    name="ProdutoEditar" 
                    component={ProdutoEditar}
                />
                <Stack.Screen 
                    name="Perfil" 
                    component={Perfil}
                />
                <Stack.Screen 
                    name="ClubeRoyal" 
                    component={ClubeRoyal}
                />
                <Stack.Screen 
                    name="HistoricoPontos" 
                    component={HistoricoPontos}
                />
                <Stack.Screen   
                    name="Pedidos" 
                    component={Pedidos}
                />
                <Stack.Screen 
                    name="Acompanhar" 
                    component={Acompanhar}
                />
                <Stack.Screen 
                    name="Config" 
                    component={Config}
                />
                <Stack.Screen 
                    name="Cesta" 
                    component={Cesta}
                />
                <Stack.Screen 
                    name="Pagamento" 
                    component={Pagamento}
                />
            </Stack.Navigator>
        </NavigationContainer>
        </BasketProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    header: {
        position: 'absolute',
        zIndex: 1001,
        top: 0,
        left: 0,
        right: 0,
    },
    menuContainer: {
        flex: 1,
        marginTop: 105,
    },
    menuContainerWithNavigation: {
        paddingBottom: 70, // Altura do MenuNavigation
    },
    promotionalContent: {
        backgroundColor: '#F6F6F6',
        paddingTop: 10,
    },
    carouselImg: {
        marginTop: -50,
        marginBottom: 10,
    },
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
        zIndex: 999,
    },
    logoutButtonContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
        zIndex: 999,
    },
    logoutButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuNavigationContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    basketOverlay: {
        position: 'absolute',
        bottom: 100, // Posiciona acima do MenuNavigation
        left: 16,
        right: 16,
        zIndex: 1001,
        paddingBottom: 16, // Espaçamento entre BasketFooter e MenuNavigation
    },
});