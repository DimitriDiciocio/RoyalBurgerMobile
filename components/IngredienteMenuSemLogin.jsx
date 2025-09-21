import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function IngredienteMenu({
    nome = "Produto",
    valorExtra = 0,
    imagem = null
}) {
    const formatarValor = (valor) => {
        if (valor === 0) {
            return "+R$ 0,00";
        }
        return `+R$ ${valor.toFixed(2).replace('.', ',')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.textoContainer}>
                    <Text style={styles.nome}>
                        {nome}
                    </Text>
                    <Text style={styles.valor}>
                        {formatarValor(valorExtra)}
                    </Text>
                </View>
                {imagem && (
                    <Image
                        source={imagem}
                        style={styles.imagem}
                        resizeMode="cover"
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingVertical: 8,
        marginVertical: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 200,
        position: 'relative',
    },
    nome: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
        marginRight: 8,
    },
    valor: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
        position: 'absolute',
        right: 0,
    },
    imagem: {
        width: 80,
        height: 35,
        marginLeft: 16,
    },
});
