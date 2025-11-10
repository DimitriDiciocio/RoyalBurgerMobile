import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import EnderecosBottomSheet from '../components/EnderecosBottomSheet';
import EditarEnderecoBottomSheet from '../components/EditarEnderecoBottomSheet';
import BottomSheet from '../components/BottomSheet';
import Toggle from '../components/Toggle';
import { isAuthenticated, getStoredUserData, getPublicSettings, validateCartForOrder } from '../services';
import { getLoyaltyBalance, getCustomerAddresses, setDefaultAddress, addCustomerAddress, updateCustomerAddress, removeCustomerAddress } from '../services/customerService';
import { createOrder } from '../services/orderService';
import { useBasket } from '../contexts/BasketContext';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#000000"/>
</svg>`;

const chevronDownSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 7.5L10 12.5L15 7.5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const getPixSvg = (isSelected) => `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.1453 18.2766C15.4828 17.9391 16.0641 17.9391 16.4016 18.2766L21.2141 23.0891C22.1016 23.9766 23.2828 24.4641 24.5328 24.4641H25.4766L19.4078 30.5328C17.5141 32.3766 14.4391 32.3766 12.5453 30.5328L6.45156 24.4453H7.03281C8.28281 24.4453 9.46406 23.9578 10.3516 23.0703L15.1453 18.2766ZM16.4016 13.6766C16.0016 14.0203 15.4891 14.0266 15.1453 13.6766L10.3516 8.88281C9.46406 7.93906 8.28281 7.50781 7.03281 7.50781H6.45156L12.5391 1.42031C14.4391 -0.473438 17.5141 -0.473438 19.4078 1.42031L25.4828 7.48906H24.5328C23.2828 7.48906 22.1016 7.97656 21.2141 8.86406L16.4016 13.6766ZM7.03281 8.91406C7.89531 8.91406 8.68906 9.26406 9.35156 9.87656L14.1453 14.6703C14.5953 15.0641 15.1828 15.3453 15.7766 15.3453C16.3641 15.3453 16.9516 15.0641 17.4016 14.6703L22.2141 9.85781C22.8266 9.25156 23.6703 8.90156 24.5328 8.90156H26.8891L30.5328 12.5453C32.4266 14.4391 32.4266 17.5141 30.5328 19.4078L26.8891 23.0516H24.5328C23.6703 23.0516 22.8266 22.7016 22.2141 22.0891L17.4016 17.2766C16.5328 16.4078 15.0141 16.4078 14.1453 17.2828L9.35156 22.0703C8.68906 22.6828 7.89531 23.0328 7.03281 23.0328H5.04531L1.42031 19.4078C-0.473438 17.5141 -0.473438 14.4391 1.42031 12.5453L5.04531 8.91406H7.03281Z" fill="${isSelected ? '#FFC700' : '#101010'}"/>
</svg>`;

const getCreditCardSvg = (isSelected) => `<svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 4V6H32V4C32 1.79375 30.2062 0 28 0H4C1.79375 0 0 1.79375 0 4ZM0 9V20C0 22.2062 1.79375 24 4 24H28C30.2062 24 32 22.2062 32 20V9H0ZM4 18.5C4 17.6688 4.66875 17 5.5 17H8.5C9.33125 17 10 17.6688 10 18.5C10 19.3312 9.33125 20 8.5 20H5.5C4.66875 20 4 19.3312 4 18.5ZM13 18.5C13 17.6688 13.6687 17 14.5 17H18.5C19.3312 17 20 17.6688 20 18.5C20 19.3312 19.3312 20 18.5 20H14.5C13.6687 20 13 19.3312 13 18.5Z" fill="${isSelected ? '#FFC700' : '#101010'}"/>
</svg>`;

const getCashSvg = (isSelected) => `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 0C7.79375 0 6 1.79375 6 4V18C6 20.2062 7.79375 22 10 22H32C34.2062 22 36 20.2062 36 18V4C36 1.79375 34.2062 0 32 0H10ZM21 6C23.7625 6 26 8.2375 26 11C26 13.7625 23.7625 16 21 16C18.2375 16 16 13.7625 16 11C16 8.2375 18.2375 6 21 6ZM10 7.5V4.5C10 4.225 10.225 4 10.5 4H13.5C13.775 4 14.0063 4.225 13.9688 4.5C13.7437 6.3125 12.3062 7.74375 10.5 7.96875C10.225 8 10 7.775 10 7.5ZM10 14.5C10 14.225 10.225 13.9937 10.5 14.0312C12.3125 14.2563 13.7437 15.6938 13.9688 17.5C14 17.775 13.775 18 13.5 18H10.5C10.225 18 10 17.775 10 17.5V14.5ZM31.5 7.96875C29.6875 7.74375 28.2563 6.30625 28.0312 4.5C28 4.225 28.225 4 28.5 4H31.5C31.775 4 32 4.225 32 4.5V7.5C32 7.775 31.775 8.00625 31.5 7.96875ZM32 14.5V17.5C32 17.775 31.775 18 31.5 18H28.5C28.225 18 27.9937 17.775 28.0312 17.5C28.2563 15.6875 29.6938 14.2563 31.5 14.0312C31.775 14 32 14.225 32 14.5ZM3 7.5C3 6.66875 2.33125 6 1.5 6C0.66875 6 0 6.66875 0 7.5V24C0 26.2062 1.79375 28 4 28H28.5C29.3312 28 30 27.3312 30 26.5C30 25.6688 29.3312 25 28.5 25H4C3.45 25 3 24.55 3 24V7.5Z" fill="${isSelected ? '#FFC700' : '#101010'}"/>
</svg>`;

const infoSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 16C12.4187 16 16 12.4187 16 8C16 3.58125 12.4187 0 8 0C3.58125 0 0 3.58125 0 8C0 12.4187 3.58125 16 8 16ZM7 5C7 4.44688 7.44688 4 8 4C8.55313 4 9 4.44688 9 5C9 5.55312 8.55313 6 8 6C7.44688 6 7 5.55312 7 5ZM6.75 7H8.25C8.66562 7 9 7.33437 9 7.75V10.5H9.25C9.66562 10.5 10 10.8344 10 11.25C10 11.6656 9.66562 12 9.25 12H6.75C6.33437 12 6 11.6656 6 11.25C6 10.8344 6.33437 10.5 6.75 10.5H7.5V8.5H6.75C6.33437 8.5 6 8.16562 6 7.75C6 7.33437 6.33437 7 6.75 7Z" fill="#A0A0A0"/>
</svg>`;

