import { StyleSheet, View, Text } from 'react-native';
import ButtonDark from "./Button";

export default function Header() {
    return (
        <View style={styles.container}>
            <View style={styles.textos}>
                <Text style={[styles.titulo]}>Faça login ou crie sua conta</Text>
                <Text style={[styles.subtitulo]}>E acumule pontos de descontos!</Text>
            </View>
            <ButtonDark texto={"Entrar"}></ButtonDark>
        </View>
    );
}
const styles = StyleSheet.create({
    container:{
        flexDirection: 'row',
    },
    textos:{
        flexWrap: 'nowrap',
    },
    titulo:{
        fontSize:18,
        color: '#101010',
        fontWeight:'semibold',
    },
    subtitulo:{
        fontSize:14,
        color: '#888888',
        fontWeight:'regular',
    },
})