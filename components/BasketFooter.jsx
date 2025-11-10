import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG da cesta - usando o arquivo cesta.svg
const basketSvg = `<svg width="1" height="1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4C20.4125 4 20.8062 4.16875 21.0875 4.46875L30.0875 13.9688L30.1187 14H35C36.1063 14 37 14.8938 37 16C37 16.9062 36.4 17.6688 35.575 17.9188L32.6937 30.8687C32.2875 32.7 30.6625 34 28.7875 34H11.2063C9.33125 34 7.70625 32.7 7.3 30.8687L4.425 17.9188C3.6 17.675 3 16.9062 3 16C3 14.8938 3.89375 14 5 14H9.88125L9.9125 13.9688L18.9125 4.46875C19.1938 4.16875 19.5875 4 20 4ZM20 7.68125L14.0125 14H25.9875L20 7.68125ZM15 20.5C15 19.6687 14.3313 19 13.5 19C12.6687 19 12 19.6687 12 20.5V27.5C12 28.3312 12.6687 29 13.5 29C14.3313 29 15 28.3312 15 27.5V20.5ZM20 19C19.1688 19 18.5 19.6687 18.5 20.5V27.5C18.5 28.3312 19.1688 29 20 29C20.8312 29 21.5 28.3312 21.5 27.5V20.5C21.5 19.6687 20.8312 19 20 19ZM28 20.5C28 19.6687 27.3312 19 26.5 19C25.6688 19 25 19.6687 25 20.5V27.5C25 28.3312 25.6688 29 26.5 29C27.3312 29 28 28.3312 28 27.5V20.5Z" fill="#101010"/>
</svg>`;

export default function BasketFooter({ 
    total = 0, 
    itemCount = 0, 
    onPress = () => {},
    style = {} 
}) {
    const formatCurrency = (value) => {
        try {
            const numValue = parseFloat(value) || 0;
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
        } catch (error) {
            console.error('[BasketFooter] Erro ao formatar moeda:', { value, error });
            const numValue = parseFloat(value) || 0;
            return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftSection}>
                <SvgXml xml={basketSvg} width={40} height={40} />
                <View style={styles.textContainer}>
                    <Text style={styles.subtitleText}>Total sem taxas</Text>
                    <Text style={styles.totalText}>
                        {formatCurrency(total)} / {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </Text>
                </View>
            </View>
            
            <TouchableOpacity 
                style={styles.button} 
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>Ver cesta</Text>
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
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
        width: '100%',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
        justifyContent: 'flex-start',
    },
    subtitleText: {
        fontSize: 12,
        color: '#525252',
        marginBottom: 2,
    },
    totalText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#101010',
    },
    button: {
        backgroundColor: '#FFC107',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#3D1807',
        fontSize: 14,
        fontWeight: '700',
    },
});