const motoSvg = `<svg width="29" height="22" viewBox="0 0 29 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.375 0C11.7516 0 11.25 0.501562 11.25 1.125C11.25 1.74844 11.7516 2.25 12.375 2.25H15.0281L16.0828 4.53281L11.625 7.875C10.0594 6.69844 8.10938 6 6 6H3.375C2.75156 6 2.25 6.50156 2.25 7.125C2.25 7.74844 2.75156 8.25 3.375 8.25H6C9.67969 8.25 12.7125 11.0437 13.0875 14.625H11.8969C11.3719 11.85 8.92969 9.75 6 9.75C2.68594 9.75 0 12.4359 0 15.75C0 19.0641 2.68594 21.75 6 21.75C8.92969 21.75 11.3672 19.65 11.8969 16.875H14.25C14.8734 16.875 15.375 16.3734 15.375 15.75V14.6953C15.375 12.5813 16.5797 10.6922 18.4453 9.64687L19.0125 10.8703C17.4937 11.9578 16.5047 13.7391 16.5047 15.75C16.5047 19.0641 19.1906 21.75 22.5047 21.75C25.8188 21.75 28.5047 19.0641 28.5047 15.75C28.5047 12.4359 25.8188 9.75 22.5047 9.75C22.0031 9.75 21.5203 9.81094 21.0563 9.92812L19.5844 6.75H22.125C22.7484 6.75 23.25 6.24844 23.25 5.625V3.375C23.25 2.75156 22.7484 2.25 22.125 2.25H19.6266C19.3031 2.25 18.9844 2.35312 18.7266 2.55L17.925 3.15L16.7719 0.651563C16.5891 0.253125 16.1906 0 15.75 0H12.375ZM20.1469 13.3312L21.4781 16.2188C21.7406 16.7812 22.4062 17.0297 22.9688 16.7672C23.5312 16.5047 23.7797 15.8391 23.5172 15.2766L22.1813 12.3891C22.2844 12.3797 22.3875 12.375 22.4953 12.375C24.3609 12.375 25.8703 13.8844 25.8703 15.75C25.8703 17.6156 24.3609 19.125 22.4953 19.125C20.6297 19.125 19.1203 17.6156 19.1203 15.75C19.1203 14.8031 19.5094 13.9453 20.1422 13.3312H20.1469ZM6 19.125C4.13438 19.125 2.625 17.6156 2.625 15.75C2.625 13.8844 4.13438 12.375 6 12.375C7.46719 12.375 8.71875 13.3125 9.18281 14.625H6C5.37656 14.625 4.875 15.1266 4.875 15.75C4.875 16.3734 5.37656 16.875 6 16.875H9.18281C8.71875 18.1875 7.46719 19.125 6 19.125Z" fill="black"/>
</svg>`;

