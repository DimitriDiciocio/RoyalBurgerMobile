import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, ScrollView} from 'react-native';
import ContainerBurger from "./components/ContainerBurger";
import Header from "./components/Header";
import CarouselImg from "./components/CarouselImg";
import LoginButton from "./components/ButtonView";

export default function App() {
    return (
        <View style={styles.container}>
            {/* Conteúdo rolável */}
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.header}>
                    <Header/>
                </View>
                <View style={styles.CarouselImg}>
                    <CarouselImg/>
                </View>
                <View style={[styles.flex_row, styles.gap_sm]}>
                    <ContainerBurger/>
                    <ContainerBurger/>
                    <ContainerBurger/>
                </View>
                {/* Espaço extra para não sobrepor o botão fixo */}
                <View style={styles.bottomPadding} />
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
    },
    scrollContent: {
        flex: 1,
    },
    scrollContainer: {
        gap: 10,
        paddingTop: 10,
    },
    header: {
        //estilos do header
    },
    flex_row: {
        flexDirection: 'row',
    },
    gap_sm: {
        gap: 10,
    },
    bottomPadding: {
        height: 100, // Altura do botão + margem para não sobrepor conteúdo
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
    },
});