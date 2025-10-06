import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import Input from "./Input";
import CEPInput from "./CEPInput";
import StateSelector from "./StateSelector";
import CitySelector from "./CitySelector";

export default function EditarEnderecoBottomSheet({
  visible,
  onClose,
  endereco = null,
  onSave,
  onDelete,
}) {
  const isEditing = !!endereco;

  const [formData, setFormData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const [semNumero, setSemNumero] = useState(false);
  const [semComplemento, setSemComplemento] = useState(false);
  
  // Estados para os novos componentes
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Preenche o formulário quando estiver editando
  useEffect(() => {
    if (endereco) {
      setFormData({
        street: endereco.street || "",
        number: endereco.number || "",
        complement: endereco.complement || "",
        neighborhood: endereco.neighborhood || "",
        city: endereco.city || "",
        state: endereco.state || "",
        zip_code: endereco.zip_code || "",
      });
      setSemNumero(!endereco.number || endereco.number === "S/N");
      setSemComplemento(!endereco.complement);
      
      // Inicializa os seletores se houver dados
      if (endereco.state) {
        setSelectedState({ sigla: endereco.state, nome: endereco.state });
      }
      if (endereco.city) {
        setSelectedCity({ nome: endereco.city });
      }
    } else {
      // Limpa o formulário quando for adicionar novo
      setFormData({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: "",
      });
      setSemNumero(false);
      setSemComplemento(false);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [endereco, visible]);

  const handleConfirm = () => {
    // Validação simples
    if (!formData.zip_code.trim()) {
      alert("Por favor, preencha o campo CEP");
      return;
    }
    if (!formData.street.trim()) {
      alert("Por favor, preencha o campo Rua");
      return;
    }
    if (!formData.neighborhood.trim()) {
      alert("Por favor, preencha o campo Bairro");
      return;
    }
    if (!selectedState) {
      alert("Por favor, selecione um estado");
      return;
    }
    if (!selectedCity) {
      alert("Por favor, selecione uma cidade");
      return;
    }
    if (!formData.number.trim() && !semNumero) {
      alert(
        'Por favor, preencha o campo Número ou marque "Endereço sem número"'
      );
      return;
    }

    // Callback com os dados
    onSave({
      zip_code: formData.zip_code,
      street: formData.street,
      number: semNumero ? null : formData.number,
      complement: semComplemento ? null : formData.complement,
      neighborhood: formData.neighborhood,
      city: selectedCity.nome,
      state: selectedState.sigla,
      id: endereco?.id, // Inclui ID se estiver editando
    });
  };

  const handleDelete = () => {
    if (onDelete && endereco?.id) {
      onDelete(endereco.id);
    }
  };

  // Função para lidar com a busca de CEP
  const handleCEPFound = async (addressData) => {
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        street: addressData.logradouro || prev.street,
        neighborhood: addressData.bairro || prev.neighborhood,
        city: addressData.localidade || prev.city,
        state: addressData.uf || prev.state,
      }));
      
      // Atualiza os seletores se houver dados
      if (addressData.uf) {
        // Busca o nome completo do estado pela sigla
        try {
          const { getStates } = await import('../services/addressService');
          const statesResult = await getStates();
          if (statesResult.success) {
            const state = statesResult.data.find(s => s.sigla === addressData.uf);
            if (state) {
              setSelectedState({ 
                id: state.id, 
                sigla: state.sigla, 
                nome: state.nome 
              });
            } else {
              // Fallback se não encontrar o estado
              setSelectedState({ sigla: addressData.uf, nome: addressData.uf });
            }
          }
        } catch (error) {
          console.error('Erro ao buscar estado:', error);
          // Fallback se der erro
          setSelectedState({ sigla: addressData.uf, nome: addressData.uf });
        }
      }
      if (addressData.localidade) {
        setSelectedCity({ nome: addressData.localidade });
      }
    }
  };

  // Função para lidar com a seleção de estado
  const handleStateChange = (state) => {
    setSelectedState(state);
    setFormData(prev => ({
      ...prev,
      state: state.sigla
    }));
    // Limpa a cidade quando muda o estado
    setSelectedCity(null);
    setFormData(prev => ({
      ...prev,
      city: ""
    }));
  };

  // Função para lidar com a seleção de cidade
  const handleCityChange = (city) => {
    setSelectedCity(city);
    setFormData(prev => ({
      ...prev,
      city: city.nome
    }));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} heightPercentage={0.85}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {isEditing ? "Editar dados" : "Adicionar endereço"}
        </Text>
        <Text style={styles.subtitle}>Campos com (*) são obrigatórios</Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CEP */}
          <CEPInput
            label="CEP*"
            value={formData.zip_code}
            onValueChange={(text) => setFormData({ ...formData, zip_code: text })}
            onAddressFound={handleCEPFound}
            placeholder="00000-000"
            autoSearch={true}
          />

          <View style={styles.spacer} />

          {/* Rua */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rua*</Text>
            <Input
              placeholder="Ex: Rua das Flores"
              placeholderTextColor="#CCCCCC"
              value={formData.street}
              onChangeText={(text) =>
                setFormData({ ...formData, street: text })
              }
            />
          </View>

          <View style={styles.spacer} />

          {/* Bairro */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bairro*</Text>
            <Input
              placeholder="Ex: Centro"
              placeholderTextColor="#CCCCCC"
              value={formData.neighborhood}
              onChangeText={(text) =>
                setFormData({ ...formData, neighborhood: text })
              }
            />
          </View>

          <View style={styles.spacer} />

          {/* Número */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número*</Text>
            <Input
              placeholder={semNumero ? "" : "Ex: 123"}
              placeholderTextColor="#CCCCCC"
              value={formData.number}
              onChangeText={(text) =>
                setFormData({ ...formData, number: text })
              }
              keyboardType="numeric"
              editable={!semNumero}
            />
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setSemNumero(!semNumero);
                if (!semNumero) {
                  setFormData({ ...formData, number: "" });
                }
              }}
            >
              <View
                style={[styles.checkbox, semNumero && styles.checkboxChecked]}
              >
                {semNumero && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Endereço sem número</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          {/* Complemento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Complemento</Text>
            <Input
              placeholder={semComplemento ? "" : "Ex: Apto 101, Bloco B"}
              placeholderTextColor="#CCCCCC"
              value={formData.complement}
              onChangeText={(text) =>
                setFormData({ ...formData, complement: text })
              }
              editable={!semComplemento}
            />
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setSemComplemento(!semComplemento);
                if (!semComplemento) {
                  setFormData({ ...formData, complement: "" });
                }
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  semComplemento && styles.checkboxChecked,
                ]}
              >
                {semComplemento && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Endereço sem complemento</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          {/* Estado */}
          <StateSelector
            label="Estado*"
            value={selectedState}
            onValueChange={handleStateChange}
            placeholder="Selecione um estado"
          />

          <View style={styles.spacer} />

          {/* Cidade */}
          <CitySelector
            label="Cidade*"
            value={selectedCity}
            onValueChange={handleCityChange}
            selectedState={selectedState}
            placeholder="Selecione uma cidade"
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Botões de ação - FIXOS */}
        <View style={styles.buttonsContainer}>
          {isEditing && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              isEditing && styles.confirmButtonSmall,
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
    paddingVertical: 2,
  },
  spacer: {
    height: 20,
    backgroundColor: "transparent",
  },
  bottomSpacer: {
    height: 30,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#D9D9D9",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#FFC700",
    borderColor: "#FFC700",
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#888888",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  deleteButtonText: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#FFC700",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmButtonSmall: {
    flex: 1,
  },
  confirmButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
