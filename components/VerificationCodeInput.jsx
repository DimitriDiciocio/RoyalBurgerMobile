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
    // Mantém apenas dígitos
    const numericText = (text || '').replace(/[^0-9]/g, '');

    // Se colou múltiplos dígitos, distribui a partir do campo atual
    if (numericText.length > 1) {
      const distributed = [...code];
      let cursor = index;
      for (let i = 0; i < numericText.length && cursor < length; i += 1) {
        distributed[cursor] = numericText[i];
        cursor += 1;
      }
      setCode(distributed);

      const joined = distributed.join('');
      onCodeChange?.(joined);

      // Foca próximo vazio ou último preenchido
      const nextEmpty = distributed.findIndex((c) => !c);
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();

      if (joined.length === length) {
        onCodeComplete?.(joined);
      }
      return;
    }

    // Comportamento normal para um dígito
    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);

    const fullCode = newCode.join('');
    onCodeChange?.(fullCode);

    if (numericText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (fullCode.length === length && fullCode.replace(/\s/g, '').length === length) {
      onCodeComplete?.(fullCode);
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace') {
      const newCode = [...code];
      // Se o campo atual tem valor, apaga e mantém foco; senão, limpa o anterior e foca nele
      if (newCode[index]) {
        newCode[index] = '';
        setCode(newCode);
        onCodeChange?.(newCode.join(''));
      } else if (index > 0) {
        newCode[index - 1] = '';
        setCode(newCode);
        onCodeChange?.(newCode.join(''));
        inputRefs.current[index - 1]?.focus();
      }
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
    width: '100%',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    width: 48,
    height: 56,
    marginHorizontal: 3,
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
