# 🧩 ROTEIRO DE INTEGRAÇÃO — Fluxo Completo de Pedido Mobile ↔ API

## 📋 **Visão Geral**

Este roteiro detalha a implementação completa do fluxo de pedido no **RoyalBurgerMobile** (React Native/JavaScript), garantindo paridade funcional e comportamental total com **RoyalBurgerWeb** e **RoyalBurgerAPI**.

---

## 🎯 **Objetivo**

Garantir que o RoyalBurgerMobile siga **exatamente** o mesmo fluxo de pedido do RoyalBurgerWeb:

1. **Listagem de produtos** com filtro de disponibilidade e badges de estoque
2. **Montagem de produto** com validação dinâmica de capacidade/estoque
3. **Gerenciamento de cesta** com sincronização servidor e validações
4. **Checkout** com validação preventiva de estoque
5. **Finalização de pedido** com todas as validações e regras de negócio

---

## 📊 **MAPEAMENTO DO FLUXO ATUAL (Web + API)**

### **Fluxo Completo de Pedido**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DE PEDIDO                      │
└─────────────────────────────────────────────────────────────────┘

1. LISTAGEM DE PRODUTOS
   ├─ Carregar produtos com filter_unavailable=true
   ├─ Filtrar produtos com capacidade >= 1
   ├─ Exibir badges de estoque (limited, low_stock)
   └─ Cache de 60 segundos (TTL curto para refletir mudanças)

2. DETALHES DO PRODUTO
   ├─ Carregar produto por ID com quantity=1
   ├─ Carregar ingredientes com max_quantity calculado
   ├─ Separar ingredientes base e extras
   └─ Exibir preço base e tempo de preparo

3. MONTAGEM DO PRODUTO
   ├─ Seleção de quantidade (1-99, limitado por estoque)
   ├─ Modificação de ingredientes base (base_modifications)
   │  ├─ Delta positivo: adiciona à receita base
   │  └─ Delta negativo: remove da receita base
   ├─ Adição de extras (ingredientes adicionais)
   ├─ Observações (até 500 caracteres)
   └─ Validação dinâmica de capacidade (com debounce 500ms)

4. VALIDAÇÃO DE CAPACIDADE
   ├─ Chamar simulateProductCapacity ao alterar:
   │  ├─ Quantidade do produto
   │  ├─ Extras (adicionar/remover)
   │  └─ Base modifications
   ├─ Atualizar max_quantity disponível
   ├─ Desabilitar botões quando no limite
   ├─ Exibir mensagem de limite (se houver)
   └─ Loading state durante validação

5. ADICIONAR À CESTA
   ├─ Validar capacidade antes de adicionar
   ├─ POST /api/cart/items com:
   │  ├─ product_id
   │  ├─ quantity
   │  ├─ extras: [{ingredient_id, quantity}]
   │  ├─ base_modifications: [{ingredient_id, delta}]
   │  ├─ notes
   │  └─ guest_cart_id (se não autenticado)
   ├─ Backend valida estoque e cria reserva temporária
   ├─ Tratar erro INSUFFICIENT_STOCK
   └─ Atualizar capacidade após erro

6. GERENCIAMENTO DE CESTA
   ├─ Carregar carrinho da API (getCart)
   ├─ Exibir itens com extras e modificações
   ├─ Atualizar quantidade (valida estoque)
   ├─ Remover item
   ├─ Editar item (abre tela de produto em modo edição)
   └─ Limpar carrinho

7. CHECKOUT
   ├─ Validar endereço (ou pickup)
   ├─ Selecionar forma de pagamento
   ├─ Configurar uso de pontos (se disponível)
   ├─ Validar CPF (se preenchido)
   ├─ VALIDAÇÃO PREVENTIVA DE ESTOQUE
   │  ├─ Validar todos os itens da cesta
   │  ├─ Se houver itens sem estoque:
   │  │  ├─ Exibir lista de itens problemáticos
   │  │  ├─ Oferecer remover automaticamente
   │  │  ├─ Remover itens sem estoque
   │  │  └─ Recarregar cesta e tentar novamente
   │  └─ Se válido, continuar
   └─ Revisar pedido

8. FINALIZAÇÃO
   ├─ POST /api/orders com:
   │  ├─ use_cart: true (usa carrinho do servidor)
   │  ├─ delivery_address_id ou is_pickup
   │  ├─ payment_method
   │  ├─ points_to_redeem (se usar pontos)
   │  ├─ cpf (se preenchido)
   │  └─ amount_paid (se dinheiro)
   ├─ Backend valida estoque novamente
   ├─ Cria pedido e deduz estoque
   ├─ Limpa carrinho
   └─ Exibe confirmação com código

```

---

## 🔍 **COMPARAÇÃO: Mobile x Web/API**

### **✅ O QUE JÁ EXISTE NO MOBILE**

| Funcionalidade | Status | Arquivo | Observações |
|----------------|--------|---------|-------------|
| **Listagem de Produtos** | ✅ Parcial | `screens/produto.js` | Carrega produtos, mas não filtra por disponibilidade |
| **Detalhes do Produto** | ✅ Implementado | `screens/produto.js` | Carrega produto e ingredientes |
| **Carrinho/Cesta** | ✅ Implementado | `contexts/BasketContext.js` | Gerencia carrinho híbrido (logado/convidado) |
| **Adicionar à Cesta** | ✅ Implementado | `services/cartService.js` | Suporta extras e base_modifications |
| **Atualizar Item** | ✅ Implementado | `services/cartService.js` | Atualiza quantidade, extras, notas |
| **Remover Item** | ✅ Implementado | `services/cartService.js` | Remove item do carrinho |
| **Tela de Cesta** | ✅ Implementado | `screens/cesta.js` | Exibe itens e totais |
| **Tela de Pagamento** | ✅ Implementado | `screens/pagamento.js` | Formulário de checkout |
| **Criar Pedido** | ✅ Implementado | `services/orderService.js` | Cria pedido via API |
| **Validação de Carrinho** | ✅ Parcial | `services/cartService.js` | `validateCartForOrder` existe, mas não valida estoque preventivamente |

### **❌ O QUE FALTA NO MOBILE**

| Funcionalidade | Prioridade | Impacto |
|----------------|------------|---------|
| **Filtrar produtos indisponíveis na listagem** | 🔴 Alta | Usuário vê produtos sem estoque |
| **Badges de estoque na listagem** | 🟡 Média | UX: não mostra estoque limitado |
| **Validação dinâmica de capacidade** | 🔴 Alta | Permite adicionar produtos sem estoque |
| **Simular capacidade com extras** | 🔴 Alta | Não valida estoque ao montar produto |
| **Atualizar limites de quantidade** | 🔴 Alta | Permite quantidade além do disponível |
| **Mensagens de limite de estoque** | 🟡 Média | UX: feedback insuficiente |
| **Debounce para validação** | 🟡 Média | Performance: muitas requisições |
| **Loading state durante validação** | 🟡 Média | UX: falta feedback visual |
| **Validação preventiva no checkout** | 🔴 Alta | Usuário descobre problema só no final |
| **Remover itens sem estoque automaticamente** | 🟡 Média | UX: processo manual |
| **Tratamento específico de INSUFFICIENT_STOCK** | 🔴 Alta | Erros genéricos, sem contexto |

### **⚠️ DIVERGÊNCIAS E INCONSISTÊNCIAS**

| Item | Web | Mobile | Impacto |
|------|-----|--------|---------|
| **Filtro de produtos** | `filter_unavailable=true` | ❌ Não aplicado | Produtos sem estoque aparecem |
| **Validação de capacidade** | ✅ Implementado | ❌ Não implementado | Permite adicionar sem estoque |
| **Badges de estoque** | ✅ Implementado | ❌ Não implementado | UX inconsistente |
| **Validação no checkout** | ✅ Preventiva | ⚠️ Apenas backend | UX ruim (erro no final) |
| **Tratamento de erro** | ✅ Específico | ⚠️ Genérico | Mensagens pouco claras |
| **Debounce** | ✅ 500ms | ❌ Não implementado | Performance inferior |

---

## 📋 **ROTEIRO DE IMPLEMENTAÇÃO DETALHADO**

---

## 🎯 **ETAPA 1: Listagem de Produtos com Filtro de Disponibilidade**

### **1.1 Modificar `services/productService.js`**

**Adicionar suporte a `filter_unavailable`:**

```javascript
/**
 * Obtém todos os produtos.
 * ALTERAÇÃO: Adicionar suporte a filter_unavailable para filtrar produtos sem estoque
 * @param {object} filters - Filtros opcionais
 * @param {boolean} filters.filter_unavailable - Filtrar produtos indisponíveis (padrão: true para frontend)
 * @returns {Promise<Array>} - Lista de produtos
 */
