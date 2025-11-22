import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import api from '../services/api';
import { getAllIngredients } from '../services/ingredientService';

export default function OrderItemCard({ item }) {
  // ALTERAÇÃO: Cache de ingredientes para buscar preços dos extras
  const [ingredientsCache, setIngredientsCache] = useState(null);

  // ALTERAÇÃO: Carregar cache de ingredientes ao montar o componente
  useEffect(() => {
    const loadIngredientsCache = async () => {
      if (ingredientsCache) return;
      try {
        const response = await getAllIngredients({ page_size: 1000 });
        let ingredientsList = [];
        if (Array.isArray(response)) {
          ingredientsList = response;
        } else if (response && response.items && Array.isArray(response.items)) {
          ingredientsList = response.items;
        }
        
        if (ingredientsList.length > 0) {
          const cache = {};
          ingredientsList.forEach(ingredient => {
            if (ingredient && ingredient.id != null) {
              const id = String(ingredient.id);
              cache[id] = {
                additional_price: parseFloat(ingredient.additional_price) || 0,
                price: parseFloat(ingredient.price) || 0,
                name: ingredient.name || ''
              };
            }
          });
          setIngredientsCache(cache);
        }
      } catch (error) {
        console.error('Erro ao carregar cache de ingredientes:', error);
      }
    };
    loadIngredientsCache();
  }, []);

  const formatCurrency = (value) => {
    try {
      const numValue = parseFloat(value) || 0;
      return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
    } catch (error) {
      const numValue = parseFloat(value) || 0;
      return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
    }
  };

  // Construir URL da imagem (mesma lógica do BasketContext)
  const getImageUrl = () => {
    const productId = item?.product_id || item?.product?.id;
    const imageCandidates = [
      item?.product?.image_url,
      item?.product?.image,
      item?.product_image_url,
      item?.image_url,
      item?.image,
    ];
    
    const imageUrl = imageCandidates.find(Boolean);
    
    if (!imageUrl || !productId) return null;
    
    // Se a URL já é completa (http/https), usa direto
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Constrói URL para o endpoint de imagem da API (mesma lógica do BasketContext)
    const baseUrl = api.defaults?.baseURL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}/api/products/image/${productId}`;
  };

  // Obter descrição abreviada
  const getDescription = () => {
    const desc = item?.product_description || item?.product?.description || item?.description || '';
    if (desc.length > 50) {
      return desc.substring(0, 50) + '...';
    }
    return desc;
  };

  // Obter extras e modificações
  const getExtras = () => {
    // ALTERAÇÃO: Se selectedExtras é um objeto, converter para array
    if (item?.selectedExtras && typeof item.selectedExtras === 'object' && !Array.isArray(item.selectedExtras)) {
      // Converter objeto {ingredientId: quantity} para array
      return Object.entries(item.selectedExtras)
        .filter(([_, qty]) => qty > 0)
        .map(([ingredientId, qty]) => ({
          ingredient_id: Number(ingredientId),
          id: Number(ingredientId),
          quantity: Number(qty),
          qty: Number(qty)
        }));
    }
    // Se já é array, retornar direto
    return item?.extras || item?.additional_items || item?.selectedExtras || [];
  };

  const getModifications = () => {
    return item?.base_modifications || item?.modifications || [];
  };

  // ALTERAÇÃO: Buscar preço do ingrediente (melhorada com cache)
  const findIngredientPrice = (ingredientData, ingredientId) => {
    // Primeiro tentar cache se tiver ID
    if (ingredientId && ingredientsCache) {
      const id = String(ingredientId);
      const cached = ingredientsCache[id];
      if (cached && cached.additional_price > 0) {
        return cached.additional_price;
      }
      if (cached && cached.price > 0) {
        return cached.price;
      }
    }

    // Tentar nos dados do ingrediente (mesma ordem do produto.js)
    const priceCandidates = [
      ingredientData?.additional_price,
      ingredientData?.extra_price,
      ingredientData?.preco_extra,
      ingredientData?.valor_extra,
      ingredientData?.price,
      ingredientData?.ingredient_price,
      ingredientData?.unit_price,
      ingredientData?.preco,
      ingredientData?.valor
    ];

    for (const candidate of priceCandidates) {
      if (candidate !== undefined && candidate !== null) {
        const priceNum = parseFloat(candidate);
        if (!isNaN(priceNum) && priceNum >= 0) {
          return priceNum;
        }
      }
    }

    return 0;
  };

  // ALTERAÇÃO: Calcular preço total do item (produto + adicionais)
  // Sempre calcula incluindo adicionais, mesmo se item_subtotal vier da API
  const calculateItemTotal = () => {
    // Começar com o preço base do produto
    const unitPrice = parseFloat(item?.unit_price || item?.price || item?.product?.price || 0);
    const quantity = parseInt(item?.quantity || 1, 10);
    let baseTotal = unitPrice * quantity;
    
    // ALTERAÇÃO: Sempre somar preços dos extras (adicionais)
    const extras = getExtras();
    let hasExtras = false;
    let extrasTotal = 0;
    
    // ALTERAÇÃO: Melhorar validação de extras - verificar se é array válido e não vazio
    const isValidExtrasArray = Array.isArray(extras) && extras.length > 0;
    const hasSelectedExtras = item?.selectedExtras && typeof item.selectedExtras === 'object' && Object.keys(item.selectedExtras).length > 0;
    
    if (isValidExtrasArray || hasSelectedExtras) {
      // Se tem selectedExtras como objeto, já foi convertido em getExtras()
      const extrasToProcess = isValidExtrasArray ? extras : getExtras();
      
      if (Array.isArray(extrasToProcess) && extrasToProcess.length > 0) {
        extrasToProcess.forEach(extra => {
          const extraQuantity = parseInt(extra.quantity || extra.qty || 1, 10);
          const ingredientId = extra.ingredient_id || extra.id;
          
          // ALTERAÇÃO: Validar se tem quantidade válida
          if (extraQuantity <= 0 || !ingredientId) {
            return; // Pula extras inválidos
          }
          
          // Buscar preço usando a mesma função que busca preço de ingrediente (com cache)
          let extraPrice = findIngredientPrice(extra, ingredientId);
          
          // ALTERAÇÃO: Se não encontrou, tentar campos específicos de itens de pedido
          if (extraPrice === 0) {
            const priceCandidates = [
              extra.price,
              extra.unit_price,
              extra.item_price,
              extra.extra_price,
              extra.additional_price,
              extra.total_price ? parseFloat(extra.total_price) / extraQuantity : null,
            ];
            
            for (const candidate of priceCandidates) {
              if (candidate !== undefined && candidate !== null) {
                const priceNum = parseFloat(candidate);
                if (!isNaN(priceNum) && priceNum >= 0) {
                  extraPrice = priceNum;
                  break;
                }
              }
            }
          }
          
          // ALTERAÇÃO: Se ainda não encontrou preço mas tem ingredient_id, tentar buscar do cache
          if (extraPrice === 0 && ingredientId && ingredientsCache) {
            const cached = ingredientsCache[String(ingredientId)];
            if (cached) {
              extraPrice = cached.additional_price || cached.price || 0;
            }
          }
          
          // ALTERAÇÃO: Somar mesmo se preço for 0 (pode ser extra gratuito), mas marcar como tendo extras
          if (extraQuantity > 0) {
            hasExtras = true;
            const extraTotal = extraPrice * extraQuantity;
            extrasTotal += extraTotal;
            baseTotal += extraTotal;
          }
        });
      }
    }
    
    // ALTERAÇÃO: Sempre somar preços das modificações positivas (adições)
    const modifications = getModifications();
    let hasModifications = false;
    if (Array.isArray(modifications) && modifications.length > 0) {
      modifications.forEach(mod => {
        const delta = parseFloat(mod.delta || 0);
        if (delta > 0) {
          // Buscar preço usando a mesma função que busca preço de ingrediente
          const modPrice = findIngredientPrice(mod, mod.ingredient_id || mod.id);
          if (modPrice > 0) {
            hasModifications = true;
            baseTotal += modPrice * Math.abs(delta);
          }
        }
      });
    }
    
    // ALTERAÇÃO: Se houver extras ou modificações, sempre usar o valor calculado
    // Se não houver, usar o item.total se disponível, senão o item_subtotal da API
    if (hasExtras || hasModifications) {
      // Se calculou extras/modificações, sempre usar o calculado
      return baseTotal;
    }
    
    // Se não houver extras/modificações, usar o total do item se disponível
    if (item?.total !== undefined && item?.total !== null) {
      const itemTotal = parseFloat(item.total);
      if (!isNaN(itemTotal) && itemTotal > 0) {
        return itemTotal;
      }
    }
    
    // Se não houver total do item, usar o total da API se disponível, senão o subtotal
    const apiTotal = parseFloat(item?.total_price || item?.item_total || 0);
    const apiSubtotal = parseFloat(item?.item_subtotal || item?.subtotal || 0);
    
    if (apiTotal > 0) {
      return apiTotal;
    }
    
    if (apiSubtotal > 0) {
      return apiSubtotal;
    }
    
    return baseTotal;
  };

  const finalPrice = calculateItemTotal();

  const imageUrl = getImageUrl();
  const extras = getExtras();
  const modifications = getModifications();
  const hasExtrasOrMods = (Array.isArray(extras) && extras.length > 0) || 
                          (Array.isArray(modifications) && modifications.length > 0);

  return (
    <View style={styles.container}>
      {/* Coluna da imagem */}
      <View style={styles.imageColumn}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </View>
      </View>

      {/* Informações do produto */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {item?.product_name || item?.product?.name || 'Nome produto'}
        </Text>

        <Text style={styles.productDescription} numberOfLines={2}>
          {getDescription()}
        </Text>

        {/* Seção de Modificações */}
        {hasExtrasOrMods && (
          <View style={styles.modificationsSection}>
            <Text style={styles.modificationsTitle}>Modificações:</Text>
            
            {/* Exibir extras (ingredientes adicionais) */}
            {Array.isArray(extras) && extras.length > 0 && extras.map((extra, index) => {
              const quantity = parseInt(extra.quantity || extra.qty || 1, 10);
              const name = extra.ingredient_name || extra.name || extra.title || 'Extra';
              const ingredientId = extra.ingredient_id || extra.id;
              
              // ALTERAÇÃO: Buscar preço usando função centralizada e também tentar campos específicos do pedido
              let unitPrice = findIngredientPrice(extra, ingredientId);
              
              // Se não encontrou, tentar campos específicos de itens de pedido
              if (unitPrice === 0) {
                const priceCandidates = [
                  extra.price,
                  extra.unit_price,
                  extra.item_price,
                  extra.extra_price,
                  extra.additional_price,
                  extra.total_price ? parseFloat(extra.total_price) / quantity : null,
                ];
                
                for (const candidate of priceCandidates) {
                  if (candidate !== undefined && candidate !== null) {
                    const priceNum = parseFloat(candidate);
                    if (!isNaN(priceNum) && priceNum >= 0) {
                      unitPrice = priceNum;
                      break;
                    }
                  }
                }
              }
              
              const totalPrice = unitPrice * quantity;
              
              return (
                <View key={`extra-${index}`} style={styles.modificationItem}>
                  <View style={styles.modificationLeft}>
                    <View style={styles.extraIcon}>
                      <Text style={styles.extraIconText}>{quantity}</Text>
                    </View>
                    <Text style={styles.modificationName}>{name}</Text>
                  </View>
                  <Text style={styles.modificationPrice}>
                    {totalPrice > 0 ? `+${formatCurrency(totalPrice)}` : formatCurrency(0)}
                  </Text>
                </View>
              );
            })}
            
            {/* Exibir modificações de base (alterações na receita padrão) */}
            {Array.isArray(modifications) && modifications.length > 0 && modifications.map((mod, index) => {
              const delta = parseFloat(mod.delta || 0);
              const isPositive = delta > 0;
              const name = mod.ingredient_name || mod.name || 'Ingrediente';
              const ingredientId = mod.ingredient_id || mod.id;
              
              // Buscar preço usando função centralizada (mesma lógica do web)
              const unitPrice = findIngredientPrice(mod, ingredientId);
              const totalPrice = unitPrice * Math.abs(delta);
              
              return (
                <View key={`mod-${index}`} style={styles.modificationItem}>
                  <View style={styles.modificationLeft}>
                    <View style={[styles.modificationIcon, !isPositive && styles.modificationIconNegative]}>
                      <Text style={styles.modificationIconText}>{Math.abs(delta)}</Text>
                    </View>
                    <Text style={styles.modificationName}>{name}</Text>
                  </View>
                  {totalPrice > 0 && isPositive && (
                    <Text style={styles.modificationPrice}>
                      +{formatCurrency(totalPrice)}
                    </Text>
                  )}
                </View>
              );
            })}
            
            {/* ALTERAÇÃO: Observações embaixo das modificações, caso houver */}
            {(item?.notes || item?.observacoes) && (item.notes?.trim() || item.observacoes?.trim()) && (
              <View style={styles.observationsSection}>
                <Text style={styles.observationsText}>
                  <Text style={styles.observationsLabel}>Obs:</Text> {item.notes || item.observacoes}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Observações - só aparece se não houver modificações */}
        {!hasExtrasOrMods && (item?.notes || item?.observacoes) && (item.notes?.trim() || item.observacoes?.trim()) && (
          <View style={styles.observationsSection}>
            <Text style={styles.observationsText}>
              <Text style={styles.observationsLabel}>Obs:</Text> {item.notes || item.observacoes}
            </Text>
          </View>
        )}

        {/* Footer: Preço e Quantidade */}
        <View style={styles.footerSection}>
          <Text style={styles.footerPrice}>
            {formatCurrency(finalPrice)}
          </Text>
          <Text style={styles.quantityText}>
            Qtd: {item?.quantity || 1}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageColumn: {
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  infoContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
    lineHeight: 20,
  },
  modificationsSection: {
    marginTop: 12,
    marginBottom: 8,
    marginLeft: -4,
  },
  modificationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  modificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#81C784',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modificationIconNegative: {
    backgroundColor: '#FF4444',
  },
  modificationIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  modificationName: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
  },
  modificationPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  extraIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#81C784',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  extraIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  observationsSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  observationsLabel: {
    fontWeight: '600',
    color: '#000000',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  quantityText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
});


