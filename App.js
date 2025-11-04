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
import EsqueciSenha from "./screens/esqueciSenha";
import VerificarCodigoSenha from "./screens/verificarCodigoSenha";
import RedefinirSenha from "./screens/redefinirSenha";
import Produto from "./screens/produto";
import ProdutoEditar from "./screens/produtoEditar";
import Perfil from "./screens/perfil";
import ClubeRoyal from "./screens/clubeRoyal";
import HistoricoPontos from "./screens/historicoPontos";
import Pedidos from "./screens/pedidos";
import Config from "./screens/config";
import Cesta from "./screens/cesta";
import Pagamento from "./screens/pagamento";
import React, { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUserData, logout, getCurrentUserProfile } from "./services";
import { getLoyaltyBalance, getCustomerAddresses } from "./services/customerService";
import { getMostOrderedProducts, getRecentlyAddedProducts } from "./services/productService";
import { getAllPromotions } from "./services/promotionService";
import { BasketProvider, useBasket } from "./contexts/BasketContext";
import api from "./services/api";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
    const isFocused = useIsFocused();
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);
    const { basketItems, basketTotal, basketItemCount, addToBasket } = useBasket();
    
    // Estados para as seções da home
    const [mostOrderedData, setMostOrderedData] = useState([]);
    const [promotionsData, setPromotionsData] = useState([]);
    const [comboData, setComboData] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);

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
    }, [isFocused]);

    // Função helper para formatar produtos da API para o formato esperado pelo ViewCardItem
    const formatProductForCard = (product, promotion = null) => {
        const basePrice = parseFloat(product.price || 0);
        const finalPrice = promotion ? (basePrice - parseFloat(promotion.discount_value || 0)) : basePrice;
        const priceFormatted = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
        
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
        
        return {
            id: product.id,
            title: product.name || 'Produto',
            description: product.description || 'Descrição não disponível',
            price: priceFormatted,
            deliveryTime: `${product.preparation_time_minutes || 30} - ${(product.preparation_time_minutes || 30) + 10} min`,
            deliveryPrice: "R$ 5,00", // Valor fixo por enquanto, pode vir das settings depois
            imageSource: imageUrl ? { uri: imageUrl } : null,
            expires_at: promotion?.expires_at || null, // Para o timer de promoção
            ...product // Inclui todos os dados originais para uso na tela de produto
        };
    };

    // Carrega dados das seções da home
    useEffect(() => {
        const loadHomeSections = async () => {
            try {
                setLoadingSections(true);
                
                // Carrega mais pedidos
                try {
                    const mostOrderedResponse = await getMostOrderedProducts({ page_size: 10 });
                    const mostOrderedItems = mostOrderedResponse.items || mostOrderedResponse || [];
                    const formattedMostOrdered = mostOrderedItems.map(product => formatProductForCard(product));
                    setMostOrderedData(formattedMostOrdered);
                } catch (error) {
                    console.log('Erro ao carregar mais pedidos:', error);
                    setMostOrderedData([]);
                }

                // Carrega promoções
                try {
                    const promotionsResponse = await getAllPromotions();
                    const promotions = promotionsResponse.items || promotionsResponse || [];
                    const formattedPromotions = promotions.map(promotion => {
                        const product = promotion.product || promotion;
                        return formatProductForCard(product, promotion);
                    });
                    setPromotionsData(formattedPromotions);
                } catch (error) {
                    console.log('Erro ao carregar promoções:', error);
                    setPromotionsData([]);
                }

                // Carrega novidades (combos)
                try {
                    const recentlyAddedResponse = await getRecentlyAddedProducts({ page_size: 10 });
                    const recentlyAddedItems = recentlyAddedResponse.items || recentlyAddedResponse || [];
                    const formattedRecentlyAdded = recentlyAddedItems.map(product => formatProductForCard(product));
                    setComboData(formattedRecentlyAdded);
                } catch (error) {
                    console.log('Erro ao carregar novidades:', error);
                    setComboData([]);
                }
            } catch (error) {
                console.log('Erro ao carregar seções da home:', error);
            } finally {
                setLoadingSections(false);
            }
        };

        loadHomeSections();
    }, [isFocused]);

    // Calcula tempo de expiração da primeira promoção (se houver)
    const getPromoEndTime = () => {
        if (promotionsData.length > 0 && promotionsData[0].expires_at) {
            return new Date(promotionsData[0].expires_at);
        }
        // Fallback: 1 hora a partir de agora
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        return defaultTime;
    };

    const handlePromoExpire = () => {
        console.log('Promoção expirou!');
        // Recarrega promoções quando uma expira
        const loadPromotions = async () => {
            try {
                const promotionsResponse = await getAllPromotions();
                const promotions = promotionsResponse.items || promotionsResponse || [];
                const formattedPromotions = promotions.map(promotion => {
                    const product = promotion.product || promotion;
                    return formatProductForCard(product, promotion);
                });
                setPromotionsData(formattedPromotions);
            } catch (error) {
                console.log('Erro ao recarregar promoções:', error);
            }
        };
        loadPromotions();
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
                    title="Em promoção"
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
                    title="Combos"
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