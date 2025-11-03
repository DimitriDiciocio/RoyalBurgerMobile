import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#000000"/>
</svg>`;

const phoneSvg = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.90406 1.94753C4.73124 1.53409 4.28062 1.31534 3.85187 1.43128L3.73156 1.46409C2.31843 1.84909 1.11093 3.21847 1.46312 4.88534C2.27468 8.71347 5.28687 11.7257 9.115 12.5372C10.7841 12.8916 12.1512 11.6819 12.5362 10.2688L12.5691 10.1485C12.6872 9.71753 12.4662 9.26691 12.055 9.09628L9.92656 8.21034C9.56562 8.05941 9.14781 8.16441 8.89843 8.46847L8.05406 9.50097C6.51625 8.73753 5.27812 7.46003 4.56718 5.89159L5.53406 5.10409C5.83812 4.85691 5.94093 4.43909 5.79218 4.07597L4.90406 1.94753Z" fill="#000000"/>
</svg>`;

const clockSvg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.875 6C10.875 8.69297 8.69297 10.875 6 10.875C3.30703 10.875 1.125 8.69297 1.125 6C1.125 3.30703 3.30703 1.125 6 1.125C8.69297 1.125 10.875 3.30703 10.875 6ZM0 6C0 9.31406 2.68594 12 6 12C9.31406 12 12 9.31406 12 6C12 2.68594 9.31406 0 6 0C2.68594 0 0 2.68594 0 6ZM5.4375 2.8125V6C5.4375 6.1875 5.53125 6.36328 5.68828 6.46875L7.93828 7.96875C8.19609 8.14219 8.54531 8.07187 8.71875 7.81172C8.89219 7.55156 8.82187 7.20469 8.56172 7.03125L6.5625 5.7V2.8125C6.5625 2.50078 6.31172 2.25 6 2.25C5.68828 2.25 5.4375 2.50078 5.4375 2.8125Z" fill="#000000"/>
</svg>`;

const storeSvg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 2V4H10V2H2ZM1 0H11C11.5523 0 12 0.447715 12 1V11C12 11.5523 11.5523 12 11 12H1C0.447715 12 0 11.5523 0 11V1C0 0.447715 0.447715 0 1 0ZM2 5V10H10V5H2Z" fill="currentColor"/>
</svg>`;

