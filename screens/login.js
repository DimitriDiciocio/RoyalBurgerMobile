import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Header from "../components/Header";
import Input from "../components/Input";
import {login, registerCustomer} from "../services";
import { requestEmailVerification } from "../services/customerService";

export default function Login({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função para validar email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Função para validar senha
    const validatePassword = (password) => {
        // Senha deve ter pelo menos 6 caracteres
        return password.length >= 6;
    };

    const handleLogin = async () => {
        // Resetar erros
        setEmailError('');
        setPasswordError('');
        setSubmitError('');

        let hasError = false;

        // Validação de email
        if (!email.trim()) {
            setEmailError('E-mail é obrigatório');
            hasError = true;
        } else if (!validateEmail(email)) {
            setEmailError('Digite um e-mail válido');
            hasError = true;
        }

        // Validação de senha
        if (!password.trim()) {
            setPasswordError('Senha é obrigatória');
            hasError = true;
        } else if (!validatePassword(password)) {
            setPasswordError('Senha deve ter pelo menos 6 caracteres');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await login({ email, password });
            if (result.ok) {
                navigation.navigate('Home');
            } else {
                const message = result.error || '';
                const isUnverified =
                    result.status === 403 ||
                    /nao verificado|não verificado|email.*verificar|verify.*email|EMAIL_NOT_VERIFIED|UNVERIFIED/i.test(message);

                if (isUnverified) {
                    try {
                        await requestEmailVerification(email);
                    } catch (e) {
                        // Silencia erro de reenvio para não bloquear o fluxo
                    }
                    navigation.navigate('VerificacaoEmail', { email });
                    return;
                }

                setSubmitError(message || 'Não foi possível fazer login.');
            }
        } catch (e) {
            setSubmitError('Erro inesperado ao fazer login.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = () => {
        // Implementar a lógica de recuperação de senha
    };

    const handleRegisterTextd = () => {
        navigation.navigate('Cadastro');
    };

    // Validação em tempo real
    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError && text.trim() && validateEmail(text)) {
            setEmailError('');
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (passwordError && text.trim() && validatePassword(text)) {
            setPasswordError('');
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                    title="Bem-vindo de volta!"
                    subtitle="Faça login para continuar"
                />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
            >
                <View style={styles.form}>
                    <Text style={styles.titulo}>Digite o seu
                        e-mail e senha</Text>
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChangeText={handleEmailChange}
                        error={emailError}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={password}
                        onChangeText={handlePasswordChange}
                        error={passwordError}
                    />
                    {!!submitError && (
                        <Text style={{ color: '#D32F2F', marginBottom: 8 }}>{submitError}</Text>
                    )}
                    <TouchableOpacity
                        style={styles.forgotPasswordButton}
                        onPress={handleForgotPassword}
                    >
                        <Text style={styles.jobDescription}>Esqueci minha senha</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.registerText}
                        onPress={handleRegisterTextd}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.jobDescription}>Ainda não tem uma conta? Cadastre-se já!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.loginButtonText}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
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
        minHeight: 'auto', // Permite que o formulário se ajuste ao conteúdo
    },
    titulo: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
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
    jobDescription: {
        color: '#AEAEBA',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'none',
        marginBottom: 15,
    },
});
