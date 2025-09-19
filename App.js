import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, ScrollView} from 'react-native';
import Header from "./components/Header";
import CarouselImg from "./components/CarouselImg";
import LoginButton from "./components/ButtonView";
import ViewCardItem from "./components/ViewCardItem";

export default function App() {
    const mostOrderedData = [
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: {uri: "https://exemplo.com/burger1.jpg"}
        },
    ];
    const promotionsData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: {uri: "https://exemplo.com/combo1.jpg"}
        },
    ];
    const comboData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: {uri: "https://exemplo.com/combo1.jpg"}
        },
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: {uri: "https://exemplo.com/burger1.jpg"}
        },
    ];

    // Configurar quando a promoção termina
    const promoEndTime = new Date();
    promoEndTime.setHours(promoEndTime.getHours() + 1); // Expira em 2 horas

    // Função para quando a promoção expirar
    const handlePromoExpire = () => {
        console.log('Promoção expirou!');
        // Aqui você pode esconder a seção, atualizar dados, etc.
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Header/>
            </View>
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.carouselImg}>
                    <CarouselImg/>
                </View>

                {/* Seção "Os mais pedidos" */}
                <ViewCardItem
                    title="Os mais pedidos"
                    data={mostOrderedData}
                />

                {/* Seção "Promoções" */}
                <ViewCardItem
                    title="Em promoção"
                    data={promotionsData}
                    promoTimer={{
                        endTime: promoEndTime,
                        onExpire: handlePromoExpire
                    }}
                />

                {/* Seção combos */}
                <ViewCardItem
                    title="Combos"
                    data={comboData}
                />

                <View style={styles.bottomPadding}/>
            </ScrollView>
            <View style={styles.fixedButtonContainer}>
                <LoginButton/>
            </View>
            <StatusBar style="auto"/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    }, scrollContent: {
        flex: 1,
    }, scrollContainer: {
        gap: 10,
        paddingTop: 10,
    }, header: {
        position: 'fixed',
        zIndex: 1,
        top: 0,
        left: 0,
        right: 0,
    }, flex_row: {
        flexDirection: 'row',
    }, gap_sm: {
        gap: 10,
    }, bottomPadding: {
        height: 100,
    }, fixedButtonContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
    },
});