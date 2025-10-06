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
import { getCitiesByState, getCitiesByStateSigla } from '../services/addressService';

const CitySelector = ({
  label = "Cidade",
  value,
  onValueChange,
  selectedState,
  error,
  disabled = false,
  placeholder = "Selecione uma cidade"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedState?.id || selectedState?.sigla) {
      if (selectedState.id) {
        loadCities(selectedState.id);
      } else if (selectedState.sigla) {
        // Se não tem ID mas tem sigla, busca o ID do estado primeiro
        loadCitiesBySigla(selectedState.sigla);
      }
    } else {
      setCities([]);
      setFilteredCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (searchText) {
      const filtered = cities.filter(city =>
        city.nome.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [searchText, cities]);

  const loadCities = async (stateId) => {
    setLoading(true);
    try {
      const result = await getCitiesByState(stateId);
      if (result.success) {
        setCities(result.data);
        setFilteredCities(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCitiesBySigla = async (stateSigla) => {
    setLoading(true);
    try {
      const result = await getCitiesByStateSigla(stateSigla);
      if (result.success) {
        setCities(result.data);
        setFilteredCities(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    onValueChange(city);
    setIsOpen(false);
    setSearchText('');
  };

  const handleOpenModal = () => {
    if (!disabled && (selectedState?.id || selectedState?.sigla)) {
      setIsOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchText('');
  };

  const isDisabled = disabled || !selectedState?.sigla;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError,
          isDisabled && styles.selectorDisabled
        ]}
        onPress={handleOpenModal}
        disabled={isDisabled}
      >
        <Text style={[
          styles.selectorText,
          !value && styles.placeholderText,
          isDisabled && styles.selectorTextDisabled
        ]}>
          {value ? value.nome : placeholder}
        </Text>
        <Text style={[
          styles.arrow,
          isDisabled && styles.arrowDisabled
        ]}>▼</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {!selectedState?.sigla && (
        <Text style={styles.warningText}>
          Selecione um estado primeiro
        </Text>
      )}

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Cidades de {selectedState?.nome}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar cidade..."
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            <ScrollView 
              style={styles.citiesList}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <Text style={styles.loadingText}>Carregando cidades...</Text>
              ) : filteredCities.length === 0 ? (
                <Text style={styles.emptyText}>
                  {cities.length === 0 ? 'Nenhuma cidade encontrada' : 'Nenhuma cidade corresponde à busca'}
                </Text>
              ) : (
                filteredCities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityItem,
                      value?.id === city.id && styles.cityItemSelected
                    ]}
                    onPress={() => handleSelectCity(city)}
                  >
                    <View style={styles.cityInfo}>
                      <Text style={[
                        styles.cityName,
                        value?.id === city.id && styles.cityNameSelected
                      ]}>
                        {city.nome}
                      </Text>
                    </View>
                    {city.microrregiao && (
                      <Text style={[
                        styles.cityRegion,
                        value?.id === city.id && styles.cityRegionSelected
                      ]}>
                        {city.microrregiao}
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
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
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
    flex: 1,
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
  citiesList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  cityItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cityItemSelected: {
    backgroundColor: '#FFF9E6',
  },
  cityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 16,
    color: '#101010',
    fontWeight: '500',
  },
  cityNameSelected: {
    color: '#FFC700',
    fontWeight: '600',
  },
  cityRegion: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cityRegionSelected: {
    color: '#FFC700',
  },
});

export default CitySelector;
