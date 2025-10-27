import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import { isAuthenticated, getStoredUserData } from '../services';
import { getLoyaltyBalance } from '../services/customerService';
import { useBasket } from '../contexts/BasketContext';
import ItensCesta from '../components/itensCesta';
import CardItemVerticalAdd from '../components/CardItemVerticalAdd';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

export default function Cesta({ navigation }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { basketItems, removeFromBasket, updateBasketItem, clearBasket, addToBasket } = useBasket();
    
    // Calcular total real dos itens da cesta
    const calculateTotal = () => {
        return basketItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
                            const loyaltyData = await getLoyaltyBalance(user.id);
                            points = loyaltyData?.current_balance?.toString() || 
                                    loyaltyData?.balance?.toString() || 
                                    loyaltyData?.points?.toString() || 
                                    loyaltyData?.total_points?.toString() || 
                                    loyaltyData?.loyalty_points?.toString() || 
                                    '0';
                        } catch (error) {
                            console.log('Erro ao buscar pontos:', error);
                            points = user.points || '0';
                        } finally {
                            setLoadingPoints(false);
                        }
                    } else {
                        points = user?.points || '0';
                    }
                    
                    const normalized = user ? {
                        name: user.full_name || user.name || 'Usuário',
                        points: points,
                        address: user.address || undefined,
                        avatar: undefined,
                    } : null;
                    setUserInfo(normalized);
                } else {
                    setUserInfo(null);
                }
            } catch (e) {
                console.log('Erro ao verificar autenticação:', e);
                setLoggedIn(false);
                setUserInfo(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleLimpar = () => {
        if (basketItems.length === 0) {
            Alert.alert(
                'Cesta vazia',
                'Não há itens na cesta para limpar.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Limpar cesta',
            'Tem certeza que deseja remover todos os itens da cesta?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Limpar',
                    style: 'destructive',
                        onPress: () => {
                            clearBasket();
                        },
                },
            ]
        );
    };

    const handleEditItem = (item) => {
        // Navegar para edição do item
        console.log('Editar item:', item);
    };

    const handleRemoveItem = (item) => {
        removeFromBasket(item.id);
    };

    const handleUpdateQuantity = (item, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromBasket(item.id);
        } else {
            updateBasketItem(item.id, { 
                quantity: newQuantity,
                price: item.price
            });
        }
    };

    const handleAddMoreItems = () => {
        navigation.navigate('Home');
    };

    // Dados aleatórios para a seção "Peça também"
    const suggestedProducts = [
        {
            id: 'suggested_1',
            name: 'Hambúrguer Clássico',
            description: 'Pão brioche, carne, queijo, alface e tomate',
            price: 25.90,
            image: null
        },
        {
            id: 'suggested_2',
            name: 'Batata Frita Crocante',
            description: 'Batatas fritas temperadas com sal e páprica',
            price: 12.50,
            image: null
        },
        {
            id: 'suggested_3',
            name: 'Refrigerante Lata',
            description: 'Coca-Cola, Pepsi ou Guaraná - 350ml',
            price: 4.50,
            image: null
        },
        {
            id: 'suggested_4',
            name: 'Milkshake de Chocolate',
            description: 'Milkshake cremoso de chocolate com chantilly',
            price: 18.90,
            image: null
        },
        {
            id: 'suggested_5',
            name: 'Onion Rings',
            description: 'Anéis de cebola empanados e crocantes',
            price: 15.90,
            image: null
        },
        {
            id: 'suggested_6',
            name: 'Salada Caesar',
            description: 'Alface, croutons, queijo parmesão e molho caesar',
            price: 22.90,
            image: null
        },
        {
            id: 'suggested_7',
            name: 'Nuggets de Frango',
            description: '6 unidades de nuggets crocantes de frango',
            price: 19.90,
            image: null
        },
        {
            id: 'suggested_8',
            name: 'Açaí Bowl',
            description: 'Açaí cremoso com granola e frutas',
            price: 16.90,
            image: null
        },
        {
            id: 'suggested_9',
            name: 'Suco Natural',
            description: 'Suco de laranja, maçã ou uva - 300ml',
            price: 8.90,
            image: null
        },
        {
            id: 'suggested_10',
            name: 'Cookie de Chocolate',
            description: 'Cookie caseiro com gotas de chocolate',
            price: 6.90,
            image: null
        }
    ];

    const handleAddSuggestedProduct = (product) => {
        addToBasket({
            quantity: 1,
            total: product.price,
            unitPrice: product.price,
            productName: product.name,
            description: product.description,
            image: product.image,
            productId: product.id
        });
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFC700" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header 
                navigation={navigation} 
                type={loggedIn ? 'logged' : 'home'}
                userInfo={userInfo}
                loadingPoints={loadingPoints}
            />
            
             <ScrollView 
                 style={styles.content}
                 contentContainerStyle={styles.scrollContent}
             >
                 <View style={styles.navigationBar}>
                     <TouchableOpacity 
                         style={styles.backButton} 
                         onPress={handleBack}
                         activeOpacity={0.7}
                     >
                         <SvgXml
                             xml={backArrowSvg}
                             width={30}
                             height={30}
                         />
                     </TouchableOpacity>
                     
                     <View style={styles.titleContainer}>
                         <Text style={styles.title}>Cesta</Text>
                     </View>
                     
                     <TouchableOpacity 
                         style={styles.limparButton} 
                         onPress={handleLimpar}
                         activeOpacity={0.7}
                     >
                         <Text style={styles.limparButtonText}>Limpar</Text>
                     </TouchableOpacity>
                 </View>
                <Text style={styles.sectionTitle}>Itens adicionados</Text>
                
                {basketItems.length > 0 ? (
                    basketItems.map((item, index) => (
                        <ItensCesta
                            key={item.id || index}
                            item={item}
                            onEdit={handleEditItem}
                            onRemove={handleRemoveItem}
                            onUpdateQuantity={handleUpdateQuantity}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>Nenhum item na cesta</Text>
                )}

                {basketItems.length > 0 && (
                    <TouchableOpacity 
                        style={styles.addMoreItemsButton}
                        onPress={handleAddMoreItems}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.addMoreItemsText}>Adicionar mais itens</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.suggestedSection}>
                    <Text style={styles.suggestedTitle}>Peça também</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestedScrollContent}
                    >
                        {suggestedProducts.map((product) => (
                            <CardItemVerticalAdd
                                key={product.id}
                                title={product.name}
                                description={product.description}
                                price={`R$ ${product.price.toFixed(2).replace('.', ',')}`}
                                imageSource={product.image}
                                onAdd={() => handleAddSuggestedProduct(product)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Resumo de valores */}
                <View style={styles.resumoSection}>
                    <Text style={styles.resumoTitulo}>Resumo de valores</Text>
                    
                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoLabel}>Taxa de entrega</Text>
                        <Text style={styles.resumoValor}>R$ XX,XX</Text>
                    </View>

                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoLabel}>Descontos</Text>
                        <Text style={styles.resumoValor}>R$ XX,XX</Text>
                    </View>

                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoTotalLabel}>Total</Text>
                        <Text style={styles.resumoTotalValor}>
                            R$ {calculateTotal().toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                     <Text style={styles.pontosText}>
                         Nessa compra, você ganhará <Text style={styles.pontosDestaque}>XX</Text> pontos Royal
                     </Text>
                 </View>
             </ScrollView>

             {/* Footer fixo */}
             <View style={styles.footer}>
                 <View style={styles.footerLeft}>
                     <Text style={styles.footerTotalLabel}>Total</Text>
                     <Text style={styles.footerTotalValue}>
                         R$ {calculateTotal().toFixed(2).replace('.', ',')}
                     </Text>
                 </View>
                 <TouchableOpacity 
                     style={styles.continuarButton}
                     onPress={() => {
                         // Verificar se o usuário está logado
                         if (loggedIn) {
                             // Navegar para tela de pagamento
                             navigation.navigate('Pagamento');
                         } else {
                             // Redirecionar para a página de login
                             navigation.navigate('Login');
                         }
                     }}
                     activeOpacity={0.8}
                 >
                     <Text style={styles.continuarButtonText}>Continuar</Text>
                 </TouchableOpacity>
             </View>
         </View>
     );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
     navigationBar: {
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
         paddingHorizontal: 16,
         paddingVertical: 16,
         paddingTop: 20,
         backgroundColor: '#F6F6F6',
     },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    limparButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    limparButtonText: {
        fontSize: 16,
        color: '#FF0000',
        fontWeight: '500',
    },
     content: {
         flex: 1,
         paddingHorizontal: 0,
     },
     scrollContent: {
         paddingBottom: 120,
     },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
        textAlign: 'left',
        paddingHorizontal: 16,
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#888888',
        textAlign: 'center',
        marginTop: 40,
    },
    addMoreItemsButton: {
        marginTop: 10,
        marginBottom: 20,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },
    addMoreItemsText: {
        fontSize: 16,
        color: '#000000',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    suggestedSection: {
        marginTop: 30,
        marginBottom: 40,
    },
    suggestedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    suggestedScrollContent: {
        paddingHorizontal: 16,
    },
    resumoSection: {
        marginBottom: 20,
        paddingHorizontal: 16,
        zIndex: 1,
    },
    resumoTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
    },
    resumoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resumoLabel: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '400',
    },
    resumoValor: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '400',
    },
    resumoTotalLabel: {
        fontSize: 18,
        color: '#000000',
        fontWeight: 'bold',
    },
    resumoTotalValor: {
        fontSize: 18,
        color: '#000000',
        fontWeight: 'bold',
    },
    pontosText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'left',
        marginTop: -8,
    },
     pontosDestaque: {
         color: '#FFC107',
         fontWeight: 'bold',
     },
     footer: {
         position: 'absolute',
         bottom: 0,
         left: 0,
         right: 0,
         backgroundColor: '#FFFFFF',
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
         paddingHorizontal: 16,
         paddingVertical: 16,
         borderTopWidth: 1,
         borderTopColor: '#E5E5E5',
         shadowColor: '#000',
         shadowOffset: {
             width: 0,
             height: -2,
         },
         shadowOpacity: 0.1,
         shadowRadius: 4,
         elevation: 8,
         zIndex: 1000,
     },
     footerLeft: {
         flex: 1,
     },
     footerTotalLabel: {
         fontSize: 16,
         color: '#000000',
         fontWeight: 'bold',
         marginBottom: 2,
     },
     footerTotalValue: {
         fontSize: 20,
         color: '#000000',
         fontWeight: 'bold',
     },
     continuarButton: {
         backgroundColor: '#FFC107',
         paddingHorizontal: 24,
         paddingVertical: 12,
         borderRadius: 8,
         marginLeft: 16,
     },
     continuarButtonText: {
         fontSize: 16,
         color: '#000000',
         fontWeight: 'bold',
         textAlign: 'center',
     },
     loadingContainer: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
         backgroundColor: '#F6F6F6',
     },
 });
