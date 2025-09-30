import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import Input from './Input';

export default function EditarEnderecoBottomSheet({ 
  visible, 
  onClose, 
  endereco = null, 
  onSave,
  onDelete 
}) {
  const isEditing = !!endereco;
  
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [semNumero, setSemNumero] = useState(false);
  const [semComplemento, setSemComplemento] = useState(false);

  // Preenche o formulário quando estiver editando
  useEffect(() => {
    if (endereco) {
      setFormData({
        street: endereco.street || '',
        number: endereco.number || '',
        complement: endereco.complement || '',
        neighborhood: endereco.neighborhood || '',
        city: endereco.city || '',
        state: endereco.state || '',
        zip_code: endereco.zip_code || '',
      });
      setSemNumero(!endereco.number || endereco.number === 'S/N');
      setSemComplemento(!endereco.complement);
    } else {
      // Limpa o formulário quando for adicionar novo
      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
      });
      setSemNumero(false);
      setSemComplemento(false);
    }
  }, [endereco, visible]);

  const handleConfirm = () => {
    // Validação simples
    if (!formData.zip_code.trim()) {
      alert('Por favor, preencha o campo CEP');
      return;
    }
    if (!formData.street.trim()) {
      alert('Por favor, preencha o campo Rua');
      return;
    }
    if (!formData.neighborhood.trim()) {
      alert('Por favor, preencha o campo Bairro');
      return;
    }
    if (!formData.number.trim() && !semNumero) {
      alert('Por favor, preencha o campo Número ou marque "Endereço sem número"');
      return;
    }

    // Callback com os dados
    onSave({
      zip_code: formData.zip_code,
      street: formData.street,
      number: semNumero ? 'S/N' : formData.number,
      complement: semComplemento ? '' : formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city || 'Não informado',
      state: formData.state || 'SP',
      id: endereco?.id, // Inclui ID se estiver editando
    });
  };

  const handleDelete = () => {
    if (onDelete && endereco?.id) {
      onDelete(endereco.id);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} heightPercentage={0.85}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {isEditing ? 'Editar dados' : 'Adicionar endereço'}
        </Text>
        <Text style={styles.subtitle}>Campos com (*) são obrigatórios</Text>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
          overScrollMode="auto"
        >
          {/* Rua */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rua*</Text>
            <Input
              placeholder="Ex: Rua das Flores"
              placeholderTextColor="#CCCCCC"
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
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
              onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
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
              onChangeText={(text) => setFormData({ ...formData, number: text })}
              keyboardType="numeric"
              editable={!semNumero}
            />
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => {
                setSemNumero(!semNumero);
                if (!semNumero) {
                  setFormData({ ...formData, number: '' });
                }
              }}
            >
              <View style={[styles.checkbox, semNumero && styles.checkboxChecked]}>
                {semNumero && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
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
              onChangeText={(text) => setFormData({ ...formData, complement: text })}
              editable={!semComplemento}
            />
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => {
                setSemComplemento(!semComplemento);
                if (!semComplemento) {
                  setFormData({ ...formData, complement: '' });
                }
              }}
            >
              <View style={[styles.checkbox, semComplemento && styles.checkboxChecked]}>
                {semComplemento && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Endereço sem complemento</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          {/* Cidade */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cidade</Text>
            <Input
              placeholder="Ex: São Paulo"
              placeholderTextColor="#CCCCCC"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>

          <View style={styles.spacer} />

          {/* Estado */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Estado</Text>
            <Input
              placeholder="Ex: SP"
              placeholderTextColor="#CCCCCC"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
              maxLength={2}
            />
          </View>

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
            style={[styles.confirmButton, isEditing && styles.confirmButtonSmall]} 
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
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
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
    backgroundColor: 'transparent',
  },
  bottomSpacer: {
    height: 30,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#888888',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 15,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  deleteButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC700',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonSmall: {
    flex: 1,
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});