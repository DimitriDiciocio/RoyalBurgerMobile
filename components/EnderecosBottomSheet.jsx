import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import CardEndereco from './CardEndereco';

export default function EnderecosBottomSheet({ visible, onClose, enderecos, onAddNew, onEdit, onSelect, enderecoAtivo, onSelectPickup, isPickupSelected }) {
  const handleEditEndereco = (endereco) => {
    if (onEdit) {
      onEdit(endereco);
    }
  };

  const handleSelectEndereco = (endereco) => {
    if (onSelect) {
      onSelect(endereco);
    }
  };

  // Função para formatar o endereço completo
  const formatEndereco = (endereco) => {
    const parts = [];
    
    if (endereco.street) {
      parts.push(endereco.street);
    }
    
    if (endereco.number) {
      parts.push(endereco.number);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
  };

  // Função para formatar o complemento
  const formatComplemento = (endereco) => {
    const parts = [];
    
    if (endereco.neighborhood) {
      parts.push(endereco.neighborhood);
    }
    
    if (endereco.complement) {
      parts.push(endereco.complement);
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Bairro - Complemento';
  };

  const handlePickupSelect = () => {
    if (onSelectPickup) {
      onSelectPickup();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} heightPercentage={0.7}>
      <View style={styles.container}>
        <Text style={styles.title}>Endereços</Text>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity 
            style={[styles.pickupCard, isPickupSelected && styles.pickupCardActive]} 
            onPress={handlePickupSelect}
            activeOpacity={0.7}
          >
            <View style={styles.pickupIconContainer}>
              <Entypo name="shop" size={24} color={isPickupSelected ? '#FFC700' : 'black'} />
            </View>
            <View style={styles.pickupTextContainer}>
              <Text style={styles.pickupTitle}>Retirar no local</Text>
              <Text style={styles.pickupSubtitle}>Balcão - Retirada na loja</Text>
            </View>
          </TouchableOpacity>

          {enderecos && enderecos.length > 0 ? (
            // Ordena endereços: ativo primeiro, depois os outros
            [...enderecos].sort((a, b) => {
              const aIsActive = enderecoAtivo && a.id === enderecoAtivo.id;
              const bIsActive = enderecoAtivo && b.id === enderecoAtivo.id;
              if (aIsActive && !bIsActive) return -1;
              if (!aIsActive && bIsActive) return 1;
              return 0;
            }).map((endereco, index) => {
              const isActive = enderecoAtivo && endereco.id === enderecoAtivo.id;
              return (
                <CardEndereco
                  key={endereco.id || index}
                  endereco={formatEndereco(endereco)}
                  complemento={formatComplemento(endereco)}
                  onEdit={() => handleEditEndereco(endereco)}
                  onSelect={() => handleSelectEndereco(endereco)}
                  isActive={isActive}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
          <Text style={styles.addButtonText}>Adicionar um novo endereço</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FFC700',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickupCardActive: {
    borderColor: '#FFC700',
    borderWidth: 2,
  },
  pickupIconContainer: {
    marginRight: 12,
  },
  pickupTextContainer: {
    flex: 1,
  },
  pickupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  pickupSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
});
