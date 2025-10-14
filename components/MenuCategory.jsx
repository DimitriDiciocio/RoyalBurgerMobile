import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
    Easing,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CardItemHorizontal from "./CardItemHorizontal";
import { getAllCategories, getProductsByCategory } from '../services';
import api from '../services/api';


export default function MenuCategory({
                                         categoriesData = [],
                                         ListHeaderComponent = null,
                                         showFixedButton = false,
                                         onCategoryPress = () => {},
                                         onItemPress = () => {},
                                         navigation = null
                                     }) {
    // Debug: log da BASE_URL
    console.log('[DEBUG] BASE_URL da API:', api.defaults.baseURL);
    const [activeCategory, setActiveCategory] = useState(-1); // -1 = nenhuma categoria selecionada
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showCategoryBar, setShowCategoryBar] = useState(false);
    const [firstCategoryPosition, setFirstCategoryPosition] = useState(0);
    const flatListRef = useRef(null);
    const categoryListRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    // Carregar categorias da API
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await getAllCategories();
            const categoriesList = response.items || response;
            setCategories(categoriesList);
            
            // Carregar produtos da primeira categoria automaticamente
            if (categoriesList.length > 0) {
                await loadProductsForCategory(categoriesList[0].id);
                setActiveCategory(0);
            }
        } catch (error) {
            console.log('Erro ao carregar categorias:', error);
            // Fallback para dados mock se a API falhar
            setCategories(mockData);
        } finally {
            setLoading(false);
        }
    };

    const loadProductsForCategory = async (categoryId) => {
        try {
            setLoadingProducts(true);
            const response = await getProductsByCategory(categoryId, { page_size: 50 });
            setProducts(prev => ({
                ...prev,
                [categoryId]: response.items || []
            }));
        } catch (error) {
            console.log('Erro ao carregar produtos da categoria:', error);
            setProducts(prev => ({
                ...prev,
                [categoryId]: []
            }));
        } finally {
            setLoadingProducts(false);
        }
    };

    // Cleanup do timeout
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Dados mock
    const mockData = categoriesData.length > 0 ? categoriesData : [
        {
            id: 1,
            title: "Hambúrguers",
            data: [
                {
                    id: 101,
                    title: "Royal Burger",
                    description: "Pão biroche, 180g de carne, queijo cheddar, alface, tomate",
                    price: "R$ 32,90",
                    deliveryTime: "25-35 min",
                    deliveryPrice: "R$ 5,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 1,
                    isAvailable: true
                },
                {
                    id: 102,
                    title: "Classic Cheese",
                    description: "Hambúrguer clássico com queijo especial da casa",
                    price: "R$ 28,90",
                    deliveryTime: "20-30 min",
                    deliveryPrice: "R$ 4,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 1,
                    isAvailable: true
                },
                {
                    id: 103,
                    title: "Bacon Supreme",
                    description: "Burger com bacon crocante e molho especial",
                    price: "R$ 35,90",
                    deliveryTime: "30-40 min",
                    deliveryPrice: "R$ 5,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 1,
                    isAvailable: true
                }
            ]
        },
        {
            id: 2,
            title: "Bebidas",
            data: [
                {
                    id: 201,
                    title: "Coca-Cola 350ml",
                    description: "Refrigerante gelado",
                    price: "R$ 6,50",
                    deliveryTime: "10-15 min",
                    deliveryPrice: "R$ 3,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 2,
                    isAvailable: true
                },
                {
                    id: 202,
                    title: "Suco Natural",
                    description: "Suco de laranja natural 500ml",
                    price: "R$ 8,90",
                    deliveryTime: "15-20 min",
                    deliveryPrice: "R$ 3,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 2,
                    isAvailable: true
                }
            ]
        },
        {
            id: 3,
            title: "Sobremesas",
            data: [
                {
                    id: 301,
                    title: "Brownie com Sorvete",
                    description: "Brownie quente com bola de sorvete de baunilha",
                    price: "R$ 15,90",
                    deliveryTime: "15-20 min",
                    deliveryPrice: "R$ 4,00",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 3,
                    isAvailable: true
                },
                {
                    id: 302,
                    title: "Milkshake Chocolate",
                    description: "Milkshake cremoso de chocolate com chantilly",
                    price: "R$ 12,90",
                    deliveryTime: "10-15 min",
                    deliveryPrice: "R$ 3,50",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 3,
                    isAvailable: true
                },
                {
                    id: 303,
                    title: "Sorvete de Ricota",
                    description: "Um delicioso sorvete de Ricota com Chocolate",
                    price: "R$ 10,90",
                    deliveryTime: "10-15 min",
                    deliveryPrice: "R$ 3,50",
                    imageSource: { uri: 'https://via.placeholder.com/120x100' },
                    categoryId: 3,
                    isAvailable: true
                }
            ]
        },
    ];

    // Transformar dados em lista plana usando dados reais da API
    const flattenedData = [];
    const dataToUse = categories.length > 0 ? categories : mockData;
    
    dataToUse.forEach((category, categoryIndex) => {
        flattenedData.push({
            type: 'categoryHeader',
            categoryIndex,
            category: category,
            id: `header-${category.id}`
        });

        // Usar produtos da API se disponíveis, senão usar dados mock
        const categoryProducts = products[category.id] || category.data || [];
        categoryProducts.forEach((item) => {
            // Construir URL da imagem
            const imageUrl = item.image_url ? 
                `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${item.id}` : 
                null;
            
            // Debug: log da URL da imagem
            console.log(`[DEBUG] Produto ${item.id}:`, {
                name: item.name,
                hasImageUrl: !!item.image_url,
                imageUrl: item.image_url,
                constructedUrl: imageUrl
            });

            // Transformar produto da API para o formato esperado pelo CardItemHorizontal
            const formattedItem = {
                id: item.id,
                title: item.name,
                description: item.description || 'Descrição não disponível',
                price: `R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}`,
                deliveryTime: `${item.preparation_time_minutes || 30} min`,
                deliveryPrice: 'R$ 5,00', // Valor fixo por enquanto
                imageSource: imageUrl ? { uri: imageUrl } : null,
                categoryId: item.category_id,
                isAvailable: item.is_active !== false
            };

            flattenedData.push({
                type: 'item',
                categoryIndex,
                item: formattedItem,
                id: `item-${item.id}`
            });
        });
    });


    const scrollToCategory = async (categoryIndex) => {
        // Atualizar categoria imediatamente
        setActiveCategory(categoryIndex);

        const category = categories[categoryIndex];
        if (category && !products[category.id]) {
            // Carregar produtos da categoria se ainda não foram carregados
            await loadProductsForCategory(category.id);
        }

        const headerIndex = flattenedData.findIndex(
            item => item.type === 'categoryHeader' && item.categoryIndex === categoryIndex
        );

        if (headerIndex !== -1) {
            try {
                flatListRef.current?.scrollToIndex({
                    index: headerIndex,
                    animated: true,
                    viewOffset: 0,
                });
            } catch (error) {
                // Fallback para scrollToOffset com animação suave
                const estimatedOffset = headerIndex * 200; // Estimativa baseada na altura média dos itens
                flatListRef.current?.scrollToOffset({
                    offset: estimatedOffset,
                    animated: true,
                });
            }
        }
    };

    // Função de scroll para detectar quando mostrar a barra de categorias
    const handleScroll = (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(currentScrollY);
        
        // Mostrar barra de categorias quando o usuário rolar até a posição da primeira categoria
        const shouldShow = currentScrollY >= firstCategoryPosition - 100; // 100px de margem
        if (shouldShow !== showCategoryBar) {
            setShowCategoryBar(shouldShow);
        }
    };

    // Calcular posição da primeira categoria
    const calculateFirstCategoryPosition = () => {
        // Estimar a posição baseada na altura dos componentes
        const screenHeight = Dimensions.get('window').height;
        const headerHeight = 105; // Altura do header
        const carouselHeight = 200; // Altura estimada do carousel
        const viewCardHeight = 300; // Altura estimada dos ViewCardItem (3 seções)
        const padding = 50; // Padding e espaçamentos
        
        return headerHeight + carouselHeight + viewCardHeight + padding;
    };

    // Atualizar posição da primeira categoria quando os dados carregam
    useEffect(() => {
        if (!loading && categories.length > 0) {
            const position = calculateFirstCategoryPosition();
            setFirstCategoryPosition(position);
        }
    }, [loading, categories]);

    // Detectar mudança de categoria automaticamente ao rolar
    const handleViewableItemsChanged = ({ viewableItems }) => {
        // Limpar timeout anterior
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Debounce de 100ms para evitar piscar
        debounceTimeoutRef.current = setTimeout(() => {
            const visibleHeaders = viewableItems.filter(item =>
                item.item.type === 'categoryHeader' && item.isViewable
            );

            if (visibleHeaders.length > 0) {
                // Pegar o primeiro header visível
                const header = visibleHeaders[0];
                const newActiveCategory = header.item.categoryIndex;
                if (newActiveCategory !== activeCategory) {
                    setActiveCategory(newActiveCategory);
                }
            } else {
                // Se não há headers visíveis, desmarcar categoria
                if (activeCategory !== -1) {
                    setActiveCategory(-1);
                }
            }
        }, 100);
    };


    const renderItem = ({ item }) => {
        if (item.type === 'categoryHeader') {
            return (
                <View>
                    {/* Barra de categorias flutuante - só aparece na primeira categoria */}
                    {item.categoryIndex === 0 && showCategoryBar && (
                        <View style={styles.floatingCategoryBar}>
                            <FontAwesome name="bars" size={20} color="#888888" style={styles.menuIcon} />
                            <FlatList
                                ref={categoryListRef}
                                data={dataToUse}
                                renderItem={renderCategoryTab}
                                keyExtractor={(item) => item.id.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoriesContainer}
                            />
                        </View>
                    )}
                    
                    <View style={styles.categoryHeader}>
                        <Text style={styles.categoryHeaderText}>{item.category.name || item.category.title}</Text>
                        {loadingProducts && activeCategory === item.categoryIndex && (
                            <ActivityIndicator size="small" color="#333" style={styles.loadingIndicator} />
                        )}
                    </View>
                </View>
            );
        } else {
            return (
                <CardItemHorizontal
                    title={item.item.title}
                    description={item.item.description}
                    price={item.item.price}
                    deliveryTime={item.item.deliveryTime}
                    deliveryPrice={item.item.deliveryPrice}
                    imageSource={item.item.imageSource}
                    isAvailable={item.item.isAvailable}
                    productId={item.item.id}
                    navigation={navigation}
                    onPress={() => onItemPress(item.item)}
                />
            );
        }
    };

    const renderCategoryTab = ({ item, index }) => {
        const isActive = activeCategory === index;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryTab,
                    isActive && styles.activeCategoryTab
                ]}
                onPress={() => scrollToCategory(index)}
                activeOpacity={1} // Sem efeito de opacidade
            >
                <Text
                    style={[
                        styles.categoryTabText,
                        isActive && styles.activeCategoryTabText
                    ]}
                    numberOfLines={1}
                >
                    {item.name || item.title}
                </Text>
            </TouchableOpacity>
        );
    };


    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>Carregando categorias...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Lista principal */}
            <FlatList
                ref={flatListRef}
                data={flattenedData}
                renderItem={renderItem}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={handleViewableItemsChanged}
                ListHeaderComponent={ListHeaderComponent}
                contentContainerStyle={[
                    styles.listContent,
                    showFixedButton && styles.listWithButton
                ]}
                ItemSeparatorComponent={({ leadingItem }) =>
                    leadingItem.type === 'item' ? <View style={styles.itemSeparator} /> : null
                }
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    floatingCategoryBar: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    menuIcon: {
        marginRight: 12,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 15,
        minWidth: 100,
        backgroundColor: 'transparent',
    },
    activeCategoryTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#333',
    },
    categoryTabText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '400',
        textAlign: 'center',
    },
    activeCategoryTabText: {
        color: '#333',
        fontWeight: '600',
    },
    categoryHeader: {
        backgroundColor: '#F6F6F6',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginTop: 10,
    },
    categoryHeaderText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 20,
        paddingRight: 0,
    },
    listWithButton: {
        paddingBottom: 100,
    },
    itemSeparator: {
        height: 12,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    loadingIndicator: {
        marginLeft: 10,
    },
});