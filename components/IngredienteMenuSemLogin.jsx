import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function IngredienteMenu({
    nome = "Produto",
    valorExtra = 0,
    imagem = null,
    onQuantityChange = () => {},
    initialQuantity = 0,
    minQuantity = 0,
    maxQuantity = null
}) {
    // Calcula a quantidade inicial
    const getInitialQuantity = (initQty, minQty) => {
        // Prioriza initialQuantity, depois minQuantity, depois 0
        return initQty !== undefined && initQty !== null 
            ? initQty 
            : (minQty || 0);
    };

    const [quantity, setQuantity] = useState(() => getInitialQuantity(initialQuantity, minQuantity));

    // Atualiza a quantidade quando initialQuantity mudar (vindo da API)
    useEffect(() => {
        const newInitial = getInitialQuantity(initialQuantity, minQuantity);
        setQuantity(prevQuantity => {
            // Só atualiza se o valor realmente mudou
            if (prevQuantity !== newInitial) {
                return newInitial;
            }
            return prevQuantity;
        });
    }, [initialQuantity, minQuantity]);
    
    // IMPORTANTE: Limita a quantidade atual se exceder o máximo quando maxQuantity mudar
    useEffect(() => {
        const maxQtyNum = maxQuantity !== null && maxQuantity !== undefined ? Number(maxQuantity) : null;
        if (maxQtyNum !== null && !isNaN(maxQtyNum) && maxQtyNum > 0 && quantity > maxQtyNum) {
            const limitedQty = Math.max(minQuantity || 0, maxQtyNum);
            setQuantity(limitedQty);
            if (onQuantityChange) {
                onQuantityChange(limitedQty);
            }
        }
    }, [maxQuantity, minQuantity]);

    const formatarValor = (valor) => {
        if (valor === 0) {
            return "+R$ 0,00";
        }
        return `+R$ ${valor.toFixed(2).replace('.', ',')}`;
    };

    const handleIncrement = () => {
        // Garante que maxQuantity é um número válido
        const maxQtyNum = maxQuantity !== null && maxQuantity !== undefined ? Number(maxQuantity) : null;
        
        if (maxQtyNum !== null && !isNaN(maxQtyNum) && maxQtyNum > 0) {
            // Limita ao máximo disponível
            const newQuantity = Math.min(quantity + 1, maxQtyNum);
            setQuantity(newQuantity);
            if (onQuantityChange) {
                onQuantityChange(newQuantity);
            }
        } else {
            // Sem limite, permite aumentar
            const newQuantity = quantity + 1;
            setQuantity(newQuantity);
            if (onQuantityChange) {
                onQuantityChange(newQuantity);
            }
        }
    };

    const handleDecrement = () => {
        const minQty = minQuantity || 0;
        const newQuantity = Math.max(minQty, quantity - 1);
        setQuantity(newQuantity);
        if (onQuantityChange) {
            onQuantityChange(newQuantity);
        }
    };

    // Mostrar botão de diminuir se quantidade > minQuantity (ou > 0 se não tiver min)
    const showDecrement = quantity > (minQuantity || 0);
    
    // Ocultar botão de aumentar se atingiu o máximo
    // Garante que maxQuantity é um número válido antes de comparar
    const maxQtyNum = maxQuantity !== null && maxQuantity !== undefined ? Number(maxQuantity) : null;
    const showIncrement = maxQtyNum === null || isNaN(maxQtyNum) || maxQtyNum <= 0 || quantity < maxQtyNum;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.nome}>{nome}</Text>
                    <Text style={styles.valor}>{formatarValor(valorExtra)}</Text>
                </View>
                <View style={styles.quantityContainer}>
                    {showDecrement && (
                        <TouchableOpacity 
                            style={styles.minusButton}
                            onPress={handleDecrement}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.minusText}>-</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.quantityBox}>
                        <Text style={styles.quantityText}>
                            {String(quantity).padStart(2, '0')}
                        </Text>
                    </View>
                    {showIncrement && (
                        <TouchableOpacity 
                            style={styles.plusButton}
                            onPress={handleIncrement}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.plusText}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        marginVertical: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    textContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
    },
    nome: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
        marginBottom: 4,
    },
    valor: {
        fontSize: 14,
        fontWeight: '400',
        color: '#666666',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
        height: 36,
    },
    minusButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    minusText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FF4444',
    },
    quantityBox: {
        paddingHorizontal: 12,
        height: 36,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#000000',
    },
    plusButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FF4444',
    },
});
