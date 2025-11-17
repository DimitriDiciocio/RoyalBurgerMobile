import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import CachedImage from './CachedImage';

export default function CardItemHorizontal({
                                               title = "Nome produto",
                                               description = "Descrição dos itens ...",
                                               price = "R$50,00",
                                               originalPrice = null, // ALTERAÇÃO: preço original (para exibir riscado quando houver promoção)
                                               discountPercentage = null, // ALTERAÇÃO: percentual de desconto para badge
                                               deliveryTime = "40 - 50 min",
                                               deliveryPrice = "R$5,00",
                                               imageSource = null,
                                               isAvailable = true,
                                               onPress = () => {},
                                               productId = null,
                                               produto = null, // ALTERAÇÃO: objeto completo do produto para exibição imediata
                                               navigation = null,
                                               availabilityStatus = null, // ALTERAÇÃO: status de disponibilidade para badges
                                               max_quantity = null // ALTERAÇÃO: quantidade máxima disponível
                                           }) {
    // ALTERAÇÃO: Função para renderizar badge de desconto
    const renderDiscountBadge = () => {
        if (discountPercentage && discountPercentage > 0) {
            return (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
                </View>
            );
        }
        return null;
    };
    // ALTERAÇÃO: Função para renderizar badge de estoque
    const renderStockBadge = () => {
        let status = String(availabilityStatus || '').toLowerCase();
        
        // ALTERAÇÃO: Se availability_status não estiver definido, calcular baseado em max_quantity
        if (!status && max_quantity !== undefined && max_quantity !== null) {
            if (max_quantity <= 5) {
                status = 'limited';
            } else if (max_quantity <= 15) {
                status = 'low_stock';
            } else {
                return null; // Não exibir badge se estoque está bom
            }
        }
        
        if (status === 'limited') {
            return (
                <View style={styles.stockBadgeLimited}>
                    <Text style={styles.stockBadgeText}>Últimas unidades</Text>
                </View>
            );
        } else if (status === 'low_stock') {
            return (
                <View style={styles.stockBadgeLow}>
                    <Text style={styles.stockBadgeText}>Estoque baixo</Text>
                </View>
            );
        }
        
        return null;
    };

    // ALTERAÇÃO: Formatação de preço (copiado do CardItemVertical)
    const formattedPrice = React.useMemo(() => {
        // ALTERAÇÃO: garante que o valor seja exibido no formato monetário brasileiro
        if (typeof price === 'number' && !Number.isNaN(price)) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2
            }).format(price);
        }

        if (typeof price === 'string') {
            const trimmed = price.trim();
            if (trimmed.startsWith('R$')) {
                return trimmed;
            }

            const numeric = Number(trimmed.replace(/[^\d,-]/g, '').replace(',', '.'));
            if (!Number.isNaN(numeric)) {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2
                }).format(numeric);
            }
        }

        return 'R$0,00';
    }, [price]);
    const handlePress = () => {
        // ALTERAÇÃO: navegação instantânea passando objeto completo do produto
        // Isso permite exibição imediata dos dados enquanto a API carrega
        if (!navigation) {
            onPress();
            return;
        }
        
        // Se tiver objeto produto completo, passa ele junto com productId
        // Isso permite que a tela mostre dados imediatamente (imagem, título, etc)
        if (produto || productId) {
            // ALTERAÇÃO: normaliza objeto produto para formato esperado pela tela
            // Se produto já tem name, usa; senão converte title para name
            const normalizedProduto = produto ? {
                ...produto,
                name: produto.name || produto.title || title,
                id: produto.id || productId
            } : {
                id: productId,
                name: title,
                description,
                price,
                imageSource
            };
            
            navigation.navigate('Produto', { 
                produto: normalizedProduto,
                productId: productId || normalizedProduto?.id
            });
        } else {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, !isAvailable && styles.unavailable]}
            onPress={handlePress}
            disabled={!isAvailable}
        >
            <View style={styles.imageWrapper}>
                {imageSource ? (
                    <CachedImage
                        style={styles.image}
                        source={imageSource}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.image} />
                )}
                {/* ALTERAÇÃO: Badge de desconto (prioridade sobre badge de estoque) */}
                {isAvailable && renderDiscountBadge()}
                {/* ALTERAÇÃO: Badge de estoque (apenas se não houver badge de desconto) */}
                {isAvailable && !discountPercentage && renderStockBadge()}
                {!isAvailable && (
                    <View style={styles.unavailableOverlay}>
                        <Text style={styles.unavailableText}>Indisponível</Text>
                    </View>
                )}
            </View>
            <View style={styles.container2}>
                <Text
                    style={[styles.title, !isAvailable && styles.unavailableText]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
                <Text
                    style={[styles.description, !isAvailable && styles.unavailableText]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {description}
                </Text>
                {/* ALTERAÇÃO: Exibir preço original riscado e novo preço em destaque quando houver promoção */}
                {originalPrice ? (
                    <View style={styles.priceContainer}>
                        <Text style={[styles.originalPrice, !isAvailable && styles.unavailableText]}>
                            {originalPrice}
                        </Text>
                        <Text style={[styles.price, !isAvailable && styles.unavailableText]}>
                            {typeof price === 'string' && price.startsWith('R$') 
                                ? price 
                                : formattedPrice}
                        </Text>
                    </View>
                ) : (
                    <Text
                        style={[styles.price, !isAvailable && styles.unavailableText]}
                    >
                        {formattedPrice}
                    </Text>
                )}
                {isAvailable && (
                    <View style={styles.containerDelivery}>
                        <Text style={styles.descriptionDel}>{deliveryTime}</Text>
                        <View style={styles.circle} />
                        <Text style={styles.descriptionDel}>{deliveryPrice}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '95%',
        height: 120,
        backgroundColor: '#fff',
        flexDirection: 'row',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        marginHorizontal: 15,
        overflow: 'hidden',
    },
    unavailable: {
        opacity: 0.6,
    },
    imageWrapper: {
        width: 120,
        height: 120,
        backgroundColor: '#D9D9D9',
        position: 'relative',
    },
    image: {
        width: 120,
        height: 120,
    },
    unavailableOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container2: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
        marginBottom: 4,
        // ALTERAÇÃO: removido flex: 1 para evitar que a descrição seja cortada por linha branca
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#101010',
        marginBottom: 0, // ALTERAÇÃO: removido marginVertical para reduzir gap
        marginTop: 4,
    },
    containerDelivery: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2, // ALTERAÇÃO: reduzido de 4 para 2 para diminuir gap
    },
    descriptionDel: {
        fontSize: 12,
        color: '#888',
    },
    circle: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#888',
        marginHorizontal: 8,
    },
    unavailableText: {
        color: '#999',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ALTERAÇÃO: Estilos para badges de estoque
    stockBadgeLimited: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ffc107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 10,
    },
    stockBadgeLow: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff9800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 10,
    },
    stockBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#000',
    },
    // ALTERAÇÃO: Estilos para badge de desconto
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#F44336',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 10,
    },
    discountBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // ALTERAÇÃO: Container para preços (original riscado + novo preço)
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        marginBottom: 0, // ALTERAÇÃO: removido marginVertical, apenas marginTop para reduzir gap
    },
    originalPrice: {
        fontSize: 14,
        fontWeight: '400',
        color: '#999',
        textDecorationLine: 'line-through',
    },
});
