import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import CachedImage from './CachedImage';

export default function CardItemVertical({
                                     title = "Nome produto",
                                     description = "Descrição dos itens ...",
                                     price = "R$50,00",
                                     originalPrice = null, // ALTERAÇÃO: preço original (para exibir riscado quando houver promoção)
                                     discountPercentage = null, // ALTERAÇÃO: percentual de desconto para badge
                                     deliveryTime = "40 - 50 min",
                                     deliveryPrice = "R$5,00",
                                     imageSource = null,
                                     onPress = () => {},
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

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
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
                {renderDiscountBadge()}
                {/* ALTERAÇÃO: Badge de estoque (apenas se não houver badge de desconto) */}
                {!discountPercentage && renderStockBadge()}
            </View>
            <View style={styles.container2}>
                <Text style={styles.title} numberOfLines={1}
                      ellipsizeMode="tail">{title}</Text>
                <Text style={styles.description} numberOfLines={1}
                      ellipsizeMode="tail">{description}</Text>
                {/* ALTERAÇÃO: Exibir preço original riscado e novo preço em destaque quando houver promoção */}
                {originalPrice ? (
                    <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>{originalPrice}</Text>
                        <Text style={styles.priceWithDiscount}>
                            {typeof price === 'string' && price.startsWith('R$') 
                                ? price 
                                : formattedPrice}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.price}>{formattedPrice}</Text>
                )}
                <View style={styles.containerDelevery}>
                    <Text style={styles.descriptionDel}>{deliveryTime}</Text>
                    <View style={styles.circle}></View>
                    <Text style={styles.descriptionDel}>{deliveryPrice}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    imageWrapper: {
        width: 140,
        height: 95,
        backgroundColor: '#D9D9D9',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        overflow: 'hidden',
    },
    image: {
        width: 140,
        height: 95,
    },
    container2: {
        paddingLeft: 8,
        paddingTop: 5,
        paddingRight: 8,
        paddingBottom: 8, // ALTERAÇÃO: adiciona padding inferior para evitar que conteúdo seja cortado
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    description: {
        fontSize: 12,
        color: '#525252',
        marginTop: 2,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 4,
    },
    // ALTERAÇÃO: Estilo para preço com desconto (menor para não escapar do quadro)
    priceWithDiscount: {
        fontSize: 15, // ALTERAÇÃO: reduzido de 18 para 15 quando houver promoção
        fontWeight: 'bold',
        color: '#000',
    },
    descriptionDel: {
        fontSize: 10,
        color: '#888888',
    },
    containerDelevery: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    circle: {
        borderRadius: 2,
        width: 4,
        height: 4,
        backgroundColor: '#888888',
    },
    // ALTERAÇÃO: Estilos para badges de estoque
    stockBadgeLimited: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ffc107',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        zIndex: 10,
    },
    stockBadgeLow: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff9800',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        zIndex: 10,
    },
    stockBadgeText: {
        fontSize: 9,
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
    },
    originalPrice: {
        fontSize: 11, // ALTERAÇÃO: reduzido de 14 para 11 para ficar menor
        fontWeight: '400',
        color: '#999',
        textDecorationLine: 'line-through',
    },
});
