import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet, Image} from 'react-native';

export default function LoginButton({ navigation }) {
//    const handlePress = () => {
//        navigation.navigate('Login');
//    };

    return (
        <TouchableOpacity
            style={styles.bigButton}
        >
            <View style={styles.buttonContent}>
                <Image
                    source={require('../assets/img/logoIcon.png')}
                    style={styles.imagem}
                />
                <View style={styles.buttonContentText}>
                    <Text style={styles.buttonText}>Explore com sua conta Royal</Text>
                    <Text style={styles.buttonSubtext}>E aproveite a experiência completa</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bigButton: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        width: '100%',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    imagem: {
        width: 60,
        height: 50,
    },
    buttonContentText: {
        flex: 1,
        justifyContent: 'flex-start',
        marginLeft: 12,
    },
    buttonText: {
        color: '#101010',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSubtext: {
        color: '#525252',
        fontSize: 14,
    },
});
