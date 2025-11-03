import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CardPedido({ pedido, onAcompanhar, onVerDetalhes, onAdicionarCesta }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'processing':
      case 'preparing':
        return { text: 'Pedido em andamento', color: '#FFC107', dotColor: '#FFC107' };
      case 'completed':
      case 'delivered':
        return { text: 'Pedido concluído', color: '#4CAF50', dotColor: '#4CAF50' };
      case 'cancelled':
      case 'failed':
        return { text: 'Pedido cancelado', color: '#F44336', dotColor: '#F44336' };
      case 'unpaid':
        return { text: 'Pedido não pago', color: '#F44336', dotColor: '#F44336' };
      default:
        return { text: 'Status desconhecido', color: '#666', dotColor: '#666' };
    }
  };

  const statusInfo = getStatusInfo(pedido.status);
  const isInProgress = pedido.status?.toLowerCase() === 'processing' || pedido.status?.toLowerCase() === 'preparing';
  const isCompleted = pedido.status?.toLowerCase() === 'completed' || pedido.status?.toLowerCase() === 'delivered';
  const isUnpaid = pedido.status?.toLowerCase() === 'unpaid';

  return (
    <View style={styles.card}>
      {/* Data e Status */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(pedido.created_at)}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.dotColor }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      {/* Itens do Pedido */}
      <View style={styles.itemsContainer}>
        {pedido.items?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <Text style={styles.itemIconText}>{item.quantity || 1}</Text>
            </View>
            <Text style={styles.itemName}>{item.name || item.product_name}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total R${pedido.total?.toFixed(2).replace('.', ',') || '0,00'}</Text>
      </View>

      {/* Endereço */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.addressText}>
          {pedido.address?.street || 'Endereço não informado'}
        </Text>
      </View>

      {/* Ações */}
      <View style={styles.actionsContainer}>
        {isInProgress ? (
          <TouchableOpacity onPress={() => onAcompanhar(pedido)} style={styles.actionButton}>
            <Text style={styles.actionTextYellow}>Acompanhar</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => onVerDetalhes(pedido)} style={styles.actionButton}>
              <Text style={styles.actionText}>Ver detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onAdicionarCesta(pedido)} style={styles.actionButton}>
              <Text style={styles.actionTextYellow}>Adicione à cesta</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemIcon: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemIconText: {
    color: '#101010',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 14,
    color: '#101010',
    flex: 1,
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101010',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  actionTextYellow: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '600',
  },
});

