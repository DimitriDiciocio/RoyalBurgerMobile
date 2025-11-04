import {StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ButtonDark from "./Button";
import React, { useState, useEffect } from "react";
import { SvgXml } from 'react-native-svg';
import {FontAwesome} from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import EnderecosBottomSheet from './EnderecosBottomSheet';
import EditarEnderecoBottomSheet from './EditarEnderecoBottomSheet';
import { setDefaultAddress, getCustomerAddresses, addCustomerAddress, updateCustomerAddress, removeCustomerAddress } from '../services/customerService';
import { useUserCache } from '../hooks/useUserCache';

const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#888888"/>
</svg>`;

const downArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g transform="rotate(270 10 10)">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="#888888"/>
</g>
</svg>`;

const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#FFC700"/>
</svg>`;

export default function Header({
                                   navigation,
                                   type = 'home',
                                   userInfo: userInfoProp = null,
                                   onBackPress = null,
                                   showBackButton = false,
                                   title = null,
                                   subtitle = null,
                                   rightButton = null,
                                    enderecos = [],
                                    onEnderecoAtivoChange = null,
                                    loadingPoints: loadingPointsProp = false
                                }) {
    // Usa hook para cache, mas permite override via props
    const { 
      userInfo: cachedUserInfo, 
      loadingPoints: cachedLoadingPoints,
      loyaltyPoints: cachedLoyaltyPoints,
      userData,
      defaultAddress: cachedDefaultAddress,
      addresses: cachedAddresses,
      loading: cacheLoading,
      isHeaderReady,
      refreshAddresses,
      updateDefaultAddress
    } = useUserCache();
    
    // Prioriza props, depois cache
    const userInfo = userInfoProp || cachedUserInfo;
    const loadingPoints = loadingPointsProp !== false ? loadingPointsProp : cachedLoadingPoints;
    
    // Mostra o valor do localStorage primeiro, sem loading
    // Só mostra loading se não tiver nada no localStorage E estiver carregando
    const hasCachedPoints = cachedLoyaltyPoints !== null && cachedLoyaltyPoints !== undefined;
    const hasValidPoints = userInfo?.points !== null && userInfo?.points !== undefined && userInfo?.points !== '';
    
    // Só mostra loading se não tiver cache E estiver carregando
    const shouldShowLoading = !hasCachedPoints && loadingPoints;
    
    // Prioriza: userInfo.points (da API, se diferente) > cachedLoyaltyPoints (do localStorage) > 0
    // Se tem cache, mostra imediatamente sem loading
    // Se userInfo.points existe e é diferente do cache, usa o da API
    const pointsFromAPI = hasValidPoints && userInfo?.points !== cachedLoyaltyPoints?.toString();
    const pointsValue = pointsFromAPI
      ? userInfo?.points 
      : (hasCachedPoints ? cachedLoyaltyPoints.toString() : '0');
    
    // Usa endereços do cache se não vierem via props
    const addressesToUse = enderecos.length > 0 ? enderecos : cachedAddresses;
    const defaultAddressToUse = enderecos.length > 0 
      ? enderecos.find(e => e.is_default || e.isDefault) || enderecos[0]
      : cachedDefaultAddress;
    
    const [showEnderecosBottomSheet, setShowEnderecosBottomSheet] = useState(false);
    const [showEditarEndereco, setShowEditarEndereco] = useState(false);
    const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
    const [enderecoAtivo, setEnderecoAtivo] = useState(null);

    // Função para formatar o endereço para exibição
    const formatEndereco = (endereco) => {
        if (!endereco) return "Adicionar endereço";
        
        const parts = [];
        if (endereco.street) {
            parts.push(endereco.street);
        }
        if (endereco.number) {
            parts.push(endereco.number);
        }
        
        return parts.length > 0 ? parts.join(', ') : "Adicionar endereço";
    };

    // Define o endereço ativo quando os endereços mudarem
    useEffect(() => {
        const enderecosToProcess = addressesToUse.length > 0 ? addressesToUse : enderecos;
        
        if (enderecosToProcess && enderecosToProcess.length > 0) {
            // Primeiro, procura por um endereço marcado como padrão
            const enderecoPadrao = enderecosToProcess.find(e => e.is_default === true || e.isDefault === true);
            
            if (enderecoPadrao) {
                // Se encontrou um endereço padrão, usa ele
                if (enderecoAtivo?.id !== enderecoPadrao.id) {
                    setEnderecoAtivo(enderecoPadrao);
                    updateDefaultAddress(enderecoPadrao);
                    if (onEnderecoAtivoChange) {
                        onEnderecoAtivoChange(enderecoPadrao);
                    }
                }
            } else if (defaultAddressToUse && enderecoAtivo?.id !== defaultAddressToUse.id) {
                // Usa endereço padrão do cache
                setEnderecoAtivo(defaultAddressToUse);
                if (onEnderecoAtivoChange) {
                    onEnderecoAtivoChange(defaultAddressToUse);
                }
            } else if (!enderecoAtivo) {
                // Se não há endereço padrão e não há endereço ativo definido, usa o mais recente
                const enderecosOrdenados = [...enderecosToProcess].sort((a, b) => 
                    new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
                );
                const enderecoMaisRecente = enderecosOrdenados[0];
                setEnderecoAtivo(enderecoMaisRecente);
                
                if (onEnderecoAtivoChange) {
                    onEnderecoAtivoChange(enderecoMaisRecente);
                }
            }
        } else if (enderecosToProcess.length === 0) {
            setEnderecoAtivo(null);
            if (onEnderecoAtivoChange) {
                onEnderecoAtivoChange(null);
            }
        }
    }, [addressesToUse, enderecos, defaultAddressToUse, enderecoAtivo, onEnderecoAtivoChange, updateDefaultAddress]);
    const handlePress = () => {
        if (navigation) {
            navigation.navigate('Login');
        }
    };

    const handleSelectEndereco = async (endereco) => {
        try {
            // Chama a API para definir o endereço como padrão
            if (userData?.id && endereco?.id) {
                await setDefaultAddress(userData.id, endereco.id);
            }
            
            // Atualiza o estado local e cache
            setEnderecoAtivo(endereco);
            await updateDefaultAddress(endereco);
            
            if (onEnderecoAtivoChange) {
                onEnderecoAtivoChange(endereco);
            }
            
            // Atualiza endereços no cache
            await refreshAddresses();
        } catch (error) {
            console.error('Erro ao definir endereço padrão:', error);
            // Mesmo com erro, atualiza o estado local para melhor UX
            setEnderecoAtivo(endereco);
            await updateDefaultAddress(endereco);
            if (onEnderecoAtivoChange) {
                onEnderecoAtivoChange(endereco);
            }
        }
    };

    const handleSaveEndereco = async (formData) => {
        try {
            if (!userData?.id) return;

            if (formData.id) {
                // Editar endereço existente
                await updateCustomerAddress(userData.id, formData.id, {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                });
            } else {
                // Adicionar novo endereço
                await addCustomerAddress(userData.id, {
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                });
            }

            // Atualiza endereços no cache após salvar
            await refreshAddresses();
            
            // Se é um novo endereço, define como padrão via API
            if (!formData.id) {
                // Aguarda um pouco para garantir que o endereço foi adicionado
                setTimeout(async () => {
                    try {
                        const enderecosAtualizados = await getCustomerAddresses(userData.id);
                        if (enderecosAtualizados && enderecosAtualizados.length > 0) {
                            // Pega o endereço mais recente (primeiro da lista ordenada)
                            const enderecosOrdenados = [...enderecosAtualizados].sort((a, b) => 
                                new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
                            );
                            const enderecoMaisRecente = enderecosOrdenados[0];
                            
                            // Define como padrão via API
                            await setDefaultAddress(userData.id, enderecoMaisRecente.id);
                            
                            // Atualiza o estado local e cache
                            setEnderecoAtivo(enderecoMaisRecente);
                            await updateDefaultAddress(enderecoMaisRecente);
                            
                            // Salva endereços atualizados no cache
                            await AsyncStorage.setItem('user_addresses', JSON.stringify(enderecosAtualizados));
                            
                            // Notifica o componente pai com o novo endereço ativo
                            if (onEnderecoAtivoChange) {
                                onEnderecoAtivoChange({ 
                                    type: 'refresh', 
                                    enderecos: enderecosAtualizados,
                                    enderecoAtivo: enderecoMaisRecente
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao definir endereço como padrão:', error);
                    }
                }, 500);
            } else {
                // Para edição, apenas atualiza a lista
                const enderecosAtualizados = await getCustomerAddresses(userData.id);
                // Salva no cache
                await AsyncStorage.setItem('user_addresses', JSON.stringify(enderecosAtualizados));
                await refreshAddresses();
                
                if (onEnderecoAtivoChange) {
                    onEnderecoAtivoChange({ type: 'refresh', enderecos: enderecosAtualizados });
                }
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
            if (!userData?.id) return;

            await removeCustomerAddress(userData.id, enderecoId);

            // Atualizar lista de endereços e cache
            const enderecosAtualizados = await getCustomerAddresses(userData.id);
            await AsyncStorage.setItem('user_addresses', JSON.stringify(enderecosAtualizados));
            await refreshAddresses();
            
            // Se o endereço deletado era o ativo, seleciona outro
            if (enderecoAtivo?.id === enderecoId && enderecosAtualizados.length > 0) {
                const novoEndereco = enderecosAtualizados.find(e => e.is_default || e.isDefault) || enderecosAtualizados[0];
                setEnderecoAtivo(novoEndereco);
                await updateDefaultAddress(novoEndereco);
            }
            
            if (onEnderecoAtivoChange) {
                onEnderecoAtivoChange({ type: 'refresh', enderecos: enderecosAtualizados });
            }
            
            setShowEditarEndereco(false);
            setShowEnderecosBottomSheet(true);
        } catch (error) {
            console.error("Erro ao deletar endereço:", error);
            alert("Erro ao deletar endereço. Tente novamente.");
        }
    };

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else if (navigation) {
            // Se estiver na tela de login, vai para Home
            if (type === 'login') {
                navigation.navigate('Home');
            } else {
                navigation.goBack();
            }
        }
    };

    const handleAddressPress = () => {
        setShowEnderecosBottomSheet(true);
    };

    const handleCloseEnderecosBottomSheet = () => {
        setShowEnderecosBottomSheet(false);
    };

    const handleAddNewEndereco = () => {
        setShowEnderecosBottomSheet(false);
        setEnderecoSelecionado(null);
        setShowEditarEndereco(true);
    };

    const handleEditEndereco = (endereco) => {
        setShowEnderecosBottomSheet(false);
        setEnderecoSelecionado(endereco);
        setShowEditarEndereco(true);
    };

    // Renderizar conteúdo baseado no tipo
    const renderContent = () => {
        switch (type) {
            case 'login':
                return (
                    <View style={styles.loginContainer}>
                        {showBackButton && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackPress}
                            >
                                <SvgXml
                                    xml={backArrowSvg}
                                    width={30}
                                    height={30}
                                />
                            </TouchableOpacity>
                        )}

                        <View style={styles.imagemContainer}>
                            <Image
                                source={require('../assets/img/logoIcon.png')}
                                style={styles.imagem}
                            />
                        </View>
                    </View>
                );
            case 'logged':
                return (
                    <View style={styles.loggedContainer}>
                        <View style={styles.userInfo}>
                            <View style={styles.userTexts}>
                                <Text style={styles.userName}>
                                    {"Olá, " + (userInfo?.name || "Usuário")}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.userAddressRow}
                                    onPress={handleAddressPress}
                                    activeOpacity={0.7}
                                >
                                    <SvgXml
                                        xml={localizationSvg}
                                        width={9}
                                        height={13}
                                        style={styles.userAddressIcon}
                                    />
                                     <Text style={styles.userAddress}>
                                         {formatEndereco(enderecoAtivo)}
                                     </Text>
                                    <SvgXml
                                        xml={downArrowSvg}
                                        width={20}
                                        height={20}
                                        style={styles.userAddressArrow}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.pointsContainer}
                            onPress={() => {
                                if (navigation) {
                                    navigation.navigate('ClubeRoyal');
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <SvgXml
                                xml={crownSvg}
                                width={20}
                                height={20}
                                style={styles.crownIcon}
                            />
                            {shouldShowLoading ? (
                                <ActivityIndicator size="small" color="#FFC700" style={styles.pointsLoading} />
                            ) : (
                                <Text style={styles.pointsText}>
                                    {pointsValue} pontos
                                </Text>
                            )}
                        </TouchableOpacity>
                        {rightButton && rightButton}
                    </View>
                );

            case 'home':
            default:
                return (
                    <View style={styles.homeContainer}>
                        <View style={styles.textosLogin}>
                            <Text style={styles.titulo}>
                                {title || "Faça login ou crie sua conta"}
                            </Text>
                            <Text style={styles.subtitulo}>
                                {subtitle || "E acumule pontos de descontos!"}
                            </Text>
                        </View>
                        {rightButton || <ButtonDark texto={"Entrar"} onPress={handlePress}/>}
                    </View>
                );
        }
    };

    // Não renderiza se o header não estiver pronto (evita flash de conteúdo)
    if (type === 'logged' && cacheLoading && !userInfoProp) {
        return (
            <View style={[styles.container, styles[`${type}Container`]]}>
                <View style={styles.loggedContainer}>
                    <View style={styles.userInfo}>
                        <ActivityIndicator size="small" color="#888888" />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <>
            <View style={[styles.container, styles[`${type}Container`]]}>
                {renderContent()}
            </View>
            
            <EnderecosBottomSheet
                visible={showEnderecosBottomSheet}
                onClose={handleCloseEnderecosBottomSheet}
                enderecos={addressesToUse.length > 0 ? addressesToUse : enderecos}
                onAddNew={handleAddNewEndereco}
                onEdit={handleEditEndereco}
                onSelect={handleSelectEndereco}
                enderecoAtivo={enderecoAtivo || defaultAddressToUse}
            />

            <EditarEnderecoBottomSheet
                visible={showEditarEndereco}
                onClose={() => {
                    setShowEditarEndereco(false);
                    setShowEnderecosBottomSheet(true);
                }}
                endereco={enderecoSelecionado}
                onSave={handleSaveEndereco}
                onDelete={handleDeleteEndereco}
                enderecos={enderecos}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingBottom: 20,
        paddingTop: 50,
        paddingHorizontal: 20,
        height: 110,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
    },

    // Estilos para Home
    homeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textosLogin: {
        flexWrap: 'nowrap',
        flex: 1,
    },
    titulo: {
        fontSize: 18,
        color: '#101010',
        fontWeight: '700',
    },
    subtitulo: {
        fontSize: 16,
        color: '#888888',
        fontWeight: '400',
    },

    // Estilos para Login
    loginContainer: {
        position: 'relative',
        minHeight: 50,
    },
    imagemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagem: {
        width: 60,
        height: 52,
    },
    backButton: {
        position: 'absolute',
        left:0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        zIndex: 10,
    },

    // Estilos para Usuário Logado
    loggedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userTexts: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        color: '#101010',
        fontWeight: '600',
        marginBottom: 2,
    },
    userAddress: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '400',
    },
    userAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    userAddressIcon: {
        marginRight: 6,
    },
    userAddressArrow: {
        marginLeft: 6,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    crownIcon: {
        marginRight: 6,
    },
    pointsText: {
        fontSize: 14,
        color: '#FFC700',
        fontWeight: '600',
    },
    pointsLoading: {
        marginLeft: 6,
    },
});
