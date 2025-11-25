import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CarouselImg() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const autoScrollTimerRef = useRef(null);
    const isDraggingRef = useRef(false);

    const banners = [
        require('../assets/img/1banner-bem-vindo.png'),
        require('../assets/img/2banner-suculência.png'),
        require('../assets/img/3banner-hamburguer-aberto.png'),
        require('../assets/img/4banner-delivery.png'),
        require('../assets/img/5banner-sanduíches.png'),
    ];

    const startAutoScroll = () => {
        if (autoScrollTimerRef.current) return;
        autoScrollTimerRef.current = setInterval(() => {
            if (isDraggingRef.current) return;
            const nextIndex = (currentIndex + 1) % banners.length;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, 5000);
    };

    const stopAutoScroll = () => {
        if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current);
            autoScrollTimerRef.current = null;
        }
    };

    // Inicia o auto-scroll ao montar e limpa ao desmontar
    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Quando o índice mudar manualmente, garantimos que o timer exista
    useEffect(() => {
        if (!isDraggingRef.current) {
            // reinicia o timer para manter o ritmo após interações
            stopAutoScroll();
            startAutoScroll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    const onScrollBeginDrag = () => {
        isDraggingRef.current = true;
        stopAutoScroll();
    };

    const onScrollEnd = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        // Adiciona um threshold para evitar mudanças muito sensíveis
        const threshold = width * 0.3; // 30% da largura da tela
        let index = Math.round(contentOffset / width);
        
        // Garante que o índice está dentro dos limites
        index = Math.max(0, Math.min(index, banners.length - 1));
        
        // Só atualiza se houve mudança significativa
        if (Math.abs(contentOffset - (currentIndex * width)) > threshold || index !== currentIndex) {
            setCurrentIndex(index);
        }
        
        isDraggingRef.current = false;
        startAutoScroll();
    };

    const getItemLayout = (_, index) => ({
        length: width,
        offset: width * index,
        index,
    });

    // ALTERAÇÃO: Handler para quando scrollToIndex falha (índice fora da tela)
    const handleScrollToIndexFailed = (info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({ 
                index: info.index, 
                animated: true,
            });
        });
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
                snapToInterval={width}
                decelerationRate="normal"
                scrollEventThrottle={16}
                minimumZoomScale={1}
                maximumZoomScale={1}
                bounces={false}
                scrollsToTop={false}
                getItemLayout={getItemLayout}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                onScrollBeginDrag={onScrollBeginDrag}
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
        marginTop: 50,
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