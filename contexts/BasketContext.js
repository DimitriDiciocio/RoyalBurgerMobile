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

    const addToBasket = ({ quantity, total, unitPrice, productName = 'Produto' }) => {
        const newItem = {
            id: Date.now(), // ID temporário
            name: productName,
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
        clearBasket
    };

    return (
        <BasketContext.Provider value={value}>
            {children}
        </BasketContext.Provider>
    );
};
