    import React, {useState, useRef, useEffect} from 'react';
    import {StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Keyboard} from 'react-native';
    import { SvgXml } from 'react-native-svg';
    import { useIsFocused } from '@react-navigation/native';
    import Header from "../components/Header";
    import Input from "../components/Input";
    import IngredienteMenu from "../components/IngredienteMenuSemLogin";
    import LoginButton from "../components/ButtonView";
    import MenuNavigation from "../components/MenuNavigation";
    import Observacoes from "../components/Observacoes";
    import QuantidadePrecoBar from "../components/QuantidadePrecoBar";
    import { isAuthenticated, getStoredUserData } from '../services/userService';
    import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
    import { getMenuProduct } from '../services/menuService';
    import { getProductIngredients, getProductById } from '../services/productService';
    import api from '../services/api';

    const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

    export default function Produto({navigation, route}) {
        const { produto, productId } = route.params || {};
        
        // Debug: log do productId recebido
        console.log('[DEBUG] Produto screen - productId recebido:', productId);
        console.log('[DEBUG] Produto screen - produto recebido:', produto);
        
        const [isExpanded, setIsExpanded] = useState(false);
        const rotateValue = useRef(new Animated.Value(0)).current;
        const isFocused = useIsFocused();
        const [loggedIn, setLoggedIn] = useState(false);
        const [userInfo, setUserInfo] = useState(null);
        const [enderecos, setEnderecos] = useState([]);
        const [enderecoAtivo, setEnderecoAtivo] = useState(null);
        const [loyaltyBalance, setLoyaltyBalance] = useState(0);
        const [loadingPoints, setLoadingPoints] = useState(false);
        const [loadingProduct, setLoadingProduct] = useState(false);
        const [productData, setProductData] = useState(null);
        const [productIngredients, setProductIngredients] = useState([]);
        const [observacoes, setObservacoes] = useState('');
        const [quantity, setQuantity] = useState(1);
        const [keyboardVisible, setKeyboardVisible] = useState(false);

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
                setLoadingPoints(true);
                const balance = await getLoyaltyBalance(userId);
                const points = balance?.current_balance || 0;
                setLoyaltyBalance(points);
                return points;
            } catch (error) {
                console.error('Erro ao buscar pontos:', error);
                setLoyaltyBalance(0);
                return 0;
            } finally {
                setLoadingPoints(false);
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
                        
                        // Buscar endereços e pontos se o usuário estiver logado
                        if (user?.id) {
                            await fetchEnderecos(user.id);
                            const points = await fetchLoyaltyBalance(user.id);
                            
                            // Normaliza campos esperados pelo Header
                            const normalized = {
                                name: user.full_name || user.name || 'Usuário',
                                points: points.toString(), // Usa os pontos da API
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

        useEffect(() => {
            let isCancelled = false;
            const fetchProduct = async () => {
                try {
                    setLoadingProduct(true);
                    // Prioriza productId; se não houver, tenta usar produto.id ou mantém produto
                    const idToFetch = productId || produto?.id;
                    let data = null;
                    if (idToFetch) {
                        try {
                            // Buscar do endpoint do menu (exibe somente ativos)
                            data = await getMenuProduct(idToFetch);
                            // Algumas APIs retornam wrapper { product: {...} }
                            if (data && data.product) {
                                data = data.product;
                            }
                        } catch (errMenu) {
                            // Fallback: tentar serviço de produtos por ID
                            try {
                                const p = await getProductById(idToFetch);
                                data = p && p.product ? p.product : p;
                            } catch (errProd) {
                                // Se falhar, ainda tentamos obter ingredientes isolados (opcional)
                                try {
                                    const alt = await getProductIngredients(idToFetch);
                                    if (!isCancelled) setProductIngredients(Array.isArray(alt) ? alt : []);
                                } catch (errIng) {
                                    // ignora
                                }
                            }
                        }
                    } else if (produto) {
                        data = produto;
                    }

                    if (!isCancelled) {
                        // Log para depuração do retorno
                        console.log('[DEBUG] Produto - dados recebidos da API:', data);
                        setProductData(data || produto || null);
                        // Buscar ingredientes somente com ID válido
                        const pid = idToFetch || data?.id;
                        if (pid) {
                            try {
                                const ingredients = await getProductIngredients(pid);
                                if (!isCancelled) setProductIngredients(Array.isArray(ingredients) ? ingredients : []);
                            } catch (e) {
                                if (!isCancelled) setProductIngredients([]);
                            }
                        } else {
                            setProductIngredients([]);
                        }
                    }
                } catch (e) {
                    if (!isCancelled) {
                        setProductData(produto || null);
                        setProductIngredients([]);
                    }
                } finally {
                    if (!isCancelled) setLoadingProduct(false);
                }
            };
            fetchProduct();
            return () => { isCancelled = true; };
        }, [productId, produto]);

        useEffect(() => {
            const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
            const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
            const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
            const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
            return () => {
                showSub?.remove();
                hideSub?.remove();
            };
        }, []);

        const handleBackPress = () => {
            navigation.goBack();
        };

        const handleArrowPress = () => {
            const toValue = isExpanded ? 0 : 1;
            
            Animated.timing(rotateValue, {
                toValue: toValue,
                duration: 300,
                useNativeDriver: true,
            }).start();
            
            setIsExpanded(!isExpanded);
        };

        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Header
                        type={loggedIn ? 'logged' : 'home'}
                        userInfo={userInfo}
                        navigation={navigation}
                        title={loggedIn ? "Personalize seu pedido" : "Faça login para personalizar"}
                        subtitle={loggedIn ? "Monte do seu jeito!" : "E aproveite nossos produtos"}
                        enderecos={enderecos}
                        onEnderecoAtivoChange={handleEnderecoAtivoChange}
                        loadingPoints={loadingPoints}
                    />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, keyboardVisible ? { paddingBottom: 20 } : null]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBackPress}
                        >
                            <SvgXml
                                xml={backArrowSvg}
                                width={30}
                                height={30}
                            />
                        </TouchableOpacity>
                        
                        <View style={styles.centerImageContainer}>
                            {loadingProduct ? (
                                <ActivityIndicator size="large" color="#000" />
                            ) : (
                                productData?.image_url ? (
                                    <Image
                                        source={{ uri: `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${productData.id}` }}
                                        style={styles.centerImage}
                                        resizeMode="contain"
                                    />
                                ) : produto?.imageSource ? (
                                    <Image
                                        source={produto.imageSource}
                                        style={styles.centerImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.centerImage} />
                                )
                            )}
                        </View>
                    </View>
                     <View style={styles.produtoContainer}>
                         <Text style={styles.produtoTitle}>{productData?.name || produto?.name || produto?.title || 'Produto'}</Text>
                         {!!(productData?.description || produto?.description) && (
                             <Text style={styles.produtoDescription}>{productData?.description || produto?.description}</Text>
                         )}
                     </View>
                     
                     <View style={styles.divisionContainer}>
                         <Image 
                             source={require('../assets/img/division.png')} 
                             style={styles.divisionImage}
                             resizeMode="contain"
                         />
                     </View>
                     
                     <View style={styles.customizeContainer}>
                         <Text style={styles.produtoTitle}>Monte do seu jeito!</Text>
                         {productIngredients && productIngredients.length > 0 ? (
                             productIngredients.map((ing) => {
                                 const displayName = ing.name || ing.nome || 'Ingrediente';
                                 const extra = parseFloat(ing.extra_price || ing.preco_extra || 0) || 0;
                                 return (
                                     <IngredienteMenu
                                         key={ing.id || displayName}
                                         nome={displayName}
                                         valorExtra={extra}
                                         imagem={require('../assets/img/hamburguerIcon.png')}
                                     />
                                 );
                             })
                         ) : (
                             null
                         )}
                     </View>

                     <Observacoes
                         value={observacoes}
                         onChangeText={setObservacoes}
                         maxLength={140}
                         style={{ marginTop: 10, marginBottom: 20 }}
                     />

                     <QuantidadePrecoBar
                         unitPrice={productData?.price || 0}
                         initialQuantity={quantity}
                         onQuantityChange={setQuantity}
                         onAddPress={({ quantity, total }) => {
                             // TODO: integrar ao carrinho quando disponível
                         }}
                         style={{ marginBottom: 24 }}
                     />
                     </ScrollView>
                     
                    {!loggedIn && !keyboardVisible && (
                        <View style={styles.fixedButtonContainer}>
                            <LoginButton navigation={navigation} />
                        </View>
                    )}
                    
                    {loggedIn && !keyboardVisible && (
                        <View style={styles.menuNavigationContainer}>
                            <MenuNavigation navigation={navigation} currentRoute="Home" />
                        </View>
                    )}
            </View>
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
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
        },
        backButton: {
            position: 'absolute',
            top: 10,
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
        },
        centerImageContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
        },
        centerImage: {
            width: 280,
            height: 230,
        },
        produtoContainer: {
            margin: 20,
            marginTop: 0,
            marginBottom: 10,
        },
        produtoTitle: {
            fontSize: 24,
        },
        produtoDescription: {
            fontSize: 14,  
            letterSpacing: 0.5,
            textAlign: 'justify',
            color: '#525252',
            marginBottom: 10,
        },
         divisionContainer: {
             alignItems: 'center',
         },
         divisionImage: {
             width: '100%',
             height: 20,
         },
        customizeContainer: {
            margin: 20,
            marginTop: 10,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100,
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
        menuNavigationContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
        },
    });