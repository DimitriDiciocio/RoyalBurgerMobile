import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { searchCEP, formatCEP, validateCEP } from '../services/addressService';

const CEPInput = ({
  label = "CEP",
  value,
  onValueChange,
  onAddressFound,
  error,
  disabled = false,
  placeholder = "00000-000",
  autoSearch = true,
  maxLength = 9
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [lastSearchedCEP, setLastSearchedCEP] = useState('');

  const handleTextChange = (text) => {
    // Remove caracteres não numéricos
    const numericText = text.replace(/\D/g, '');
    
    // Formata o CEP
    const formattedText = formatCEP(numericText);
    
    onValueChange(formattedText);
    setSearchError('');
    
    // Busca automática quando o CEP estiver completo
    if (autoSearch && numericText.length === 8 && formattedText !== lastSearchedCEP) {
      handleSearch(formattedText);
    }
  };

  const handleSearch = async (cep = value) => {
    if (!cep || !validateCEP(cep)) {
      setSearchError('CEP inválido');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setLastSearchedCEP(cep);

    try {
      const result = await searchCEP(cep);
      
      if (result.success) {
        // Chama callback com os dados do endereço encontrado
        onAddressFound?.(result.data);
        setSearchError('');
      } else {
        setSearchError(result.error || 'CEP não encontrado');
        onAddressFound?.(null);
      }
    } catch (error) {
      setSearchError('Erro ao consultar CEP');
      onAddressFound?.(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = () => {
    if (value && validateCEP(value)) {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchError('');
    setLastSearchedCEP('');
    onAddressFound?.(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            disabled && styles.inputDisabled
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType="numeric"
          maxLength={maxLength}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFC700" />
          </View>
        )}
        
        {!isSearching && value && validateCEP(value) && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleManualSearch}
            disabled={disabled}
          >
            <SvgUri
              uri="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4Ljc1IDEwLjYyNUMxOC43NSAxMi40MTggMTguMTY4IDE0LjA3NDIgMTcuMTg3NSAxNS40MThMMjIuMTMyOCAyMC4zNjcyQzIyLjYyMTEgMjAuODU1NSAyMi42MjExIDIxLjY0ODQgMjIuMTMyOCAyMi4xMzY3QzIxLjY0NDUgMjIuNjI1IDIwLjg1MTYgMjIuNjI1IDIwLjM2MzMgMjIuMTM2N0wxNS40MTggMTcuMTg3NUMxNC4wNzQyIDE4LjE2OCAxMi40MTggMTguNzUgMTAuNjI1IDE4Ljc1QzYuMTM2NzIgMTguNzUgMi41IDE1LjExMzMgMi41IDEwLjYyNUMyLjUgNi4xMzY3MiA2LjEzNjcyIDIuNSAxMC42MjUgMi41QzE1LjExMzMgMi41IDE4Ljc1IDYuMTM2NzIgMTguNzUgMTAuNjI1Wk0xMC42MjUgMTYuMjVDMTMuNzMwNSAxNi4yNSAxNi4yNSAxMy43MzA1IDE2LjI1IDEwLjYyNUMxNi4yNSA3LjUxOTUzIDEzLjczMDUgNSAxMC42MjUgNUM3LjUxOTUzIDUgNSA3LjUxOTUzIDUgMTAuNjI1QzUgMTMuNzMwNSA3LjUxOTUzIDE2LjI1IDEwLjYyNSAxNi4yNVoiIGZpbGw9IiM4ODg4ODgiLz4KPC9zdmc+"
              width={12}
              height={12}
            />
          </TouchableOpacity>
        )}
        
        {searchError && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
            disabled={disabled}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}
      
      {isSearching && (
        <Text style={styles.searchingText}>Buscando endereço...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101010',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#101010',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    color: '#999',
  },
  loadingContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  searchButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 5,
  },
  searchErrorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  searchingText: {
    color: '#FFC700',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default CEPInput;
