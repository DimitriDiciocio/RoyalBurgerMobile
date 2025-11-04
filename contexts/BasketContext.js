import React, { createContext, useContext, useState } from 'react';

const BasketContext = createContext();

export const useBasket = () => {
    const context = useContext(BasketContext);
    if (!context) {
        throw new Error('useBasket deve ser usado dentro de um BasketProvider');
    }
    return context;
};

export const BasketProvider = ({ children }) => {
    const [basketItems, setBasketItems] = useState([]);
    const [basketTotal, setBasketTotal] = useState(0);

    const addToBasket = ({ quantity, total, unitPrice, productName = 'Produto', description, image, productId, observacoes = '', selectedExtras = {}, defaultIngredientsQuantities = {}, modifications = [] }) => {
        const newItem = {
            id: `${productId || 'temp'}_${Date.now()}_${Math.random()}`, // ID único sempre
            originalProductId: productId, // Mantém referência ao produto original
            name: productName,
            description: description || 'Descrição dos itens do produto',
            image: image,
            price: unitPrice,
            quantity: quantity,
            total: total,
            observacoes: observacoes,
            selectedExtras: selectedExtras,
            defaultIngredientsQuantities: defaultIngredientsQuantities,
            modifications: modifications // Lista de modificações para exibição
        };
        
        setBasketItems(prev => [...prev, newItem]);
        setBasketTotal(prev => prev + total);
    };

    const removeFromBasket = (itemId) => {
        setBasketItems(prev => {
            const itemToRemove = prev.find(item => item.id === itemId);
            if (itemToRemove) {
                setBasketTotal(current => current - itemToRemove.total);
            }
            return prev.filter(item => item.id !== itemId);
        });
    };

    const clearBasket = () => {
        setBasketItems([]);
        setBasketTotal(0);
    };

    const updateBasketItem = (itemId, updatedItem) => {
        setBasketItems(prev => {
            const itemIndex = prev.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                const updatedItems = [...prev];
                const oldItem = updatedItems[itemIndex];
                
                // Calcular total: se total foi fornecido explicitamente, usar ele (prioridade)
                // Caso contrário, recalcular baseado em quantidade/preço mantendo adicionais proporcionais
                let newTotal = oldItem.total;
                if (updatedItem.total !== undefined) {
                    // Se total foi fornecido, usar diretamente (prioridade máxima)
                    newTotal = updatedItem.total;
                } else if (updatedItem.quantity !== undefined && updatedItem.quantity !== oldItem.quantity) {
                    // Calcular adicionais (diferença entre total e preço base * quantidade antiga)
                    const baseTotal = (oldItem.price || 0) * (oldItem.quantity || 1);
                    const additionalTotal = (oldItem.total || 0) - baseTotal;
                    // Novo total = novo preço base * nova quantidade + adicionais proporcionais
                    const newBaseTotal = (updatedItem.price || oldItem.price || 0) * updatedItem.quantity;
                    newTotal = newBaseTotal + additionalTotal;
                } else if (updatedItem.price !== undefined) {
                    // Se apenas o preço mudou, recalcular mantendo adicionais
                    const baseTotal = (oldItem.price || 0) * (oldItem.quantity || 1);
                    const additionalTotal = (oldItem.total || 0) - baseTotal;
                    newTotal = (updatedItem.price || 0) * (oldItem.quantity || 1) + additionalTotal;
                }
                
                updatedItems[itemIndex] = { 
                    ...oldItem, 
                    ...updatedItem,
                    total: newTotal,
                    // Preservar modificações se não foram fornecidas
                    modifications: updatedItem.modifications !== undefined ? updatedItem.modifications : oldItem.modifications
                };
                
                // Recalcula o total geral
                const newBasketTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
                setBasketTotal(newBasketTotal);
                
                return updatedItems;
            }
            return prev;
        });
    };

    // Calcular quantidade total de itens (soma das quantidades)
    const getTotalItemCount = () => {
        return basketItems.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        basketItems,
        basketTotal,
        basketItemCount: getTotalItemCount(), // Quantidade total de itens
        addToBasket,
        removeFromBasket,
        updateBasketItem,
        clearBasket
    };

    return (
        <BasketContext.Provider value={value}>
            {children}
        </BasketContext.Provider>
    );
};
