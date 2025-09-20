import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Header from "./components/Header";
import CarouselImg from "./components/CarouselImg";
import LoginButton from "./components/ButtonView";
import ViewCardItem from "./components/ViewCardItem";
import MenuCategory from "./components/MenuCategory";

export default function App() {
    const mostOrderedData = [
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: { uri: "https://exemplo.com/burger1.jpg" }
        },
    ];

    const promotionsData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: { uri: "https://exemplo.com/combo1.jpg" }
        },
    ];

    const comboData = [
        {
            title: "Combo Especial",
            description: "Burger + Batata + Refrigerante",
            price: "R$ 28,90",
            deliveryTime: "35 - 45 min",
            deliveryPrice: "R$ 4,00",
            imageSource: { uri: "https://exemplo.com/combo1.jpg" }
        },
        {
            title: "Hambúrguer Clássico",
            description: "Pão, carne, queijo, alface",
            price: "R$ 25,90",
            deliveryTime: "30 - 40 min",
            deliveryPrice: "R$ 5,00",
            imageSource: { uri: "https://exemplo.com/burger1.jpg" }
        },
    ];

    const promoEndTime = new Date();
    promoEndTime.setHours(promoEndTime.getHours() + 1);

    const handlePromoExpire = () => {
        console.log('Promoção expirou!');
    };

    // ✅ Conteúdo sections
    const renderPromotionalHeader = () => (
        <View style={styles.promotionalContent}>
            <View style={styles.carouselImg}>
                <CarouselImg />
            </View>

            <ViewCardItem
                title="Os mais pedidos"
                data={mostOrderedData}
            />

            <ViewCardItem
                title="Em promoção"
                data={promotionsData}
                promoTimer={{
                    endTime: promoEndTime,
                    onExpire: handlePromoExpire
                }}
            />

            <ViewCardItem
                title="Combos"
                data={comboData}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* ✅ Header principal fixo */}
            <View style={styles.header}>
                <Header />
            </View>

            {/* ✅ MenuCategory ocupa o espaço disponível */}
            <View style={styles.menuContainer}>
                <MenuCategory
                    ListHeaderComponent={renderPromotionalHeader}
                    showFixedButton={true}
                />
            </View>

            {/* ✅ Botão fixo */}
            <View style={styles.fixedButtonContainer}>
                <LoginButton />
            </View>

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    header: {
        position: 'absolute',
        zIndex: 1001,
        top: 0,
        left: 0,
        right: 0,
    },
    menuContainer: {
        flex: 1,
        marginTop: 105,
    },
    promotionalContent: {
        backgroundColor: '#F6F6F6',
        paddingTop: 10,
    },
    carouselImg: {
        marginTop: -50,
        marginBottom: 10,
    },
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
        zIndex: 999,
    },
});
