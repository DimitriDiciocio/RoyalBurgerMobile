import React from 'react';
import {View, Text, StyleSheet, FlatList, Alert} from 'react-native';
import CardItemVertical from "./CardItemVertical";
import TimerPromotions from "./TimerPromotions";
import { checkProductAvailability } from '../services/productService';

export default function ViewCardItem({
                                         title = "Seção",
                                         data = [],
                                         showTitle = true,
                                         promoTimer = null,
                                         navigation = null
                                     }) {
    const handleCardPress = async (item) => {
        if (!navigation) return;
        
        const productId = item.id || item.originalProductId;
        
        if (!productId) {
            navigation.navigate('Produto', { produto: item });
            return;
        }
        
        try {
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
            navigation.navigate('Produto', { produto: item });
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            // Em caso de erro na verificação, permite navegar (fail-safe)
            navigation.navigate('Produto', { produto: item });
        }
    };

    const renderCard = ({item}) => (
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
    );

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
                keyExtractor={(item, index) => index.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.containerCard}
                ItemSeparatorComponent={() => <View style={styles.separator}/>}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={155}
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
        paddingHorizontal:5,
        height:'100%',
        width:'100%',
    },
    separator: {
        width: 15,
    }
});
