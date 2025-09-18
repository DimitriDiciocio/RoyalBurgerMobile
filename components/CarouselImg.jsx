import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CarouselImg() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const banners = [
        require('../assets/img/1banner-bem-vindo.png'),
        require('../assets/img/2banner-suculência.png'),
        require('../assets/img/3banner-hamburguer-aberto.png'),
        require('../assets/img/4banner-delivery.png'),
        require('../assets/img/5banner-sanduíches.png'),
    ];

    // Auto-scroll a cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % banners.length;
            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true
            });
            setCurrentIndex(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, banners.length]);

    const onScrollEnd = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / width);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }) => (
        <View style={styles.imageContainer}>
            <Image
                source={item}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                keyExtractor={(item, index) => index.toString()}
            />

            {/* Indicadores de ponto */}
            <View style={styles.pagination}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 360,
        height: 380,
        borderRadius: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ccc',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#FFC700',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});