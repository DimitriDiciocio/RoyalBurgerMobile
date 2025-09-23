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
        // Se ainda não tem tamanho completo, não trava o usuário; deixa a API validar depois
        if (!date || date.length < 10) {
            return { valid: true, message: '' };
        }

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(date)) {
            // Não padroniza aqui para permitir que a mensagem específica da API (ex.: ano inválido) apareça
            return { valid: true, message: '' };
        }

        const [, dayStr, monthStr, yearStr] = date.match(dateRegex);
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);

        // Padroniza mês inválido no cliente
        if (month < 1 || month > 12) {
            return { valid: false, message: 'Mês inválido (use 01-12)' };
        }

        // Verifica consistência de dia
        const birthDate = new Date(year, month - 1, day);
        if (birthDate.getMonth() + 1 !== month || birthDate.getDate() !== day || birthDate.getFullYear() !== year) {
            return { valid: false, message: 'Data inválida' };
        }

        // Regras de idade
        const today = new Date();
        let age = today.getFullYear() - year;
        const beforeBirthdayThisYear = (today.getMonth() + 1 < month) || ((today.getMonth() + 1 === month) && (today.getDate() < day));
        if (beforeBirthdayThisYear) age -= 1;

        if (age < 18) {
            return { valid: false, message: 'Você deve ter pelo menos 18 anos' };
        }

        if (age > 120) {
            return { valid: false, message: 'Data inválida' };
        }

        return { valid: true, message: '' };
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
            setEmailError('Email é obrigatório');
            hasError = true;
        } else if (!validateEmail(email)) {
            setEmailError('Digite um email válido');
            hasError = true;
        }

        // Validação de data de nascimento
        if (!dataNascimento.trim()) {
            setDataError('Data de nascimento é obrigatória');
            hasError = true;
        } else {
            const { valid, message } = validateDate(dataNascimento);
            if (!valid) {
                setDataError(message);
                hasError = true;
            } else {
                setDataError('');
            }
        }

        // Validação de telefone
        if (!telefone.trim()) {
            setTelefoneError('Telefone é obrigatório');
            hasError = true;
        } else if (!validatePhone(telefone)) {
            setTelefoneError('Digite um telefone válido');
            hasError = true;
        } else {
            // Após validar formato, verifica se o primeiro dígito do número local é 9
            const digits = telefone.replace(/\D/g, '');
            if (digits.length >= 11) {
                const firstLocalDigit = digits[2];
                if (firstLocalDigit !== '9') {
                    setTelefoneError('Telefone deve começar com 9');
                    hasError = true;
                }
            }
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
            const apiSuccessMsg = response?.data?.message || response?.message;
            setSubmitSuccess(apiSuccessMsg || 'Cadastro realizado com sucesso.');
            // Redireciona para login após breve confirmação
            setTimeout(() => {
                navigation.navigate('Login');
            }, 800);
        } catch (error) {
            // Normaliza mensagem da API
            let apiErrMsg = error?.data?.error || error?.data?.msg || error?.data?.message || '';
            if (apiErrMsg) {
                apiErrMsg = apiErrMsg.replace(/E-mail/gi, 'Email');
            }

            const lower = apiErrMsg.toLowerCase();

            // Direciona por campo
            if (/(data|nascimento|dd-?mm-?a{4}|dd\/?mm\/?a{4})/i.test(apiErrMsg)) {
                setDataError(apiErrMsg);
            }
            if (lower.includes('email')) {
                setEmailError(apiErrMsg || 'Email inválido');
            }
            if (lower.includes('telefone') || lower.includes('celular')) {
                setTelefoneError(apiErrMsg || 'Telefone inválido');
            }
            if (lower.includes('senha')) {
                if (lower.includes('confirma')) {
                    setConfirmarSenhaError(apiErrMsg);
                } else {
                    setSenhaError(apiErrMsg);
                }
            }

            // Códigos específicos
            if (error?.status === 409) {
                if (lower.includes('email')) setEmailError(apiErrMsg || 'Email já cadastrado');
                if (lower.includes('telefone') || lower.includes('celular')) setTelefoneError(apiErrMsg || 'Telefone já cadastrado');
            }

            // Não mostra erro geral no rodapé
            setSubmitError('');
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
        // Formatação automática da data no formato DD/MM/YYYY
        let formatted = text.replace(/\D/g, '');
        if (formatted.length >= 5) {
            formatted = formatted.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
        } else if (formatted.length >= 3) {
            formatted = formatted.replace(/(\d{2})(\d{0,2})/, '$1/$2');
        }
        
        setDataNascimento(formatted);
        if (formatted.trim()) {
            const { valid } = validateDate(formatted);
            if (valid && dataError) {
                setDataError('');
            }
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
                        placeholder="DD/MM/AAAA"
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
                        label="Confirmar senha"
                        type="password"
                        value={confirmarSenha}
                        onChangeText={handleConfirmarSenhaChange}
                        error={confirmarSenhaError}
                    />

                    {/* Erro geral removido: erros aparecem apenas nos inputs */}
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
