import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { getStates } from '../services/addressService';

const StateSelector = ({
  label = "Estado",
  value,
  onValueChange,
  error,
  disabled = false,
  placeholder = "Selecione um estado"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = states.filter(state =>
        state.nome.toLowerCase().includes(searchText.toLowerCase()) ||
        state.sigla.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStates(filtered);
    } else {
      setFilteredStates(states);
    }
  }, [searchText, states]);

  const loadStates = async () => {
    setLoading(true);
    try {
      const result = await getStates();
      if (result.success) {
        setStates(result.data);
        setFilteredStates(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectState = (state) => {
    onValueChange(state);
    setIsOpen(false);
    setSearchText('');
  };

  const handleOpenModal = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled
        ]}
        onPress={handleOpenModal}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText,
          !value && styles.placeholderText,
          disabled && styles.selectorTextDisabled
        ]}>
          {value ? `${value.nome} (${value.sigla})` : placeholder}
        </Text>
        <Text style={[
          styles.arrow,
          disabled && styles.arrowDisabled
        ]}>▼</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Estado</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            <ScrollView 
              style={styles.statesList}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <Text style={styles.loadingText}>Carregando estados...</Text>
              ) : (
                filteredStates.map((state) => (
                  <TouchableOpacity
                    key={state.id}
                    style={[
                      styles.stateItem,
                      value?.id === state.id && styles.stateItemSelected
                    ]}
                    onPress={() => handleSelectState(state)}
                  >
                    <View style={styles.stateInfo}>
                      <Text style={[
                        styles.stateName,
                        value?.id === state.id && styles.stateNameSelected
                      ]}>
                        {state.nome}
                      </Text>
                      <Text style={[
                        styles.stateSigla,
                        value?.id === state.id && styles.stateSiglaSelected
                      ]}>
                        {state.sigla}
                      </Text>
                    </View>
                    {state.regiao && (
                      <Text style={[
                        styles.stateRegion,
                        value?.id === state.id && styles.stateRegionSelected
                      ]}>
                        {state.regiao}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorError: {
    borderColor: '#F44336',
  },
  selectorDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  selectorText: {
    fontSize: 16,
    color: '#101010',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  selectorTextDisabled: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  arrowDisabled: {
    color: '#999',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101010',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statesList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },
  stateItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stateItemSelected: {
    backgroundColor: '#FFF9E6',
  },
  stateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateName: {
    fontSize: 16,
    color: '#101010',
    fontWeight: '500',
  },
  stateNameSelected: {
    color: '#FFC700',
    fontWeight: '600',
  },
  stateSigla: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  stateSiglaSelected: {
    color: '#FFC700',
  },
  stateRegion: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  stateRegionSelected: {
    color: '#FFC700',
  },
});

export default StateSelector;
