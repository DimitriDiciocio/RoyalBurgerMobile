    import React, {useState, useRef} from 'react';
    import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Animated} from 'react-native';
    import { SvgXml } from 'react-native-svg';
    import Header from "../components/Header";
    import Input from "../components/Input";
    import IngredienteMenu from "../components/IngredienteMenuSemLogin";
    import LoginButton from "../components/ButtonView";

    const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

    export default function Produto({navigation, route}) {
        const { produto } = route.params || {};
        const [isExpanded, setIsExpanded] = useState(false);
        const rotateValue = useRef(new Animated.Value(0)).current;

        const handleBackPress = () => {
            navigation.goBack();
        };

        const handleArrowPress = () => {
            const toValue = isExpanded ? 0 : 1;
            
            Animated.timing(rotateValue, {
                toValue: toValue,
                duration: 300,
                useNativeDriver: true,
            }).start();
            
            setIsExpanded(!isExpanded);
        };

        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.headerContainer}>
                    <Header
                        type="home"
                        navigation={navigation}
                    />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerRow}>
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
                        
                        <View style={styles.centerImageContainer}>
                            <Image
                                source={require('../assets/img/hamburguer.png')}
                                style={styles.centerImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                     <View style={styles.produtoContainer}>
                         <Text style={styles.produtoTitle}>Nome do Produto</Text>
                         <Text style={styles.produtoDescription}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam auctor pellentesque urna nec tincidunt. 
                             Phasellus ultricies elementum tristique. Nullam ante leo, eleifend blandit tempus nec, viverra at nulla. 
                             Donec tincidunt lacus nisi, non sollicitudin mi suscipit luctus. Proin ac arcu pellentesque, bibendum massa nec, 
                             varius arcu.</Text>
                     </View>
                     
                     <View style={styles.divisionContainer}>
                         <Image 
                             source={require('../assets/img/division.png')} 
                             style={styles.divisionImage}
                             resizeMode="contain"
                         />
                     </View>
                     
                     <View style={styles.customizeContainer}>
                         <Text style={styles.produtoTitle}>Monte do seu jeito!</Text>
                         
                         <IngredienteMenu
                             nome="Pão Superior"
                             valorExtra={0.00}
                             imagem={require('../assets/img/hamburguerIcon.png')}
                         />
                         
                         <IngredienteMenu
                             nome="Bacon"
                             valorExtra={0.00}
                             imagem={require('../assets/img/baconIcon.png')}
                         />
                         
                         <IngredienteMenu
                             nome="Queijo Cheedar"
                             valorExtra={0}
                             imagem={require('../assets/img/chedarIcon.png')}
                         />
                        <IngredienteMenu
                             nome="Carne"
                             valorExtra={0}
                             imagem={require('../assets/img/carneIcon.png')}
                         />
                        <IngredienteMenu
                             nome="Ketchup"
                             valorExtra={0}
                             imagem={require('../assets/img/ketchupIcon.png')}
                         />
                        <IngredienteMenu
                             nome="Pão Inferior"
                             valorExtra={0}
                             imagem={require('../assets/img/paoIcon.png')}
                         />
                     </View>
                     </ScrollView>
                     
                    <View style={styles.fixedButtonContainer}>
                        <LoginButton navigation={navigation} />
                    </View>
                <View>
                    
                </View>
            </KeyboardAvoidingView>
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
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
        },
        backButton: {
            position: 'absolute',
            top: 10,
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
        },
        centerImageContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
        },
        centerImage: {
            width: 280,
            height: 230,
        },
        produtoContainer: {
            margin: 20,
            marginTop: 0,
            marginBottom: 10,
        },
        produtoTitle: {
            fontSize: 24,
        },
        produtoDescription: {
            fontSize: 14,  
            letterSpacing: 0.5,
            textAlign: 'justify',
            color: '#525252',
            marginBottom: 10,
        },
         divisionContainer: {
             alignItems: 'center',
         },
         divisionImage: {
             width: '100%',
             height: 20,
         },
        customizeContainer: {
            margin: 20,
            marginTop: 10,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100,
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