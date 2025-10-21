import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import CachedImage from './CachedImage';

const plusSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 3.33333V12.6667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.33333 8H12.6667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function CardItemVerticalAdd({
    title = "Nome produto",
    description = "Descrição dos itens ...",
    price = "R$50,00",
    imageSource = null,
    onAdd = () => {}
}) {
    return (
        <View style={styles.container}>
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
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                </Text>
                <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                    {description}
                </Text>
                <View style={styles.bottomSection}>
                    <Text style={styles.price}>{price}</Text>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={onAdd}
                        activeOpacity={0.7}
                    >
                        <SvgXml
                            xml={plusSvg}
                            width={16}
                            height={16}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        marginRight: 12,
        marginBottom: 10,
        position: 'relative',
        overflow: 'visible',
    },
    imageWrapper: {
        width: 140,
        height: 95,
        backgroundColor: '#D9D9D9',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: 140,
        height: 95,
    },
    contentContainer: {
        padding: 8,
        flex: 1,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    description: {
        fontSize: 12,
        color: '#525252',
        marginTop: 4,
        lineHeight: 16,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        flex: 1,
    },
    addButton: {
        width: 30,
        height: 30,
        backgroundColor: '#FFC107',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
});
