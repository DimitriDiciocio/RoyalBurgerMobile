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

    const addToBasket = ({ quantity, total, unitPrice, productName = 'Produto', description, image, productId }) => {
        const newItem = {
            id: `${productId || 'temp'}_${Date.now()}_${Math.random()}`, // ID único sempre
            originalProductId: productId, // Mantém referência ao produto original
            name: productName,
            description: description || 'Descrição dos itens do produto',
            image: image,
            price: unitPrice,
            quantity: quantity,
            total: total
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
                updatedItems[itemIndex] = { 
                    ...oldItem, 
                    ...updatedItem,
                    total: updatedItem.price * updatedItem.quantity // Recalcula o total do item
                };
                
                // Recalcula o total geral
                const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
                setBasketTotal(newTotal);
                
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
