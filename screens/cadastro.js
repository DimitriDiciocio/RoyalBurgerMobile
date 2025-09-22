import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Header from "../components/Header";
import Input from "../components/Input";
import {registerCustomer} from "../services";

export default function Cadastro({navigation}) {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    
    // Estados de erro
    const [nomeError, setNomeError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [dataError, setDataError] = useState('');
    const [telefoneError, setTelefoneError] = useState('');
    const [senhaError, setSenhaError] = useState('');
    const [confirmarSenhaError, setConfirmarSenhaError] = useState('');

    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para validação de senha em tempo real
    const [passwordRequirements, setPasswordRequirements] = useState({
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Função para validar email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Função para validar telefone (formato brasileiro)
    const validatePhone = (phone) => {
        const phoneRegex = /^\(?[1-9]{2}\)?[0-9]{4,5}[0-9]{4}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    };

    // Função para validar data de nascimento
    const validateDate = (date) => {
        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
        if (!dateRegex.test(date)) return false;
        
        const [, day, month, year] = date.match(dateRegex);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        return age >= 18 && age <= 120;
    };

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

    const handleCadastro = async () => {
        // Resetar erros
        setSubmitError('');
        setSubmitSuccess('');
        setNomeError('');
        setEmailError('');
        setDataError('');
        setTelefoneError('');
        setSenhaError('');
        setConfirmarSenhaError('');

        let hasError = false;

        // Validação de nome completo
        if (!nomeCompleto.trim()) {
            setNomeError('Nome completo é obrigatório');
            hasError = true;
        } else if (nomeCompleto.trim().split(' ').length < 2) {
            setNomeError('Digite seu nome completo');
            hasError = true;
        }

        // Validação de email
        if (!email.trim()) {
            setEmailError('E-mail é obrigatório');
            hasError = true;
        } else if (!validateEmail(email)) {
            setEmailError('Digite um e-mail válido');
            hasError = true;
        }

        // Validação de data de nascimento
        if (!dataNascimento.trim()) {
            setDataError('Data de nascimento é obrigatória');
            hasError = true;
        } else if (!validateDate(dataNascimento)) {
            setDataError('Data inválida ou você deve ter pelo menos 18 anos');
            hasError = true;
        }

        // Validação de telefone
        if (!telefone.trim()) {
            setTelefoneError('Telefone é obrigatório');
            hasError = true;
        } else if (!validatePhone(telefone)) {
            setTelefoneError('Digite um telefone válido');
            hasError = true;
        }

        // Validação de senha
        if (!senha.trim()) {
            setSenhaError('Senha é obrigatória');
            hasError = true;
        } else if (!validatePassword(senha)) {
            setSenhaError('Senha não atende aos requisitos');
            hasError = true;
        }

        // Validação de confirmação de senha
        if (!confirmarSenha.trim()) {
            setConfirmarSenhaError('Confirmação de senha é obrigatória');
            hasError = true;
        } else if (senha !== confirmarSenha) {
            setConfirmarSenhaError('Senhas não coincidem');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await registerCustomer({nomeCompleto, email, dataNascimento, telefone, senha, confirmarSenha});
            setSubmitSuccess(response?.message || 'Cadastro realizado com sucesso.');
            // Redireciona para login após breve confirmação
            setTimeout(() => {
                navigation.navigate('Login');
            }, 800);
        } catch (error) {
            const message = error?.message || 'Erro ao realizar cadastro.';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }

    };

    const handleLoginRedirect = () => {
        navigation.navigate('Login');
    };

    // Validação em tempo real
    const handleSenhaChange = (text) => {
        setSenha(text);
        validatePassword(text);
        
        if (senhaError && text.trim() && validatePassword(text)) {
            setSenhaError('');
        }
    };

    const handleConfirmarSenhaChange = (text) => {
        setConfirmarSenha(text);
        if (confirmarSenhaError && text.trim() && text === senha) {
            setConfirmarSenhaError('');
        }
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError && text.trim() && validateEmail(text)) {
            setEmailError('');
        }
    };

    const handleTelefoneChange = (text) => {
        // Formatação automática do telefone
        let formatted = text.replace(/\D/g, '');
        if (formatted.length >= 11) {
            formatted = formatted.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (formatted.length >= 7) {
            formatted = formatted.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (formatted.length >= 3) {
            formatted = formatted.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        
        setTelefone(formatted);
        if (telefoneError && formatted.trim() && validatePhone(formatted)) {
            setTelefoneError('');
        }
    };

    const handleDataChange = (text) => {
        // Formatação automática da data no formato DD-MM-YYYY
        let formatted = text.replace(/\D/g, '');
        if (formatted.length >= 5) {
            formatted = formatted.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1-$2-$3');
        } else if (formatted.length >= 3) {
            formatted = formatted.replace(/(\d{2})(\d{0,2})/, '$1-$2');
        }
        
        setDataNascimento(formatted);
        if (dataError && formatted.trim() && validateDate(formatted)) {
            setDataError('');
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
                    <Text style={styles.titulo}>Cadastre sua conta Royal</Text>
                    
                    <Input
                        label="Nome completo"
                        type="text"
                        value={nomeCompleto}
                        onChangeText={setNomeCompleto}
                        error={nomeError}
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChangeText={handleEmailChange}
                        error={emailError}
                    />

                    <Input
                        label="Data de nascimento"
                        type="date"
                        value={dataNascimento}
                        onChangeText={handleDataChange}
                        error={dataError}
                        placeholder="DD-MM-AAAA"
                        maxLength={10}
                    />

                    <Input
                        label="Telefone"
                        type="phone"
                        value={telefone}
                        onChangeText={handleTelefoneChange}
                        error={telefoneError}
                        maxLength={15}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={senha}
                        onChangeText={handleSenhaChange}
                        error={senhaError}
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
                        label="Confirmar senhaenha"
                        type="password"
                        value={confirmarSenha}
                        onChangeText={handleConfirmarSenhaChange}
                        error={confirmarSenhaError}
                    />

                    {!!submitError && (
                        <Text style={{ color: '#D32F2F', marginBottom: 8 }}>{submitError}</Text>
                    )}
                    {!!submitSuccess && (
                        <Text style={{ color: '#2E7D32', marginBottom: 8 }}>{submitSuccess}</Text>
                    )}

                    <TouchableOpacity
                        style={styles.loginRedirectButton}
                        onPress={handleLoginRedirect}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.loginRedirectText}>Já possui uma conta? Entre aqui!</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cadastroButton}
                        onPress={handleCadastro}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cadastroButtonText}>{isSubmitting ? 'Enviando...' : 'Cadastrar'}</Text>
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
        zIndex: 2,
        position: 'relative',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 35,
        paddingVertical: 20,
        paddingBottom: 20, // Espaço extra para o teclado
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
        marginBottom: 20,
        color: '#101010',
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
    loginRedirectButton: {
        paddingVertical: 10,
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    loginRedirectText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'none',
    },
    cadastroButton: {
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
    cadastroButtonText: {
        color: '#101010',
        fontSize: 15,
        fontWeight: '500'
    },
});
