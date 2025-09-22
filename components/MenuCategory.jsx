import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CardItemHorizontal from "./CardItemHorizontal";

export default function MenuCategory({
                                         categoriesData = [],
                                         ListHeaderComponent = null,
                                         showFixedButton = false,
                                         onCategoryPress = () => {},
                                         onItemPress = () => {}
                                     }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [showStickyHeader, setShowStickyHeader] = useState(false);
    const flatListRef = useRef(null);
    const categoryListRef = useRef(null);

    // Valores animados
    const headerAnimatedValue = useRef(new Animated.Value(0)).current;
    const slideAnimatedValue = useRef(new Animated.Value(-70)).current; // Começa fora da tela
    const opacityAnimatedValue = useRef(new Animated.Value(0)).current;

    // Dados mock
    const mockData = categoriesData.length > 0 ? categoriesData : [
        {
            id: 1,
            title: "Hambúrguers",
            data: [
                {
                    id: 101,
                    title: "Royal Burger",
                    description: "Pão brioche, 180g de carne, queijo cheddar, alface, tomate",
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

    // Transformar dados em lista plana
    const flattenedData = [];
    mockData.forEach((category, categoryIndex) => {
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

    // Detectar quando mostrar header sticky com animação
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
                    onPress={() => onItemPress(item.item)}
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
                data={mockData}
                renderItem={renderCategoryTab}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
            />
        </Animated.View>
    );

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
});