import {StyleSheet, View, Text} from 'react-native';
import ButtonDark from "./Button";

export default function Header({ navigation }) {
//    const handlePress = () => {
//        navigation.navigate('');
//    };

    return (
        <View style={styles.container}>
            <View style={styles.textosLogin}>
                <Text style={[styles.titulo]}>Faça login ou crie sua conta</Text>
                <Text style={[styles.subtitulo]}>E acumule pontos de descontos!</Text>
            </View>
            <ButtonDark texto={"Entrar"} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingBottom: 20,
        paddingTop: 50,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
    },
    textosLogin: {
        flexWrap: 'nowrap',
        flex: 1,
    },
    titulo: {
        fontSize: 18,
        color: '#101010',
        fontWeight: '700',
    },
    subtitulo: {
        fontSize: 16,
        color: '#888888',
        fontWeight: '400',
    },
});
