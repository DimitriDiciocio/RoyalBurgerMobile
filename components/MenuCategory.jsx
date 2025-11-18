import React, { useState, useRef, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
import { filterProductsWithStock } from '../services/productService';
import { getPromotionByProductId } from '../services/promotionService';
import api from '../services/api';


export default function MenuCategory({
                                         categoriesData = [],
                                         ListHeaderComponent = null,
                                         showFixedButton = false,
                                         onCategoryPress = () => {},
                                         onItemPress = () => {},
                                         navigation = null
                                     }) {
    const [activeCategory, setActiveCategory] = useState(-1); // -1 = nenhuma categoria selecionada
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showCategoryBar, setShowCategoryBar] = useState(false);
    const [firstCategoryPosition, setFirstCategoryPosition] = useState(0);
    const [isSticky, setIsSticky] = useState(false);
    const [firstCategoryLayout, setFirstCategoryLayout] = useState(null);
    const [error, setError] = useState(null);
    const flatListRef = useRef(null);
    const categoryListRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const firstCategoryHeaderRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const stickyAnimatedValue = useRef(new Animated.Value(0)).current;
    const isFocused = useIsFocused(); // ALTERAÇÃO: para recarregar promoções quando a tela receber foco

    // Carregar categorias da API
    useEffect(() => {
        loadCategories();
    }, []);

    // Carregar produtos de todas as categorias quando as categorias carregarem
    useEffect(() => {
        if (categories.length > 0) {
            loadAllProducts();
        }
    }, [categories]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllCategories();
            const categoriesList = response.items || response;
            setCategories(categoriesList);
            
            // Define a primeira categoria como ativa, mas não carrega produtos ainda
            if (categoriesList.length > 0) {
                setActiveCategory(0);
            }
        } catch (error) {
            setCategories([]);
            setError('Não foi possível carregar as categorias.');
        } finally {
            setLoading(false);
        }
    };

    const loadProductsForCategory = async (categoryId) => {
        try {
            setLoadingProducts(true);
            // ALTERAÇÃO: Filtrar produtos indisponíveis na API
            const response = await getProductsByCategory(categoryId, { 
                page_size: 50,
                filter_unavailable: true // Filtrar produtos sem estoque na API
            });
            
            // A resposta da API retorna { category: {...}, items: [...], pagination: {...} }
            // Mas pode vir em diferentes formatos, então verificamos múltiplas possibilidades
            let products = [];
            if (response) {
                if (Array.isArray(response.items)) {
                    products = response.items;
                } else if (Array.isArray(response)) {
                    // Se a resposta for diretamente um array
                    products = response;
                } else if (response.data && Array.isArray(response.data.items)) {
                    // Se estiver aninhado em data
                    products = response.data.items;
                } else if (response.data && Array.isArray(response.data)) {
                    // Se data for diretamente um array
                    products = response.data;
                }
            }
            
            // ALTERAÇÃO: Filtrar apenas produtos ativos
            const activeProducts = products.filter((product) => {
                const isActive = product.is_active !== false && 
                                product.is_active !== 0 && 
                                product.is_active !== "false";
                return isActive;
            });
            
            // ALTERAÇÃO: Validar estoque de cada produto e adicionar availability_status
            // Isso garante que produtos sem estoque não sejam exibidos mesmo se passarem pelo filtro da API
            const validatedProducts = await filterProductsWithStock(activeProducts);
            
            setProducts(prev => ({
                ...prev,
                [categoryId]: validatedProducts
            }));
        } catch (error) {
            setProducts(prev => ({
                ...prev,
                [categoryId]: []
            }));
        } finally {
            setLoadingProducts(false);
        }
    };

    // Carregar produtos de todas as categorias de uma vez
    const loadAllProducts = async () => {
        try {
            setLoadingProducts(true);
            
            // Carrega produtos de todas as categorias em paralelo
            const productPromises = categories.map(async (category) => {
                try {
                    // ALTERAÇÃO: Filtrar produtos indisponíveis na API
                    const response = await getProductsByCategory(category.id, { 
                        page_size: 50,
                        filter_unavailable: true // Filtrar produtos sem estoque na API
                    });
                    
                    // A resposta da API retorna { category: {...}, items: [...], pagination: {...} }
                    // Mas pode vir em diferentes formatos, então verificamos múltiplas possibilidades
                    let products = [];
                    if (response) {
                        if (Array.isArray(response.items)) {
                            products = response.items;
                        } else if (Array.isArray(response)) {
                            // Se a resposta for diretamente um array
                            products = response;
                        } else if (response.data && Array.isArray(response.data.items)) {
                            // Se estiver aninhado em data
                            products = response.data.items;
                        } else if (response.data && Array.isArray(response.data)) {
                            // Se data for diretamente um array
                            products = response.data;
                        }
                    }
                    
                    // ALTERAÇÃO: Filtrar apenas produtos ativos
                    const activeProducts = products.filter((product) => {
                        const isActive = product.is_active !== false && 
                                        product.is_active !== 0 && 
                                        product.is_active !== "false";
                        return isActive;
                    });
                    
                    // ALTERAÇÃO: Validar estoque de cada produto e adicionar availability_status
                    // Isso garante que produtos sem estoque não sejam exibidos mesmo se passarem pelo filtro da API
                    const validatedProducts = await filterProductsWithStock(activeProducts);
                    
                    return {
                        categoryId: category.id,
                        products: validatedProducts
                    };
                } catch (error) {
                    return {
                        categoryId: category.id,
                        products: []
                    };
                }
            });

            const results = await Promise.all(productPromises);
            
            // Atualiza o estado com todos os produtos
            const allProducts = {};
            results.forEach(({ categoryId, products }) => {
                allProducts[categoryId] = products;
            });
            
            setProducts(allProducts);
        } catch (error) {
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

    // ALTERAÇÃO: Estado para armazenar promoções dos produtos
    const [productPromotions, setProductPromotions] = useState({});

    // ALTERAÇÃO: Buscar promoções para todos os produtos em um useEffect separado
    // Adicionado isFocused para recarregar promoções quando a tela receber foco (atualiza em tempo real)
    useEffect(() => {
        const fetchPromotions = async () => {
            // Coletar todos os IDs de produtos únicos
            const allProductIds = [];
            Object.values(products).forEach(categoryProducts => {
                if (Array.isArray(categoryProducts)) {
                    categoryProducts.forEach(product => {
                        if (product?.id && !allProductIds.includes(product.id)) {
                            allProductIds.push(product.id);
                        }
                    });
                }
            });

            if (allProductIds.length === 0) return;

            // Buscar promoções para todos os produtos em paralelo
            const promotionsMap = {};
            const promotionsResults = await Promise.allSettled(
                allProductIds.map(async (productId) => {
                    try {
                        const promotion = await getPromotionByProductId(productId);
                        return { productId, promotion };
                    } catch (error) {
                        // Ignora erros ao buscar promoção (produto pode não ter promoção)
                        return { productId, promotion: null };
                    }
                })
            );

            promotionsResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { productId, promotion } = result.value;
                    if (promotion) {
                        promotionsMap[productId] = promotion;
                    } else {
                        // ALTERAÇÃO: Remove promoção do mapa se não existir mais (para atualizar quando promoção é removida)
                        promotionsMap[productId] = null;
                    }
                }
            });

            setProductPromotions(promotionsMap);
        };

        if (Object.keys(products).length > 0) {
            fetchPromotions();
        }
    }, [products, isFocused]); // ALTERAÇÃO: adicionado isFocused para recarregar quando a tela receber foco

    // Transformar dados em lista plana usando dados reais da API
    const flattenedData = [];
    const dataToUse = categories;
    const visibleCategories = [];
    let visibleCategoryIndex = 0;
    
    dataToUse.forEach((category, originalIndex) => {
        // Usar produtos da API se disponíveis, senão usar dados mock
        const categoryProducts = products[category.id] || [];
        
        // Filtrar apenas itens ativos
        const activeProducts = categoryProducts.filter(item => 
            item?.is_active !== false && item?.isAvailable !== false
        );
        
        // Só adiciona o header se houver produtos ativos
        if (activeProducts.length > 0) {
            // Adiciona categoria visível para a barra
            visibleCategories.push({
                ...category,
                originalIndex,
                visibleIndex: visibleCategoryIndex
            });

            flattenedData.push({
                type: 'categoryHeader',
                categoryIndex: visibleCategoryIndex,
                category: category,
                id: `header-${category.id}`
            });

            // ALTERAÇÃO: Processar produtos com promoções do estado
            activeProducts.forEach((item) => {
                const promotion = productPromotions[item.id] || null;
                
                // ALTERAÇÃO: availability_status já vem validado do filterProductsWithStock
                // Produtos indisponíveis já foram filtrados, então todos aqui estão disponíveis
                let availabilityStatus = item.availability_status || 'unknown';
                
                // ALTERAÇÃO: Se availability_status não estiver presente, calcular baseado em max_quantity
                if (!availabilityStatus && item.max_quantity !== undefined && item.max_quantity !== null) {
                    if (item.max_quantity <= 5) {
                        availabilityStatus = 'limited';
                    } else if (item.max_quantity <= 15) {
                        availabilityStatus = 'low_stock';
                    } else {
                        availabilityStatus = 'available';
                    }
                }
                
                const imageUrl = item?.id
                    ? `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${item.id}`
                    : null;
                
                // ALTERAÇÃO: Calcular preço com desconto se houver promoção
                const basePrice = parseFloat(item.price || 0);
                let finalPrice = basePrice;
                let discountPercentage = null;
                
                if (promotion) {
                    // Priorizar discount_percentage se disponível
                    if (promotion.discount_percentage && parseFloat(promotion.discount_percentage) > 0) {
                        discountPercentage = parseFloat(promotion.discount_percentage);
                        finalPrice = basePrice * (1 - discountPercentage / 100);
                    } else if (promotion.discount_value && parseFloat(promotion.discount_value) > 0) {
                        const discountValue = parseFloat(promotion.discount_value);
                        finalPrice = basePrice - discountValue;
                        // Calcular percentual para exibição
                        if (basePrice > 0) {
                            discountPercentage = (discountValue / basePrice) * 100;
                        }
                    }
                }
                
                const priceFormatted = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
                const originalPriceFormatted = promotion ? `R$ ${basePrice.toFixed(2).replace('.', ',')}` : null;
                
                // Transformar produto da API para o formato esperado pelo CardItemHorizontal
                const formattedItem = {
                    id: item.id,
                    name: item.name, // ALTERAÇÃO: adiciona campo name para compatibilidade com tela de produto
                    title: item.name,
                    description: item.description || 'Descrição não disponível',
                    price: priceFormatted, // Preço final (com desconto se houver)
                    originalPrice: originalPriceFormatted, // Preço original (apenas se houver promoção)
                    discountPercentage: discountPercentage ? Math.round(discountPercentage) : null, // Percentual de desconto arredondado
                    deliveryTime: `${item.preparation_time_minutes || 30} min`,
                    deliveryPrice: 'R$ 5,00', // Valor fixo por enquanto
                    imageSource: imageUrl ? { uri: imageUrl } : null,
                    categoryId: item.category_id,
                    promotion: promotion, // ALTERAÇÃO: Passa objeto completo da promoção
                    // ALTERAÇÃO: Produtos já foram validados, então todos estão disponíveis
                    isAvailable: true,
                    availabilityStatus: availabilityStatus, // Passa o status para badges
                    max_quantity: item.max_quantity // Passa max_quantity para badges
                };

                flattenedData.push({
                    type: 'item',
                    categoryIndex: visibleCategoryIndex,
                    item: formattedItem,
                    id: `item-${item.id}`
                });
            });
            
            visibleCategoryIndex++;
        }
    });


    const scrollToCategory = async (categoryIndex) => {
        // Atualizar categoria imediatamente
        setActiveCategory(categoryIndex);

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

    // Função para medir a posição da primeira categoria no layout
    const handleFirstCategoryLayout = (event) => {
        const { y, height } = event.nativeEvent.layout;
        if (!firstCategoryLayout || firstCategoryLayout.y !== y) {
            setFirstCategoryLayout({ y, height });
        }
    };

    // Função de scroll para detectar quando mostrar a barra de categorias e quando ficar sticky
    const handleScroll = (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(currentScrollY);
        
        // Mostrar barra de categorias quando o usuário rolar até a posição da primeira categoria
        const shouldShow = currentScrollY >= firstCategoryPosition - 100; // 100px de margem
        if (shouldShow !== showCategoryBar) {
            setShowCategoryBar(shouldShow);
        }
        
        // Detectar quando a barra deve ficar sticky
        // A barra fica sticky quando o primeiro categoryHeader realmente encosta no topo
        // Usando offset bem grande para só ativar quando visualmente passar do topo
        const STICKY_THRESHOLD = firstCategoryPosition + 555; 
        const UNSTICKY_THRESHOLD = STICKY_THRESHOLD - 1; // Hysteresis de 150px
        
        if (currentScrollY >= STICKY_THRESHOLD) {
            if (!isSticky) {
                setIsSticky(true);
                Animated.timing(stickyAnimatedValue, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }).start();
            }
        } else if (currentScrollY < UNSTICKY_THRESHOLD) {
            if (isSticky) {
                setIsSticky(false);
                Animated.timing(stickyAnimatedValue, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }).start();
            }
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
                <View
                    ref={item.categoryIndex === 0 ? firstCategoryHeaderRef : null}
                    onLayout={item.categoryIndex === 0 ? handleFirstCategoryLayout : null}
                >
                    {/* Barra de categorias flutuante - só aparece na primeira categoria */}
                    {item.categoryIndex === 0 && showCategoryBar && !isSticky && (
                        <View style={styles.floatingCategoryBar}>
                            <FontAwesome name="bars" size={20} color="#888888" style={styles.menuIcon} />
                            <FlatList
                                ref={categoryListRef}
                                data={visibleCategories}
                                renderItem={renderCategoryTab}
                                keyExtractor={(item) => item.id.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoriesContainer}
                            />
                        </View>
                    )}
                    
                    {/* Espaço em branco quando a barra fica sticky */}
                    {item.categoryIndex === 0 && isSticky && (
                        <View style={styles.stickyPlaceholder} />
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
                    originalPrice={item.item.originalPrice} // ALTERAÇÃO: passa preço original para exibir riscado
                    discountPercentage={item.item.discountPercentage} // ALTERAÇÃO: passa percentual de desconto para badge
                    deliveryTime={item.item.deliveryTime}
                    deliveryPrice={item.item.deliveryPrice}
                    imageSource={item.item.imageSource}
                    isAvailable={item.item.isAvailable}
                    productId={item.item.id}
                    produto={item.item} // ALTERAÇÃO: passa objeto completo para exibição imediata na tela de produto
                    navigation={navigation}
                    onPress={() => onItemPress(item.item)}
                    availabilityStatus={item.item.availabilityStatus} // ALTERAÇÃO: passa status de disponibilidade para badges
                    max_quantity={item.item.max_quantity} // ALTERAÇÃO: passa quantidade máxima para badges
                />
            );
        }
    };

    const renderCategoryTab = ({ item, index }) => {
        const isActive = activeCategory === item.visibleIndex;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryTab,
                    isActive && styles.activeCategoryTab
                ]}
                onPress={() => scrollToCategory(item.visibleIndex)}
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

    if (error) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.loadingText}>{error}</Text>
                <TouchableOpacity
                    style={[styles.addExtrasButton, { marginTop: 12 }]}
                    onPress={loadCategories}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addExtrasButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Barra de categorias sticky - aparece quando isSticky é true E já fez scroll */}
            {isSticky && scrollY._value > 0 && (
                <Animated.View 
                    style={[
                        styles.stickyCategoryBar,
                        {
                            opacity: stickyAnimatedValue,
                        }
                    ]}
                >
                    <FontAwesome name="bars" size={20} color="#888888" style={styles.menuIcon} />
                    <FlatList
                        ref={categoryListRef}
                        data={visibleCategories}
                        renderItem={renderCategoryTab}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    />
                </Animated.View>
            )}
            
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
    stickyPlaceholder: {
        height: 44, // paddingVertical 12 + 12 = 24 + altura aproximada da barra
        marginBottom: 10,
    },
    stickyCategoryBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
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