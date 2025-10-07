import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";
import {
  isAuthenticated,
  getStoredUserData,
  getCurrentUserProfile,
  testTokenValidity,
  getLoyaltyBalance,
} from "../services";
import { calculateDaysUntilExpiration } from "../services/customerService";
  import {
    getCustomerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    removeCustomerAddress,
    setDefaultAddress,
  } from "../services/customerService";
import MenuNavigation from "../components/MenuNavigation";
import DadosContaBottomSheet from "../components/DadosContaBottomSheet";
import EnderecosBottomSheet from "../components/EnderecosBottomSheet";
import EditarEnderecoBottomSheet from "../components/EditarEnderecoBottomSheet";

// SVGs dos ícones
const lupaSvg = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.75 10.625C18.75 12.418 18.168 14.0742 17.1875 15.418L22.1328 20.3672C22.6211 20.8555 22.6211 21.6484 22.1328 22.1367C21.6445 22.625 20.8516 22.625 20.3633 22.1367L15.418 17.1875C14.0742 18.168 12.418 18.75 10.625 18.75C6.13672 18.75 2.5 15.1133 2.5 10.625C2.5 6.13672 6.13672 2.5 10.625 2.5C15.1133 2.5 18.75 6.13672 18.75 10.625ZM10.625 16.25C13.7305 16.25 16.25 13.7305 16.25 10.625C16.25 7.51953 13.7305 5 10.625 5C7.51953 5 5 7.51953 5 10.625C5 13.7305 7.51953 16.25 10.625 16.25Z" fill="#888888"/>
  </svg>`;

const perfilSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 14.625C18.1078 14.625 20.625 12.1078 20.625 9C20.625 5.89219 18.1078 3.375 15 3.375C11.8922 3.375 9.375 5.89219 9.375 9C9.375 12.1078 11.8922 14.625 15 14.625ZM13.6078 17.25C8.99062 17.25 5.25 20.9906 5.25 25.6078C5.25 26.3766 5.87344 27 6.64219 27H23.3578C24.1266 27 24.75 26.3766 24.75 25.6078C24.75 20.9906 21.0094 17.25 16.3922 17.25H13.6078Z" fill="#888888"/>
  </svg>`;

const pedidoSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.65625 3.10331C7.05469 2.9205 7.52344 2.98613 7.85625 3.27207L9.75 4.89394L11.6437 3.27207C12.0656 2.91113 12.6891 2.91113 13.1063 3.27207L15 4.89394L16.8937 3.27207C17.3156 2.91113 17.9344 2.91113 18.3563 3.27207L20.25 4.89394L22.1437 3.27207C22.4766 2.98613 22.9453 2.9205 23.3438 3.10331C23.7422 3.28613 24 3.68456 24 4.12519V25.8752C24 26.3158 23.7422 26.7143 23.3438 26.8971C22.9453 27.0799 22.4766 27.0143 22.1437 26.7283L20.25 25.1064L18.3563 26.7283C17.9344 27.0893 17.3156 27.0893 16.8937 26.7283L15 25.1064L13.1063 26.7283C12.6844 27.0893 12.0609 27.0893 11.6437 26.7283L9.75 25.1064L7.85625 26.7283C7.52344 27.0143 7.05469 27.0799 6.65625 26.8971C6.25781 26.7143 6 26.3158 6 25.8752V4.12519C6 3.68456 6.25781 3.28613 6.65625 3.10331ZM10.875 9.37519C10.2516 9.37519 9.75 9.87675 9.75 10.5002C9.75 11.1236 10.2516 11.6252 10.875 11.6252H19.125C19.7484 11.6252 20.25 11.1236 20.25 10.5002C20.25 9.87675 19.7484 9.37519 19.125 9.37519H10.875ZM9.75 19.5002C9.75 20.1236 10.2516 20.6252 10.875 20.6252H19.125C19.7484 20.6252 20.25 20.1236 20.25 19.5002C20.25 18.8768 19.7484 18.3752 19.125 18.3752H10.875C10.2516 18.3752 9.75 18.8768 9.75 19.5002ZM10.875 13.8752C10.2516 13.8752 9.75 14.3768 9.75 15.0002C9.75 15.6236 10.2516 16.1252 10.875 16.1252H19.125C19.7484 16.1252 20.25 15.6236 20.25 15.0002C20.25 14.3768 19.7484 13.8752 19.125 13.8752H10.875Z" fill="#888888"/>
  </svg>`;

const localizationSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M-9.7692e-05 4.92031C-9.7692e-05 2.47813 2.01553 0.5 4.4999 0.5C6.98428 0.5 8.9999 2.47813 8.9999 4.92031C8.9999 7.71641 6.18272 11.068 5.00615 12.3453C4.72959 12.6453 4.26787 12.6453 3.99131 12.3453C2.81475 11.068 -0.00244141 7.71641 -0.00244141 4.92031H-9.7692e-05ZM4.4999 6.5C5.32725 6.5 5.9999 5.82734 5.9999 5C5.9999 4.17266 5.32725 3.5 4.4999 3.5C3.67256 3.5 2.9999 4.17266 2.9999 5C2.9999 5.82734 3.67256 6.5 4.4999 6.5Z" fill="#888888"/>
  </svg>`;