export const getAllProducts = async (filters = {}) => {
  try {
    // ALTERAÇÃO: Adicionar filter_unavailable aos parâmetros
    const params = { ...filters };
    
    // Converter parâmetros booleanos para strings para garantir compatibilidade com Flask
    if (params.include_inactive !== undefined) {
      params.include_inactive = params.include_inactive ? 'true' : 'false';
    }
    
    // ALTERAÇÃO: Adicionar filter_unavailable (padrão: true para frontend)
    if (params.filter_unavailable !== undefined) {
      params.filter_unavailable = params.filter_unavailable ? 'true' : 'false';
    } else {
      // Padrão: true para frontend (filtrar produtos sem estoque)
      params.filter_unavailable = 'true';
    }
    
    const response = await api.get("/products", { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao obter produtos:", error);
    throw error;
  }
};
```

**Adicionar função para simular capacidade:**

```javascript
/**
 * Simula capacidade máxima de um produto com extras e modificações da receita base
 * ALTERAÇÃO: Nova função para validação de estoque dinâmica
 * @param {number} productId - ID do produto
 * @param {Array} extras - Lista de extras [{ingredient_id: number, quantity: number}]
 * @param {number} quantity - Quantidade desejada (opcional, padrão: 1)
 * @param {Array} baseModifications - Modificações da receita base [{ingredient_id: number, delta: number}]
 * @returns {Promise<Object>} Dados de capacidade
 * 
 * Resposta esperada:
 * {
 *   "product_id": number,
 *   "max_quantity": number,
 *   "capacity": number,
 *   "availability_status": "available" | "limited" | "unavailable" | "low_stock",
 *   "is_available": boolean,
 *   "limiting_ingredient": {
 *     "name": string,
 *     "available": number,
 *     "unit": string,
 *     "message": string
 *   } | null,
 *   "message": string
 * }
 */
export const simulateProductCapacity = async (
  productId, 
  extras = [], 
  quantity = 1, 
  baseModifications = []
) => {
  try {
    // ALTERAÇÃO: Validação de parâmetros
    if (!productId || isNaN(productId) || productId <= 0) {
      throw new Error('ID do produto é obrigatório e deve ser um número positivo');
    }
    
    if (productId > 2147483647) {
      throw new Error('ID do produto excede o limite máximo permitido');
    }
    
    // Validação de quantity
    if (quantity !== undefined && quantity !== null) {
      const qtyNum = parseInt(quantity, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        throw new Error('quantity deve ser um número positivo');
      }
      if (qtyNum > 999) {
        throw new Error('quantity excede o limite máximo permitido (999)');
      }
      quantity = qtyNum;
    } else {
      quantity = 1;
    }
    
    if (!Array.isArray(extras)) {
      throw new Error('extras deve ser uma lista');
    }
    
    // Validação de extras
    const validatedExtras = extras.map(extra => {
      if (!extra || typeof extra !== 'object') {
        throw new Error('Cada extra deve ser um objeto');
      }
      
      const ingId = parseInt(extra.ingredient_id, 10);
      const qty = parseInt(extra.quantity, 10) || 1;
      
      if (!ingId || isNaN(ingId) || ingId <= 0) {
        throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
      }
      if (ingId > 2147483647) {
        throw new Error('ingredient_id excede o limite máximo permitido');
      }
      
      if (isNaN(qty) || qty <= 0) {
        throw new Error('quantity deve ser um número positivo');
      }
      if (qty > 999) {
        throw new Error('quantity do extra excede o limite máximo permitido (999)');
      }
      
      return {
        ingredient_id: ingId,
        quantity: qty
      };
    });
    
    // Validação de base_modifications (opcional)
    let validatedBaseModifications = [];
    if (baseModifications && Array.isArray(baseModifications) && baseModifications.length > 0) {
      validatedBaseModifications = baseModifications.map(bm => {
        if (!bm || typeof bm !== 'object') {
          throw new Error('Cada base_modification deve ser um objeto');
        }
        
        const ingId = parseInt(bm.ingredient_id, 10);
        const delta = parseInt(bm.delta, 10);
        
        if (!ingId || isNaN(ingId) || ingId <= 0) {
          throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
        }
        if (ingId > 2147483647) {
          throw new Error('ingredient_id excede o limite máximo permitido');
        }
        
        if (isNaN(delta) || delta === 0) {
          throw new Error('delta deve ser um número diferente de zero');
        }
        if (Math.abs(delta) > 999) {
          throw new Error('delta excede o limite máximo permitido (999)');
        }
        
        return {
          ingredient_id: ingId,
          delta: delta
        };
      });
    }
    
    const requestBody = {
      product_id: productId,
      extras: validatedExtras,
      quantity: quantity
    };
    
    // Adiciona base_modifications apenas se houver
    if (validatedBaseModifications.length > 0) {
      requestBody.base_modifications = validatedBaseModifications;
    }
    
    const response = await api.post('/products/simular_capacidade', requestBody);
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    // TODO: REVISAR - Implementar logging estruturado condicional (apenas em modo debug)
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao simular capacidade:', error);
    }
    throw error;
  }
};

/**
 * Obtém capacidade de um produto
 * ALTERAÇÃO: Nova função para obter capacidade sem simulação
 * @param {number} productId - ID do produto
 * @param {Array} extras - Lista de extras (opcional) [{ingredient_id: number, quantity: number}]
 * @returns {Promise<Object>} Dados de capacidade
 */
export const getProductCapacity = async (productId, extras = []) => {
  try {
    // Validação de parâmetros
    if (!productId || isNaN(productId) || productId <= 0) {
      throw new Error('ID do produto é obrigatório e deve ser um número positivo');
    }
    
    const params = {};
    
    // Se houver extras, adiciona como parâmetro JSON
    if (extras && Array.isArray(extras) && extras.length > 0) {
      // Validação de extras
      const validatedExtras = extras.map(extra => {
        if (!extra || typeof extra !== 'object') {
          throw new Error('Cada extra deve ser um objeto');
        }
        
        const ingId = parseInt(extra.ingredient_id, 10);
        const qty = parseInt(extra.quantity, 10) || 1;
        
        if (!ingId || isNaN(ingId) || ingId <= 0) {
          throw new Error('ingredient_id é obrigatório e deve ser um número positivo');
        }
        
        if (isNaN(qty) || qty <= 0) {
          throw new Error('quantity deve ser um número positivo');
        }
        
        return {
          ingredient_id: ingId,
          quantity: qty
        };
      });
      
      params.extras = JSON.stringify(validatedExtras);
    }
    
    const response = await api.get(`/products/${productId}/capacity`, { params });
    return response.data;
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    // TODO: REVISAR - Implementar logging estruturado condicional (apenas em modo debug)
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao obter capacidade:', error);
    }
    throw error;
  }
};
```

### **1.2 Modificar Tela de Listagem de Produtos**

**Localizar arquivo que lista produtos (provavelmente `screens/produto.js` ou tela de menu):**

```javascript
// ALTERAÇÃO: Adicionar filter_unavailable ao carregar produtos
const loadProducts = async () => {
  try {
    setLoading(true);
    
    // ALTERAÇÃO: Filtrar produtos indisponíveis
    const response = await getAllProducts({
      page_size: 1000,
      include_inactive: false,
      filter_unavailable: true // NOVO: Filtrar produtos sem estoque
    });
    
    const allProducts = response?.items || [];
    
    // ALTERAÇÃO: Filtrar apenas produtos ativos (backend já filtra por disponibilidade)
    const availableProducts = allProducts.filter((product) => {
      const isActive = product.is_active !== false && 
                      product.is_active !== 0 && 
                      product.is_active !== "false";
      return isActive;
    });
    
    setProducts(availableProducts);
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao carregar produtos:', error);
    }
    setProducts([]);
  } finally {
    setLoading(false);
  }
};
```

**Adicionar badges de estoque nos cards de produtos:**

```javascript
// ALTERAÇÃO: Função para renderizar badge de estoque
const renderStockBadge = (product) => {
  const availabilityStatus = String(product.availability_status || '').toLowerCase();
  
  if (availabilityStatus === 'limited') {
    return (
      <View style={styles.stockBadgeLimited}>
        <Text style={styles.stockBadgeText}>Últimas unidades</Text>
      </View>
    );
  } else if (availabilityStatus === 'low_stock') {
    return (
      <View style={styles.stockBadgeLow}>
        <Text style={styles.stockBadgeText}>Estoque baixo</Text>
      </View>
    );
  }
  
  return null;
};

