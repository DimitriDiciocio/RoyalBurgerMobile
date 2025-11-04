import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function QuantidadePrecoBar({
    unitPrice = 0,
    initialQuantity = 1,
    additionalTotal = 0,
    onQuantityChange = () => {},
    onAddPress = () => {},
    onAddToBasket = () => {},
    style = {},
    buttonText = 'Adicionar à cesta'
}) {
    const [quantity, setQuantity] = useState(Math.max(1, parseInt(initialQuantity || 1, 10)));

    // Atualizar quantidade quando initialQuantity mudar (útil para edição)
    useEffect(() => {
        const newQuantity = Math.max(1, parseInt(initialQuantity || 1, 10));
        if (newQuantity !== quantity) {
            setQuantity(newQuantity);
            onQuantityChange(newQuantity);
        }
    }, [initialQuantity]);

    const priceNumber = useMemo(() => {
        const num = typeof unitPrice === 'string' ? parseFloat(unitPrice.replace('R$', '').replace('.', '').replace(',', '.')) : Number(unitPrice || 0);
        return isNaN(num) ? 0 : num;
    }, [unitPrice]);

    const total = useMemo(() => {
        const baseTotal = priceNumber * quantity;
        return baseTotal + (additionalTotal || 0);
    }, [priceNumber, quantity, additionalTotal]);

    const formatCurrency = (value) => {
        try {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        } catch {
            return `R$ ${value.toFixed(2).replace('.', ',')}`;
        }
    };

    const decrement = () => {
        const next = Math.max(1, quantity - 1);
        setQuantity(next);
        onQuantityChange(next);
    };

    const increment = () => {
        const next = quantity + 1;
        setQuantity(next);
        onQuantityChange(next);
    };

    const handleAdd = () => {
        onAddPress({ quantity, total, unitPrice: priceNumber });
        onAddToBasket({ quantity, total, unitPrice: priceNumber });
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftGroup}>
                <View style={styles.stepper}>
                    <TouchableOpacity onPress={decrement} style={styles.stepperBtn}>
                        <Text style={styles.stepperSign}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{String(quantity).padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={increment} style={styles.stepperBtn}>
                        <Text style={styles.stepperSign}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.totalText}>{formatCurrency(total)}</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.9}>
                <Text style={styles.addButtonText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 2,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E9E9EC',
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 30,
        gap: 10,
    },
    stepperBtn: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    stepperSign: {
        color: '#E53935',
        fontSize: 16,
        fontWeight: '600',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
        minWidth: 22,
        textAlign: 'center',
    },
    totalText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    addButton: {
        backgroundColor: '#FFC107',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    addButtonText: {
        color: '#3D1807',
        fontSize: 14,
        fontWeight: '700',
    },
});


