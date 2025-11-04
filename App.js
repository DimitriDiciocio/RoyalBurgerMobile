import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
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
import Perfil from "./screens/perfil";
import ClubeRoyal from "./screens/clubeRoyal";
import Pedidos from "./screens/pedidos";
import Config from "./screens/config";
import Cesta from "./screens/cesta";
import Pagamento from "./screens/pagamento";
import React, { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUserData, logout, getCurrentUserProfile } from "./services";
import { getLoyaltyBalance, getCustomerAddresses } from "./services/customerService";
import { BasketProvider, useBasket } from "./contexts/BasketContext";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
    const isFocused = useIsFocused();
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);
    const { basketItems, basketTotal, basketItemCount, addToBasket } = useBasket();

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
    const mostOrderedData = [
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: { uri: "https://exemplo.com/burger1.jpg" }
        },
    ];

    const promotionsData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: { uri: "https://exemplo.com/combo1.jpg" }
        },
    ];

    const comboData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: { uri: "https://exemplo.com/combo1.jpg" }
        },
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: { uri: "https://exemplo.com/burger1.jpg" }
        },
    ];

    const promoEndTime = new Date();
    promoEndTime.setHours(promoEndTime.getHours() + 1);

    const handlePromoExpire = () => {
        console.log('Promoção expirou!');
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

            <ViewCardItem
                title="Os mais pedidos"
                data={mostOrderedData}
                navigation={navigation}
            />

            <ViewCardItem
                title="Em promoção"
                data={promotionsData}
                promoTimer={{
                    endTime: promoEndTime,
                    onExpire: handlePromoExpire
                }}
                navigation={navigation}
            />

            <ViewCardItem
                title="Combos"
                data={comboData}
                navigation={navigation}
            />
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
                    name="Perfil" 
                    component={Perfil}
                />
                <Stack.Screen 
                    name="ClubeRoyal" 
                    component={ClubeRoyal}
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