// ALTERAÇÃO: Adicionar badge no card do produto
<View style={styles.productCard}>
  {renderStockBadge(product)}
  {/* ... resto do card ... */}
</View>
```

**Adicionar estilos para badges:**

```javascript
const styles = StyleSheet.create({
  // ... estilos existentes ...
  
  // ALTERAÇÃO: Estilos para badges de estoque
  stockBadgeLimited: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  stockBadgeLow: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#000',
  },
});
```

---

## 🍔 **ETAPA 2: Validação na Montagem do Produto**

### **2.1 Modificar `screens/produto.js`**

**Adicionar estado para capacidade:**

```javascript
// ALTERAÇÃO: Adicionar estados para validação de capacidade
const [productMaxQuantity, setProductMaxQuantity] = useState(99);
const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);
const [capacityData, setCapacityData] = useState(null);
const [stockLimitMessage, setStockLimitMessage] = useState(null);
```

**Adicionar função para atualizar capacidade:**

```javascript
// ALTERAÇÃO: Função para atualizar capacidade quando extras/quantidade mudam
const updateProductCapacity = async (showMessage = false, immediate = false) => {
  if (!productData?.id) return null;
  
  // ALTERAÇÃO: Se já está atualizando e não é imediato, aguardar debounce
  if (isUpdatingCapacity && !immediate) {
    return null;
  }
  
  try {
    setIsUpdatingCapacity(true);
    
    // Preparar extras no formato esperado pela API
    const extras = Object.entries(selectedExtras || {})
      .filter(([ingredientId, qty]) => {
        const id = Number(ingredientId);
        const quantity = Number(qty);
        return !isNaN(id) && id > 0 && !isNaN(quantity) && quantity > 0;
      })
      .map(([ingredientId, qty]) => ({
        ingredient_id: Number(ingredientId),
        quantity: Number(qty)
      }));
    
    // Preparar base_modifications no formato esperado pela API
    const baseModifications = Object.entries(defaultIngredientsQuantities || {})
      .filter(([ingredientId, data]) => {
        const id = Number(ingredientId);
        const delta = Number(data?.delta || data || 0);
        return !isNaN(id) && id > 0 && !isNaN(delta) && delta !== 0;
      })
      .map(([ingredientId, data]) => ({
        ingredient_id: Number(ingredientId),
        delta: Number(data?.delta || data || 0)
      }));
    
    const capacityResult = await simulateProductCapacity(
      productData.id,
      extras,
      quantity,
      baseModifications
    );
    
    const maxQuantity = capacityResult?.max_quantity ?? 99;
    setProductMaxQuantity(maxQuantity);
    setCapacityData(capacityResult);
    
    // Atualizar limites na UI
    updateQuantityLimits(maxQuantity, capacityResult);
    
    // Exibir mensagem de limite se houver e showMessage=true
    if (showMessage && capacityResult?.limiting_ingredient) {
      setStockLimitMessage(capacityResult.limiting_ingredient.message);
    } else {
      setStockLimitMessage(null);
    }
    
    return capacityResult;
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao atualizar capacidade:', error);
    }
    return null;
  } finally {
    setIsUpdatingCapacity(false);
  }
};

// ALTERAÇÃO: Função para atualizar limites de quantidade na UI
const updateQuantityLimits = (maxQuantity, capacityData) => {
  // Se maxQuantity for 0 ou null, ainda permitir aumentar para permitir alternar
  // A validação será feita quando tentar adicionar ao carrinho
  if (maxQuantity > 0 && quantity >= maxQuantity) {
    // Desabilitar botão de aumentar quantidade
    // (implementar desabilitação visual do botão)
  } else {
    // Habilitar botão de aumentar quantidade
  }
};

// ALTERAÇÃO: Versão com debounce para chamadas não críticas
let capacityUpdateTimeout = null;
const debouncedUpdateProductCapacity = (showMessage = false) => {
  if (capacityUpdateTimeout) {
    clearTimeout(capacityUpdateTimeout);
  }
  
  capacityUpdateTimeout = setTimeout(() => {
    updateProductCapacity(showMessage, false);
  }, 500); // Aguardar 500ms após última mudança
};
```

**Modificar handlers para chamar validação:**

```javascript
// ALTERAÇÃO: Modificar handler de quantidade
const handleQuantityChange = (delta) => {
  const newQuantity = Math.max(1, Math.min(99, quantity + delta));
  setQuantity(newQuantity);
  
  // ALTERAÇÃO: Atualizar capacidade quando quantidade muda
  debouncedUpdateProductCapacity(delta > 0); // Mostrar mensagem apenas ao aumentar
};

// ALTERAÇÃO: Modificar handler de extras
const handleExtraChange = (ingredientId, quantity) => {
  setSelectedExtras(prev => ({
    ...prev,
    [ingredientId]: quantity
  }));
  
  // ALTERAÇÃO: Atualizar capacidade quando extras mudam
  debouncedUpdateProductCapacity(false);
};

