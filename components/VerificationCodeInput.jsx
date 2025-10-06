import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const VerificationCodeInput = ({
  onCodeChange,
  onCodeComplete,
  error,
  disabled = false,
  autoFocus = false,
  length = 6,
}) => {
  const [code, setCode] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleTextChange = (text, index) => {
    // Remove caracteres não numéricos
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Atualiza o código
    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);

    // Chama callback de mudança
    const fullCode = newCode.join('');
    onCodeChange?.(fullCode);

    // Auto-focus no próximo input se digitou um número
    if (numericText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Chama callback de código completo
    if (fullCode.length === length && fullCode.replace(/\s/g, '').length === length) {
      onCodeComplete?.(fullCode);
    }
  };

  const handleKeyPress = (key, index) => {
    // Se pressionou backspace e o campo está vazio, volta para o anterior
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Se o campo já tem valor, seleciona todo o texto
    if (code[index]) {
      inputRefs.current[index]?.setSelection(0, 1);
    }
  };

  const clearCode = () => {
    setCode(Array(length).fill(''));
    onCodeChange?.('');
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array.from({ length }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              error && styles.inputError,
              code[index] && styles.inputFilled,
            ]}
            value={code[index]}
            onChangeText={(text) => handleTextChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            onFocus={() => handleFocus(index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            editable={!disabled}
            autoFocus={autoFocus && index === 0}
          />
        ))}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <TouchableOpacity
        style={styles.clearButton}
        onPress={clearCode}
        disabled={disabled}
      >
        <Text style={styles.clearButtonText}>Limpar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  input: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#101010',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputFilled: {
    borderColor: '#FFC700',
    backgroundColor: '#FFF9E6',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 5,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VerificationCodeInput;
