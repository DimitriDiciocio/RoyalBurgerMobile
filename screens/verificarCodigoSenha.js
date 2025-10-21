import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Header from "../components/Header";
import VerificationCodeInput from "../components/VerificationCodeInput";
import { requestPasswordReset, resetPassword } from "../services/customerService";
import { SvgXml } from 'react-native-svg';

export default function VerificarCodigoSenha({ navigation, route }) {
  const { email } = route.params || {};
  
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Inicia contador de 60 segundos para reenvio
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setError('');
    setSuccess('');
  };

  const handleCodeComplete = async (completeCode) => {
    if (completeCode.length === 6) {
      // Navega para a tela de redefinir senha com o código
      navigation.navigate('RedefinirSenha', { 
        email: email, 
        resetCode: completeCode 
      });
    }
  };

  const resendCode = async () => {
    if (!email) {
      setError('Email não encontrado. Tente solicitar recuperação novamente.');
      return;
    }

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await requestPasswordReset(email);
      
      if (response.ok) {
        setSuccess('Novo código enviado para seu email!');
        setCountdown(60); // Reinicia contador
        
        // Inicia novo timer
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.error || 'Erro ao reenviar código');
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao reenviar código';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToForgotPassword = () => {
    navigation.navigate('EsqueciSenha', { email: email });
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
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/img/cadeado.png')}
            />
          </View>
          
          <Text style={styles.titulo}>Verifique seu código</Text>
          
          <Text style={styles.subtitulo}>
            Enviamos um código de verificação de 6 dígitos para:
          </Text>
          
          <Text style={styles.emailText}>{email}</Text>
          
          <Text style={styles.instrucoes}>
            Digite o código abaixo para continuar com a redefinição de senha:
          </Text>

          <VerificationCodeInput
            onCodeChange={handleCodeChange}
            onCodeComplete={handleCodeComplete}
            error={error}
            disabled={isVerifying}
            autoFocus={true}
            length={6}
          />

          {success ? (
            <Text style={styles.successText}>{success}</Text>
          ) : null}

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Não recebeu o código?
            </Text>
            
            <TouchableOpacity
              style={[
                styles.resendButton,
                (countdown > 0 || isResending) && styles.resendButtonDisabled
              ]}
              onPress={resendCode}
              disabled={countdown > 0 || isResending}
            >
              <Text style={[
                styles.resendButtonText,
                (countdown > 0 || isResending) && styles.resendButtonTextDisabled
              ]}>
                {isResending 
                  ? 'Enviando...' 
                  : countdown > 0 
                    ? `Reenviar em ${formatTime(countdown)}` 
                    : 'Reenviar código'
                }
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToForgotPassword}
            disabled={isVerifying || isResending}
          >
            <Text style={styles.backButtonText}>
              Voltar
            </Text>
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
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 20,
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#101010',
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFC700',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  instrucoes: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFC700',
    borderWidth: 1,
    borderColor: '#FFC700',
  },
  resendButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  resendButtonText: {
    color: '#101010',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  backButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