// ALTERAÇÃO: Modificar handler de base modifications
const handleBaseModificationChange = (ingredientId, delta) => {
  setDefaultIngredientsQuantities(prev => ({
    ...prev,
    [ingredientId]: { ...prev[ingredientId], delta }
  }));
  
  // ALTERAÇÃO: Atualizar capacidade quando modificações mudam
  debouncedUpdateProductCapacity(false);
};
```

**Adicionar validação antes de adicionar ao carrinho:**

```javascript
// ALTERAÇÃO: Modificar função de adicionar à cesta
const handleAddToBasket = async () => {
  try {
    // ALTERAÇÃO: Validar capacidade antes de adicionar
    const capacityResult = await updateProductCapacity(false, true); // Imediato para validação crítica
    
    if (capacityResult && capacityResult.max_quantity < quantity) {
      Alert.alert(
        'Estoque Insuficiente',
        `Quantidade solicitada (${quantity}) excede o disponível (${capacityResult.max_quantity}). Ajuste a quantidade ou remova alguns extras.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (capacityResult && !capacityResult.is_available) {
      Alert.alert(
        'Produto Indisponível',
        capacityResult.limiting_ingredient?.message || 
        'Produto temporariamente indisponível. Tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Preparar extras no formato da API
    const extras = Object.entries(selectedExtras || {})
      .filter(([_, qty]) => qty > 0)
      .map(([ingredientId, qty]) => ({
        ingredient_id: Number(ingredientId),
        quantity: Number(qty)
      }));
    
    // Preparar base_modifications
    const baseModifications = Object.entries(defaultIngredientsQuantities || {})
      .filter(([_, data]) => {
        const delta = Number(data?.delta || 0);
        return !isNaN(delta) && delta !== 0;
      })
      .map(([ingredientId, data]) => ({
        ingredient_id: Number(ingredientId),
        delta: Number(data?.delta || 0)
      }));
    
    // Adicionar à cesta
    const result = await addToBasket({
      productId: productData.id,
      quantity: quantity,
      observacoes: observacoes,
      selectedExtras: selectedExtras,
      baseModifications: baseModifications,
      extras: extras // Passar extras já validados
    });
    
    if (result.success) {
      // Navegar para cesta ou mostrar sucesso
      navigation.navigate('Cesta');
    } else {
      // ALTERAÇÃO: Tratamento específico para erro de estoque
      if (result.errorType === 'INSUFFICIENT_STOCK') {
        Alert.alert(
          'Estoque Insuficiente',
          result.error || 'Estoque insuficiente',
          [{ text: 'OK' }]
        );
        // Atualizar capacidade para refletir mudanças
        await updateProductCapacity(false, true);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao adicionar à cesta');
      }
    }
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao adicionar à cesta:', error);
    }
    Alert.alert('Erro', 'Erro ao adicionar item à cesta. Tente novamente.');
  }
};
```

**Adicionar indicador visual de loading:**

```javascript
// ALTERAÇÃO: Adicionar indicador de loading durante validação
{isUpdatingCapacity && (
  <ActivityIndicator 
    size="small" 
    color="#666" 
    style={styles.capacityLoadingIndicator}
  />
)}

// ALTERAÇÃO: Exibir mensagem de limite de estoque
{stockLimitMessage && (
  <View style={styles.stockLimitMessage}>
    <Text style={styles.stockLimitMessageText}>
      ⚠️ {stockLimitMessage}
    </Text>
  </View>
)}
```

**Adicionar estilos:**

```javascript
const styles = StyleSheet.create({
  // ... estilos existentes ...
  
  // ALTERAÇÃO: Estilos para validação de capacidade
  capacityLoadingIndicator: {
    marginLeft: 8,
  },
  stockLimitMessage: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginVertical: 8,
  },
  stockLimitMessageText: {
    fontSize: 14,
    color: '#856404',
  },
});
```

---

## 🧺 **ETAPA 3: Melhorar Tratamento de Erros na Cesta**

### **3.1 Modificar `services/cartService.js`**

**Melhorar tratamento de erros de estoque:**

```javascript
// ALTERAÇÃO: Melhorar tratamento de erros em addItemToCart
export const addItemToCart = async ({
  productId,
  quantity = 1,
  extras = [],
  notes = '',
  baseModifications = []
}) => {
  try {
    // ... código existente ...
    
    const response = await api.post('/cart/items', payload);
    
    // ... código de sucesso ...
    
  } catch (error) {
    // ALTERAÇÃO: Tratamento específico para erros de estoque
    const errorMessage = error.response?.data?.error || error.message;
    const errorPayload = error.response?.data;
    
    // Detectar erros de estoque
    if (error.response?.status === 400 || error.response?.status === 422) {
      const isStockError = errorMessage.includes('Estoque insuficiente') ||
                          errorMessage.includes('insuficiente') ||
                          errorMessage.includes('INSUFFICIENT_STOCK');
      
      if (isStockError) {
        return {
          success: false,
          error: errorMessage,
          errorType: 'INSUFFICIENT_STOCK',
          cartId: null
        };
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      cartId: null
    };
  }
};
```

**Melhorar tratamento em `updateCartItem`:**

```javascript
// ALTERAÇÃO: Melhorar tratamento de erros em updateCartItem
export const updateCartItem = async (cartItemId, updates = {}) => {
  try {
    // ... código existente ...
    
  } catch (error) {
    // ALTERAÇÃO: Tratamento específico para erros de estoque
    const errorMessage = error.response?.data?.error || error.message;
    
    if (error.response?.status === 400 || error.response?.status === 422) {
      const isStockError = errorMessage.includes('Estoque insuficiente') ||
                          errorMessage.includes('insuficiente') ||
                          errorMessage.includes('INSUFFICIENT_STOCK');
      
      if (isStockError) {
        return {
          success: false,
          error: errorMessage,
          errorType: 'INSUFFICIENT_STOCK'
        };
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
```

### **3.2 Modificar `screens/cesta.js`**

**Melhorar tratamento de erros ao atualizar item:**

```javascript
// ALTERAÇÃO: Melhorar tratamento de erros ao atualizar item
const handleUpdateItem = async (cartItemId, updates) => {
  try {
    const result = await updateBasketItem(cartItemId, updates);
    
    if (!result.success) {
      // ALTERAÇÃO: Tratamento específico para erro de estoque
      if (result.errorType === 'INSUFFICIENT_STOCK') {
        Alert.alert(
          'Estoque Insuficiente',
          result.error || 'Estoque insuficiente para esta quantidade.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', result.error || 'Erro ao atualizar item');
      }
    }
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao atualizar item:', error);
    }
    Alert.alert('Erro', 'Erro ao atualizar item. Tente novamente.');
  }
};
```

---

## 📦 **ETAPA 4: Validação Preventiva no Checkout**

### **4.1 Modificar `services/cartService.js`**

**Adicionar função de validação preventiva de estoque:**

```javascript
/**
 * Valida estoque de todos os itens da cesta antes do checkout
 * ALTERAÇÃO: Validação preventiva de estoque no frontend
 * @returns {Promise<Object>} Resultado da validação { valid: boolean, items?: Array }
 */
export const validateStockBeforeCheckout = async () => {
  try {
    // Buscar carrinho atual
    const cartResult = await getCart();
    const items = cartResult?.data?.cart?.items || cartResult?.data?.items || [];
    
    if (items.length === 0) {
      return { valid: true };
    }
    
    // Importar simulateProductCapacity
    const { simulateProductCapacity } = require('./productService');
    
    // Validar estoque de cada item
    const validationPromises = items.map(async (item) => {
      try {
        // Preparar extras no formato esperado pela API
        const extras = (item.extras || []).map(extra => ({
          ingredient_id: extra.ingredient_id || extra.id,
          quantity: extra.quantity || 1
        })).filter(extra => extra.ingredient_id && extra.quantity > 0);
        
        // Preparar base_modifications no formato esperado pela API
        const baseModifications = (item.base_modifications || []).map(bm => ({
          ingredient_id: bm.ingredient_id || bm.id,
          delta: bm.delta || 0
        })).filter(bm => bm.ingredient_id && bm.delta !== 0);
        
        const capacityData = await simulateProductCapacity(
          item.product_id,
          extras,
          item.quantity,
          baseModifications
        );
        
        if (!capacityData.is_available || capacityData.max_quantity < item.quantity) {
          return {
            valid: false,
            cartItemId: item.id,
            product: item.product?.name || `Produto #${item.product_id}`,
            message: capacityData.limiting_ingredient?.message || 
                    'Estoque insuficiente',
            maxQuantity: capacityData.max_quantity || 0
          };
        }
        
        return { valid: true };
      } catch (error) {
        // ALTERAÇÃO: Removido console.error em produção
        const isDev = __DEV__;
        if (isDev) {
          console.error('Erro ao validar estoque do item:', error);
        }
        // Em caso de erro, permitir (backend validará)
        return { valid: true };
      }
    });
    
    const results = await Promise.all(validationPromises);
    const invalidItems = results.filter(r => !r.valid);
    
    if (invalidItems.length > 0) {
      return {
        valid: false,
        items: invalidItems
      };
    }
    
    return { valid: true };
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao validar estoque:', error);
    }
    // Em caso de erro, permitir (backend validará no checkout)
    return { valid: true };
  }
};
```

### **4.2 Modificar `screens/pagamento.js`**

**Adicionar validação preventiva antes de finalizar:**

```javascript
// ALTERAÇÃO: Importar função de validação
import { validateStockBeforeCheckout, removeCartItem } from '../services/cartService';

// ALTERAÇÃO: Modificar função de finalizar pedido
const handleConfirmOrder = async () => {
  try {
    // Validações existentes (endereço, pagamento, etc.)
    if (!enderecoSelecionado) {
      Alert.alert('Atenção', 'Selecione um endereço de entrega ou retirada no local.');
      return;
    }
    
    if (!selectedPayment) {
      Alert.alert('Atenção', 'Selecione uma forma de pagamento.');
      return;
    }
    
    // ALTERAÇÃO: Revalidar estoque antes de finalizar pedido
    setIsCreatingOrder(true);
    
    const stockValidation = await validateStockBeforeCheckout();
    
    if (!stockValidation.valid) {
      setIsCreatingOrder(false);
      
      const messages = stockValidation.items.map(item => 
        `${item.product}: ${item.message}`
      ).join('\n');
      
      // ALTERAÇÃO: Oferecer opção de remover itens sem estoque
      Alert.alert(
        'Estoque Insuficiente',
        `Os seguintes itens não têm estoque suficiente:\n\n${messages}\n\nDeseja remover esses itens e continuar?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Remover e Continuar',
            onPress: async () => {
              // Remover itens sem estoque do carrinho
              let removedCount = 0;
              for (const invalidItem of stockValidation.items) {
                if (invalidItem.cartItemId) {
                  try {
                    const removeResult = await removeCartItem(invalidItem.cartItemId);
                    if (removeResult.success) {
                      removedCount++;
                    }
                  } catch (error) {
                    // ALTERAÇÃO: Removido console.error em produção
                    const isDev = __DEV__;
                    if (isDev) {
                      console.error('Erro ao remover item do carrinho:', error);
                    }
                  }
                }
              }
              
              if (removedCount > 0) {
                // Recarregar cesta
                await loadCart();
                
                Alert.alert(
                  'Itens Removidos',
                  `${removedCount} ${removedCount === 1 ? 'item foi removido' : 'itens foram removidos'} da sua cesta.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Verificar se ainda há itens na cesta
                        if (basketItems.length === 0) {
                          Alert.alert('Cesta Vazia', 'Sua cesta está vazia após remover itens sem estoque.');
                          navigation.navigate('Cesta');
                        } else {
                          // Tentar novamente após remover itens
                          setTimeout(() => {
                            handleConfirmOrder();
                          }, 500);
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  'Erro',
                  'Não foi possível remover os itens. Por favor, remova manualmente e tente novamente.'
                );
              }
            }
          }
        ]
      );
      return;
    }
    
    // Continuar com criação do pedido...
    // ... código existente de criação de pedido ...
    
  } catch (error) {
    setIsCreatingOrder(false);
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao finalizar pedido:', error);
    }
    Alert.alert('Erro', 'Erro ao processar pedido. Tente novamente.');
  }
};
```

---

## 🎨 **ETAPA 5: Melhorias de UX**

### **5.1 Adicionar Indicadores Visuais**

**Loading state durante validação:**

```javascript
// ALTERAÇÃO: Adicionar indicador de loading
{isUpdatingCapacity && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="small" color="#FFC700" />
    <Text style={styles.loadingText}>Validando estoque...</Text>
  </View>
)}
```

**Mensagens de erro amigáveis:**

```javascript
// ALTERAÇÃO: Função helper para mensagens de erro
const getFriendlyErrorMessage = (error) => {
  const errorMessage = error?.message || error?.error || 'Erro desconhecido';
  
  if (errorMessage.includes('Estoque insuficiente')) {
    return errorMessage; // Já vem formatado do backend
  }
  
  if (errorMessage.includes('INSUFFICIENT_STOCK')) {
    return 'Estoque insuficiente. Verifique a quantidade ou remova alguns extras.';
  }
  
  return 'Não foi possível processar sua solicitação. Tente novamente.';
};
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **✅ Etapa 1: Listagem de Produtos**
- [ ] Adicionar suporte a `filter_unavailable` em `productService.js`
- [ ] Adicionar função `simulateProductCapacity()` em `productService.js`
- [ ] Adicionar função `getProductCapacity()` em `productService.js`
- [ ] Modificar tela de listagem para usar `filter_unavailable=true`
- [ ] Adicionar badges de estoque nos cards de produtos
- [ ] Adicionar estilos para badges de estoque

