import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import Header from "../components/Header";
import Input from "../components/Input";
import { requestPasswordReset } from "../services/customerService";

export default function EsqueciSenha({navigation, route}) {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Recebe o email do login se foi passado via parâmetros
    useEffect(() => {
        if (route?.params?.email) {
            setEmail(route.params.email);
        }
    }, [route?.params?.email]);

    // Função para validar email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRequestPasswordReset = async () => {
        // Resetar erros
        setEmailError('');
        setSubmitError('');

        // Validação de email
        if (!email.trim()) {
            setEmailError('E-mail é obrigatório');
            return;
        } else if (!validateEmail(email)) {
            setEmailError('Digite um e-mail válido');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await requestPasswordReset(email);
            if (result.ok) {
                // Navega para a tela de verificação de código
                navigation.navigate('VerificarCodigoSenha', { email: email });
            } else {
                setSubmitError(result.error || 'Erro ao enviar e-mail de recuperação');
            }
        } catch (e) {
            setSubmitError('Erro inesperado ao enviar e-mail de recuperação');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToLogin = () => {
        navigation.goBack();
    };

    // Validação em tempo real
    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError && text.trim() && validateEmail(text)) {
            setEmailError('');
        }
    };


    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            enabled={true}
        >
            <Image
                source={require('../assets/img/imagemLogin.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            />
            
            <View style={styles.headerContainer}>
                <Header
                    type="login"
                    navigation={navigation}
                    showBackButton={true}
                    title="Esqueci minha senha"
                    subtitle="Digite seu e-mail para recuperar"
                />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                keyboardDismissMode="on-drag"
            >
                <View style={styles.form}>
                    <Text style={styles.titulo}>Digite o seu e-mail</Text>
                    <Text style={styles.subtitle}>
                        Enviaremos um código de verificação para você redefinir sua senha
                    </Text>
                    
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChangeText={handleEmailChange}
                        error={emailError}
                    />
                    
                    {!!submitError && (
                        <Text style={styles.errorText}>{submitError}</Text>
                    )}
                    
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleRequestPasswordReset}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.loginButtonText}>
                            {isSubmitting ? 'Enviando...' : 'Enviar código'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackToLogin}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.backButtonText}>Voltar ao login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECEDF2',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    headerContainer: {
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        gap: 10,
        width: '100%',
        maxWidth: 450,
        backgroundColor: '#FFFFFF',
        padding: 35,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 8,
        marginBottom: 30,
        minHeight: 'auto',
    },
    titulo: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#101010',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
        lineHeight: 22,
    },
    loginButton: {
        backgroundColor: '#FFC700',
        paddingVertical: 15,
        borderRadius: 10,
        width: '100%',
        maxWidth: 450,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        color: '#101010',
        fontSize: 15,
        fontWeight: '500'
    },
    backButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#AEAEBA',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#D32F2F',
        marginBottom: 8,
        textAlign: 'center',
    },
});
