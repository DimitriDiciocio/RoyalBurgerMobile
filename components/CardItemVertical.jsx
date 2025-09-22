import React from 'react';
import {View, StyleSheet, Image, Text, TouchableOpacity} from 'react-native';

export default function CardItemVertical({
                                     title = "Nome produto",
                                     description = "Descrição dos itens ...",
                                     price = "R$50,00",
                                     deliveryTime = "40 - 50 min",
                                     deliveryPrice = "R$5,00",
                                     imageSource = null,
                                     onPress = () => {}
                                 }) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.imageWrapper}>
                <Image
                    style={styles.image}
                    source={imageSource || {uri: 'https://via.placeholder.com/140x95'}}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.container2}>
                <Text style={styles.title} numberOfLines={1}
                      ellipsizeMode="tail">{title}</Text>
                <Text style={styles.description} numberOfLines={1}
                      ellipsizeMode="tail">{description}</Text>
                <Text style={styles.price}>{price}</Text>
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
    }
});
