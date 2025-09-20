import {StyleSheet, View, Text, TouchableOpacity, Image} from 'react-native';
import ButtonDark from "./Button";
import React from "react";
import {FontAwesome} from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Header({
                                   navigation,
                                   type = 'home',
                                   userInfo = null,
                                   onBackPress = null,
                                   showBackButton = false,
                                   title = null,
                                   subtitle = null,
                                   rightButton = null
                               }) {
    const handlePress = () => {
        if (navigation) {
            navigation.navigate('Login');
        }
    };

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else if (navigation) {
            navigation.goBack();
        }
    };

    // Renderizar conteúdo baseado no tipo
    const renderContent = () => {
        switch (type) {
            case 'login':
                return (
                    <View style={styles.loginContainer}>
                        {showBackButton && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackPress}
                            >
                                <AntDesign name="left" size={18} color="black"/>
                            </TouchableOpacity>
                        )}

                        <View style={styles.imagemContainer}>
                            <Image
                                source={require('../assets/img/logoIcon.png')}
                                style={styles.imagem}
                            />
                        </View>
                    </View>
                );
            case 'logged':
                return (
                    <View style={styles.loggedContainer}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={userInfo?.avatar || require('../assets/img/logoIcon.png')}
                                    style={styles.avatar}
                                />
                            </View>
                            <View style={styles.userTexts}>
                                <Text style={styles.userName}>
                                    {userInfo?.name || "Usuário"}
                                </Text>
                                <Text style={styles.userPoints}>
                                    {userInfo?.points || "0"} pontos
                                </Text>
                            </View>
                        </View>
                        {rightButton && rightButton}
                    </View>
                );

            case 'home':
            default:
                return (
                    <View style={styles.homeContainer}>
                        <View style={styles.textosLogin}>
                            <Text style={styles.titulo}>
                                {title || "Faça login ou crie sua conta"}
                            </Text>
                            <Text style={styles.subtitulo}>
                                {subtitle || "E acumule pontos de descontos!"}
                            </Text>
                        </View>
                        {rightButton || <ButtonDark texto={"Entrar"} onPress={handlePress}/>}
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, styles[`${type}Container`]]}>
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingBottom: 20,
        paddingTop: 50,
        paddingHorizontal: 20,
        height: 110,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
    },

    // Estilos para Home
    homeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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

    // Estilos para Login
    loginContainer: {
        position: 'relative',
        minHeight: 50,
    },
    imagemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagem: {
        width: 60,
        height: 52,
    },
    backButton: {
        position: 'absolute',
        left:0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        zIndex: 10,
    },

    // Estilos para Usuário Logado
    loggedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#f0f0f0',
    },
    userTexts: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        color: '#101010',
        fontWeight: '600',
        marginBottom: 2,
    },
    userPoints: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '400',
    },
});
