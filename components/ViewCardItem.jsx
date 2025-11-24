import React, { useCallback } from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import CardItemVertical from "./CardItemVertical";
import TimerPromotions from "./TimerPromotions";

export default function ViewCardItem({
                                         title = "Seção",
                                         data = [],
                                         showTitle = true,
                                         promoTimer = null,
                                         navigation = null
                                     }) {
    const handleCardPress = useCallback(async (item) => {
        if (!navigation) return;
        
        const productId = item.id || item.originalProductId;
        
        // ALTERAÇÃO: Navegação direta igual ao CardItemHorizontal - passa objeto completo do produto
        // A validação de estoque será feita na tela de produto quando necessário
        if (productId) {
            // ALTERAÇÃO: Normaliza objeto produto para formato esperado pela tela
            const normalizedProduto = {
                ...item,
                name: item.name || item.title,
                id: productId
            };
            
            navigation.navigate('Produto', { 
                produto: normalizedProduto,
                productId: productId
            });
        } else {
            // Se não tiver productId, navega com o objeto item completo
            navigation.navigate('Produto', { produto: item });
        }
    }, [navigation]);

    const renderCard = useCallback(({item}) => (
        <CardItemVertical
            title={item.title}
            description={item.description}
            price={item.price}
            originalPrice={item.originalPrice} // ALTERAÇÃO: passa preço original para exibir riscado
            discountPercentage={item.discountPercentage} // ALTERAÇÃO: passa percentual de desconto para badge
            deliveryTime={item.deliveryTime}
            deliveryPrice={item.deliveryPrice}
            imageSource={item.imageSource}
            onPress={() => handleCardPress(item)}
            availabilityStatus={item.availability_status || item.availabilityStatus} // ALTERAÇÃO: passa status de disponibilidade para badges
            max_quantity={item.max_quantity} // ALTERAÇÃO: passa quantidade máxima para badges
        />
    ), [handleCardPress]);

    const keyExtractor = useCallback((item, index) => {
        return (item.id || item.originalProductId || index).toString();
    }, []);

    return (
        <View style={styles.container}>
            {showTitle && (
                <View style={styles.containerText}>
                    <Text style={styles.titleSection}>{title}</Text>
                </View>
            )}

            {promoTimer && (
                <TimerPromotions
                    endTime={promoTimer.endTime}
                    onExpire={promoTimer.onExpire}
                />
            )}

            <FlatList
                data={data}
                renderItem={renderCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.containerCard}
                ItemSeparatorComponent={() => <View style={styles.separator}/>}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={155}
                scrollEnabled={true}
                bounces={true}
                nestedScrollEnabled={true}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={5}
                windowSize={5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingLeft: 15,
    },
    titleSection: {
        fontSize: 20,
        fontWeight: "400",
    },
    containerCard: {
        marginVertical: 15,
        paddingHorizontal: 5,
        paddingRight: 15, // ALTERAÇÃO: adiciona padding direito para garantir que o último item seja visível
        paddingBottom: 10, // ALTERAÇÃO: adiciona padding inferior para evitar que cards sejam cortados na parte de baixo
    },
    separator: {
        width: 15,
    }
});