const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#FFD700"/>
  </svg>`;

const crownGraySvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#888888"/>
  </svg>`;

const gearSvg = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10.1207 2.87109C10.2379 2.29297 10.7496 1.875 11.3434 1.875H13.6793C14.273 1.875 14.7848 2.29297 14.9019 2.87109L15.4684 5.60547C16.0191 5.83984 16.5348 6.14062 17.0035 6.49609L19.6519 5.61719C20.2144 5.42969 20.8316 5.66406 21.1285 6.17969L22.2965 8.20312C22.5934 8.71875 22.4879 9.36719 22.0426 9.76172L19.9605 11.6133C19.9957 11.9023 20.0113 12.1992 20.0113 12.5C20.0113 12.8008 19.9918 13.0977 19.9605 13.3867L22.0465 15.2422C22.4918 15.6367 22.5934 16.2891 22.3004 16.8008L21.1324 18.8242C20.8355 19.3359 20.2184 19.5742 19.6559 19.3867L17.0074 18.5078C16.5348 18.8633 16.0191 19.1602 15.4723 19.3984L14.9098 22.1289C14.7887 22.7109 14.2769 23.125 13.6871 23.125H11.3512C10.7574 23.125 10.2457 22.707 10.1285 22.1289L9.56601 19.3984C9.01523 19.1641 8.50351 18.8633 8.03085 18.5078L5.3707 19.3867C4.8082 19.5742 4.19101 19.3398 3.89413 18.8242L2.72617 16.8008C2.42929 16.2852 2.53476 15.6367 2.98007 15.2422L5.06601 13.3867C5.03085 13.0977 5.01523 12.8008 5.01523 12.5C5.01523 12.1992 5.03476 11.9023 5.06601 11.6133L2.98007 9.75781C2.53476 9.36328 2.4332 8.71094 2.72617 8.19922L3.89413 6.17578C4.19101 5.66016 4.8082 5.42578 5.3707 5.61328L8.01913 6.49219C8.49179 6.13672 9.00742 5.83984 9.55429 5.60156L10.1207 2.87109ZM12.5113 15.625C14.2379 15.6172 15.6324 14.2148 15.6246 12.4883C15.6168 10.7617 14.2144 9.36719 12.4879 9.375C10.7613 9.38281 9.36679 10.7852 9.3746 12.5117C9.38242 14.2383 10.7848 15.6328 12.5113 15.625Z" fill="#888888"/>
  </svg>`;

const infoSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 16C12.4187 16 16 12.4187 16 8C16 3.58125 12.4187 0 8 0C3.58125 0 0 3.58125 0 8C0 12.4187 3.58125 16 8 16ZM7 5C7 4.44688 7.44688 4 8 4C8.55313 4 9 4.44688 9 5C9 5.55312 8.55313 6 8 6C7.44688 6 7 5.55312 7 5ZM6.75 7H8.25C8.66562 7 9 7.33437 9 7.75V10.5H9.25C9.66562 10.5 10 10.8344 10 11.25C10 11.6656 9.66562 12 9.25 12H6.75C6.33437 12 6 11.6656 6 11.25C6 10.8344 6.33437 10.5 6.75 10.5H7.5V8.5H6.75C6.33437 8.5 6 8.16562 6 7.75C6 7.33437 6.33437 7 6.75 7Z" fill="#A0A0A0"/>
  </svg>`;

