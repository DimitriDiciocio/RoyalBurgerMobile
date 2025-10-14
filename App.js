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
import Login from "./screens/login";
import Cadastro from "./screens/cadastro";
import VerificacaoEmail from "./screens/verificacaoEmail";
import Produto from "./screens/produto";
import Perfil from "./screens/perfil";
import ClubeRoyal from "./screens/clubeRoyal";
import Pedidos from "./screens/pedidos";
import Config from "./screens/config";
import React, { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUserData, logout } from "./services";
import { getCustomerAddresses, getLoyaltyBalance } from "./services/customerService";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
    const isFocused = useIsFocused();
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);
    const [loyaltyBalance, setLoyaltyBalance] = useState(0);

    const fetchEnderecos = async (userId) => {
        try {
            const enderecosData = await getCustomerAddresses(userId);
            setEnderecos(enderecosData || []);
        } catch (error) {
            console.error('Erro ao buscar endereços:', error);
            setEnderecos([]);
        }
    };

    const fetchLoyaltyBalance = async (userId) => {
        try {
            const balance = await getLoyaltyBalance(userId);
            const points = balance?.current_balance || 0;
            setLoyaltyBalance(points);
            return points;
        } catch (error) {
            console.error('Erro ao buscar pontos:', error);
            setLoyaltyBalance(0);
            return 0;
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
                    
                    // Buscar endereços se o usuário estiver logado
                    if (user?.id) {
                        await fetchEnderecos(user.id);
                        
                        // Normaliza campos esperados pelo Header
                        const normalized = {
                            name: user.full_name || user.name || 'Usuário',
                            points: userInfo?.points || "0", // Mantém pontos existentes ou usa 0
                            address: user.address || undefined,
                            avatar: undefined,
                        };
                        setUserInfo(normalized);
                    } else {
                        setUserInfo(null);
                    }
                } else {
                    setUserInfo(null);
                    setEnderecos([]);
                }
            } catch (e) {
                setLoggedIn(false);
                setUserInfo(null);
                setEnderecos([]);
            }
        };
        checkAuth();
    }, [isFocused]);

    // Carrega pontos apenas quando o usuário estiver logado e na tela principal
    useEffect(() => {
        if (loggedIn && userInfo?.name && isFocused && userInfo?.points === "0") {
            loadUserPoints();
        }
    }, [loggedIn, userInfo?.name, isFocused, userInfo?.points]);

    // Função para carregar pontos apenas quando necessário
    const loadUserPoints = async () => {
        if (loggedIn && userInfo?.name) {
            try {
                const user = await getStoredUserData();
                if (user?.id) {
                    const points = await fetchLoyaltyBalance(user.id);
                    setUserInfo(prev => ({
                        ...prev,
                        points: points.toString()
                    }));
                }
            } catch (error) {
                console.error('Erro ao carregar pontos:', error);
            }
        }
    };
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
            setEnderecos([]);
            setEnderecoAtivo(null);
            setLoyaltyBalance(0);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
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

            {!loggedIn && (
                <View style={styles.fixedButtonContainer}>
                    <LoginButton navigation={navigation} />
                </View>
            )}

            {loggedIn && (
                <View style={styles.menuNavigationContainer}>
                    <MenuNavigation navigation={navigation} currentRoute="Home" />
                </View>
            )}
    
            <StatusBar style="auto" />
        </View>
    );
}

export default function App() {
    return (
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
            </Stack.Navigator>
        </NavigationContainer>
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
});