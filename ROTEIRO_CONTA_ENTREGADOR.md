# 📘 Roteiro Completo - Interface da Conta do Entregador
## Royal Burger Mobile

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estruturação de Pastas e Arquivos](#estruturação-de-pastas-e-arquivos)
3. [Layout e Componentes](#layout-e-componentes)
4. [Integração com API](#integração-com-api)
5. [Lógica de Estado](#lógica-de-estado)
6. [Regras Especiais](#regras-especiais)
7. [Testes](#testes)
8. [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

### Objetivo
Implementar uma interface funcional, intuitiva e segura para uso diário pelos entregadores, garantindo que o fluxo de pedidos → rota → entrega seja eficiente e compatível com toda a infraestrutura da Royal Burger.

### Funcionalidades Principais
- **Navegação inferior** (MenuNavigation) com 5 opções: Início, Pedidos, Logo, Mochila, Perfil
- **Screen Pedidos**: Lista pedidos com status "Pronto" (antes de sair para entrega)
- **Screen Mochila**: Lista pedidos com status "Em rota de entrega"
- **Alteração de status**: De "Pronto" para "Em rota de entrega"
- **Finalização de entrega**: Validação via código do pedido
- **Tela Perfil**: Já existe, validar navs para exibir apenas: Configurações, Dados, Ver Cardápio

---

## 📁 Estruturação de Pastas e Arquivos

### 1. Estrutura de Pastas

```
RoyalBurgerMobile/
├── screens/
│   ├── entregador/
│   │   ├── EntregadorHome.js          # Tela principal (Início)
│   │   ├── EntregadorPedidos.js       # Screen 1: Pedidos com status "Pronto"
│   │   └── EntregadorMochila.js       # Screen 2: Pedidos com status "Em rota"
│
├── components/
│   ├── entregador/
│   │   ├── EntregadorMenuNavigation.jsx # Navegação inferior (Início, Pedidos, Logo, Mochila, Perfil)
│   │   ├── CardPedidoEntregador.jsx   # Card de pedido (sem código de entrega)
│   │   ├── ModalConfirmacaoCodigo.jsx # Modal para validar código
│   │   └── SectionPedidosDisponiveis.jsx # Section 1 - Pedidos Prontos
│   │   └── SectionMochila.jsx         # Section 2 - Pedidos Em Rota
│
├── services/
│   ├── deliveryService.js             # Serviço específico para entregadores
│
├── hooks/
│   ├── useEntregadorPedidos.js        # Hook para gerenciar pedidos do entregador
│   └── useEntregadorStatus.js         # Hook para gerenciar mudanças de status
```

### 2. Arquivos a Criar

#### 2.1. Screens

**`screens/entregador/EntregadorHome.js`**
- Tela principal da conta do entregador (Início)
- Pode exibir informações gerais, estatísticas, etc.
- Renderiza `EntregadorMenuNavigation` na parte inferior

**`screens/entregador/EntregadorPedidos.js`**
- Screen 1: Lista pedidos com status "Pronto" (antes de sair para entrega)
- Renderiza `SectionPedidosDisponiveis` com lista de pedidos prontos
- Botão "Aceitar Entrega" em cada card
- Ao aceitar, pedido muda status e desaparece desta tela
- Renderiza `EntregadorMenuNavigation` na parte inferior

**`screens/entregador/EntregadorMochila.js`**
- Screen 2: Lista pedidos com status "Em rota de entrega"
- Renderiza `SectionMochila` com lista de pedidos em rota
- Botão "Finalizar Entrega" em cada card
- Modal para validar código do pedido
- Renderiza `EntregadorMenuNavigation` na parte inferior

**`screens/perfil.js` (JÁ EXISTE - Apenas validação)**
- Tela de perfil já existe no projeto
- **Validação necessária**: Filtrar `menuOptions` para entregadores
- Exibir apenas: "Configurações", "Dados da conta", "Ver cardápio"
- Remover: "Ver pedidos", "Endereços", "Ver pontos"
- Renderiza `EntregadorMenuNavigation` na parte inferior (ao invés de MenuNavigation padrão)

#### 2.2. Components

**`components/entregador/EntregadorMenuNavigation.jsx`**
- Navegação inferior (bottom navigation) com 5 opções: Início, Pedidos, Logo, Mochila, Perfil
- Baseado em `MenuNavigation.jsx` existente, mas adaptado para entregadores
- Remove opção "Clube Royal"
- Mantém logo central
- Indicador visual da página atual
- Estilo consistente com o design system

**`components/entregador/CardPedidoEntregador.jsx`**
- Baseado em `CardPedido.jsx` existente
- **NUNCA exibe código de entrega** (remover campo `delivery_code` se existir)
- Botão para alterar status para "Em rota de entrega"
- Botão para finalizar entrega (apenas na Mochila)
- Estilo visual inspirado no Painel ADM

**`components/entregador/ModalConfirmacaoCodigo.jsx`**
- Modal para inserir código de validação
- Input numérico com máscara
- Validação e feedback visual
- Botões: Confirmar, Cancelar

**`components/entregador/SectionPedidosDisponiveis.jsx`**
- Componente usado na screen `EntregadorPedidos.js`
- Lista de pedidos com status "Pronto"
- Usa `FlatList` para performance
- Pull-to-refresh
- Empty state quando não há pedidos
- Botão "Aceitar Entrega" em cada card

**`components/entregador/SectionMochila.jsx`**
- Componente usado na screen `EntregadorMochila.js`
- Lista de pedidos com status "Em rota de entrega"
- Usa `FlatList` para performance
- Pull-to-refresh
- Empty state quando não há pedidos
- Botão "Finalizar Entrega" em cada card

#### 2.3. Services

**`services/deliveryService.js`**
- `getReadyOrders()` - Lista pedidos com status "Pronto"
- `getInTransitOrders()` - Lista pedidos com status "Em rota de entrega"
- `updateOrderToInTransit(orderId)` - Altera status para "Em rota"
- `finalizeDelivery(orderId, code)` - Finaliza entrega com validação de código
- `getDeliveryOrders()` - Lista todos os pedidos de entrega (filtro por tipo)

#### 2.4. Hooks

**`hooks/useEntregadorPedidos.js`**
- Gerencia estado de pedidos disponíveis e mochila
- Sincronização automática entre sections
- Atualização periódica (polling opcional)
- Tratamento de erros

**`hooks/useEntregadorStatus.js`**
- Gerencia mudanças de status
- Validação de transições de status
- Feedback visual durante operações
- Tratamento de erros

---

## 🎨 Layout e Componentes

### 1. Navegação Inferior (`EntregadorMenuNavigation.jsx`)

**Baseado em:** `components/MenuNavigation.jsx`

**Modificações:**
- Remover opção "Clube Royal" (crown)
- **Manter logo central** (não remover)
- Manter: Início (house), Pedidos (pedido), Logo (logo), Mochila (novo ícone), Perfil (perfil)
- Distribuir 5 itens igualmente na barra
- Adicionar ícone para "Mochila" (pode usar ícone de mochila/bolsa ou adaptar existente)

**Estrutura:**
```jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

const EntregadorMenuNavigation = ({ navigation, currentRoute = 'EntregadorHome' }) => {
  const menuItems = [
    { id: 'home', icon: 'house', label: 'Início', screen: 'EntregadorHome', type: 'svg' },
    { id: 'orders', icon: 'pedido', label: 'Pedidos', screen: 'EntregadorPedidos', type: 'svg' },
    { id: 'logo', icon: 'logo', label: '', screen: 'EntregadorHome', type: 'logo' },
    { id: 'mochila', icon: 'mochila', label: 'Mochila', screen: 'EntregadorMochila', type: 'svg' },
    { id: 'profile', icon: 'perfil', label: 'Perfil', screen: 'Perfil', type: 'svg' },
  ];

  const getSvgIcon = (iconName, isActive = false) => {
    switch (iconName) {
      case 'house':
        return isActive ? houseSvgActive : houseSvg;
      case 'pedido':
        return isActive ? pedidoSvgActive : pedidoSvg;
      case 'mochila':
        // TODO: Criar SVG para mochila ou usar ícone existente adaptado
        return isActive ? mochilaSvgActive : mochilaSvg;
      case 'perfil':
        return isActive ? perfilSvgActive : perfilSvg;
      default:
        return isActive ? houseSvgActive : houseSvg;
    }
  };

  const handleNavigation = (screen) => {
    if (navigation && screen) {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        // Se for o logo, renderiza sem TouchableOpacity
        if (item.type === 'logo') {
          return (
            <View key={item.id} style={styles.menuItem}>
              <Image
                source={require('../assets/img/logoIcon.png')}
                style={styles.logoImage}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
          );
        }
        
        // Para outros itens, mantém o TouchableOpacity
        const isActive = currentRoute === item.screen;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleNavigation(item.screen)}
            activeOpacity={0.7}
          >
            <SvgXml xml={getSvgIcon(item.icon, isActive)} width={30} height={30} />
            <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
```

**Características:**
- Posição fixa na parte inferior da tela
- Altura: ~100px (mesma do MenuNavigation original)
- Background: #FFFFFF
- Borda superior: 1px, cor #E0E0E0
- Sombras sutis para profundidade
- 5 itens distribuídos igualmente (flex: 1 cada)
- Logo central não é clicável (apenas visual)
- Indicador visual da página ativa (cor do texto e ícone mudam)

**Estilos:**
```jsx
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 100,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 5,
  },
  menuLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  activeMenuLabel: {
    color: '#101010',
    fontWeight: '600',
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
```

**Uso nas Telas:**
```jsx
// Em cada tela do entregador (EntregadorHome, EntregadorPedidos, EntregadorMochila, Perfil)
<View style={styles.container}>
  {/* Conteúdo da tela */}
  <ScrollView 
    style={styles.content}
    contentContainerStyle={{ paddingBottom: 100 }} // Espaço para navegação
  >
    {/* Conteúdo */}
  </ScrollView>
  
  {/* Navegação inferior */}
  <EntregadorMenuNavigation 
    navigation={navigation} 
    currentRoute="EntregadorPedidos" // Nome da rota atual
  />
</View>
```

**⚠️ IMPORTANTE:**
- Adicionar `paddingBottom: 100` no `contentContainerStyle` do ScrollView/FlatList
- Ou usar `paddingBottom: 100` no container principal
- Garantir que o conteúdo não fique escondido atrás da navegação
- **Ícone Mochila**: Criar SVG para mochila ou adaptar ícone existente (pode usar ícone de bolsa/sacola)

### 2. Validação na Tela de Perfil (`screens/perfil.js`)

**Modificação necessária:**
- Filtrar `menuOptions` baseado no role do usuário
- Para entregadores, exibir apenas: "Configurações", "Dados da conta", "Ver cardápio"
- Remover: "Ver pedidos", "Endereços", "Ver pontos"

**Implementação:**
```javascript
// No início do componente Perfil
const user = await getStoredUserData();
const isDelivery = user?.role === 'delivery' || user?.role === 'entregador';

// Filtrar menuOptions
const menuOptions = isDelivery 
  ? [
      { id: "cardapio", icon: "lupa", title: "Ver cardápio" },
      { id: "dados", icon: "perfil", title: "Dados da conta" },
      { id: "config", icon: "gear", title: "Configurações" },
    ]
  : [
      { id: "cardapio", icon: "lupa", title: "Ver cardápio" },
      { id: "dados", icon: "perfil", title: "Dados da conta" },
      { id: "pedidos", icon: "pedido", title: "Ver pedidos" },
      { id: "enderecos", icon: "localization", title: "Endereços" },
      { id: "pontos", icon: "crown", title: "Ver pontos" },
      { id: "config", icon: "gear", title: "Configurações" },
    ];
```

**Também atualizar:**
- Renderizar `EntregadorMenuNavigation` ao invés de `MenuNavigation` quando for entregador
- Remover seção "Seus Pontos" quando for entregador

### 4. Section Pedidos Disponíveis (`SectionPedidosDisponiveis.jsx`)

**Estrutura:**
```jsx
<View style={styles.navContainer}>
  <TouchableOpacity 
    onPress={() => setActiveSection('pedidos')}
    style={[styles.navItem, activeSection === 'pedidos' && styles.activeNavItem]}
  >
    <Text style={styles.navItemText}>Pedidos</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    onPress={() => setActiveSection('mochila')}
    style={[styles.navItem, activeSection === 'mochila' && styles.activeNavItem]}
  >
    <Text style={styles.navItemText}>Mochila</Text>
  </TouchableOpacity>
</View>
```

**Características:**
- Posição lateral (esquerda ou topo, dependendo do design)
- Indicador visual da section ativa
- Animações suaves
- Estilo consistente com o design system

### 3. Card de Pedido (`CardPedidoEntregador.jsx`)

**Baseado em:** `components/CardPedido.jsx`

**Modificações:**
- **REMOVER** qualquer exibição de `delivery_code` ou `codigo_entrega`
- Adicionar botão "Aceitar Entrega" (Section Pedidos Disponíveis)
- Adicionar botão "Finalizar Entrega" (Section Mochila)
- Manter estilo visual do Painel ADM

**Estrutura:**
```jsx
<View style={styles.card}>
  {/* Header: ID, Status, Data */}
  <View style={styles.orderHeader}>
    <Text style={styles.orderId}>#{pedido.id}</Text>
    <StatusBadge status={pedido.status} />
    <Text style={styles.orderDate}>{formatDate(pedido.created_at)}</Text>
  </View>

  {/* Informações do Cliente */}
  <View style={styles.customerInfo}>
    <Text style={styles.customerName}>{pedido.customer?.name}</Text>
    <Text style={styles.customerPhone}>{pedido.customer?.phone}</Text>
    <Text style={styles.customerAddress}>{pedido.address?.street}</Text>
  </View>

  {/* Lista de Itens */}
  <View style={styles.orderItems}>
    {pedido.items?.map((item, index) => (
      <OrderItem key={index} item={item} />
    ))}
  </View>

  {/* Footer: Total e Ações */}
  <View style={styles.orderFooter}>
    <Text style={styles.total}>Total: R$ {pedido.total}</Text>
    
    {/* Botão baseado na section */}
    {section === 'pedidos' && (
      <TouchableOpacity 
        onPress={() => handleAcceptDelivery(pedido.id)}
        style={styles.acceptButton}
      >
        <Text style={styles.acceptButtonText}>Aceitar Entrega</Text>
      </TouchableOpacity>
    )}
    
    {section === 'mochila' && (
      <TouchableOpacity 
        onPress={() => handleFinalizeDelivery(pedido.id)}
        style={styles.finalizeButton}
      >
        <Text style={styles.finalizeButtonText}>Finalizar Entrega</Text>
      </TouchableOpacity>
    )}
  </View>
</View>
```

**⚠️ REGRA CRÍTICA:** 
- **NUNCA** exibir `delivery_code`, `codigo_entrega`, `deliveryCode` ou qualquer campo relacionado ao código de entrega no card
- Filtrar esses campos antes de renderizar

### 4. Modal de Confirmação (`ModalConfirmacaoCodigo.jsx`)

**Estrutura:**
```jsx
<Modal
  visible={visible}
  transparent={true}
  animationType="slide"
  onRequestClose={onClose}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Confirmar Entrega</Text>
      <Text style={styles.modalSubtitle}>
        Digite o código fornecido pelo cliente
      </Text>
      
      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={setCode}
        placeholder="0000"
        keyboardType="numeric"
        maxLength={4}
        autoFocus={true}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleConfirm}
          style={styles.confirmButton}
          disabled={!code || code.length !== 4}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
```

**Características:**
- Input numérico com máscara (4 dígitos)
- Validação em tempo real
- Feedback visual de erro
- Botões desabilitados quando código inválido

### 5. Section Pedidos Disponíveis (`SectionPedidosDisponiveis.jsx`)

**Estrutura:**
```jsx
<View style={styles.sectionContainer}>
  <Text style={styles.sectionTitle}>Pedidos Disponíveis</Text>
  
  {loading ? (
    <ActivityIndicator size="large" color="#FFC700" />
  ) : (
    <FlatList
      data={readyOrders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <CardPedidoEntregador 
          pedido={item} 
          section="pedidos"
          onAcceptDelivery={handleAcceptDelivery}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nenhum pedido disponível no momento
          </Text>
        </View>
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.listContent}
    />
  )}
</View>
```

**Características:**
- Filtra apenas pedidos com status "Pronto" ou equivalente
- Pull-to-refresh
- Empty state amigável
- Loading state durante carregamento

### 5. Section Mochila (`SectionMochila.jsx`)

**Estrutura:**
```jsx
<View style={styles.sectionContainer}>
  <Text style={styles.sectionTitle}>Mochila</Text>
  
  {loading ? (
    <ActivityIndicator size="large" color="#FFC700" />
  ) : (
    <FlatList
      data={inTransitOrders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <CardPedidoEntregador 
          pedido={item} 
          section="mochila"
          onFinalizeDelivery={handleFinalizeDelivery}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nenhum pedido em rota no momento
          </Text>
        </View>
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.listContent}
    />
  )}
</View>
```

**Características:**
- Filtra apenas pedidos com status "Em rota de entrega"
- Pull-to-refresh
- Empty state amigável
- Loading state durante carregamento

---

## 🔌 Integração com API

### 1. Serviço de Entregador (`services/deliveryService.js`)

```javascript
import api from "./api";

/**
 * Obtém pedidos com status "Pronto" (disponíveis para entrega)
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de pedidos prontos
 */
export const getReadyOrders = async (filters = {}) => {
  try {
    const response = await api.get("/orders/status/ready", {
      params: {
        ...filters,
        order_type: "delivery", // Apenas entregas
      },
    });
    
    // Filtrar campos sensíveis (código de entrega)
    const orders = response.data?.items || response.data || [];
    return orders.map(order => {
      const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = order;
      return safeOrder;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém pedidos com status "Em rota de entrega"
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de pedidos em rota
 */
export const getInTransitOrders = async (filters = {}) => {
  try {
    const response = await api.get("/orders/status/out_for_delivery", {
      params: {
        ...filters,
        order_type: "delivery",
      },
    });
    
    // Filtrar campos sensíveis
    const orders = response.data?.items || response.data || [];
    return orders.map(order => {
      const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = order;
      return safeOrder;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza status do pedido para "Em rota de entrega"
 * @param {number} orderId - ID do pedido
 * @returns {Promise<object>} - Pedido atualizado
 */
export const updateOrderToInTransit = async (orderId) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, {
      status: "out_for_delivery", // ou "em_rota" dependendo da API
      notes: "Pedido aceito pelo entregador",
    });
    
    // Filtrar campos sensíveis
    const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = response.data;
    return safeOrder;
  } catch (error) {
    throw error;
  }
};

/**
 * Finaliza entrega com validação de código
 * @param {number} orderId - ID do pedido
 * @param {string} code - Código de validação fornecido pelo cliente
 * @returns {Promise<object>} - Pedido finalizado
 */
export const finalizeDelivery = async (orderId, code) => {
  try {
    const response = await api.post(`/orders/${orderId}/finalize-delivery`, {
      delivery_code: code, // Enviar código apenas na requisição
    });
    
    // Filtrar campos sensíveis na resposta
    const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = response.data;
    return safeOrder;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtém todos os pedidos de entrega (para sincronização)
 * @param {object} filters - Filtros opcionais
 * @returns {Promise<Array>} - Lista de pedidos
 */
export const getDeliveryOrders = async (filters = {}) => {
  try {
    const response = await api.get("/orders", {
      params: {
        ...filters,
        order_type: "delivery",
      },
    });
    
    // Filtrar campos sensíveis
    const orders = response.data?.items || response.data || [];
    return orders.map(order => {
      const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = order;
      return safeOrder;
    });
  } catch (error) {
    throw error;
  }
};
```

### 2. Rotas da API Necessárias

**Verificar se existem na API:**
- `GET /orders/status/ready` - Lista pedidos prontos
- `GET /orders/status/out_for_delivery` - Lista pedidos em rota
- `PATCH /orders/:id/status` - Atualiza status do pedido
- `POST /orders/:id/finalize-delivery` - Finaliza entrega com código

**Se não existirem, usar rotas alternativas:**
- `GET /orders?status=ready&order_type=delivery`
- `GET /orders?status=out_for_delivery&order_type=delivery`
- `PATCH /orders/:id/status` (já existe em `orderService.js`)

### 3. Tratamento de Erros

**Padrão de tratamento:**
```javascript
try {
  const orders = await getReadyOrders();
  setReadyOrders(orders);
} catch (error) {
  const errorMessage = error?.response?.data?.message || 
                       error?.message || 
                       "Erro ao carregar pedidos";
  
  // Exibir feedback visual (Alert, Toast, etc.)
  Alert.alert("Erro", errorMessage);
  
  // Log apenas em desenvolvimento
  if (__DEV__) {
    console.error("Erro ao carregar pedidos:", error);
  }
}
```

---

## 🧠 Lógica de Estado

### 1. Hook `useEntregadorPedidos.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getReadyOrders, getInTransitOrders } from '../services/deliveryService';

export const useEntregadorPedidos = () => {
  const [readyOrders, setReadyOrders] = useState([]);
  const [inTransitOrders, setInTransitOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ready, inTransit] = await Promise.all([
        getReadyOrders(),
        getInTransitOrders(),
      ]);
      
      setReadyOrders(ready);
      setInTransitOrders(inTransit);
    } catch (err) {
      setError(err);
      if (__DEV__) {
        console.error("Erro ao carregar pedidos:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  }, [loadOrders]);

  useEffect(() => {
    loadOrders();
    
    // Opcional: Polling automático a cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  return {
    readyOrders,
    inTransitOrders,
    loading,
    refreshing,
    error,
    refreshOrders,
    reloadOrders: loadOrders,
  };
};
```

### 2. Hook `useEntregadorStatus.js`

```javascript
import { useState, useCallback } from 'react';
import { updateOrderToInTransit, finalizeDelivery } from '../services/deliveryService';
import { Alert } from 'react-native';

export const useEntregadorStatus = (onStatusChange) => {
  const [updating, setUpdating] = useState(false);

  const acceptDelivery = useCallback(async (orderId) => {
    try {
      setUpdating(true);
      await updateOrderToInTransit(orderId);
      
      // Callback para atualizar lista
      if (onStatusChange) {
        onStatusChange(orderId, 'out_for_delivery');
      }
      
      Alert.alert("Sucesso", "Pedido aceito para entrega!");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                           "Erro ao aceitar pedido";
      Alert.alert("Erro", errorMessage);
      
      if (__DEV__) {
        console.error("Erro ao aceitar pedido:", error);
      }
    } finally {
      setUpdating(false);
    }
  }, [onStatusChange]);

  const finishDelivery = useCallback(async (orderId, code) => {
    try {
      setUpdating(true);
      await finalizeDelivery(orderId, code);
      
      // Callback para atualizar lista
      if (onStatusChange) {
        onStatusChange(orderId, 'delivered');
      }
      
      Alert.alert("Sucesso", "Entrega finalizada com sucesso!");
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                           "Código inválido ou erro ao finalizar entrega";
      Alert.alert("Erro", errorMessage);
      
      if (__DEV__) {
        console.error("Erro ao finalizar entrega:", error);
      }
      return false;
    } finally {
      setUpdating(false);
    }
  }, [onStatusChange]);

  return {
    acceptDelivery,
    finishDelivery,
    updating,
  };
};
```

### 3. Sincronização entre Screens

**Na screen `EntregadorPedidos.js`:**
```javascript
const { readyOrders, refreshOrders } = useEntregadorPedidos();

const handleStatusChange = useCallback((orderId, newStatus) => {
  // Atualizar lista de pedidos prontos
  refreshOrders();
  // Navegar para Mochila após aceitar
  navigation.navigate('EntregadorMochila');
}, [refreshOrders, navigation]);

const { acceptDelivery } = useEntregadorStatus(handleStatusChange);
```

**Na screen `EntregadorMochila.js`:**
```javascript
const { inTransitOrders, refreshOrders } = useEntregadorPedidos();

const handleStatusChange = useCallback((orderId, newStatus) => {
  // Atualizar lista de mochila
  refreshOrders();
}, [refreshOrders]);

const { finishDelivery } = useEntregadorStatus(handleStatusChange);
```

**Fluxo:**
1. Entregador visualiza pedido em `EntregadorPedidos` (status "Pronto")
2. Clica em "Aceitar Entrega" → Status muda para "Em rota"
3. Pedido desaparece de `EntregadorPedidos`
4. Navegação automática para `EntregadorMochila` (ou manual via MenuNavigation)
5. Pedido aparece em `EntregadorMochila`
6. Ao finalizar entrega, pedido desaparece de `EntregadorMochila`

---

## 🔒 Regras Especiais

### 1. Segurança - NUNCA Exibir Código de Entrega

**Implementação:**
```javascript
// Em deliveryService.js - Filtrar antes de retornar
const safeOrder = {
  ...order,
};
delete safeOrder.delivery_code;
delete safeOrder.codigo_entrega;
delete safeOrder.deliveryCode;
return safeOrder;

// Em CardPedidoEntregador.jsx - Garantir que não seja renderizado
const { delivery_code, codigo_entrega, deliveryCode, ...displayOrder } = pedido;
// Usar apenas displayOrder para renderização
```

**Verificação:**
- Buscar por `delivery_code`, `codigo_entrega`, `deliveryCode` em todos os componentes
- Garantir que nenhum campo relacionado apareça no UI

### 2. Estilo Visual - Inspirado no Painel ADM

**Cores:**
- Background: #F6F6F6
- Cards: #FFFFFF
- Botões primários: #101010
- Botões secundários: #FFC700
- Status badges: Cores específicas por status

**Tipografia:**
- Títulos: fontSize 16-18, fontWeight '600'
- Texto normal: fontSize 14, fontWeight '400'
- Labels: fontSize 12, fontWeight '500'

**Espaçamentos:**
- Padding cards: 20px
- Margin entre cards: 12px
- Border radius: 10px

### 3. Performance

**Otimizações:**
- Usar `FlatList` em vez de `ScrollView` para listas
- `keyExtractor` otimizado
- `getItemLayout` se possível
- `initialNumToRender={10}`
- `windowSize={5}`
- `removeClippedSubviews={true}`

**Memoização:**
- `React.memo` em `CardPedidoEntregador`
- `useCallback` para funções passadas como props
- `useMemo` para cálculos pesados

### 4. Acessibilidade

**Implementar:**
- `accessibilityLabel` em todos os botões
- `accessibilityRole` apropriado
- `accessibilityHint` quando necessário
- Suporte a leitores de tela

**Exemplo:**
```jsx
<TouchableOpacity
  accessibilityLabel="Aceitar entrega do pedido"
  accessibilityRole="button"
  accessibilityHint="Aceita o pedido e move para a mochila"
  onPress={handleAcceptDelivery}
>
  <Text>Aceitar Entrega</Text>
</TouchableOpacity>
```

---

## 🧪 Testes

### 1. Testes de Fluxo

**Teste 1: Mudança de Status**
```
1. Entregador visualiza pedido em "Pedidos Disponíveis"
2. Clica em "Aceitar Entrega"
3. Verifica que pedido desaparece de "Pedidos Disponíveis"
4. Verifica que pedido aparece em "Mochila"
5. Verifica que status mudou para "Em rota de entrega"
```

**Teste 2: Validação de Código**
```
1. Entregador visualiza pedido em "Mochila"
2. Clica em "Finalizar Entrega"
3. Modal de código aparece
4. Insere código correto
5. Verifica que entrega é finalizada
6. Verifica que pedido desaparece de "Mochila"
7. Verifica feedback de sucesso
```

**Teste 3: Código Inválido**
```
1. Entregador tenta finalizar entrega
2. Insere código incorreto
3. Verifica mensagem de erro
4. Verifica que pedido permanece em "Mochila"
```

**Teste 4: Atualização da Mochila**
```
1. Entregador aceita pedido
2. Verifica atualização automática da mochila
3. Verifica que não há duplicatas
4. Verifica ordenação correta (mais recente primeiro)
```

### 2. Testes de Responsividade

**Dispositivos:**
- iPhone SE (pequeno)
- iPhone 12/13/14 (médio)
- iPhone 14 Pro Max (grande)
- Android pequeno (320px)
- Android médio (360px)
- Android grande (414px)

**Verificações:**
- Cards não ultrapassam bordas
- Texto não corta
- Botões acessíveis
- Scroll funciona corretamente
- Navegação inferior não sobrepõe conteúdo
- Padding bottom adequado nas telas para não sobrepor a navegação

### 3. Testes de Usabilidade

**Cenários:**
1. Entregador com múltiplos pedidos
2. Entregador sem pedidos disponíveis
3. Entregador com mochila vazia
4. Conexão lenta/offline
5. Erros de API

**Verificações:**
- Loading states apropriados
- Empty states informativos
- Mensagens de erro claras
- Feedback visual em todas as ações

### 4. Testes de Segurança

**Verificações:**
- Código de entrega nunca aparece no UI
- Código não é logado em console
- Tokens não são expostos
- Dados sensíveis filtrados

---

## ✅ Checklist Final

### Funcionalidades
- [ ] Navegação inferior (EntregadorMenuNavigation) com 5 opções funcionando (Início, Pedidos, Logo, Mochila, Perfil)
- [ ] Screen "EntregadorPedidos" exibindo pedidos prontos
- [ ] Screen "EntregadorMochila" exibindo pedidos em rota
- [ ] Validação na tela Perfil para entregadores (apenas Configurações, Dados, Ver Cardápio)
- [ ] Botão "Aceitar Entrega" funcionando
- [ ] Botão "Finalizar Entrega" funcionando
- [ ] Modal de código funcionando
- [ ] Validação de código funcionando
- [ ] Atualização automática entre sections
- [ ] Pull-to-refresh funcionando

### Segurança
- [ ] Código de entrega nunca exibido no UI
- [ ] Campos sensíveis filtrados
- [ ] Tokens não expostos
- [ ] Validação de autenticação em todas as rotas

### Performance
- [ ] FlatList implementado corretamente
- [ ] Memoização aplicada
- [ ] Loading states apropriados
- [ ] Otimizações de renderização

### UI/UX
- [ ] Estilo consistente com Painel ADM
- [ ] Empty states implementados
- [ ] Feedback visual em todas as ações
- [ ] Mensagens de erro claras
- [ ] Animações suaves

### Acessibilidade
- [ ] accessibilityLabel em botões
- [ ] accessibilityRole apropriado
- [ ] Contraste de cores adequado
- [ ] Suporte a leitores de tela

### Integração API
- [ ] Rotas de API funcionando
- [ ] Tratamento de erros implementado
- [ ] Sincronização funcionando
- [ ] Polling opcional funcionando

### Testes
- [ ] Testes de fluxo passando
- [ ] Testes de responsividade passando
- [ ] Testes de usabilidade passando
- [ ] Testes de segurança passando

### Documentação
- [ ] Código comentado
- [ ] JSDoc em funções públicas
- [ ] README atualizado (se necessário)

---

## 🚀 Próximos Passos

1. **Criar estrutura de pastas** conforme definido
2. **Implementar serviços** (`deliveryService.js`)
3. **Criar hooks** (`useEntregadorPedidos.js`, `useEntregadorStatus.js`)
4. **Implementar componentes** (MenuNavigation para entregadores, Cards, Modal, Sections)
5. **Criar screens** (Home, Pedidos, Mochila)
6. **Validar tela Perfil** (filtrar menuOptions para entregadores)
7. **Integrar com navegação** (adicionar rotas no `App.js`)
8. **Testar fluxos** completos (Pedidos → Mochila → Finalizar)
9. **Ajustar estilos** conforme necessário
10. **Validar segurança** (garantir que código nunca aparece)
11. **Documentar** código e funcionalidades

---

## 🔄 Fluxo Completo e Validações

### 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA NO APP                           │
│  (Entregador autenticado via login)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÃO 1: Verificar Role do Usuário                      │
│  ✓ user.role === 'delivery' || 'entregador'                 │
│  ✗ Se não for entregador → Redirecionar para Home padrão   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Tela: EntregadorHome (Início)                              │
│  - Exibe informações gerais                                 │
│  - MenuNavigation inferior (5 opções)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  Tela: Pedidos   │        │  Tela: Mochila   │
│  (Status: Pronto)│        │  (Status: Em rota)│
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÃO 2: Carregar Pedidos                              │
│  - getReadyOrders() → Filtra status "ready"/"pronto"       │
│  - getInTransitOrders() → Filtra status "out_for_delivery" │
│  - Filtrar campos sensíveis (delivery_code)                │
│  - Validar token de autenticação                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  AÇÃO: Aceitar Entrega (Tela Pedidos)                      │
│  1. Validar se pedido existe e está "Pronto"               │
│  2. Validar token do entregador                             │
│  3. Chamar updateOrderToInTransit(orderId)                  │
│  4. Atualizar estado local                                  │
│  5. Navegar para Mochila (opcional)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÃO 3: Status do Pedido                              │
│  ✓ Pedido deve estar com status "ready"/"pronto"           │
│  ✓ Entregador deve estar autenticado                        │
│  ✓ Pedido não pode estar já em rota                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Tela: Mochila (Pedidos em Rota)                            │
│  - Lista pedidos com status "out_for_delivery"              │
│  - Botão "Finalizar Entrega" em cada card                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  AÇÃO: Finalizar Entrega (Tela Mochila)                     │
│  1. Abrir Modal de Confirmação de Código                    │
│  2. VALIDAÇÃO 4: Código de Entrega                          │
│     - Código deve ter 4 dígitos                             │
│     - Código deve ser numérico                              │
│     - Validar com API antes de finalizar                    │
│  3. Chamar finalizeDelivery(orderId, code)                  │
│  4. Atualizar estado local                                  │
│  5. Remover pedido da lista                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDAÇÃO 5: Código de Entrega (API)                       │
│  ✓ Código deve corresponder ao pedido                       │
│  ✓ Pedido deve estar em status "out_for_delivery"           │
│  ✓ Entregador deve ser o responsável pelo pedido           │
│  ✗ Se inválido → Exibir erro e manter pedido na mochila    │
└─────────────────────────────────────────────────────────────┘
```

### 🔐 Validações Detalhadas

#### **VALIDAÇÃO 1: Autenticação e Role do Usuário**

**Onde:** Todas as telas do entregador

**Implementação:**
```javascript
// Em cada screen do entregador
useEffect(() => {
  const checkAuth = async () => {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      navigation.navigate('Login');
      return;
    }
    
    const user = await getStoredUserData();
    const isDelivery = user?.role === 'delivery' || 
                      user?.role === 'entregador' ||
                      user?.roles?.includes('delivery');
    
    if (!isDelivery) {
      // Redirecionar para home padrão se não for entregador
      Alert.alert(
        'Acesso Negado',
        'Você não tem permissão para acessar esta área.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    }
  };
  
  checkAuth();
}, [navigation]);
```

**Validações:**
- ✓ Token válido e não expirado
- ✓ Role do usuário é "delivery" ou "entregador"
- ✓ Token presente em todas as requisições API
- ✗ Se falhar → Redirecionar para Login ou Home

---

#### **VALIDAÇÃO 2: Carregamento de Pedidos**

**Onde:** `EntregadorPedidos.js` e `EntregadorMochila.js`

**Implementação:**
```javascript
const loadOrders = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Validar autenticação antes de buscar
    const token = await getStoredToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    // Buscar pedidos com validação
    const [ready, inTransit] = await Promise.all([
      getReadyOrders(), // Filtra automaticamente por order_type: "delivery"
      getInTransitOrders(),
    ]);
    
    // VALIDAÇÃO: Filtrar campos sensíveis
    const safeReady = ready.map(order => {
      const { delivery_code, codigo_entrega, deliveryCode, ...safe } = order;
      return safe;
    });
    
    const safeInTransit = inTransit.map(order => {
      const { delivery_code, codigo_entrega, deliveryCode, ...safe } = order;
      return safe;
    });
    
    setReadyOrders(safeReady);
    setInTransitOrders(safeInTransit);
    
  } catch (err) {
    setError(err);
    // VALIDAÇÃO: Tratar erros específicos
    if (err.response?.status === 401) {
      // Token expirado
      await logout();
      navigation.navigate('Login');
    } else if (err.response?.status === 403) {
      // Sem permissão
      Alert.alert('Erro', 'Você não tem permissão para acessar estes pedidos');
    }
  } finally {
    setLoading(false);
  }
}, [navigation]);
```

**Validações:**
- ✓ Token válido antes de buscar
- ✓ Filtrar apenas pedidos com `order_type: "delivery"`
- ✓ Filtrar campos sensíveis (`delivery_code`, etc.)
- ✓ Tratar erros 401 (não autorizado) e 403 (sem permissão)
- ✓ Validar formato da resposta da API

---

#### **VALIDAÇÃO 3: Aceitar Entrega**

**Onde:** `EntregadorPedidos.js` → Botão "Aceitar Entrega"

**Implementação:**
```javascript
const acceptDelivery = useCallback(async (orderId) => {
  try {
    // VALIDAÇÃO: Verificar se pedido existe e está no estado correto
    const order = readyOrders.find(o => o.id === orderId);
    if (!order) {
      Alert.alert('Erro', 'Pedido não encontrado');
      return;
    }
    
    // VALIDAÇÃO: Verificar status do pedido
    const status = order.status?.toLowerCase();
    const validStatuses = ['ready', 'pronto', 'preparado'];
    if (!validStatuses.includes(status)) {
      Alert.alert(
        'Erro',
        `Este pedido não pode ser aceito. Status atual: ${order.status}`
      );
      return;
    }
    
    // VALIDAÇÃO: Verificar se já está em rota (dupla validação)
    if (status.includes('rota') || status.includes('delivery')) {
      Alert.alert('Erro', 'Este pedido já está em rota de entrega');
      return;
    }
    
    setUpdating(true);
    
    // Chamar API
    await updateOrderToInTransit(orderId);
    
    // VALIDAÇÃO: Verificar resposta da API
    if (onStatusChange) {
      onStatusChange(orderId, 'out_for_delivery');
    }
    
    Alert.alert("Sucesso", "Pedido aceito para entrega!");
    
    // Atualizar lista
    refreshOrders();
    
    // Navegar para Mochila (opcional)
    setTimeout(() => {
      navigation.navigate('EntregadorMochila');
    }, 500);
    
  } catch (error) {
    // VALIDAÇÃO: Tratar erros específicos
    let errorMessage = "Erro ao aceitar pedido";
    
    if (error.response?.status === 404) {
      errorMessage = "Pedido não encontrado";
    } else if (error.response?.status === 409) {
      errorMessage = "Este pedido já foi aceito por outro entregador";
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || "Status do pedido inválido";
    } else {
      errorMessage = error?.response?.data?.message || error?.message || errorMessage;
    }
    
    Alert.alert("Erro", errorMessage);
    
    if (__DEV__) {
      console.error("Erro ao aceitar pedido:", error);
    }
  } finally {
    setUpdating(false);
  }
}, [readyOrders, onStatusChange, refreshOrders, navigation]);
```

**Validações:**
- ✓ Pedido existe na lista local
- ✓ Status do pedido é "ready"/"pronto"
- ✓ Pedido não está já em rota
- ✓ Token válido
- ✓ Resposta da API válida
- ✗ Se falhar → Exibir erro específico e manter pedido na lista

---

#### **VALIDAÇÃO 4: Código de Entrega (Frontend)**

**Onde:** `ModalConfirmacaoCodigo.jsx`

**Implementação:**
```javascript
const [code, setCode] = useState('');
const [error, setError] = useState('');
const [isValidating, setIsValidating] = useState(false);

const handleCodeChange = (text) => {
  // VALIDAÇÃO: Apenas números
  const numericOnly = text.replace(/[^0-9]/g, '');
  
  // VALIDAÇÃO: Máximo 4 dígitos
  const limited = numericOnly.slice(0, 4);
  
  setCode(limited);
  
  // VALIDAÇÃO: Limpar erro quando usuário digita
  if (error) {
    setError('');
  }
};

const validateCode = () => {
  // VALIDAÇÃO: Código deve ter 4 dígitos
  if (!code || code.length !== 4) {
    setError('O código deve ter 4 dígitos');
    return false;
  }
  
  // VALIDAÇÃO: Código deve ser numérico
  if (!/^\d{4}$/.test(code)) {
    setError('O código deve conter apenas números');
    return false;
  }
  
  return true;
};

const handleConfirm = async () => {
  // VALIDAÇÃO: Validar formato antes de enviar
  if (!validateCode()) {
    return;
  }
  
  setIsValidating(true);
  setError('');
  
  try {
    const success = await onConfirm(code);
    
    if (success) {
      // Fechar modal e limpar código
      setCode('');
      onClose();
    } else {
      setError('Código inválido. Tente novamente.');
    }
  } catch (error) {
    setError('Erro ao validar código. Tente novamente.');
  } finally {
    setIsValidating(false);
  }
};
```

**Validações:**
- ✓ Código deve ter exatamente 4 dígitos
- ✓ Código deve conter apenas números
- ✓ Botão desabilitado se código inválido
- ✓ Feedback visual de erro
- ✓ Limpar código após sucesso

---

#### **VALIDAÇÃO 5: Finalizar Entrega (API)**

**Onde:** `deliveryService.js` → `finalizeDelivery()`

**Implementação:**
```javascript
export const finalizeDelivery = async (orderId, code) => {
  try {
    // VALIDAÇÃO: Parâmetros obrigatórios
    if (!orderId) {
      throw new Error('ID do pedido é obrigatório');
    }
    
    if (!code || code.length !== 4) {
      throw new Error('Código de entrega inválido');
    }
    
    // VALIDAÇÃO: Código deve ser numérico
    if (!/^\d{4}$/.test(code)) {
      throw new Error('Código deve conter apenas números');
    }
    
    const response = await api.post(`/orders/${orderId}/finalize-delivery`, {
      delivery_code: code,
    });
    
    // VALIDAÇÃO: Verificar resposta da API
    if (!response.data) {
      throw new Error('Resposta inválida da API');
    }
    
    // Filtrar campos sensíveis na resposta
    const { delivery_code, codigo_entrega, deliveryCode, ...safeOrder } = response.data;
    
    return safeOrder;
    
  } catch (error) {
    // VALIDAÇÃO: Tratar erros específicos da API
    if (error.response?.status === 400) {
      throw new Error('Código de entrega inválido');
    } else if (error.response?.status === 404) {
      throw new Error('Pedido não encontrado');
    } else if (error.response?.status === 409) {
      throw new Error('Este pedido já foi finalizado');
    } else if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para finalizar este pedido');
    }
    
    throw error;
  }
};
```

**Validações (API):**
- ✓ ID do pedido válido
- ✓ Código tem 4 dígitos numéricos
- ✓ Pedido existe e está em status "out_for_delivery"
- ✓ Entregador é responsável pelo pedido
- ✓ Código corresponde ao pedido
- ✗ Se inválido → Retornar erro específico

---

#### **VALIDAÇÃO 6: Tela de Perfil (Menu Options)**

**Onde:** `screens/perfil.js`

**Implementação:**
```javascript
useEffect(() => {
  const loadUserData = async () => {
    const user = await getStoredUserData();
    const isDelivery = user?.role === 'delivery' || 
                      user?.role === 'entregador' ||
                      user?.roles?.includes('delivery');
    
    // VALIDAÇÃO: Filtrar menuOptions baseado no role
    const allOptions = [
      { id: "cardapio", icon: "lupa", title: "Ver cardápio" },
      { id: "dados", icon: "perfil", title: "Dados da conta" },
      { id: "pedidos", icon: "pedido", title: "Ver pedidos" },
      { id: "enderecos", icon: "localization", title: "Endereços" },
      { id: "pontos", icon: "crown", title: "Ver pontos" },
      { id: "config", icon: "gear", title: "Configurações" },
    ];
    
    const filteredOptions = isDelivery
      ? allOptions.filter(opt => 
          opt.id === "cardapio" || 
          opt.id === "dados" || 
          opt.id === "config"
        )
      : allOptions;
    
    setMenuOptions(filteredOptions);
    setIsDelivery(isDelivery);
  };
  
  loadUserData();
}, []);
```

**Validações:**
- ✓ Verificar role do usuário
- ✓ Filtrar opções do menu para entregadores
- ✓ Remover seção "Seus Pontos" para entregadores
- ✓ Usar `EntregadorMenuNavigation` para entregadores

---

### 📋 Resumo das Validações por Etapa

| Etapa | Validações | Onde |
|-------|-----------|------|
| **Login/Acesso** | Token válido, Role correto | Todas as telas |
| **Carregar Pedidos** | Token, Filtros, Campos sensíveis | `useEntregadorPedidos` |
| **Aceitar Entrega** | Status válido, Pedido existe | `useEntregadorStatus` |
| **Código (Frontend)** | 4 dígitos, Numérico | `ModalConfirmacaoCodigo` |
| **Finalizar Entrega** | Código válido, Pedido correto | `deliveryService` |
| **Perfil** | Role, Menu options | `screens/perfil.js` |

---

## 📝 Notas Importantes

### Status da API
Verificar na API quais são os status exatos:
- "ready" ou "pronto"?
- "out_for_delivery" ou "em_rota"?
- "delivered" ou "entregue"?

Ajustar o código conforme a API real.

### Autenticação
Garantir que apenas entregadores autenticados possam acessar:
- Verificar role do usuário
- Redirecionar se não for entregador
- Validar token em todas as requisições

### Sincronização
Considerar implementar:
- WebSocket para atualizações em tempo real (opcional)
- Polling automático a cada 30 segundos
- Pull-to-refresh manual

---

**Fim do Roteiro**

