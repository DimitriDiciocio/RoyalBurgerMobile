import React from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';

export default function CardItemHorizontal({
                                               title = "Nome produto",
                                               description = "Descrição dos itens ...",
                                               price = "R$50,00",
                                               deliveryTime = "40 - 50 min",
                                               deliveryPrice = "R$5,00",
                                               imageSource = null,
                                               isAvailable = true,
                                               onPress = () => {}
                                           }) {
    return (
        <TouchableOpacity
            style={[styles.container, !isAvailable && styles.unavailable]}
            onPress={onPress}
            disabled={!isAvailable}
        >
            <View style={styles.imageWrapper}>
                <Image
                    style={styles.image}
                    source={imageSource || { uri: 'https://via.placeholder.com/120x100' }}
                    resizeMode="cover"
                />
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
                    numberOfLines={2}
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
});
