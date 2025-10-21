import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

const penSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.3333 2.00001C11.5083 1.82505 11.7162 1.68698 11.9451 1.59333C12.174 1.49968 12.4194 1.45215 12.6667 1.45215C12.9139 1.45215 13.1593 1.49968 13.3882 1.59333C13.6171 1.68698 13.825 1.82505 14 2.00001C14.175 2.17497 14.313 2.38289 14.4067 2.61178C14.5003 2.84067 14.5479 3.08605 14.5479 3.33334C14.5479 3.58063 14.5003 3.82601 14.4067 4.0549C14.313 4.28379 14.175 4.49171 14 4.66667L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2.00001Z" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const trashSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 4H3.33333H14" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.66667 7.33333V11.3333" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.33333 7.33333V11.3333" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const minusSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.33333 8H12.6667" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const plusSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 3.33333V12.6667" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.33333 8H12.6667" stroke="#FF4444" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function ItensCesta({ 
    item, 
    onEdit, 
    onRemove, 
    onUpdateQuantity 
}) {
    // Debug: verificar dados do item
    console.log('ItensCesta - item recebido:', item);
    console.log('ItensCesta - item.image:', item?.image);
    
    const formatCurrency = (value) => {
        try {
            return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(value);
        } catch {
            return `R$ ${value.toFixed(2).replace('.', ',')}`;
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(item);
        }
    };

    const handleRemove = () => {
        if (onRemove) {
            onRemove(item);
        }
    };

    const handleQuantityChange = (newQuantity) => {
        if (onUpdateQuantity && newQuantity >= 0) {
            onUpdateQuantity(item, newQuantity);
        }
    };

    return (
        <View style={styles.container}>
            {/* Botão de edição - posicionado no canto superior direito */}
            <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.7}
            >
                <SvgXml
                    xml={penSvg}
                    width={16}
                    height={16}
                />
            </TouchableOpacity>

            {/* Seção principal do produto */}
            <View style={styles.mainSection}>
            {/* Imagem do produto - lado esquerdo */}
            <View style={styles.imageContainer}>
                <Image
                    source={item.image ? { uri: item.image } : require('../assets/img/hamburguer.png')}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={(error) => {
                        console.log('Erro ao carregar imagem:', error.nativeEvent.error);
                    }}
                />
            </View>

                {/* Detalhes do produto - lado direito da imagem */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.productName}>
                        {item.name || 'Nome produto'}
                    </Text>
                <Text 
                    style={styles.productDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {item.description || 'Descrição dos itens do produto'}
                </Text>
                </View>
            </View>

            {/* Seção inferior - preço à esquerda, controles à direita */}
            <View style={styles.bottomSection}>
                {/* Preço */}
                <Text style={styles.price}>
                    {formatCurrency(item.price || 0)}
                </Text>

                {/* Controles de quantidade */}
                <View style={styles.quantityControls}>
                    <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange((item.quantity || 1) - 1)}
                        activeOpacity={0.7}
                    >
                        <SvgXml
                            xml={(item.quantity || 1) >= 2 ? minusSvg : trashSvg}
                            width={16}
                            height={16}
                        />
                    </TouchableOpacity>
                    
                    <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>
                            {String(item.quantity || 1).padStart(2, '0')}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange((item.quantity || 1) + 1)}
                        activeOpacity={0.7}
                    >
                        <SvgXml
                            xml={plusSvg}
                            width={16}
                            height={16}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
        overflow: 'visible',
        zIndex: 1,
    },
    mainSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    productDescription: {
        fontSize: 14,
        color: '#666666',
    },
    editButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 32,
        height: 32,
        backgroundColor: '#FFC107',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    quantityButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityDisplay: {
        marginHorizontal: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
    },
});