### **✅ Etapa 2: Montagem do Produto**
- [ ] Adicionar estados para capacidade em `produto.js`
- [ ] Adicionar função `updateProductCapacity()` em `produto.js`
- [ ] Adicionar função `updateQuantityLimits()` em `produto.js`
- [ ] Adicionar função `debouncedUpdateProductCapacity()` em `produto.js`
- [ ] Modificar handlers de quantidade para chamar validação
- [ ] Modificar handlers de extras para chamar validação
- [ ] Modificar handlers de base_modifications para chamar validação
- [ ] Adicionar validação antes de adicionar ao carrinho
- [ ] Adicionar indicador de loading durante validação
- [ ] Adicionar mensagem de limite de estoque
- [ ] Adicionar estilos para loading e mensagens

### **✅ Etapa 3: Melhorar Tratamento de Erros**
- [ ] Melhorar tratamento de erros de estoque em `cartService.js`
- [ ] Adicionar tratamento específico para `INSUFFICIENT_STOCK` em `cesta.js`
- [ ] Atualizar capacidade após erro de estoque em `produto.js`

### **✅ Etapa 4: Checkout**
- [ ] Adicionar função `validateStockBeforeCheckout()` em `cartService.js`
- [ ] Modificar `handleConfirmOrder()` em `pagamento.js` para revalidar estoque
- [ ] Adicionar opção de remover itens sem estoque automaticamente
- [ ] Adicionar feedback visual durante validação ("Validando estoque...")

### **✅ Etapa 5: UX**
- [ ] Adicionar indicadores visuais de estoque (badges)
- [ ] Adicionar debounce para atualização de capacidade
- [ ] Adicionar loading states durante validação
- [ ] Adicionar mensagens de erro amigáveis
- [ ] Adicionar animações suaves para transições

---

## 🔄 **REGRAS DE NEGÓCIO CRÍTICAS**

### **1. Validação de Estoque**

**Regra:** O estoque deve ser validado em múltiplas camadas:

1. **Listagem:** Filtrar produtos com `capacity < 1`
2. **Montagem:** Validar capacidade dinamicamente ao alterar quantidade/extras
3. **Adicionar à Cesta:** Validar antes de adicionar (frontend + backend)
4. **Checkout:** Revalidar todos os itens antes de finalizar (frontend + backend)

**Implementação:**

```javascript
// Exemplo de validação em cada etapa
// 1. Listagem
const products = await getAllProducts({ filter_unavailable: true });

// 2. Montagem (com debounce)
debouncedUpdateProductCapacity(false);

// 3. Adicionar à cesta (imediato)
const capacity = await updateProductCapacity(false, true);
if (capacity.max_quantity < quantity) {
  // Bloquear adição
}

// 4. Checkout (preventivo)
const validation = await validateStockBeforeCheckout();
if (!validation.valid) {
  // Oferecer remover itens
}
```

### **2. Regras de Cesta**

**Regra:** O carrinho deve:
- Sincronizar com servidor (não armazenar itens localmente)
- Criar reservas temporárias ao adicionar itens
- Validar estoque ao atualizar quantidade
- Permitir edição de itens (abre tela de produto em modo edição)

**Implementação:**

```javascript
// Sincronização sempre com servidor
const result = await addItemToCartAPI({ ... });
if (result.success) {
  await loadCart(); // Recarrega do servidor
}

// Validação ao atualizar
const result = await updateCartItemAPI(cartItemId, { quantity: newQty });
if (result.errorType === 'INSUFFICIENT_STOCK') {
  // Tratar erro específico
}
```

### **3. Regras de Atualização de Item**

**Regra:** Ao atualizar um item:
- Validar estoque com nova quantidade/extras
- Se estoque insuficiente, mostrar erro específico
- Permitir reduzir quantidade mesmo se no limite
- Bloquear aumentar além do disponível

**Implementação:**

```javascript
// Backend valida automaticamente
// Frontend deve tratar erro INSUFFICIENT_STOCK
if (result.errorType === 'INSUFFICIENT_STOCK') {
  Alert.alert('Estoque Insuficiente', result.error);
  // Recarregar cesta para atualizar limites
  await loadCart();
}
```

### **4. Regras de Finalização**

**Regra:** Antes de finalizar:
1. Validar endereço (ou pickup)
2. Validar forma de pagamento
3. Validar CPF (se preenchido)
4. **Validar estoque preventivamente** (NOVO)
5. Se houver itens sem estoque, oferecer remover
6. Criar pedido via API com `use_cart: true`

**Implementação:**

```javascript
// Validação preventiva
const stockValidation = await validateStockBeforeCheckout();
if (!stockValidation.valid) {
  // Oferecer remover itens
  // Se confirmar, remover e tentar novamente
}

// Criar pedido
const orderData = {
  use_cart: true, // Usa carrinho do servidor
  delivery_address_id: enderecoSelecionado.id,
  payment_method: selectedPayment,
  points_to_redeem: usePoints ? pointsToUse : 0,
  cpf: cpf || null,
  amount_paid: selectedPayment === 'cash' ? parseFloat(trocoValue) : null
};

const order = await createOrder(orderData);
```

### **5. Eventos e Callbacks Importantes**

**Eventos do BasketContext:**

```javascript
// Quando carrinho é atualizado
useEffect(() => {
  loadCart();
}, []);

// Quando usuário faz login (reivindicar carrinho de convidado)
useEffect(() => {
  if (loggedIn) {
    claimGuestCartAfterLogin();
  }
}, [loggedIn]);
```

**Callbacks de validação:**

```javascript
// Callback quando capacidade é atualizada
const onCapacityUpdated = (capacityData) => {
  if (capacityData.limiting_ingredient) {
    // Exibir mensagem de limite
  }
};

// Callback quando estoque é insuficiente
const onInsufficientStock = (error) => {
  // Atualizar capacidade
  // Exibir mensagem
  // Oferecer ajustar quantidade
};
```

---

## 🧪 **CHECKLIST DE TESTES FUNCIONAIS**

### **Teste 1: Listagem de Produtos**
- [ ] Verificar que apenas produtos com capacidade ≥ 1 são exibidos
- [ ] Verificar badges de estoque limitado/baixo
- [ ] Verificar que produtos indisponíveis não aparecem
- [ ] Testar cache (produtos devem atualizar após 60s)

### **Teste 2: Montagem de Produto**
- [ ] Abrir página de produto
- [ ] Adicionar extras e verificar que limite de quantidade é atualizado
- [ ] Verificar mensagem de limite de estoque
- [ ] Tentar aumentar quantidade além do limite (deve bloquear)
- [ ] Verificar debounce (não deve fazer muitas requisições)
- [ ] Verificar loading state durante validação

### **Teste 3: Adicionar à Cesta**
- [ ] Adicionar produto com extras ao carrinho
- [ ] Verificar que reserva temporária é criada
- [ ] Tentar adicionar quantidade que excede estoque (deve mostrar erro)
- [ ] Verificar mensagem de erro clara e específica
- [ ] Verificar que capacidade é atualizada após erro

