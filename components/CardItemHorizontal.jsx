import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import CachedImage from './CachedImage';
import { checkProductAvailability } from '../services/productService';

export default function CardItemHorizontal({
                                               title = "Nome produto",
                                               description = "Descrição dos itens ...",
                                               price = "R$50,00",
                                               deliveryTime = "40 - 50 min",
                                               deliveryPrice = "R$5,00",
                                               imageSource = null,
                                               isAvailable = true,
                                               onPress = () => {},
                                               productId = null,
                                               navigation = null
                                           }) {
    const [checking, setChecking] = React.useState(false);
    
    const handlePress = async () => {
        // Se não tem productId ou navigation, só chama onPress
        if (!navigation || !productId) {
            onPress();
            return;
        }
        
        try {
            setChecking(true);
            
            // Verificar disponibilidade antes de navegar
            const availability = await checkProductAvailability(productId, 1);
            
            if (!availability.is_available) {
                Alert.alert(
                    'Produto Indisponível',
                    availability.message || 'Este produto está temporariamente indisponível devido à falta de ingredientes em estoque.',
                    [{ text: 'OK' }]
                );
                return;
            }
            
            // Se disponível, navega normalmente
            navigation.navigate('Produto', { productId });
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            // Em caso de erro na verificação, permite navegar (fail-safe)
            navigation.navigate('Produto', { productId });
        } finally {
            setChecking(false);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, !isAvailable && styles.unavailable]}
            onPress={handlePress}
            disabled={!isAvailable || checking}
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
                {!isAvailable && (
                    <View style={styles.unavailableOverlay}>
                        <Text style={styles.unavailableText}>Indisponível</Text>
                    </View>
                )}
                {checking && (
                    <View style={styles.checkingOverlay}>
                        <ActivityIndicator size="small" color="#FFF" />
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
                <Text
                    style={[styles.price, !isAvailable && styles.unavailableText]}
                >
                    {price}
                </Text>
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
        flex: 1,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#101010',
        marginVertical: 4,
    },
    containerDelivery: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
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
    checkingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
