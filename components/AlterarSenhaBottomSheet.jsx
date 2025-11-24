import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomSheet from "./BottomSheet";
import Input from "./Input";
import CustomAlert from "./CustomAlert";
import { updatePassword, verifyPassword } from "../services";

export default function AlterarSenhaBottomSheet({
  visible,
  onClose,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  // ALTERAÇÃO: Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState([]);

  // Estados para validação de senha em tempo real (igual ao cadastro)
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });

  // Função para validar senha (igual ao cadastro)
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

  // Validação em tempo real (igual ao cadastro)
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    validatePassword(text);
  };

  // Validação da senha atual
  const handleCurrentPasswordChange = async (text) => {
    setCurrentPassword(text);
    setIsCurrentPasswordValid(false);
    
    if (text.trim().length >= 6) {
      try {
        await verifyPassword(text);
        setIsCurrentPasswordValid(true);
      } catch (error) {
        setIsCurrentPasswordValid(false);
      }
    }
  };

  const handleSave = async () => {
    // ALTERAÇÃO: Validações usando CustomAlert
    if (!currentPassword.trim()) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('Por favor, digite sua senha atual.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    if (!isCurrentPasswordValid) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('Por favor, digite sua senha atual correta.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    if (!newPassword.trim()) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('Por favor, digite sua nova senha.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    if (!confirmPassword.trim()) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('Por favor, confirme sua nova senha.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('As senhas não coincidem.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    if (!validatePassword(newPassword)) {
      setAlertType('delete');
      setAlertTitle('Erro');
      setAlertMessage('A nova senha não atende aos requisitos.');
      setAlertButtons([{ text: 'OK' }]);
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      // ALTERAÇÃO: Usar CustomAlert para sucesso
      setAlertType('success');
      setAlertTitle('Sucesso');
      setAlertMessage('Senha alterada com sucesso!');
      setAlertButtons([
        {
          text: 'OK',
          onPress: () => {
            // Limpa os campos
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsCurrentPasswordValid(false);
            onClose();
          }
        }
      ]);
      setAlertVisible(true);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Erro ao alterar senha";
      
      // ALTERAÇÃO: Se for erro 401, significa que a senha atual está incorreta
      if (error?.response?.status === 401) {
        setIsCurrentPasswordValid(false);
        setAlertType('delete');
        setAlertTitle('Erro');
        setAlertMessage('Senha atual incorreta. Verifique e tente novamente.');
        setAlertButtons([{ text: 'OK' }]);
        setAlertVisible(true);
      } else {
        setAlertType('delete');
        setAlertTitle('Erro');
        setAlertMessage(errorMessage);
        setAlertButtons([{ text: 'OK' }]);
        setAlertVisible(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsCurrentPasswordValid(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleCancel} heightPercentage={0.8}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.container}>
          <Text style={styles.titulo}>Altere sua senha</Text>
          
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChangeText={handleCurrentPasswordChange}
            style={styles.inputSpacing}
            isValid={isCurrentPasswordValid}
          />

          <Input
            label="Senha nova"
            type="password"
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            style={styles.inputSpacing}
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
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.confirmButtonText}>
              {isLoading ? 'Alterando...' : 'Confirmar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* ALTERAÇÃO: CustomAlert para substituir Alert.alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 30,
    textAlign: "center",
  },
  passwordRequirements: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  requirementItem: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  requirementMet: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#FFC700",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  confirmButtonText: {
    color: "#3D1807",
    fontSize: 16,
    fontWeight: "600",
  },
  inputSpacing: {
    marginBottom: 20,
  },
});