### **Teste 4: Gerenciamento de Cesta**
- [ ] Atualizar quantidade de item (deve validar estoque)
- [ ] Tentar aumentar além do disponível (deve mostrar erro)
- [ ] Remover item do carrinho
- [ ] Editar item (deve abrir tela de produto em modo edição)
- [ ] Verificar sincronização com servidor

### **Teste 5: Checkout**
- [ ] Adicionar itens ao carrinho
- [ ] Ir para checkout
- [ ] Simular estoque insuficiente (remover estoque manualmente no banco)
- [ ] Tentar finalizar pedido
- [ ] Verificar que validação preventiva detecta problema
- [ ] Verificar opção de remover itens sem estoque
- [ ] Verificar que cesta é recarregada após remover itens
- [ ] Verificar que pedido é criado após validação bem-sucedida

### **Teste 6: Fluxo Completo**
- [ ] Listar produtos → Selecionar produto → Montar com extras → Adicionar à cesta → Ir para checkout → Finalizar pedido
- [ ] Verificar que todas as validações funcionam
- [ ] Verificar que mensagens são claras
- [ ] Verificar que UX é fluida

---

## 📝 **NOTAS IMPORTANTES**

1. **Cache:** O cache de produtos deve ter TTL curto (60s) para refletir mudanças de estoque
2. **Reservas Temporárias:** O backend já cria reservas temporárias ao adicionar ao carrinho (TTL ~10 min)
3. **Validação Dupla:** Sempre validar no frontend (UX) e no backend (segurança)
4. **Mensagens:** Usar mensagens do backend quando disponíveis (já incluem detalhes de conversão de unidades)
5. **Performance:** Usar debounce (500ms) para evitar muitas chamadas à API durante interações rápidas
6. **Loading States:** Sempre mostrar feedback visual durante operações assíncronas
7. **Tratamento de Erros:** Tratar especificamente erros de estoque (INSUFFICIENT_STOCK)
8. **Sincronização:** Sempre sincronizar carrinho com servidor (não armazenar itens localmente)

---

## 📋 **ETAPA 6: Histórico de Pedidos**

### **6.1 Melhorar Tela de Histórico (`screens/pedidos.js`)**

**Status Atual:**
- ✅ Listagem básica implementada
- ✅ Separação entre "Pedidos em andamento" e "Histórico"
- ✅ Card de pedido (`CardPedido`) implementado
- ❌ Navegação para detalhes não implementada
- ❌ Funcionalidade "Adicionar à cesta" não implementada
- ❌ Funcionalidade "Acompanhar pedido" não implementada
- ❌ Filtros e paginação não implementados

**Implementar navegação para detalhes:**

```javascript
// ALTERAÇÃO: Modificar handleVerDetalhes para navegar para tela de detalhes
const handleVerDetalhes = (pedido) => {
  navigation.navigate('DetalhesPedido', { 
    orderId: pedido.id || pedido.order_id,
    order: pedido // Passar dados do pedido para evitar nova requisição
  });
};
```

**Implementar funcionalidade "Adicionar à cesta":**

```javascript
// ALTERAÇÃO: Implementar adição de itens do pedido à cesta
const handleAdicionarCesta = async (pedido) => {
  try {
    if (!pedido.items || pedido.items.length === 0) {
      Alert.alert('Atenção', 'Este pedido não possui itens para adicionar à cesta.');
      return;
    }
    
    // Confirmar ação
    Alert.alert(
      'Adicionar à Cesta',
      `Deseja adicionar todos os itens deste pedido à sua cesta?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async () => {
            try {
              // Buscar detalhes completos do pedido se necessário
              let orderDetails = pedido;
              if (!orderDetails.items || orderDetails.items.length === 0) {
                orderDetails = await getOrderById(pedido.id || pedido.order_id);
              }
              
              // Adicionar cada item à cesta
              let addedCount = 0;
              for (const item of orderDetails.items || []) {
                try {
                  // Preparar extras
                  const extras = (item.extras || []).map(extra => ({
                    ingredient_id: extra.ingredient_id || extra.id,
                    quantity: extra.quantity || 1
                  })).filter(extra => extra.ingredient_id && extra.quantity > 0);
                  
                  // Preparar base_modifications
                  const baseModifications = (item.base_modifications || []).map(bm => ({
                    ingredient_id: bm.ingredient_id || bm.id,
                    delta: bm.delta || 0
                  })).filter(bm => bm.ingredient_id && bm.delta !== 0);
                  
                  const result = await addToBasket({
                    productId: item.product_id || item.product?.id,
                    quantity: item.quantity || 1,
                    observacoes: item.notes || item.observacoes || '',
                    extras: extras,
                    baseModifications: baseModifications
                  });
                  
                  if (result.success) {
                    addedCount++;
                  }
                } catch (error) {
                  // ALTERAÇÃO: Removido console.error em produção
                  const isDev = __DEV__;
                  if (isDev) {
                    console.error('Erro ao adicionar item à cesta:', error);
                  }
                }
              }
              
              if (addedCount > 0) {
                Alert.alert(
                  'Sucesso',
                  `${addedCount} ${addedCount === 1 ? 'item foi adicionado' : 'itens foram adicionados'} à sua cesta.`,
                  [
                    {
                      text: 'Ver Cesta',
                      onPress: () => navigation.navigate('Cesta')
                    },
                    { text: 'OK' }
                  ]
                );
              } else {
                Alert.alert('Atenção', 'Não foi possível adicionar os itens à cesta. Tente novamente.');
              }
            } catch (error) {
              // ALTERAÇÃO: Removido console.error em produção
              const isDev = __DEV__;
              if (isDev) {
                console.error('Erro ao adicionar pedido à cesta:', error);
              }
              Alert.alert('Erro', 'Erro ao adicionar itens à cesta. Tente novamente.');
            }
          }
        }
      ]
    );
  } catch (error) {
    // ALTERAÇÃO: Removido console.error em produção
    const isDev = __DEV__;
    if (isDev) {
      console.error('Erro ao processar adição à cesta:', error);
    }
    Alert.alert('Erro', 'Erro ao processar solicitação. Tente novamente.');
  }
};
```

**Implementar funcionalidade "Acompanhar pedido":**

```javascript
// ALTERAÇÃO: Implementar acompanhamento de pedido
const handleAcompanharPedido = (pedido) => {
  // Navegar para tela de detalhes (que mostra progresso)
  navigation.navigate('DetalhesPedido', { 
    orderId: pedido.id || pedido.order_id,
    order: pedido,
    showTracking: true // Flag para destacar acompanhamento
  });
};
```

**Adicionar filtros (opcional, para paridade com Web):**

```javascript
// ALTERAÇÃO: Adicionar filtros de status
const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed', 'cancelled'

const getFilteredOrders = () => {
  if (filterStatus === 'all') {
    return orders;
  }
  
  return orders.filter(pedido => {
    const status = pedido.status?.toLowerCase();
    switch (filterStatus) {
      case 'pending':
        return status === 'pending' || status === 'processing' || status === 'preparing';
      case 'completed':
        return status === 'completed' || status === 'delivered' || status === 'concluido';
      case 'cancelled':
        return status === 'cancelled' || status === 'cancelado';
      default:
        return true;
    }
  });
};

// No render:
<View style={styles.filtersContainer}>
  <TouchableOpacity
    style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
    onPress={() => setFilterStatus('all')}
  >
    <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
      Todos
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
    onPress={() => setFilterStatus('pending')}
  >
    <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
      Em Andamento
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
    onPress={() => setFilterStatus('completed')}
  >
    <Text style={[styles.filterButtonText, filterStatus === 'completed' && styles.filterButtonTextActive]}>
      Concluídos
    </Text>
  </TouchableOpacity>
