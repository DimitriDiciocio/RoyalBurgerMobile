import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import BottomSheet from "./BottomSheet";
import { updateProfile } from "../services";

export default function EditarDadoBottomSheet({
  visible,
  onClose,
  field,
  currentValue,
  onSave,
  title,
  placeholder,
  keyboardType = "default",
  maxLength,
}) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatDateInput = (text) => {
    if (field !== 'date_of_birth') return text;
    
    // Remove tudo que não é número
    const numbersOnly = text.replace(/\D/g, '');
    
    // Aplica a formatação DD/MM/AAAA (padrão brasileiro)
    if (numbersOnly.length <= 2) {
      return numbersOnly;
    } else if (numbersOnly.length <= 4) {
      return `${numbersOnly.substring(0, 2)}/${numbersOnly.substring(2)}`;
    } else {
      return `${numbersOnly.substring(0, 2)}/${numbersOnly.substring(2, 4)}/${numbersOnly.substring(4, 8)}`;
    }
  };

  useEffect(() => {
    if (visible) {
      let initialValue = currentValue || "";
      
      // Converte data de nascimento do formato DD-MM-AAAA para DD/MM/AAAA
      if (field === 'date_of_birth' && initialValue && initialValue.includes('-')) {
        const parts = initialValue.split('-');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          initialValue = `${day}/${month}/${year}`;
        }
      }
      
      setValue(initialValue);
    }
  }, [visible, currentValue, field]);

  const handleSave = async () => {
    if (!value.trim()) {
      Alert.alert("Erro", "Por favor, preencha o campo.");
      return;
    }

    setIsLoading(true);
    try {
      let processedValue = value.trim();
      
      // Converte data de nascimento de DD/MM/AAAA para DD-MM-AAAA (formato da API)
      if (field === 'date_of_birth') {
        if (processedValue.includes('/')) {
          // Converte DD/MM/AAAA para DD-MM-AAAA
          const parts = processedValue.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            processedValue = `${day}-${month}-${year}`;
          }
        } else {
          // Remove qualquer caractere que não seja número
          const numbersOnly = processedValue.replace(/\D/g, '');
          
          // Se tem 8 dígitos, converte DDMMAAAA para DD-MM-AAAA
          if (numbersOnly.length === 8) {
            const day = numbersOnly.substring(0, 2);
            const month = numbersOnly.substring(2, 4);
            const year = numbersOnly.substring(4, 8);
            processedValue = `${day}-${month}-${year}`;
          } else if (numbersOnly.length === 6) {
            // Se tem 6 dígitos, assume DDMMAA e converte para DD-MM-20AA
            const day = numbersOnly.substring(0, 2);
            const month = numbersOnly.substring(2, 4);
            const year = numbersOnly.substring(4, 6);
            processedValue = `${day}-${month}-20${year}`;
          }
        }
      }
      
      await updateProfile({ [field]: processedValue });
      Alert.alert("Sucesso", "Dados atualizados com sucesso!");
      
      // Para data de nascimento, passa o valor no formato visual (DD/MM/AAAA)
      if (field === 'date_of_birth' && processedValue.includes('-')) {
        const parts = processedValue.split('-');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          onSave(`${day}/${month}/${year}`);
        } else {
          onSave(processedValue);
        }
      } else {
        onSave(processedValue);
      }
      
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Erro ao atualizar dados";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue || "");
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleCancel} heightPercentage={0.4}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setValue(formatDateInput(text))}
          placeholder={placeholder}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoFocus={true}
        />

        <View style={styles.buttonsContainer}>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#FFC700",
  },
  saveButtonText: {
    color: "#3D1807",
    fontSize: 16,
    fontWeight: "600",
  },
});
