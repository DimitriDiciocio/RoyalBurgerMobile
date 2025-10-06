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
    
    // Aplica a formatação DD/MM/AAAA
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
      
      // Converte data de nascimento para formato DD/MM/AAAA no input
      if (field === 'date_of_birth' && initialValue) {
        if (initialValue.includes('-')) {
          const parts = initialValue.split('-');
          if (parts.length === 3) {
            // Se é formato AAAA-MM-DD, converte para DD/MM/AAAA
            if (parts[0].length === 4) {
              const [year, month, day] = parts;
              initialValue = `${day}/${month}/${year}`;
            } else {
              // Se é DD-MM-AAAA, converte para DD/MM/AAAA
              const [day, month, year] = parts;
              initialValue = `${day}/${month}/${year}`;
            }
          }
        }
        // Se já está no formato DD/MM/AAAA, mantém como está
      }
      
      setValue(initialValue);
    }
  }, [visible, currentValue, field]);

  const validateDate = (day, month, year) => {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    
    // Validações básicas com mensagens específicas
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      Alert.alert("Erro", "Por favor, digite apenas números na data.");
      return false;
    }
    
    if (dayNum < 1 || dayNum > 31) {
      Alert.alert("Erro", "O dia deve estar entre 1 e 31.");
      return false;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      Alert.alert("Erro", "O mês deve estar entre 1 e 12.");
      return false;
    }
    
    if (yearNum < 1900) {
      Alert.alert("Erro", "O ano deve ser maior que 1900.");
      return false;
    }
    
    if (yearNum > currentYear) {
      Alert.alert("Erro", `O ano não pode ser maior que ${currentYear}.`);
      return false;
    }
    
    // Validação de dias por mês
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Verifica ano bissexto
    if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    
    if (dayNum > daysInMonth[monthNum - 1]) {
      const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
      Alert.alert("Erro", `${monthNames[monthNum - 1]} tem apenas ${daysInMonth[monthNum - 1]} dias.`);
      return false;
    }
    
    // Validação de idade mínima (18 anos)
    const today = new Date();
    const birthDate = new Date(yearNum, monthNum - 1, dayNum);
    
    // Verifica se a data é válida
    if (birthDate.getDate() !== dayNum || birthDate.getMonth() !== monthNum - 1 || birthDate.getFullYear() !== yearNum) {
      Alert.alert("Erro", "Data inválida. Verifique se o dia, mês e ano estão corretos.");
      return false;
    }
    
    // Calcula a diferença em milissegundos
    const ageInMs = today.getTime() - birthDate.getTime();
    const ageInYears = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
    
    console.log(`Data de nascimento: ${day}/${month}/${year}`);
    console.log(`Data atual: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`);
    console.log(`Idade calculada: ${ageInYears} anos`);
    
    if (ageInYears < 18) {
      Alert.alert("Erro", "Você deve ter pelo menos 18 anos para usar este serviço.");
      return false;
    }
    
    return true;
  };

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
            
            // Valida a data antes de processar
            console.log(`Validando data: ${day}/${month}/${year}`);
            if (!validateDate(day, month, year)) {
              console.log("Validação falhou");
              setIsLoading(false);
              return;
            }
            console.log("Validação passou");
            
            processedValue = `${day}-${month}-${year}`;
          }
        } else if (processedValue.includes('-')) {
          // Se já está no formato DD-MM-AAAA, valida
          const parts = processedValue.split('-');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            
            // Valida a data antes de processar
            if (!validateDate(day, month, year)) {
              setIsLoading(false);
              return;
            }
          }
        } else {
          // Remove qualquer caractere que não seja número
          const numbersOnly = processedValue.replace(/\D/g, '');
          
          // Se tem 8 dígitos, converte DDMMAAAA para DD-MM-AAAA
          if (numbersOnly.length === 8) {
            const day = numbersOnly.substring(0, 2);
            const month = numbersOnly.substring(2, 4);
            const year = numbersOnly.substring(4, 8);
            
            // Valida a data antes de processar
            if (!validateDate(day, month, year)) {
              setIsLoading(false);
              return;
            }
            
            processedValue = `${day}-${month}-${year}`;
          } else if (numbersOnly.length === 6) {
            // Se tem 6 dígitos, assume DDMMAA e converte para DD-MM-20AA
            const day = numbersOnly.substring(0, 2);
            const month = numbersOnly.substring(2, 4);
            const year = numbersOnly.substring(4, 6);
            const fullYear = `20${year}`;
            
            // Valida a data antes de processar
            if (!validateDate(day, month, fullYear)) {
              setIsLoading(false);
              return;
            }
            
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