export default function Pagamento({ navigation }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsAvailable, setPointsAvailable] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [loyaltyRates, setLoyaltyRates] = useState({
        gain_rate: 0.1, // valor padrão: 1 ponto vale 0.1 reais (10 centavos)
        redemption_rate: 0.01, // valor padrão: 1 ponto vale 0.01 reais (100 pontos = 1 real)
    });
    const [showEnderecosBottomSheet, setShowEnderecosBottomSheet] = useState(false);
    const [showEditarEndereco, setShowEditarEndereco] = useState(false);
    const [enderecoParaEditar, setEnderecoParaEditar] = useState(null);
    const [showTrocoBottomSheet, setShowTrocoBottomSheet] = useState(false);
    const [trocoValue, setTrocoValue] = useState('');
    const [showReviewBottomSheet, setShowReviewBottomSheet] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [redemptionRate, setRedemptionRate] = useState(0.01); // Taxa padrão até carregar das settings
    const trocoValueRef = useRef('');
    const { basketItems, clearBasket, loadCart } = useBasket();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Buscar configurações públicas (taxa de entrega e taxas de conversão)
                try {
                    const publicSettings = await getPublicSettings();
                    const fee = parseFloat(publicSettings?.delivery_fee || 0);
                    setDeliveryFee(fee);
                    
                    // Salva ambas as taxas de pontos (ganho e resgate)
                    if (publicSettings?.loyalty_rates) {
                        setLoyaltyRates({
                            gain_rate: parseFloat(publicSettings.loyalty_rates.gain_rate || 0.1),
                            redemption_rate: parseFloat(publicSettings.loyalty_rates.redemption_rate || 0.01),
                        });
                        setRedemptionRate(parseFloat(publicSettings.loyalty_rates.redemption_rate || 0.01));
                    } else {
                        // Fallback para valores padrão
                        setRedemptionRate(0.01);
                    }
                } catch (error) {
                    console.log('Erro ao buscar configurações públicas:', error);
                    setDeliveryFee(0);
                    setRedemptionRate(0.01); // Fallback
                }

                const ok = await isAuthenticated();
                setLoggedIn(!!ok);
                if (ok) {
                    const user = await getStoredUserData();
                    let points = '0';
                    
                    if (user && user.role === 'customer' && user.id) {
                        setLoadingPoints(true);
                        try {
                            const loyaltyData = await getLoyaltyBalance(user.id);
                            points = loyaltyData?.current_balance?.toString() || 
                                    loyaltyData?.balance?.toString() || 
                                    loyaltyData?.points?.toString() || 
                                    loyaltyData?.total_points?.toString() || 
                                    loyaltyData?.loyalty_points?.toString() || 
                                    '0';
                            setPointsAvailable(parseInt(points));
                        } catch (error) {
                            console.log('Erro ao buscar pontos:', error);
                            points = user.points || '0';
                            setPointsAvailable(parseInt(user.points || '0'));
                        } finally {
                            setLoadingPoints(false);
                        }
                    } else {
                        points = user?.points || '0';
                        setPointsAvailable(parseInt(user?.points || '0'));
                    }
                    
                    const normalized = user ? {
                        name: user.full_name || user.name || 'Usuário',
                        points: points,
                        address: user.address || undefined,
                        avatar: undefined,
                    } : null;
                    setUserInfo(normalized);

                    // Buscar endereços do cliente
                    if (user?.id && user.role === 'customer') {
                        try {
                            const enderecosData = await getCustomerAddresses(user.id);
                            setEnderecos(enderecosData || []);
                            // Selecionar endereço padrão
                            const enderecoPadrao = enderecosData?.find(e => e.is_default || e.isDefault);
                            setEnderecoSelecionado(enderecoPadrao || null);
                        } catch (error) {
                            console.log('Erro ao buscar endereços:', error);
                        }
                    }
                } else {
                    setUserInfo(null);
                }
            } catch (e) {
                console.log('Erro ao verificar autenticação:', e);
                setLoggedIn(false);
                setUserInfo(null);
            }
        };
        checkAuth();
    }, []);

    const calculateTotal = () => {
        return basketItems.reduce((total, item) => total + (item.total || (item.price * item.quantity)), 0);
    };

    // Versão síncrona para cálculos na UI (usa estado já carregado)
    const calculateDiscountPoints = () => {
        if (!usePoints) return 0;
        // Calcula desconto baseado nos pontos disponíveis e taxa de resgate
        // redemptionRate = valor de 1 ponto em reais (ex: 0.01 = R$ 0,01 por ponto)
        // Se tem 100 pontos e taxa é 0.01, desconto = 100 * 0.01 = R$ 1,00
        // Usa redemptionRate que é mais atualizado
        return pointsAvailable * redemptionRate;
    };

    const calculateFinalTotal = () => {
        const subtotal = calculateTotal();
        const discount = calculateDiscountPoints();
        return subtotal + deliveryFee - discount;
    };

    const calculateEarnedPoints = () => {
        // gain_rate é quanto vale 1 ponto em reais (ex: 0.1 = 10 centavos por ponto)
        // Para calcular pontos ganhos: valor gasto / valor de cada ponto
        // Ex: R$ 10,00 / R$ 0,10 = 100 pontos
        if (loyaltyRates.gain_rate <= 0) return 0;
        return Math.floor(calculateFinalTotal() / loyaltyRates.gain_rate);
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleAddressPress = () => {
        setShowEnderecosBottomSheet(true);
    };

    const handleCloseEnderecosBottomSheet = () => {
        setShowEnderecosBottomSheet(false);
    };

    const handleSelectEndereco = async (endereco) => {
        try {
            const user = await getStoredUserData();
            if (user?.id && endereco?.id) {
                await setDefaultAddress(user.id, endereco.id);
            }
            // Atualizar lista de endereços para garantir sincronização com o Header
            const enderecosAtualizados = await getCustomerAddresses(user.id);
            setEnderecos(enderecosAtualizados);
            setEnderecoSelecionado(endereco);
            setShowEnderecosBottomSheet(false);
        } catch (error) {
            console.error('Erro ao definir endereço padrão:', error);
            setEnderecoSelecionado(endereco);
            setShowEnderecosBottomSheet(false);
        }
    };

    const handleAddNewEndereco = () => {
        setShowEnderecosBottomSheet(false);
        setEnderecoParaEditar(null);
        setShowEditarEndereco(true);
    };

    const handleEditEndereco = (endereco) => {
        setShowEnderecosBottomSheet(false);
        setEnderecoParaEditar(endereco);
        setShowEditarEndereco(true);
    };

    const handleSaveEndereco = async (formData) => {
        try {
            const user = await getStoredUserData();
            if (!user?.id) return;

            if (formData.id) {
                await updateCustomerAddress(user.id, formData.id, {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                });
            } else {
                await addCustomerAddress(user.id, {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                });
            }

            // Se é um novo endereço, define como padrão
            if (!formData.id) {
                setTimeout(async () => {
                    try {
                        const enderecosAtualizados = await getCustomerAddresses(user.id);
                        if (enderecosAtualizados && enderecosAtualizados.length > 0) {
                            const enderecosOrdenados = [...enderecosAtualizados].sort((a, b) => 
                                new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
                            );
                            const enderecoMaisRecente = enderecosOrdenados[0];
                            await setDefaultAddress(user.id, enderecoMaisRecente.id);
                            setEnderecoSelecionado(enderecoMaisRecente);
                            setEnderecos(enderecosAtualizados);
                        }
                    } catch (error) {
                        console.error('Erro ao definir endereço como padrão:', error);
                    }
                }, 500);
            } else {
                const enderecosAtualizados = await getCustomerAddresses(user.id);
                setEnderecos(enderecosAtualizados);
            }
            
            setShowEditarEndereco(false);
            setShowEnderecosBottomSheet(true);
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            alert("Erro ao salvar endereço. Tente novamente.");
        }
    };

    const handleDeleteEndereco = async (enderecoId) => {
        try {
            const user = await getStoredUserData();
            if (!user?.id) return;

            await removeCustomerAddress(user.id, enderecoId);
            const enderecosAtualizados = await getCustomerAddresses(user.id);
            setEnderecos(enderecosAtualizados);
            
            setShowEditarEndereco(false);
            setShowEnderecosBottomSheet(true);
        } catch (error) {
            console.error("Erro ao deletar endereço:", error);
            alert("Erro ao deletar endereço. Tente novamente.");
        }
    };

    const handlePaymentSelect = (payment) => {
        setSelectedPayment(payment);
        
        // Mostrar bottom sheet de troco quando dinheiro for selecionado
        if (payment === 'cash') {
            setShowTrocoBottomSheet(true);
        }
    };

    const handleTogglePoints = () => {
        setUsePoints(!usePoints);
    };

    const handleReviewOrder = async () => {
        if (!enderecoSelecionado) {
            alert('Selecione um endereço antes de continuar');
            return;
        }
        if (!selectedPayment) {
            alert('Selecione uma forma de pagamento');
            return;
        }
        // Validar se é pagamento em dinheiro e se o valor foi preenchido
        if (selectedPayment === 'cash' && (!trocoValue.trim() || !isTrocoValueValid())) {
            // Abrir o bottom sheet de troco novamente
            setShowTrocoBottomSheet(true);
            return;
        }
        // Validação do carrinho antes de revisar
        try {
            const validation = await validateCartForOrder();
            const isValid = validation?.success && (validation.is_valid !== false) && (!(validation.alerts) || validation.alerts.length === 0);
            if (!isValid) {
                const alertsText = Array.isArray(validation?.alerts) && validation.alerts.length > 0
                    ? validation.alerts.join('\\n')
                    : 'Seu carrinho possui itens indisponíveis ou com estoque insuficiente.';
                alert(alertsText);
                return;
            }
        } catch (e) {
            // Em falha de validação, não bloquear, mas informar o usuário
            alert('Não foi possível validar o carrinho no momento. Tente novamente.');
            return;
        }
        // Abrir bottom sheet de revisão
        setShowReviewBottomSheet(true);
    };

    const getPaymentMethodName = () => {
        if (selectedPayment === 'pix') return 'Pix';
        if (selectedPayment === 'credit') return 'Cartão de crédito';
        if (selectedPayment === 'cash') return 'Dinheiro';
        return '';
    };

    const getPaymentSubtitle = () => {
        if (selectedPayment === 'cash' && trocoValue.trim()) {
            return `Troco para R$${formatCurrency(trocoValue)}`;
        }
        return '';
    };

    // Formatador de moeda: converte número para formato R$ 0,00
    const formatCurrency = (value) => {
        // Remove tudo que não for número
        const numbers = value.replace(/\D/g, '');
        // Se está vazio, retorna vazio
        if (numbers.length === 0) return '';
        
        // Se tem apenas 1 dígito
        if (numbers.length === 1) {
            return `0,0${numbers}`;
        }
        
        // Se tem 2 dígitos
        if (numbers.length === 2) {
            return `0,${numbers}`;
        }
        
        // Se tem 3 ou mais dígitos, separa reais e centavos diretamente
        const cents = numbers.slice(-2);
        const reais = numbers.slice(0, -2);
        
        // Formata com vírgula (sem zeros à esquerda nos reais)
        return `${reais},${cents}`;
    };

    // Processa o input de moeda
    const handleTrocoValueChange = (text) => {
        // Extrai TODOS os números do texto
        const allNumbers = text.replace(/[^0-9]/g, '');
        
        // Se está vazio, limpa o estado
        if (allNumbers.length === 0) {
            setTrocoValue('');
            trocoValueRef.current = '';
            return;
        }
        
        // Converte para verificar se ultrapassa o máximo
        let valueInCents;
        if (allNumbers.length <= 2) {
            valueInCents = parseInt(allNumbers);
        } else {
            const cents = parseInt(allNumbers.slice(-2));
            const reais = parseInt(allNumbers.slice(0, -2));
            valueInCents = reais * 100 + cents;
        }
        
        // Se ultrapassar R$ 1.000,00, não permite
        if (valueInCents >= 100001) {
            return; // Não atualiza
        }
        
        // Remove zeros à esquerda desnecessários
        let cleanDigits = allNumbers;
        if (allNumbers.length > 2) {
            const cents = allNumbers.slice(-2);
            const reaisPart = allNumbers.slice(0, -2);
            const cleanReais = reaisPart.replace(/^0+/, '') || '';
            cleanDigits = cleanReais ? cleanReais + cents : cents;
        }
        
        // Limita a 6 dígitos (R$ 1.000,00 = 100000 centavos)
        const limited = cleanDigits.slice(0, 6);
        
        // Atualiza ref e estado
        trocoValueRef.current = formatCurrency(limited);
        setTrocoValue(limited);
    };

    // Verifica se o valor é válido (entre mínimo e máximo)
    const isTrocoValueValid = () => {
        const numbers = trocoValue.replace(/\D/g, '');
        if (numbers.length === 0) return false;
        
        // Converte para centavos
        let valueInCents;
        if (numbers.length <= 2) {
            // Tem apenas 1 ou 2 dígitos, são só centavos
            valueInCents = parseInt(numbers);
        } else {
            // Separa reais e centavos
            const cents = parseInt(numbers.slice(-2));
            const reais = parseInt(numbers.slice(0, -2));
            valueInCents = reais * 100 + cents;
        }
        
        const totalInCents = Math.round(calculateFinalTotal() * 100);
        const maxCents = 100001; // R$ 1.000,01 (aceita até R$ 1.000,00)
        
        return valueInCents >= totalInCents && valueInCents < maxCents;
    };

    const formatEndereco = (endereco) => {
        if (!endereco) return "Adicionar endereço";
        
        const parts = [];
        if (endereco.street) {
            parts.push(endereco.street);
        }
        if (endereco.number) {
            parts.push(endereco.number);
        }
        
        const enderecoStr = parts.length > 0 ? parts.join(', ') : "Adicionar endereço";
        
        // Adicionar bairro e complemento na linha de baixo
        const details = [];
        if (endereco.neighborhood) details.push(endereco.neighborhood);
        if (endereco.complement) details.push(endereco.complement);
        
        return enderecoStr + (details.length > 0 ? `\n${details.join(' - ')}` : '');
    };

    // Mapeia métodos de pagamento do mobile para a API
    const mapPaymentMethodToAPI = (mobileMethod) => {
        const mapping = {
            'pix': 'pix',
            'credit': 'credit_card',
            'cash': 'money'
        };
        return mapping[mobileMethod] || mobileMethod;
    };

    // Converte valor do troco de string formatada para número
    const convertTrocoValueToNumber = () => {
        if (!trocoValue.trim()) return null;
        const numbers = trocoValue.replace(/\D/g, '');
        if (numbers.length === 0) return null;
        
        if (numbers.length <= 2) {
            return parseInt(numbers) / 100; // Centavos
        } else {
            const cents = parseInt(numbers.slice(-2));
            const reais = parseInt(numbers.slice(0, -2));
            return reais + (cents / 100);
        }
    };

    // Calcula pontos a resgatar baseado no desconto (usa estado já carregado)
    const calculatePointsToRedeem = () => {
        if (!usePoints) return 0;
        
        const discount = calculateDiscountPoints();
        // Calcula quantos pontos são necessários para o desconto
        // redemptionRate = valor de 1 ponto em reais (ex: 0.01 = R$ 0,01 por ponto)
        // Para R$ 1,00 de desconto com taxa 0.01, precisa de 100 pontos
        // Mas como já calculamos o desconto baseado nos pontos disponíveis,
        // vamos usar os pontos disponíveis diretamente (limitado pelo desconto máximo)
        const maxDiscount = calculateTotal() + deliveryFee; // Não pode descontar mais que o total
        const actualDiscount = Math.min(discount, maxDiscount);
        
        // Retorna pontos proporcional ao desconto aplicado
        if (redemptionRate > 0) {
            return Math.floor(actualDiscount / redemptionRate);
        }
        return 0;
    };

    const handleConfirmOrder = async () => {
        if (!enderecoSelecionado) {
            alert('Selecione um endereço antes de continuar');
            return;
        }
        if (!selectedPayment) {
            alert('Selecione uma forma de pagamento');
            return;
        }
        if (selectedPayment === 'cash' && (!trocoValue.trim() || !isTrocoValueValid())) {
            alert('Por favor, informe o valor para troco');
            setShowTrocoBottomSheet(true);
            return;
        }
        if (!basketItems || basketItems.length === 0) {
            alert('Seu carrinho está vazio');
            return;
        }

        // Validação final do carrinho antes de criar o pedido
        try {
            const validation = await validateCartForOrder();
            const isValid = validation?.success && (validation.is_valid !== false) && (!(validation.alerts) || validation.alerts.length === 0);
            if (!isValid) {
                const alertsText = Array.isArray(validation?.alerts) && validation.alerts.length > 0
                    ? validation.alerts.join('\n')
                    : 'Seu carrinho possui itens indisponíveis ou com estoque insuficiente.';
                Alert.alert(
                    'Carrinho Inválido',
                    alertsText,
                    [{ text: 'OK', onPress: () => {
                        // Recarrega carrinho e volta para cesta
                        loadCart();
                        navigation.navigate('Cesta');
                    }}]
                );
                return;
            }
        } catch (e) {
            Alert.alert(
                'Erro de Validação',
                'Não foi possível validar o carrinho no momento. Tente novamente.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setIsCreatingOrder(true);
            
            // Calcula pontos a resgatar (usa estado já carregado)
            const pointsToRedeem = calculatePointsToRedeem();
            
            // Converte itens do carrinho local para o formato da API
            const orderItems = basketItems.map(item => {
                const apiItem = {
                    product_id: item.originalProductId || item.productId,
                    quantity: item.quantity,
                    extras: [],
                    base_modifications: [],
                };
                
                // Adiciona observações se houver
                if (item.observacoes) {
                    apiItem.notes = item.observacoes;
                }
                
                // Converte extras (selectedExtras)
                // selectedExtras é um objeto {ingredientId: quantity}
                if (item.selectedExtras && typeof item.selectedExtras === 'object') {
                    Object.keys(item.selectedExtras).forEach(ingredientId => {
                        const quantity = item.selectedExtras[ingredientId];
                        if (quantity > 0) {
                            apiItem.extras.push({
                                ingredient_id: parseInt(ingredientId),
                                quantity: quantity
                            });
                        }
                    });
                }
                
                // Converte modificações da base (defaultIngredientsQuantities)
                // defaultIngredientsQuantities é um objeto {ingredientId: {min, max, current}}
                // onde current é a quantidade modificada (delta)
                if (item.defaultIngredientsQuantities && typeof item.defaultIngredientsQuantities === 'object') {
                    Object.keys(item.defaultIngredientsQuantities).forEach(ingredientId => {
                        const mod = item.defaultIngredientsQuantities[ingredientId];
                        // Se é um objeto com current, usa o delta
                        if (mod && typeof mod === 'object' && mod.current !== undefined) {
                            const delta = mod.current - (mod.default || 0);
                            if (delta !== 0) {
                                apiItem.base_modifications.push({
                                    ingredient_id: parseInt(ingredientId),
                                    delta: delta
                                });
                            }
                        }
                    });
                }
                
                return apiItem;
            });
            
            // Prepara dados do pedido
            const orderData = {
                use_cart: false, // Não usa carrinho da API, envia items diretamente
                items: orderItems,
                address_id: enderecoSelecionado.id,
                payment_method: mapPaymentMethodToAPI(selectedPayment),
                order_type: 'delivery', // Por padrão é delivery, pode ser configurável depois
                points_to_redeem: pointsToRedeem,
                notes: '', // Pode adicionar campo de observações depois
            };

            // Se for pagamento em dinheiro, adiciona amount_paid
            if (selectedPayment === 'cash') {
                const amountPaid = convertTrocoValueToNumber();
                if (amountPaid) {
                    orderData.amount_paid = amountPaid;
                }
            }

            console.log('Criando pedido com dados:', orderData);

            // Cria o pedido
            const newOrder = await createOrder(orderData);
            
            console.log('Pedido criado com sucesso:', newOrder);

            // Limpa o carrinho
            clearBasket();

            // Fecha o bottom sheet
            setShowReviewBottomSheet(false);

            // Navega para a tela de pedidos
            navigation.navigate('Pedidos', { 
                orderId: newOrder.id || newOrder.order_id,
                showSuccess: true 
            });

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            
            let errorMessage = 'Erro ao criar pedido. Tente novamente.';
            
            if (error.response) {
                const errorData = error.response.data;
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                
                // Tratamento de erros específicos
                if (error.response.status === 409) {
                    // Loja fechada ou conflito
                    errorMessage = errorData.error || 'A loja está fechada no momento';
                } else if (error.response.status === 422) {
                    // Erro de estoque
                    errorMessage = errorData.error || 'Algum produto está sem estoque';
                } else if (error.response.status === 400) {
                    // Erro de validação
                    errorMessage = errorData.error || 'Dados do pedido inválidos';
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setIsCreatingOrder(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header 
                navigation={navigation} 
                type={loggedIn ? 'logged' : 'home'}
                userInfo={userInfo}
                loadingPoints={loadingPoints}
                enderecos={enderecos}
                onEnderecoAtivoChange={(data) => {
                    // Quando o Header atualiza o endereço, sincronizar com a tela
                    if (data && typeof data !== 'object') {
                        // É um endereço direto
                        setEnderecoSelecionado(data);
                    } else if (data && data.type === 'refresh') {
                        // Atualizar lista de endereços
                        setEnderecos(data.enderecos);
                    }
                }}
            />
            
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Barra de navegação */}
                <View style={styles.navigationBar}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={handleBack}
                        activeOpacity={0.7}
                    >
                        <SvgXml
                            xml={backArrowSvg}
                            width={30}
                            height={30}
                        />
                    </TouchableOpacity>
                    
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Pagamento</Text>
                    </View>
                </View>

                {/* Seção de Endereços */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Endereços</Text>
                        <Text style={styles.deliveryTime}>40 - 50 min</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.addressCard}
                        onPress={handleAddressPress}
                        activeOpacity={0.7}
                    >
                        <SvgXml
                            xml={localizationSvg}
                            width={16}
                            height={16}
                        />
                        <View style={styles.addressInfo}>
                            <Text style={styles.addressText}>
                                {formatEndereco(enderecoSelecionado)}
                            </Text>
                        </View>
                        <SvgXml
                            xml={chevronDownSvg}
                            width={20}
                            height={20}
                        />
                    </TouchableOpacity>
                </View>

                {/* Seção de Formas de Pagamento */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Formas de pagamento</Text>
                    <Text style={styles.paymentSubtitle}>O pagamento é feito na entrega</Text>
                    
                    <View style={styles.paymentCards}>
                        <TouchableOpacity 
                            style={[styles.paymentCard, selectedPayment === 'pix' && styles.paymentCardSelected]}
                            onPress={() => handlePaymentSelect('pix')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.paymentCardTitle, selectedPayment === 'pix' && styles.paymentCardTitleSelected]}>
                                Pix
                            </Text>
                            <View style={styles.paymentCardSpacer} />
                            <View style={styles.paymentCardIcon}>
                                <SvgXml xml={getPixSvg(selectedPayment === 'pix')} width={32} height={32} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.paymentCard, selectedPayment === 'credit' && styles.paymentCardSelected]}
                            onPress={() => handlePaymentSelect('credit')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.paymentCardTitle}>Cartão de crédito</Text>
                            <View style={styles.paymentCardSpacer} />
                            <View style={styles.paymentCardIcon}>
                                <SvgXml xml={getCreditCardSvg(selectedPayment === 'credit')} width={32} height={24} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.paymentCard, styles.paymentCardLast, selectedPayment === 'cash' && styles.paymentCardSelected]}
                            onPress={() => handlePaymentSelect('cash')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.paymentCardTitle}>Dinheiro</Text>
                            <View style={styles.paymentCardSpacer} />
                            <View style={styles.paymentCardIcon}>
                                <SvgXml xml={getCashSvg(selectedPayment === 'cash')} width={36} height={28} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Resumo de Valores */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo de valores</Text>
                    
                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoLabel}>Subtotal</Text>
                        <Text style={styles.resumoValue}>
                            R$ {calculateTotal().toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoLabel}>Taxa de entrega</Text>
                        <Text style={styles.resumoValue}>
                            R$ {deliveryFee.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoLabel}>Descontos</Text>
                        <Text style={styles.resumoValue}>
                            R$ {calculateDiscountPoints().toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    {/* Usar Pontos Royal */}
                    <View style={styles.pointsSection}>
                        <View style={styles.pointsHeader}>
                            <Text style={styles.pointsTitle}>Usar pontos Royal</Text>
                            <TouchableOpacity 
                                style={styles.infoButton}
                                onPress={() => navigation.navigate('ClubeRoyal')}
                                activeOpacity={0.7}
                            >
                                <SvgXml xml={infoSvg} width={16} height={16} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.pointsSubtitle}>
                            Você tem <Text style={styles.pointsHighlight}>{pointsAvailable}</Text> pontos Royal
                        </Text>
                        <View style={styles.pointsRow}>
                            <Text style={styles.pointsDiscount}>
                                -R$ {calculateDiscountPoints().toFixed(2).replace('.', ',')}
                            </Text>
                            <Toggle value={usePoints} onValueChange={handleTogglePoints} />
                        </View>
                    </View>

                    <View style={styles.resumoItem}>
                        <Text style={styles.resumoTotalLabel}>Total</Text>
                        <Text style={styles.resumoTotalValue}>
                            R$ {calculateFinalTotal().toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    <Text style={styles.pontosGanhosText}>
                        Nessa compra, você ganhará <Text style={styles.pontosDestaque}>
                            {calculateEarnedPoints()}
                        </Text> pontos Royal
                    </Text>
                </View>
                         </ScrollView>

             {/* Footer fixo */}
             {(basketItems && basketItems.length > 0) && (
                 <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerTotalLabel}>Total</Text>
                    <Text style={styles.footerTotalValue}>
                        R$ {calculateFinalTotal().toFixed(2).replace('.', ',')}
                    </Text>
                </View>
                                 <TouchableOpacity 
                     style={styles.revisarButton}
                     onPress={handleReviewOrder}
                     activeOpacity={0.8}
                 >
                     <Text style={styles.revisarButtonText}>Revisar pedido</Text>
                 </TouchableOpacity>
                 </View>
             )}

            {/* Bottom Sheet de Troco */}
            <BottomSheet 
                visible={showTrocoBottomSheet} 
                onClose={() => setShowTrocoBottomSheet(false)}
                heightPercentage={0.5}
            >
                <View style={styles.trocoBottomSheetContent}>
                    <Text style={styles.trocoTitle}>Vai precisar de troco?</Text>
                    <Text style={styles.trocoDescription}>
                        Digite o valor em dinheiro que será usado para pagar o pedido, para que assim, caso seja necessário troco, o entregador levar.
                    </Text>
                    <Text style={styles.trocoInputLabel}>Valor mínimo: R$ {calculateFinalTotal().toFixed(2).replace('.', ',')}</Text>
                    <TextInput
                        style={[styles.trocoInput, !isTrocoValueValid() && trocoValue.length > 0 && styles.trocoInputError]}
                        placeholder="0,00"
                        value={trocoValue.length > 0 ? formatCurrency(trocoValue) : ''}
                        onChangeText={handleTrocoValueChange}
                        keyboardType="numeric"
                    />
                    {!isTrocoValueValid() && trocoValue.length > 0 && (
                        <Text style={styles.trocoErrorText}>
                            O valor deve ser maior ou igual a R$ {calculateFinalTotal().toFixed(2).replace('.', ',')}
                        </Text>
                    )}
                    <TouchableOpacity 
                        style={[styles.trocoConfirmButton, (!trocoValue.trim() || !isTrocoValueValid()) && styles.trocoConfirmButtonDisabled]}
                        onPress={() => {
                            if (!trocoValue.trim()) {
                                alert('Por favor, preencha o valor');
                                return;
                            }
                            if (!isTrocoValueValid()) {
                                alert(`O valor deve ser maior ou igual a R$ ${calculateFinalTotal().toFixed(2).replace('.', ',')}`);
                                return;
                            }
                            setShowTrocoBottomSheet(false);
                        }}
                        activeOpacity={0.8}
                        disabled={!trocoValue.trim() || !isTrocoValueValid()}
                    >
                        <Text style={[styles.trocoConfirmButtonText, (!trocoValue.trim() || !isTrocoValueValid()) && styles.trocoConfirmButtonTextDisabled]}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* Bottom Sheets de Endereços */}
            <EnderecosBottomSheet
                visible={showEnderecosBottomSheet}
                onClose={handleCloseEnderecosBottomSheet}
                enderecos={enderecos}
                onAddNew={handleAddNewEndereco}
                onEdit={handleEditEndereco}
                onSelect={handleSelectEndereco}
                enderecoAtivo={enderecoSelecionado}
            />

            <EditarEnderecoBottomSheet
                visible={showEditarEndereco}
                onClose={() => {
                    setShowEditarEndereco(false);
                    setShowEnderecosBottomSheet(true);
                }}
                endereco={enderecoParaEditar}
                onSave={handleSaveEndereco}
                onDelete={handleDeleteEndereco}
                enderecos={enderecos}
            />

            {/* Bottom Sheet de Revisão do Pedido */}
            <BottomSheet 
                visible={showReviewBottomSheet} 
                onClose={() => setShowReviewBottomSheet(false)}
                heightPercentage={0.7}
            >
                <View style={styles.reviewBottomSheetContent}>
                    <Text style={styles.reviewTitle}>Revise o seu pedido</Text>
                    
                    {/* Entrega */}
                    <View style={styles.reviewInfoCard}>
                        <View style={styles.reviewIcon}>
                            <SvgXml xml={motoSvg} width={29} height={22} />
                        </View>
                        <View style={styles.reviewInfo}>
                            <Text style={styles.reviewInfoTitle}>Entrega hoje</Text>
                            <Text style={styles.reviewInfoSubtitle}>Hoje, 40 - 50 min</Text>
                        </View>
                    </View>

                    {/* Endereço */}
                    <View style={styles.reviewInfoCard}>
                        <View style={styles.reviewIcon}>
                            <SvgXml xml={localizationSvg} width={16} height={24} />
                        </View>
                        <View style={styles.reviewInfo}>
                            <Text style={styles.reviewInfoTitle}>{formatEndereco(enderecoSelecionado)}</Text>
                            <Text style={styles.reviewInfoSubtitle}>
                                {enderecoSelecionado?.neighborhood || ''} {enderecoSelecionado?.complement ? `- ${enderecoSelecionado.complement}` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Pagamento */}
                    <View style={styles.reviewInfoCard}>
                        <View style={styles.reviewIcon}>
                            <SvgXml xml={
                                selectedPayment === 'pix' ? getPixSvg(false) :
                                selectedPayment === 'credit' ? getCreditCardSvg(false) :
                                getCashSvg(false)
                            } width={24} height={24} />
                        </View>
                        <View style={styles.reviewInfo}>
                            <Text style={styles.reviewInfoTitle}>Pagamento na entrega</Text>
                            <Text style={styles.reviewInfoSubtitle}>
                                {getPaymentMethodName()}{getPaymentSubtitle() ? ` - ${getPaymentSubtitle()}` : ''}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.confirmOrderButton, isCreatingOrder && styles.confirmOrderButtonDisabled]}
                        onPress={handleConfirmOrder}
                        activeOpacity={0.8}
                        disabled={isCreatingOrder}
                    >
                        <Text style={[styles.confirmOrderButtonText, isCreatingOrder && styles.confirmOrderButtonTextDisabled]}>
                            {isCreatingOrder ? 'Criando pedido...' : 'Confirmar pedido'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.changeOrderButton}
                        onPress={() => setShowReviewBottomSheet(false)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.changeOrderButtonText}>Alterar pedido</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    navigationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 20,
        backgroundColor: '#F6F6F6',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 0,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    deliveryTime: {
        fontSize: 14,
        color: '#888888',
    },
    paymentSubtitle: {
        fontSize: 14,
        color: '#888888',
        textDecorationLine: 'underline',
        marginBottom: 16,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    addressInfo: {
        flex: 1,
        marginLeft: 12,
    },
    addressText: {
        fontSize: 16,
        color: '#000000',
        marginRight: 8,
    },
    paymentCards: {
        marginTop: 12,
        flexDirection: 'row',
        flexShrink: 1,
    },
    paymentCard: {
        flex: 1,
        minHeight: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    paymentCardTitle: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '500',
    },
    paymentCardTitleSelected: {
        fontWeight: 'bold',
    },
    paymentCardSpacer: {
        flex: 1,
    },
    paymentCardIcon: {
        alignSelf: 'flex-end',
    },
    paymentCardSelected: {
        borderWidth: 2,
        borderColor: '#FFC700',
        backgroundColor: '#FFFBF0',
    },
    paymentCardLast: {
        marginRight: 0,
    },
    resumoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    resumoLabel: {
        fontSize: 16,
        color: '#666666',
    },
    resumoValue: {
        fontSize: 16,
        color: '#666666',
    },
    resumoTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    resumoTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    pontosGanhosText: {
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
    },
    pontosDestaque: {
        color: '#FFC700',
        fontWeight: 'bold',
    },
    pointsSection: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 16,
    },
    pointsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pointsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        marginRight: 8,
    },
    infoButton: {
        width: 20,
        height: 20,
    },
    pointsSubtitle: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
    },
    pointsHighlight: {
        color: '#FFC700',
        fontWeight: 'bold',
    },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pointsDiscount: {
        fontSize: 16,
        color: '#666666',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
        zIndex: 1000,
    },
    footerLeft: {
        flex: 1,
    },
    footerTotalLabel: {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    footerTotalValue: {
        fontSize: 20,
        color: '#000000',
        fontWeight: 'bold',
    },
    revisarButton: {
        backgroundColor: '#FFC700',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 16,
    },
    revisarButtonText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'bold',
    },
    trocoBottomSheetContent: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    trocoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 16,
    },
    trocoDescription: {
        fontSize: 14,
        color: '#525252',
        marginBottom: 24,
        lineHeight: 20,
    },
    trocoInputLabel: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '600',
        marginBottom: 8,
    },
    trocoInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000000',
        marginBottom: 8,
    },
    trocoInputError: {
        borderWidth: 1,
        borderColor: '#FF0000',
    },
    trocoErrorText: {
        fontSize: 12,
        color: '#FF0000',
        marginBottom: 24,
    },
    trocoConfirmButton: {
        backgroundColor: '#FFC700',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    trocoConfirmButtonText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'bold',
    },
    trocoConfirmButtonDisabled: {
        backgroundColor: '#D9D9D9',
    },
    trocoConfirmButtonTextDisabled: {
        color: '#888888',
    },
    reviewBottomSheetContent: {
        flex: 1,
        paddingTop: 20,
    },
    reviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 24,
    },
    reviewInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    reviewIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    reviewInfo: {
        flex: 1,
    },
    reviewInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    reviewInfoSubtitle: {
        fontSize: 14,
        color: '#888888',
    },
    confirmOrderButton: {
        backgroundColor: '#FFC700',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
         confirmOrderButtonText: {
         fontSize: 16,
         color: '#000000',
         fontWeight: 'bold',
     },
     confirmOrderButtonDisabled: {
         backgroundColor: '#D9D9D9',
     },
     confirmOrderButtonTextDisabled: {
         color: '#888888',
     },
     changeOrderButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    changeOrderButtonText: {
        fontSize: 16,
        color: '#3D1807',
        fontWeight: 'bold',
        textDecorationLine: 'underline',    
    },
});

