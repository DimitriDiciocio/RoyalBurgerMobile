import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, Keyboard} from 'react-native';
import Header from "../components/Header";
import Input from "../components/Input";
import { resetPassword } from "../services/customerService";

export default function RedefinirSenha({navigation, route}) {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Estados para validação de senha em tempo real
    const [passwordRequirements, setPasswordRequirements] = useState({
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Recebe o email e código da tela anterior
    useEffect(() => {
        if (route?.params?.email) {
            setEmail(route.params.email);
        }
        if (route?.params?.resetCode) {
            // O código já foi validado na tela anterior
        }
    }, [route?.params?.email, route?.params?.resetCode]);

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    // Função para validar senha
    const validatePassword = (password) => {
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasMinLength = password.length >= 8;

        setPasswordRequirements({
            hasUppercase,
            hasNumber,
            hasSpecialChar,
            hasMinLength
        });

        return hasUppercase && hasNumber && hasSpecialChar && hasMinLength;
    };


    const handleResetPassword = async () => {
        // Delay para evitar problemas de teclado
        if (keyboardVisible) {
            Keyboard.dismiss();
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Resetar erros
        setPasswordError('');
        setConfirmPasswordError('');
        setSubmitError('');

        let hasError = false;

        // Validação da senha
        if (!newPassword.trim()) {
            setPasswordError('Nova senha é obrigatória');
            hasError = true;
        } else if (!validatePassword(newPassword)) {
            setPasswordError('Senha não atende aos requisitos');
            hasError = true;
        }

        // Validação da confirmação de senha
        if (!confirmPassword.trim()) {
            setConfirmPasswordError('Confirmação de senha é obrigatória');
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError('As senhas não coincidem');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await resetPassword(email, route?.params?.resetCode, newPassword);
            if (result.ok) {
                Alert.alert(
                    'Senha redefinida!',
                    'Sua senha foi redefinida com sucesso. Faça login com sua nova senha.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login')
                        }
                    ]
                );
            } else {
                setSubmitError(result.error || 'Erro ao redefinir senha');
            }
        } catch (e) {
            setSubmitError('Erro inesperado ao redefinir senha');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToForgotPassword = () => {
        navigation.goBack();
    };

    // Validação em tempo real

    const handleNewPasswordChange = (text) => {
        setNewPassword(text);
        validatePassword(text);
        if (passwordError && text.trim() && validatePassword(text)) {
            setPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (text) => {
        setConfirmPassword(text);
        if (confirmPasswordError && text.trim() && newPassword === text) {
            setConfirmPasswordError('');
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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
                    title="Redefinir senha"
                    subtitle="Digite o código e sua nova senha"
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
                    <Text style={styles.titulo}>Redefinir senha</Text>
                    <Text style={styles.subtitle}>
                        Digite sua nova senha seguindo os requisitos abaixo
                    </Text>
                    
                    <Input
                        label="Nova senha"
                        type="password"
                        value={newPassword}
                        onChangeText={handleNewPasswordChange}
                        error={passwordError}
                    />

                    <View style={styles.passwordRequirements}>
                        <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
                        <View style={styles.requirementItem}>
                            <Text style={[styles.requirementText, passwordRequirements.hasUppercase && styles.requirementMet]}>
                                • 1 Letra em maiúsculo
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Text style={[styles.requirementText, passwordRequirements.hasNumber && styles.requirementMet]}>
                                • 1 Dígito numérico
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Text style={[styles.requirementText, passwordRequirements.hasSpecialChar && styles.requirementMet]}>
                                • 1 Caractere especial
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Text style={[styles.requirementText, passwordRequirements.hasMinLength && styles.requirementMet]}>
                                • 8 Dígitos
                            </Text>
                        </View>
                    </View>

                    <Input
                        label="Confirmar nova senha"
                        type="password"
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        error={confirmPasswordError}
                    />
                    
                    {!!submitError && (
                        <Text style={styles.errorText}>{submitError}</Text>
                    )}
                    
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleResetPassword}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.loginButtonText}>
                            {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackToForgotPassword}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.backButtonText}>Voltar</Text>
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
    passwordRequirements: {
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    requirementItem: {
        marginBottom: 4,
    },
    requirementText: {
        fontSize: 13,
        color: '#999',
        fontWeight: '500',
    },
    requirementMet: {
        color: '#4CAF50',
        fontWeight: '600',
    },
});
