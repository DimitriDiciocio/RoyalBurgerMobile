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
    const [activeCategory, setActiveCategory] = useState(-1); // -1 = nenhuma categoria selecionada
    const flatListRef = useRef(null);
    const categoryListRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

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


    const scrollToCategory = (categoryIndex) => {
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

    // Função de scroll (vazia por enquanto)
    const handleScroll = (event) => {
        // Pode ser usada para futuras funcionalidades
    };

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
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
    };


    return (
        <View style={styles.container}>
            {/* Barra de categorias fixa no topo */}
            <View style={styles.fixedCategoryBar}>
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
            </View>

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
    fixedCategoryBar: {
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
        paddingRight: 10,
    },
    listWithButton: {
        paddingBottom: 100,
    },
    itemSeparator: {
        height: 12,
    },
});