</View>
```

---

## 📋 **ETAPA 7: Página de Detalhes do Pedido**

### **7.1 Criar Nova Tela `screens/detalhesPedido.js`**

**Criar arquivo completo:**

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Header from '../components/Header';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance } from '../services/customerService';
import { getOrderById, cancelOrder } from '../services/orderService';
import { addToBasket } from '../contexts/BasketContext';
import { useBasket } from '../contexts/BasketContext';
import api from '../services/api';

export default function DetalhesPedido({ navigation, route }) {
  const { orderId, order: initialOrder, showTracking } = route.params || {};
  const isFocused = useIsFocused();
  
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [order, setOrder] = useState(initialOrder || null);
  const [loadingOrder, setLoadingOrder] = useState(!initialOrder);
  const [cancelling, setCancelling] = useState(false);
  
  const { addToBasket: addToBasketContext } = useBasket();

  // Carregar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        setLoggedIn(!!ok);
        if (ok) {
          const user = await getStoredUserData();
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            setLoyaltyBalance(points);
            
            const normalized = {
              name: user.full_name || user.name || 'Usuário',
              points: points.toString(),
              address: user.address || undefined,
              avatar: undefined,
            };
            setUserInfo(normalized);
          }
        }
      } catch (e) {
        setLoggedIn(false);
        setUserInfo(null);
      }
    };
    checkAuth();
  }, [isFocused]);

  // Carregar detalhes do pedido
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        setLoadingOrder(true);
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        // ALTERAÇÃO: Removido console.error em produção
        const isDev = __DEV__;
        if (isDev) {
          console.error('Erro ao carregar detalhes do pedido:', error);
        }
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido.');
        navigation.goBack();
      } finally {
        setLoadingOrder(false);
      }
    };
    
    if (!initialOrder) {
      fetchOrderDetails();
    }
  }, [orderId, initialOrder]);

  const fetchEnderecos = async (userId) => {
    try {
      const enderecosData = await getCustomerAddresses(userId);
      setEnderecos(enderecosData || []);
      const enderecoPadrao = enderecosData?.find(e => e.is_default || e.isDefault);
      setEnderecoAtivo(enderecoPadrao || null);
    } catch (error) {
      // ALTERAÇÃO: Removido console.error em produção
      const isDev = __DEV__;
      if (isDev) {
        console.error('Erro ao buscar endereços:', error);
      }
    }
  };

  const fetchLoyaltyBalance = async (userId) => {
    try {
      setLoadingPoints(true);
      const balance = await getLoyaltyBalance(userId);
      return balance?.current_balance || 0;
    } catch (error) {
      return 0;
    } finally {
      setLoadingPoints(false);
    }
  };

  // Formatação de data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dayName}, ${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  // Formatação de status
  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
      case 'novo':
        return { text: 'Novo', color: '#FF8C00', bgColor: '#FFF3E0' };
      case 'processing':
      case 'preparing':
      case 'preparo':
        return { text: 'Em Preparo', color: '#FFD700', bgColor: '#FFFDE7' };
      case 'ready':
      case 'pronto':
        return { text: 'Pronto', color: '#32CD32', bgColor: '#E8F5E9' };
      case 'out_for_delivery':
      case 'delivering':
      case 'entrega':
      case 'em_rota':
        return { text: 'Em Rota de Entrega', color: '#A0522D', bgColor: '#EFEBE9' };
      case 'completed':
      case 'delivered':
      case 'concluido':
        return { text: 'Concluído', color: '#4CAF50', bgColor: '#E8F5E9' };
      case 'cancelled':
      case 'cancelado':
        return { text: 'Cancelado', color: '#F44336', bgColor: '#FFEBEE' };
      default:
        return { text: 'Desconhecido', color: '#888888', bgColor: '#F5F5F5' };
    }
  };

  // Renderizar progresso do pedido
  const renderOrderProgress = () => {
    if (!order) return null;
    
    const status = order.status?.toLowerCase();
    const isCompleted = status === 'completed' || status === 'delivered' || status === 'concluido';
    const isCancelled = status === 'cancelled' || status === 'cancelado';
    
    if (isCancelled) {
      return (
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, styles.progressStepCompleted]}>
            <View style={styles.progressStepIcon}>
              <Text style={styles.progressStepIconText}>✕</Text>
            </View>
            <Text style={styles.progressStepLabel}>Pedido Cancelado</Text>
          </View>
        </View>
      );
    }
    
    const steps = [
      { key: 'pending', label: 'Pedido Recebido', icon: '✓' },
      { key: 'preparing', label: 'Em Preparo', icon: '🍔' },
      { key: 'ready', label: 'Pronto', icon: '✓' },
      { key: 'delivering', label: 'Saiu para Entrega', icon: '🚚' },
      { key: 'completed', label: 'Entregue', icon: '✓' }
    ];
    
    let currentStepIndex = 0;
    if (status === 'pending' || status === 'novo') currentStepIndex = 0;
    else if (status === 'processing' || status === 'preparing' || status === 'preparo') currentStepIndex = 1;
    else if (status === 'ready' || status === 'pronto') currentStepIndex = 2;
    else if (status === 'out_for_delivery' || status === 'delivering' || status === 'em_rota') currentStepIndex = 3;
    else if (isCompleted) currentStepIndex = 4;
    
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <View key={step.key} style={styles.progressStepContainer}>
              <View style={[
                styles.progressStep,
                isActive && styles.progressStepCompleted,
                isCurrent && styles.progressStepCurrent
              ]}>
                <View style={[
                  styles.progressStepIcon,
                  isActive && styles.progressStepIconCompleted
                ]}>
                  <Text style={[
                    styles.progressStepIconText,
                    isActive && styles.progressStepIconTextCompleted
                  ]}>
                    {step.icon}
                  </Text>
                </View>
                <Text style={[
                  styles.progressStepLabel,
                  isActive && styles.progressStepLabelCompleted
                ]}>
                  {step.label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  isActive && styles.progressLineCompleted
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // Renderizar itens do pedido
  const renderOrderItems = () => {
    if (!order?.items || order.items.length === 0) return null;
    
    return (
      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>Itens do Pedido</Text>
        {order.items.map((item, index) => {
          const productImageUrl = item.product?.image_url 
            ? (item.product.image_url.startsWith('http') 
                ? item.product.image_url 
                : `${api.defaults.baseURL.replace('/api', '')}/api/products/image/${item.product.id}`)
            : null;
          
          return (
            <View key={index} style={styles.orderItem}>
              {productImageUrl && (
                <Image source={{ uri: productImageUrl }} style={styles.itemImage} />
              )}
              <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.product_name || item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity || 1}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {((item.item_subtotal || item.price || 0) / (item.quantity || 1)).toFixed(2).replace('.', ',')}
                </Text>
                
                {/* Extras */}
                {item.extras && item.extras.length > 0 && (
                  <View style={styles.itemExtras}>
                    {item.extras.map((extra, extraIndex) => (
                      <Text key={extraIndex} style={styles.extraText}>
                        + {extra.ingredient_name || extra.name} (x{extra.quantity || 1})
                      </Text>
                    ))}
                  </View>
                )}
                
                {/* Modificações base */}
                {item.base_modifications && item.base_modifications.length > 0 && (
                  <View style={styles.itemModifications}>
                    {item.base_modifications.map((mod, modIndex) => (
                      <Text key={modIndex} style={styles.modificationText}>
                        {mod.delta > 0 ? '+' : ''}{mod.delta}x {mod.ingredient_name || mod.name}
                      </Text>
                    ))}
                  </View>
                )}
                
                {/* Observações */}
                {item.notes && (
                  <Text style={styles.itemNotes}>
                    <Text style={styles.notesLabel}>Obs:</Text> {item.notes}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Renderizar resumo financeiro
  const renderOrderSummary = () => {
    if (!order) return null;
    
    const subtotal = order.subtotal || order.items?.reduce((sum, item) => 
      sum + (item.item_subtotal || item.price || 0), 0) || 0;
    const deliveryFee = order.delivery_fee || (order.order_type === 'pickup' ? 0 : 5.0);
    const discount = order.discount || 0;
    const total = order.total_amount || order.total || (subtotal + deliveryFee - discount);
    const pointsEarned = order.points_earned || 0;
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
        </View>
        
        {deliveryFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
            <Text style={styles.summaryValue}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
          </View>
        )}
        
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Desconto</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>
              - R$ {discount.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
        
        {pointsEarned > 0 && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>
              🎉 Você ganhou {pointsEarned} pontos Royal com este pedido!
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Cancelar pedido
  const handleCancelOrder = () => {
    const status = order?.status?.toLowerCase();
    const canCancel = status === 'pending' || status === 'novo' || status === 'processing';
    
    if (!canCancel) {
      Alert.alert('Atenção', 'Este pedido não pode ser cancelado.');
      return;
    }
    
    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelOrder(orderId, 'Cancelado pelo cliente');
              Alert.alert('Sucesso', 'Pedido cancelado com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              // ALTERAÇÃO: Removido console.error em produção
              const isDev = __DEV__;
              if (isDev) {
                console.error('Erro ao cancelar pedido:', error);
              }
              Alert.alert('Erro', 'Não foi possível cancelar o pedido. Tente novamente.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  // Reordenar pedido
  const handleReorder = async () => {
    if (!order?.items || order.items.length === 0) {
      Alert.alert('Atenção', 'Este pedido não possui itens para reordenar.');
      return;
    }
    
    Alert.alert(
      'Reordenar Pedido',
      'Deseja adicionar todos os itens deste pedido à sua cesta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async () => {
            try {
              let addedCount = 0;
              for (const item of order.items) {
                try {
                  const extras = (item.extras || []).map(extra => ({
                    ingredient_id: extra.ingredient_id || extra.id,
                    quantity: extra.quantity || 1
                  })).filter(extra => extra.ingredient_id && extra.quantity > 0);
                  
                  const baseModifications = (item.base_modifications || []).map(bm => ({
                    ingredient_id: bm.ingredient_id || bm.id,
                    delta: bm.delta || 0
                  })).filter(bm => bm.ingredient_id && bm.delta !== 0);
                  
                  const result = await addToBasketContext({
                    productId: item.product_id || item.product?.id,
                    quantity: item.quantity || 1,
                    observacoes: item.notes || '',
                    extras: extras,
                    baseModifications: baseModifications
                  });
                  
                  if (result.success) {
                    addedCount++;
                  }
                } catch (error) {
                  // Ignorar erros individuais
                }
              }
              
              if (addedCount > 0) {
                Alert.alert(
                  'Sucesso',
                  `${addedCount} ${addedCount === 1 ? 'item foi adicionado' : 'itens foram adicionados'} à sua cesta.`,
                  [
                    {
                      text: 'Ver Cesta',
                      onPress: () => navigation.navigate('Cesta')
                    },
                    { text: 'OK' }
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao adicionar itens à cesta.');
            }
          }
        }
      ]
    );
  };

  if (loadingOrder) {
    return (
      <View style={styles.container}>
        <Header
          type={loggedIn ? "logged" : "default"}
          userInfo={userInfo}
          navigation={navigation}
          title="Detalhes do Pedido"
          enderecos={enderecos}
          onEnderecoAtivoChange={(data) => setEnderecoAtivo(data)}
          loadingPoints={loadingPoints}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={styles.loadingText}>Carregando detalhes do pedido...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Header
          type={loggedIn ? "logged" : "default"}
          userInfo={userInfo}
          navigation={navigation}
          title="Detalhes do Pedido"
          enderecos={enderecos}
          onEnderecoAtivoChange={(data) => setEnderecoAtivo(data)}
          loadingPoints={loadingPoints}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Pedido não encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const isPickup = order.order_type === 'pickup';
  const canCancel = order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'novo';

  return (
    <View style={styles.container}>
      <Header
        type={loggedIn ? "logged" : "default"}
        userInfo={userInfo}
        navigation={navigation}
        title="Detalhes do Pedido"
        enderecos={enderecos}
        onEnderecoAtivoChange={(data) => setEnderecoAtivo(data)}
        loadingPoints={loadingPoints}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho do Pedido */}
        <View style={styles.headerContainer}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdText}>
              Pedido {order.confirmation_code || `#${order.id || order.order_id}`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        {/* Progresso do Pedido */}
        {showTracking && renderOrderProgress()}

        {/* Informações de Entrega */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Informações de Entrega</Text>
          
          {isPickup ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>Retirada no Balcão</Text>
            </View>
          ) : (
            <>
              {order.address && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Endereço:</Text>
                    <Text style={styles.infoValue}>
                      {order.address.street || order.address.address || ''}
                      {order.address.number ? `, ${order.address.number}` : ''}
                    </Text>
                  </View>
                  {order.address.complement && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Complemento:</Text>
                      <Text style={styles.infoValue}>{order.address.complement}</Text>
                    </View>
                  )}
                  {order.address.neighborhood && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Bairro:</Text>
                      <Text style={styles.infoValue}>{order.address.neighborhood}</Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Forma de Pagamento:</Text>
            <Text style={styles.infoValue}>
              {order.payment_method === 'pix' ? 'Pix' :
               order.payment_method === 'credit' ? 'Cartão de Crédito' :
               order.payment_method === 'cash' ? 'Dinheiro' :
               order.payment_method || 'Não informado'}
            </Text>
          </View>
          
          {order.payment_method === 'cash' && order.change_amount && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Troco para:</Text>
              <Text style={styles.infoValue}>
                R$ {order.change_amount.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          )}
        </View>

        {/* Itens do Pedido */}
        {renderOrderItems()}

        {/* Resumo Financeiro */}
        {renderOrderSummary()}

        {/* Ações */}
        <View style={styles.actionsContainer}>
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.reorderButton]}
            onPress={handleReorder}
          >
            <Text style={styles.reorderButtonText}>Reordenar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  progressStepContainer: {
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepCompleted: {
    opacity: 1,
  },
  progressStepCurrent: {
    transform: [{ scale: 1.1 }],
  },
  progressStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepIconCompleted: {
    backgroundColor: '#FFC107',
  },
  progressStepIconText: {
    fontSize: 20,
    color: '#666',
  },
  progressStepIconTextCompleted: {
    color: '#101010',
  },
  progressStepLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressStepLabelCompleted: {
    color: '#101010',
    fontWeight: '600',
  },
  progressLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  progressLineCompleted: {
    backgroundColor: '#FFC107',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#101010',
    flex: 1,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101010',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemExtras: {
    marginTop: 4,
  },
  extraText: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 2,
  },
  itemModifications: {
    marginTop: 4,
  },
  modificationText: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesLabel: {
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#101010',
    fontWeight: '600',
  },
  discountValue: {
    color: '#4CAF50',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  pointsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFDE7',
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#F57F17',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  reorderButton: {
    backgroundColor: '#FFC107',
  },
  reorderButtonText: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### **7.2 Adicionar Rota de Navegação**

**No arquivo de navegação (App.js ou similar):**

```javascript
// ALTERAÇÃO: Adicionar rota para detalhes do pedido
import DetalhesPedido from './screens/detalhesPedido';

// No Stack Navigator:
<Stack.Screen 
  name="DetalhesPedido" 
  component={DetalhesPedido}
  options={{ headerShown: false }}
/>
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO ATUALIZADO**

### **✅ Etapa 6: Histórico de Pedidos**
- [ ] Implementar navegação para detalhes em `handleVerDetalhes`
- [ ] Implementar funcionalidade "Adicionar à cesta" em `handleAdicionarCesta`
- [ ] Implementar funcionalidade "Acompanhar pedido" em `handleAcompanharPedido`
- [ ] Adicionar filtros de status (opcional, para paridade com Web)
- [ ] Melhorar tratamento de erros

### **✅ Etapa 7: Detalhes do Pedido**
- [ ] Criar arquivo `screens/detalhesPedido.js`
- [ ] Implementar carregamento de detalhes do pedido
- [ ] Implementar renderização de progresso do pedido
- [ ] Implementar renderização de itens do pedido
- [ ] Implementar renderização de resumo financeiro
- [ ] Implementar funcionalidade de cancelar pedido
- [ ] Implementar funcionalidade de reordenar pedido
- [ ] Adicionar rota de navegação
- [ ] Adicionar estilos completos
- [ ] Testar integração com histórico

---

## 🧪 **CHECKLIST DE TESTES FUNCIONAIS ATUALIZADO**

### **Teste 7: Histórico de Pedidos**
- [ ] Verificar que pedidos são carregados corretamente
- [ ] Verificar separação entre "Em andamento" e "Histórico"
- [ ] Verificar que ao clicar em "Ver mais" navega para detalhes
- [ ] Verificar que ao clicar em "Acompanhar" navega para detalhes com tracking
- [ ] Verificar que ao clicar em "Adicionar à cesta" adiciona itens corretamente
- [ ] Verificar filtros (se implementados)
- [ ] Verificar estado vazio quando não há pedidos

### **Teste 8: Detalhes do Pedido**
- [ ] Verificar que detalhes são carregados corretamente
- [ ] Verificar exibição de progresso do pedido
- [ ] Verificar exibição de informações de entrega
- [ ] Verificar exibição de itens com extras e modificações
- [ ] Verificar exibição de resumo financeiro
- [ ] Verificar funcionalidade de cancelar pedido (apenas se permitido)
- [ ] Verificar funcionalidade de reordenar pedido
- [ ] Verificar navegação de volta
- [ ] Verificar tratamento de erros

---

## 🔄 **PRÓXIMOS PASSOS**

1. Implementar Etapa 1 (Listagem)
2. Implementar Etapa 2 (Montagem)
3. Implementar Etapa 3 (Cesta)
4. Implementar Etapa 4 (Checkout)
5. Implementar Etapa 5 (UX)
6. **Implementar Etapa 6 (Histórico de Pedidos)**
7. **Implementar Etapa 7 (Detalhes do Pedido)**
8. Testar integração completa
9. Ajustar conforme feedback

---

**Data:** 2025-01-27  
**Autor:** Sistema de Integração  
**Versão:** 1.1 (Atualizado com Histórico e Detalhes)

