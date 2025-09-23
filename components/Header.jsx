import {StyleSheet, View, Text, TouchableOpacity, Image} from 'react-native';
import ButtonDark from "./Button";
import React from "react";
import { SvgXml } from 'react-native-svg';
import {FontAwesome} from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#888888"/>
</svg>`;

const downArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g transform="rotate(270 10 10)">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="#888888"/>
</g>
</svg>`;

const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#FFC700"/>
</svg>`;

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
                                <SvgXml
                                    xml={backArrowSvg}
                                    width={30}
                                    height={30}
                                />
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
                            <View style={styles.userTexts}>
                                <Text style={styles.userName}>
                                    {"Olá, " + (userInfo?.name || "Usuário")}
                                </Text>
                                <View style={styles.userAddressRow}>
                                    <SvgXml
                                        xml={localizationSvg}
                                        width={9}
                                        height={13}
                                        style={styles.userAddressIcon}
                                    />
                                    <Text style={styles.userAddress}>
                                        {userInfo?.address || "Adicionar endereço"}
                                    </Text>
                                    <SvgXml
                                        xml={downArrowSvg}
                                        width={20}
                                        height={20}
                                        style={styles.userAddressArrow}
                                    />
                                </View>
                            </View>
                        </View>
                        <View style={styles.pointsContainer}>
                            <SvgXml
                                xml={crownSvg}
                                width={20}
                                height={20}
                                style={styles.crownIcon}
                            />
                            <Text style={styles.pointsText}>
                                {userInfo?.points || "0"} pontos
                            </Text>
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
    userTexts: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        color: '#101010',
        fontWeight: '600',
        marginBottom: 2,
    },
    userAddress: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '400',
    },
    userAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    userAddressIcon: {
        marginRight: 6,
    },
    userAddressArrow: {
        marginLeft: 6,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    crownIcon: {
        marginRight: 6,
    },
    pointsText: {
        fontSize: 14,
        color: '#FFC700',
        fontWeight: '600',
    },
});