export default function CardPedido({ pedido, onAcompanhar, onVerDetalhes, onAdicionarCesta, customerInfo }) {
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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase();
    
    // Primeiro verificar casos específicos no switch
    switch (statusLower) {
      case 'pending':
      case 'novo':
        return { text: 'Novo', badgeClass: 'novo', backgroundColor: '#FF8C00', textColor: '#FFFFFF' };
      case 'processing':
      case 'preparing':
      case 'preparo':
        return { text: 'Preparo', badgeClass: 'preparo', backgroundColor: '#FFD700', textColor: '#101010' };
      case 'ready':
      case 'pronto':
        return { text: 'Pronto', badgeClass: 'pronto', backgroundColor: '#32CD32', textColor: '#FFFFFF' };
      case 'out_for_delivery':
      case 'delivering':
      case 'entrega':
      case 'em_rota':
      case 'em rota':
      case 'saiu_para_entrega':
      case 'saiu para entrega':
      case 'saiu_entrega':
      case 'rota':
      case 'on_the_way':
      case 'on the way':
      case 'em_transporte':
      case 'em transporte':
        return { text: 'Em rota de entrega', badgeClass: 'entrega', backgroundColor: '#A0522D', textColor: '#FFFFFF' };
      case 'completed':
      case 'delivered':
      case 'concluido':
      case 'finalizado':
      case 'entregue':
        return { text: 'Concluído', badgeClass: 'concluido', backgroundColor: '#4CAF50', textColor: '#FFFFFF' };
      case 'cancelled':
      case 'canceled':
      case 'cancelado':
        return { text: 'Cancelado', badgeClass: 'cancelado', backgroundColor: '#F44336', textColor: '#FFFFFF' };
      case 'unpaid':
        return { text: 'Não pago', badgeClass: 'cancelado', backgroundColor: '#F44336', textColor: '#FFFFFF' };
      default:
        // Verificar se contém palavras relacionadas a entrega/rota (após verificar casos específicos)
        // Mas excluir status de conclusão que podem conter "deliver"
        if (statusLower && !statusLower.includes('completed') && !statusLower.includes('delivered') && 
            !statusLower.includes('concluido') && !statusLower.includes('finalizado') && 
            !statusLower.includes('entregue') && 
            (statusLower.includes('rota') || statusLower.includes('entrega') || 
             (statusLower.includes('deliver') && !statusLower.includes('delivered')) || 
             statusLower.includes('transport'))) {
          return { text: 'Em rota de entrega', badgeClass: 'entrega', backgroundColor: '#A0522D', textColor: '#FFFFFF' };
        }
        return { text: 'Desconhecido', badgeClass: 'novo', backgroundColor: '#888888', textColor: '#FFFFFF' };
    }
  };

  const calculateEstimatedTime = (status, createdAt) => {
    if (!createdAt) return null;
    
    const statusLower = status?.toLowerCase();
    
    // Não calcular tempo estimado para pedidos concluídos
    if (statusLower === 'completed' || statusLower === 'delivered' || statusLower === 'concluido' ||
        statusLower === 'finalizado' || statusLower === 'entregue' ||
        (statusLower && (statusLower.includes('completed') || statusLower.includes('delivered') && 
         !statusLower.includes('delivering') && !statusLower.includes('delivery')))) {
      return null;
    }
    
    const now = new Date();
    const created = new Date(createdAt);
    const elapsedMinutes = Math.floor((now - created) / 60000);
    
    let estimatedMin = 0;
    let estimatedMax = 0;
    
    switch (statusLower) {
      case 'pending':
      case 'novo':
        estimatedMin = 30;
        estimatedMax = 45;
        break;
      case 'processing':
      case 'preparing':
      case 'preparo':
        estimatedMin = Math.max(15, 45 - elapsedMinutes);
        estimatedMax = Math.max(25, 60 - elapsedMinutes);
        break;
      case 'ready':
      case 'pronto':
        estimatedMin = 5;
        estimatedMax = 15;
        break;
      case 'out_for_delivery':
      case 'delivering':
      case 'entrega':
      case 'em_rota':
      case 'em rota':
      case 'saiu_para_entrega':
      case 'saiu para entrega':
      case 'saiu_entrega':
      case 'rota':
      case 'on_the_way':
      case 'on the way':
      case 'em_transporte':
      case 'em transporte':
        estimatedMin = 10;
        estimatedMax = 25;
        break;
      default:
        return null;
    }
    
    // Determinar cor baseado no tempo restante
    const avgTime = (estimatedMin + estimatedMax) / 2;
    let timeColor = 'gray';
    if (elapsedMinutes > avgTime * 0.8) {
      timeColor = 'red';
    } else if (elapsedMinutes > avgTime * 0.5) {
      timeColor = 'yellow';
    } else {
      timeColor = 'green';
    }
    
    return { min: estimatedMin, max: estimatedMax, color: timeColor };
  };

  const statusInfo = getStatusInfo(pedido.status);
  const status = pedido.status?.toLowerCase();
  
  // Verificar se está concluído primeiro para evitar que seja considerado em progresso
  const isCompleted = status === 'completed' || status === 'delivered' || status === 'concluido' ||
                      status === 'finalizado' || status === 'entregue' ||
                      statusInfo.badgeClass === 'concluido';
  
  const isInProgress = !isCompleted && (
    status === 'pending' || status === 'processing' || status === 'preparing' || 
    status === 'novo' || status === 'preparo' || status === 'ready' || 
    status === 'pronto' || status === 'out_for_delivery' || status === 'delivering' || 
    status === 'entrega' || status === 'em_rota' || status === 'em rota' ||
    status === 'saiu_para_entrega' || status === 'saiu para entrega' ||
    status === 'saiu_entrega' || status === 'rota' || status === 'on_the_way' ||
    status === 'on the way' || status === 'em_transporte' || status === 'em transporte' ||
    statusInfo.badgeClass === 'novo' || statusInfo.badgeClass === 'preparo' || 
    statusInfo.badgeClass === 'pronto' || statusInfo.badgeClass === 'entrega'
  );
  const isPickup = pedido.order_type === 'pickup' || pedido.order_type === 'retirada';
  const estimatedTime = calculateEstimatedTime(pedido.status, pedido.created_at);

  // Informações do cliente
  const customerName = customerInfo?.name || customerInfo?.nomeCompleto || customerInfo?.nome || 'Cliente';
  const customerPhone = customerInfo?.telefone || customerInfo?.phone || pedido.phone || '';

  return (
    <View style={styles.card}>
      {/* Header: ID, Status e Data */}
      <View style={styles.orderHeader}>
        <View style={styles.orderIdStatus}>
          <View style={styles.orderId}>
            <Text style={styles.idText}>
              {pedido.confirmation_code || `#${pedido.id || pedido.order_id || ''}`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.textColor }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          {estimatedTime && isInProgress && (
            <View style={[styles.orderTimeEstimate, styles[`time${estimatedTime.color.charAt(0).toUpperCase() + estimatedTime.color.slice(1)}`]]}>
              <SvgXml xml={clockSvg} width={10} height={10} />
              <Text style={[styles.timeDisplay, styles[`time${estimatedTime.color.charAt(0).toUpperCase() + estimatedTime.color.slice(1)}Text`]]}>
                {estimatedTime.min} - {estimatedTime.max} min
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.orderDate}>
          {formatDate(pedido.created_at)}
          {'\n'}
          {formatTime(pedido.created_at)}
        </Text>
      </View>

      {/* Informações do Cliente */}
      {(customerName || customerPhone) && (
        <View style={styles.orderCustomer}>
          <Text style={styles.customerName}>{customerName}</Text>
          <View style={styles.customerInfo}>
            {customerPhone && (
              <View style={styles.infoItem}>
                <SvgXml xml={phoneSvg} width={10} height={10} />
                <Text style={styles.infoItemText}>{customerPhone}</Text>
              </View>
            )}
            {pedido.address && (
              <View style={[styles.infoItem, isPickup && styles.orderPickup]}>
                {isPickup ? (
                  <SvgXml xml={storeSvg} width={10} height={10} />
                ) : (
                  <SvgXml xml={localizationSvg} width={10} height={10} />
                )}
                <Text style={styles.infoItemText}>
                  {pedido.address.street || pedido.address.address || ''}
                  {pedido.address.number ? `, ${pedido.address.number}` : ''}
                  {pedido.address.neighborhood ? ` - ${pedido.address.neighborhood}` : ''}
                </Text>
                {isPickup && (
                  <View style={styles.pickupBadge}>
                    <Text style={styles.pickupBadgeText}>Retirada</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Lista de Itens */}
      <View style={styles.orderItems}>
        {pedido.items?.map((item, index) => {
          const modifications = item.modifications || item.modificacoes || [];
          const extras = modifications.filter(m => m.type === 'extra' || m.type === 'add').length;
          const removals = modifications.filter(m => m.type === 'remove' || m.type === 'remover').length;
          const notes = item.notes || item.observacoes || item.observation || '';

          return (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <View style={styles.itemQtd}>
                  <Text style={styles.itemQtdText}>{item.quantity || 1}</Text>
                </View>
                <Text style={styles.itemName}>{item.name || item.product_name}</Text>
              </View>
              {item.price && (
                <Text style={styles.itemPrice}>
                  R$ {typeof item.price === 'number' 
                    ? item.price.toFixed(2).replace('.', ',') 
                    : item.price}
                </Text>
              )}
              {(extras > 0 || removals > 0 || notes) && (
                <View style={styles.orderItemModifications}>
                  {(extras > 0 || removals > 0) && (
                    <View style={styles.orderItemModificationsCompact}>
                      {extras > 0 && (
                        <View style={[styles.modificationBadge, styles.modAdd]}>
                          <Text style={styles.modificationBadgeText}>+{extras} extra(s)</Text>
                        </View>
                      )}
                      {removals > 0 && (
                        <View style={[styles.modificationBadge, styles.modRemove]}>
                          <Text style={styles.modificationBadgeText}>-{removals}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {notes && (
                    <View style={styles.orderItemNotesCompact}>
                      <Text style={styles.orderItemNotesText}>
                        <Text style={styles.notesLabel}>Obs:</Text> {notes}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Footer: Total e Botão */}
      <View style={styles.orderFooter}>
        <View style={styles.orderTotal}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            R$ {(pedido.total || pedido.order_total || 0).toFixed(2).replace('.', ',')}
          </Text>
        </View>
        {isInProgress ? (
          <TouchableOpacity 
            onPress={() => onAcompanhar(pedido)} 
            style={styles.orderActionBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.orderActionBtnText}>Acompanhar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => onVerDetalhes(pedido)} 
            style={styles.orderActionBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.orderActionBtnText}>Ver mais</Text>
          </TouchableOpacity>
        )}
        {!isInProgress && isCompleted && onAdicionarCesta && (
          <TouchableOpacity 
            onPress={() => onAdicionarCesta(pedido)} 
            style={styles.orderActionBtnSecondary}
            activeOpacity={0.8}
          >
            <Text style={styles.orderActionBtnTextSecondary}>Adicione à cesta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  // Header
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdStatus: {
    flex: 1,
    gap: 8,
  },
  orderId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  idText: {
    color: '#101010',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderTimeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeGreen: {
    color: '#4CAF50',
  },
  timeYellow: {
    color: '#FF9800',
  },
  timeRed: {
    color: '#F44336',
  },
  timeGray: {
    color: '#888888',
  },
  timeDisplay: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeGreenText: {
    color: '#4CAF50',
  },
  timeYellowText: {
    color: '#FF9800',
  },
  timeRedText: {
    color: '#F44336',
  },
  timeGrayText: {
    color: '#888888',
  },
  orderDate: {
    color: '#888888',
    fontSize: 11,
    textAlign: 'right',
  },
  // Customer
  orderCustomer: {
    marginBottom: 12,
  },
  customerName: {
    color: '#101010',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  customerInfo: {
    gap: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderPickup: {
    flexWrap: 'wrap',
  },
  infoItemText: {
    color: '#888888',
    fontSize: 11,
    flex: 1,
  },
  pickupBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFC700',
    borderRadius: 4,
    marginTop: 2,
  },
  pickupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#101010',
  },
  // Items
  orderItems: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E1E4',
  },
  orderItem: {
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemQtd: {
    backgroundColor: '#FFC700',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemQtdText: {
    color: '#101010',
    fontSize: 10,
    fontWeight: '600',
  },
  itemName: {
    color: '#101010',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  itemPrice: {
    color: '#888888',
    fontSize: 13,
    alignSelf: 'flex-end',
    marginTop: -18,
    marginBottom: 4,
  },
  orderItemModifications: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginLeft: 28,
  },
  orderItemModificationsCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  modificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modAdd: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  modRemove: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  modificationBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  orderItemNotesCompact: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#FFC700',
  },
  notesLabel: {
    fontWeight: '600',
  },
  orderItemNotesText: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
  },
  // Footer
  orderFooter: {
    marginTop: 4,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    color: '#101010',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '700',
  },
  orderActionBtn: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#101010',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  orderActionBtnSecondary: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC700',
  },
  orderActionBtnTextSecondary: {
    color: '#FFC700',
    fontSize: 13,
    fontWeight: '600',
  },
});
