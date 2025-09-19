import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import CardItemVertical from "./CardItemVertical";
import TimerPromotions from "./TimerPromotions";

export default function ViewCardItem({
                                         title = "Seção",
                                         data = [],
                                         showTitle = true,
                                         promoTimer = null
                                     }) {
    const renderCard = ({item}) => (
        <CardItemVertical
            title={item.title}
            description={item.description}
            price={item.price}
            deliveryTime={item.deliveryTime}
            deliveryPrice={item.deliveryPrice}
            imageSource={item.imageSource}
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
        paddingRight: 15,
    },
    separator: {
        width: 15,
    }
});
