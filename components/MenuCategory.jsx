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
    Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CardItemHorizontal from "./CardItemHorizontal";
import { getMenuCategories } from '../services/menuService';
import { getAllProducts } from '../services/productService';

export default function MenuCategory({
                                         ListHeaderComponent = null,
                                         showFixedButton = false,
                                         onCategoryPress = () => {},
                                         onItemPress = () => {},
                                         navigation = null
                                     }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [showStickyHeader, setShowStickyHeader] = useState(false);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    
    const flatListRef = useRef(null);
    const categoryListRef = useRef(null);

    // Valores animados
    const headerAnimatedValue = useRef(new Animated.Value(0)).current;
    const slideAnimatedValue = useRef(new Animated.Value(-70)).current; // Começa fora da tela
    const opacityAnimatedValue = useRef(new Animated.Value(0)).current;

    // Função para buscar categorias da API
    const fetchCategories = async () => {
        try {
            const response = await getMenuCategories();
            const categoriesData = response.items || response || [];
            setCategories(categoriesData);
            return categoriesData;
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            Alert.alert('Erro', 'Não foi possível carregar as categorias');
            return [];
        }
    };

    // Função para buscar produtos da API
    const fetchProducts = async (page = 1, categoryId = null, reset = false) => {
        try {
            setLoadingMore(true);
            
            const filters = {
                page: page,
                page_size: 20,
                include_inactive: false
            };
            
            if (categoryId) {
                filters.category_id = categoryId;
            }
            
            const response = await getAllProducts(filters);
            const productsData = response.items || [];
            
            if (reset) {
                setProducts(productsData);
            } else {
                setProducts(prev => [...prev, ...productsData]);
            }
            
            // Verificar se há mais páginas
            const totalPages = response.pagination?.total_pages || 1;
            setHasMore(page < totalPages);
            setCurrentPage(page);
            
            return productsData;
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            Alert.alert('Erro', 'Não foi possível carregar os produtos');
            return [];
        } finally {
            setLoadingMore(false);
        }
    };

    // Função para mapear produto da API para o formato do componente
    const mapProductFromAPI = (product) => {
        return {
            id: product.id,
            title: product.name,
            description: product.description || 'Sem descrição',
            price: `R$ ${parseFloat(product.price || 0).toFixed(2).replace('.', ',')}`,
            deliveryTime: `${product.preparation_time_minutes || 0}-${(product.preparation_time_minutes || 0) + 10} min`,
            deliveryPrice: "R$ 5,00", // Valor fixo por enquanto
            imageSource: product.image_url ? { uri: product.image_url } : { uri: 'https://via.placeholder.com/120x100' },
            categoryId: product.category_id,
            isAvailable: product.is_active !== false
        };
    };

    // Função para agrupar produtos por categoria
    const groupProductsByCategory = (products, categories) => {
        const grouped = {};
        
        // Inicializar todas as categorias
        categories.forEach(category => {
            grouped[category.id] = {
                id: category.id,
                title: category.name,
                data: []
            };
        });
        
        // Adicionar produtos às suas categorias
        products.forEach(product => {
            const mappedProduct = mapProductFromAPI(product);
            if (mappedProduct.categoryId && grouped[mappedProduct.categoryId]) {
                grouped[mappedProduct.categoryId].data.push(mappedProduct);
            }
        });
        
        // Filtrar categorias que têm produtos
        return Object.values(grouped).filter(category => category.data.length > 0);
    };

    // useEffect para carregar dados iniciais
    useEffect(() => {
        loadInitialData();
    }, []);

    // Função para carregar dados iniciais
    const loadInitialData = async () => {
        try {
            setLoading(true);
            const categoriesData = await fetchCategories();
            await fetchProducts(1, null, true);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        } finally {
            setLoading(false);
        }
    };

    // Função para filtrar produtos por categoria
    const filterProductsByCategory = (categoryId) => {
        setSelectedCategoryId(categoryId);
        setActiveCategory(categoryId ? categories.findIndex(cat => cat.id === categoryId) : 0);
        setProducts([]);
        setCurrentPage(1);
        setHasMore(true);
        fetchProducts(1, categoryId, true);
    };

    // Função para carregar mais produtos (scroll infinito)
    const loadMoreProducts = () => {
        if (!loadingMore && hasMore) {
            fetchProducts(currentPage + 1, selectedCategoryId, false);
        }
    };

    // Dados agrupados por categoria
    const groupedData = groupProductsByCategory(products, categories);

    // Transformar dados em lista plana
    const flattenedData = [];
    groupedData.forEach((category, categoryIndex) => {
        flattenedData.push({
            type: 'categoryHeader',
            categoryIndex,
            category: category,
            id: `header-${category.id}`
        });

        category.data.forEach((item) => {
            flattenedData.push({
                type: 'item',
                categoryIndex,
                item: item,
                id: `item-${item.id}`
            });
        });
    });

    // Animação para mostrar/esconder header
    const animateHeaderShow = () => {
        Animated.parallel([
            Animated.timing(slideAnimatedValue, {
                toValue: 0, // Desliza para posição normal
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnimatedValue, {
                toValue: 1, // Fade in
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateHeaderHide = () => {
        Animated.parallel([
            Animated.timing(slideAnimatedValue, {
                toValue: -70, // Desliza para fora da tela
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnimatedValue, {
                toValue: 0, // Fade out
                duration: 200,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const scrollToCategory = (categoryIndex) => {
        setActiveCategory(categoryIndex);

        // Se for a primeira categoria (índice 0), mostrar todos os produtos
        if (categoryIndex === 0) {
            filterProductsByCategory(null);
            return;
        }

        // Filtrar por categoria específica
        const category = categories[categoryIndex - 1]; // -1 porque "Todos" é o índice 0
        if (category) {
            filterProductsByCategory(category.id);
        }

        const headerIndex = flattenedData.findIndex(
            item => item.type === 'categoryHeader' && item.categoryIndex === categoryIndex
        );

        if (headerIndex !== -1) {
            try {
                flatListRef.current?.scrollToIndex({
                    index: headerIndex,
                    animated: true,
                    viewOffset: 70,
                });
            } catch (error) {
                // Fallback para scrollToOffset se scrollToIndex falhar
                flatListRef.current?.scrollToOffset({
                    offset: headerIndex * 200, // Estimativa aproximada
                    animated: true,
                });
            }
        }

        try {
            categoryListRef.current?.scrollToIndex({
                index: categoryIndex,
                animated: true,
                viewPosition: 0.5,
            });
        } catch (error) {
            // Fallback para scrollToOffset se scrollToIndex falhar
            categoryListRef.current?.scrollToOffset({
                offset: categoryIndex * 120, // Estimativa aproximada
                animated: true,
            });
        }
    };

    // Detectar quando mostrar header sticky com animação e scroll infinito
    const handleScroll = (event) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const headerHeight = ListHeaderComponent ? 1000 : 0;
        const shouldShowHeader = scrollY > headerHeight;

        // Atualizar valor animado para scroll
        headerAnimatedValue.setValue(scrollY);

        if (shouldShowHeader !== showStickyHeader) {
            setShowStickyHeader(shouldShowHeader);

            if (shouldShowHeader) {
                animateHeaderShow();
            } else {
                animateHeaderHide();
            }
        }

        // Scroll infinito - carregar mais produtos quando próximo do fim
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 1000;
        
        if (isCloseToBottom && !loadingMore && hasMore) {
            loadMoreProducts();
        }
    };

    // Função para tratar falhas no scrollToIndex
    const onScrollToIndexFailed = (info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewOffset: 70,
            });
        });
    };

    // Detectar mudança de categoria automaticamente
    const handleViewableItemsChanged = ({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const visibleHeaders = viewableItems.filter(item =>
                item.item.type === 'categoryHeader'
            );

            if (visibleHeaders.length > 0) {
                const newActiveCategory = visibleHeaders[0].item.categoryIndex;
                if (newActiveCategory !== activeCategory) {
                    setActiveCategory(newActiveCategory);

                    // Animação suave na mudança de categoria
                    try {
                        categoryListRef.current?.scrollToIndex({
                            index: newActiveCategory,
                            animated: true,
                            viewPosition: 0.5
                        });
                    } catch (error) {
                        // Fallback para scrollToOffset se scrollToIndex falhar
                        categoryListRef.current?.scrollToOffset({
                            offset: newActiveCategory * 120, // Estimativa aproximada
                            animated: true,
                        });
                    }
                }
            }
        }
    };

    const renderItem = ({ item }) => {
        if (item.type === 'categoryHeader') {
            return (
                <View style={styles.categoryHeader}>
                    <Text style={styles.categoryHeaderText}>{item.category.title}</Text>
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
                    onPress={() => {
                        if (navigation) {
                            navigation.navigate('Produto', { produto: item.item });
                        } else {
                            onItemPress(item.item);
                        }
                    }}
                />
            );
        }
    };

    const renderCategoryTab = ({ item, index }) => {
        //  Animação de escala no botão ativo
        const isActive = activeCategory === index;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryTab,
                    isActive && styles.activeCategoryTab
                ]}
                onPress={() => scrollToCategory(index)}
                activeOpacity={0.7}
            >
                <Animated.Text
                    style={[
                        styles.categoryTabText,
                        isActive && styles.activeCategoryTabText,
                        {
                            transform: [{
                                scale: isActive ? 1.05 : 1
                            }]
                        }
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Animated.Text>
            </TouchableOpacity>
        );
    };

    // Preparar dados para as tabs de categoria (incluindo "Todos")
    const categoryTabsData = [
        { id: 'all', title: 'Todos' },
        ...categories.map(cat => ({ id: cat.id, title: cat.name }))
    ];

    // Header sticky animado
    const AnimatedStickyHeader = () => (
        <Animated.View
            style={[
                styles.stickyHeader,
                {
                    transform: [{
                        translateY: slideAnimatedValue
                    }],
                    opacity: opacityAnimatedValue,
                }
            ]}
            pointerEvents={showStickyHeader ? 'auto' : 'none'}
        >
            <FontAwesome name="bars" size={20} color="#888888" style={styles.menuIcon} />
            <FlatList
                ref={categoryListRef}
                data={categoryTabsData}
                renderItem={renderCategoryTab}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
            />
        </Animated.View>
    );

    // Loading inicial
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Carregando cardápio...</Text>
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
                keyExtractor={(item) => item.id}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={handleViewableItemsChanged}
                onScrollToIndexFailed={onScrollToIndexFailed}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={() => (
                    loadingMore ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color="#007bff" />
                            <Text style={styles.loadingMoreText}>Carregando mais produtos...</Text>
                        </View>
                    ) : null
                )}
                contentContainerStyle={[
                    styles.listContent,
                    showFixedButton && styles.listWithButton
                ]}
                ItemSeparatorComponent={({ leadingItem }) =>
                    leadingItem.type === 'item' ? <View style={styles.itemSeparator} /> : null
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Header sticky animado */}
            <AnimatedStickyHeader />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    menuIcon: {
        marginRight: 12,
    },
    categoriesContainer: {
        paddingRight: 15,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 15,
        minWidth: 100,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    activeCategoryTab: {
        backgroundColor: '#F0F0F0',
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
        paddingTop: 70,
        paddingBottom: 20,
        paddingRight: 10,

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
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingMoreText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
});