export default function Perfil({ navigation }) {
  const isFocused = useIsFocused();
  const [userInfo, setUserInfo] = useState(null);
  const [showDadosConta, setShowDadosConta] = useState(false);
  const [showEnderecos, setShowEnderecos] = useState(false);
  const [showEditarEndereco, setShowEditarEndereco] = useState(false);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyData, setLoyaltyData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const ok = await isAuthenticated();
        if (ok) {
          // Primeiro tenta obter dados atualizados da API
          let user;
          try {
            user = await getCurrentUserProfile();
          } catch (apiError) {
            // Se falhar, usa dados locais como fallback
            console.warn(
              "Erro ao obter dados da API, usando dados locais:",
              apiError
            );
            user = await getStoredUserData();
          }

          // Mantém todos os dados do usuário
          const normalized = user
            ? {
                ...user, // Mantém todos os campos do usuário
                name: user.full_name || user.name || "Usuário",
                points: user.points || "0",
                address: user.address || undefined,
                avatar: undefined,
              }
            : null;
          setUserInfo(normalized);

          // Buscar endereços e pontos do usuário de forma sequencial
          if (user?.id) {
            // Testa o token antes de fazer as requisições
            setTimeout(async () => {
              try {
                const tokenValid = await testTokenValidity();

                if (tokenValid) {
                  await fetchEnderecos(user.id);
                  await fetchLoyaltyBalance(user.id);
                }
              } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
              }
            }, 100);
          }
        } else {
          setUserInfo(null);
          setEnderecos([]);
        }
      } catch (e) {
        console.error("Erro ao obter dados do usuário:", e);
        setUserInfo(null);
        setEnderecos([]);
      }
    };
    getUserData();
  }, [isFocused]);

  const fetchEnderecos = async (userId) => {
    try {
      const addresses = await getCustomerAddresses(userId);
      setEnderecos(addresses);
      
      // Define o endereço ativo
      if (addresses && addresses.length > 0) {
        // Primeiro, procura por um endereço marcado como padrão
        const enderecoPadrao = addresses.find(e => e.is_default === true || e.isDefault === true);
        
        if (enderecoPadrao) {
          setEnderecoAtivo(enderecoPadrao);
        } else if (!enderecoAtivo) {
          // Se não há endereço padrão, usa o mais recente
          const enderecosOrdenados = [...addresses].sort((a, b) => 
            new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
          );
          setEnderecoAtivo(enderecosOrdenados[0]);
        }
      } else {
        setEnderecoAtivo(null);
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      setEnderecos([]);
      setEnderecoAtivo(null);
    }
  };

  const fetchLoyaltyBalance = async (userId) => {
    try {
      const balance = await getLoyaltyBalance(userId);
      setLoyaltyBalance(balance?.current_balance || 0);
      setLoyaltyData(balance);
    } catch (error) {
      console.error("Erro ao buscar pontos:", error);
      setLoyaltyBalance(0);
      setLoyaltyData(null);
    }
  };

  // Função para calcular dias restantes até expiração
  const getDaysUntilExpiration = () => {
    if (!loyaltyData) {
      return 0;
    }
    
    // A API retorna a data de expiração diretamente no objeto
    if (loyaltyData.points_expiration_date) {
      return calculateDaysUntilExpiration(loyaltyData.points_expiration_date);
    }
    
    // Fallback: se não tiver data mas tiver pontos, assume 30 dias
    if (loyaltyData.current_balance > 0) {
      return 30;
    }
    
    return 0;
  };

  const handleAddEndereco = () => {
    setEnderecoSelecionado(null);
    setShowEnderecos(false);
    setShowEditarEndereco(true);
  };

  const handleEditEndereco = (endereco) => {
    setEnderecoSelecionado(endereco);
    setShowEnderecos(false);
    setShowEditarEndereco(true);
  };

  const handleSelectEndereco = async (endereco) => {
    try {
      // Chama a API para definir o endereço como padrão
      if (userInfo?.id && endereco?.id) {
        await setDefaultAddress(userInfo.id, endereco.id);
      }
      
      // Atualiza o estado local
      setEnderecoAtivo(endereco);
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
      // Mesmo com erro, atualiza o estado local para melhor UX
      setEnderecoAtivo(endereco);
    }
  };

  const handleSaveEndereco = async (formData) => {
    try {
      if (!userInfo?.id) return;

      if (formData.id) {
        // Editar endereço existente
        await updateCustomerAddress(userInfo.id, formData.id, {
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
        await addCustomerAddress(userInfo.id, {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        });
      }

      // Atualizar lista de endereços
      await fetchEnderecos(userInfo.id);
      
      // Se é um novo endereço, define como padrão via API
      if (!formData.id) {
        // Aguarda um pouco para garantir que o endereço foi adicionado
        setTimeout(async () => {
          try {
            const enderecosAtualizados = await getCustomerAddresses(userInfo.id);
            if (enderecosAtualizados && enderecosAtualizados.length > 0) {
              // Pega o endereço mais recente (primeiro da lista ordenada)
              const enderecosOrdenados = [...enderecosAtualizados].sort((a, b) => 
                new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
              );
              const enderecoMaisRecente = enderecosOrdenados[0];
              
              // Define como padrão via API
              await setDefaultAddress(userInfo.id, enderecoMaisRecente.id);
              setEnderecoAtivo(enderecoMaisRecente);
            }
          } catch (error) {
            console.error('Erro ao definir endereço como padrão:', error);
          }
        }, 500);
      }
      
      setShowEditarEndereco(false);
      setShowEnderecos(true);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço. Tente novamente.");
    }
  };

  const handleDeleteEndereco = async (enderecoId) => {
    try {
      if (!userInfo?.id) return;

      await removeCustomerAddress(userInfo.id, enderecoId);

      // Atualizar lista de endereços
      await fetchEnderecos(userInfo.id);
      setShowEditarEndereco(false);
      setShowEnderecos(true);
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
      alert("Erro ao deletar endereço. Tente novamente.");
    }
  };

  const menuOptions = [
    { id: "cardapio", icon: "lupa", title: "Ver cardápio" },
    { id: "dados", icon: "perfil", title: "Dados da conta" },
    { id: "pedidos", icon: "pedido", title: "Ver pedidos" },
    { id: "enderecos", icon: "localization", title: "Endereços" },
    { id: "pontos", icon: "crown", title: "Ver pontos" },
    { id: "config", icon: "gear", title: "Configurações" },
  ];

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const capitalizeName = (name) => {
    if (!name) return "Usuário";
    return name
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSvgIcon = (iconName) => {
    switch (iconName) {
      case "lupa":
        return lupaSvg;
      case "perfil":
        return perfilSvg;
      case "pedido":
        return pedidoSvg;
      case "localization":
        return localizationSvg;
      case "crown":
        return crownGraySvg; // Usa o SVG cinza para o menu
      case "gear":
        return gearSvg;
      default:
        return lupaSvg;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner} />

        <View style={styles.modal}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(userInfo?.name)}
              </Text>
            </View>
          </View>

          {/* Nome */}
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{capitalizeName(userInfo?.name)}</Text>
            <View style={styles.borderLine} />
          </View>

          {/* Menu Options */}
          <View style={styles.menuOptions}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.menuItem}
                onPress={() => {
                  if (option.id === "config") {
                    navigation.navigate("Config");
                  } else if (option.id === "dados") {
                    setShowDadosConta(true);
                  } else if (option.id === "enderecos") {
                    setShowEnderecos(true);
                  } else if (option.id === "pontos") {
                    navigation.navigate("ClubeRoyal");
                  } else if (option.id === "pedidos") {
                    navigation.navigate("Pedidos");
                  } 
                }}
              >
                <View style={styles.menuIcon}>
                  <SvgXml
                    xml={getSvgIcon(option.icon)}
                    width={25}
                    height={25}
                  />
                </View>
                <Text style={styles.menuText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Container de Seus Pontos */}
        <View style={styles.pointsContainer}>
          {/* Header do Container */}
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsTitle}>Seus Pontos</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => navigation.navigate('ClubeRoyal')}
            >
              <SvgXml xml={infoSvg} width={16} height={16} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo do Container */}
          <View style={styles.pointsContent}>
            <View style={styles.pointsDisplay}>
              <SvgXml xml={crownSvg} width={40} height={40} />
              <Text style={styles.pointsNumber}>{loyaltyBalance}</Text>
            </View>
            <Text style={styles.pointsExpiration}>
              {getDaysUntilExpiration() > 0 
                ? `Faltam ${getDaysUntilExpiration()} dias para seus pontos expirarem`
                : loyaltyBalance > 0 
                  ? 'Seus pontos expiraram'
                  : 'Você não possui pontos para expirar'
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} currentRoute="Perfil" />
      </View>

      {/* Bottom Sheet - Dados da Conta */}
      <DadosContaBottomSheet
        visible={showDadosConta}
        onClose={() => setShowDadosConta(false)}
        userData={userInfo}
        onUserDataUpdate={() => {
          // Recarrega os dados do usuário quando houver atualização
          const getUserData = async () => {
            try {
              const ok = await isAuthenticated();
              if (ok) {
                // Tenta obter dados atualizados da API
                let user;
                try {
                  user = await getCurrentUserProfile();
                } catch (apiError) {
                  console.warn(
                    "Erro ao obter dados da API, usando dados locais:",
                    apiError
                  );
                  user = await getStoredUserData();
                }

                const normalized = user
                  ? {
                      ...user,
                      name: user.full_name || user.name || "Usuário",
                      points: user.points || "0",
                      address: user.address || undefined,
                      avatar: undefined,
                    }
                  : null;
                setUserInfo(normalized);

                // Atualiza endereços e pontos se o usuário tem ID
                if (user?.id) {
                  setTimeout(async () => {
                    try {
                      await fetchEnderecos(user.id);
                      await fetchLoyaltyBalance(user.id);
                    } catch (error) {
                      console.error(
                        "Erro ao atualizar dados do usuário:",
                        error
                      );
                    }
                  }, 100);
                }
              }
            } catch (e) {
              console.error("Erro ao recarregar dados do usuário:", e);
              setUserInfo(null);
            }
          };
          getUserData();
        }}
      />

      {/* Bottom Sheet - Endereços */}
        <EnderecosBottomSheet
          visible={showEnderecos}
          onClose={() => setShowEnderecos(false)}
          enderecos={enderecos}
          onAddNew={handleAddEndereco}
          onEdit={handleEditEndereco}
          onSelect={handleSelectEndereco}
          enderecoAtivo={enderecoAtivo}
        />

      {/* Bottom Sheet - Editar/Adicionar Endereço */}
      <EditarEnderecoBottomSheet
        visible={showEditarEndereco}
        onClose={() => {
          setShowEditarEndereco(false);
          setShowEnderecos(true);
        }}
        endereco={enderecoSelecionado}
        onSave={handleSaveEndereco}
        onDelete={handleDeleteEndereco}
        enderecos={enderecos}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 100, // Espaço para o menu de navegação
  },
  banner: {
    width: "100%",
    height: 200,
    backgroundColor: "#D9D9D9",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: -70,
    padding: 20,
    width: "70%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
    position: "relative",
    top: -60,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#101010",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  userNameContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: -65,
    marginBottom: 10,
    paddingBottom: 30,
    position: "relative",
  },
  borderLine: {
    position: "absolute",
    bottom: 0,
    left: -20,
    right: -20,
    height: 1,
    backgroundColor: "#D9D9D9",
  },
  userName: {
    fontSize: 25,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  menuOptions: {
    width: "100%",
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "90%",
    maxWidth: 280,
  },
  menuIcon: {
    marginRight: 15,
    width: 20,
  },
  menuText: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "500",
    flex: 1,
  },
  menuNavigationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  // Estilos do Container de Pontos
  pointsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    width: "70%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  infoButton: {
    padding: 5,
  },
  pointsContent: {
    alignItems: "center",
    width: "100%",
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  pointsNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginLeft: 15,
  },
  pointsExpiration: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
});
