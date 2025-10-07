import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Header from '../components/Header';
import MenuNavigation from '../components/MenuNavigation';
import { isAuthenticated, getStoredUserData } from '../services/userService';
import { getCustomerAddresses, getLoyaltyBalance, calculateDaysUntilExpiration } from '../services/customerService';

// SVGs dos ícones
const crownSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.08594 3.54375C8.30156 3.37266 8.4375 3.10781 8.4375 2.8125C8.4375 2.29453 8.01797 1.875 7.5 1.875C6.98203 1.875 6.5625 2.29453 6.5625 2.8125C6.5625 3.10781 6.70078 3.37266 6.91406 3.54375L5.31094 6.06562C5.07656 6.43359 4.57734 6.525 4.22812 6.2625L2.83359 5.21953C2.93906 5.06953 3 4.88438 3 4.6875C3 4.16953 2.58047 3.75 2.0625 3.75C1.54453 3.75 1.125 4.16953 1.125 4.6875C1.125 5.19844 1.53516 5.61562 2.04375 5.625L2.80781 10.7227C2.91797 11.4563 3.54844 12 4.29141 12H10.7086C11.4516 12 12.082 11.4563 12.1922 10.7227L12.9562 5.625C13.4648 5.61562 13.875 5.19844 13.875 4.6875C13.875 4.16953 13.4555 3.75 12.9375 3.75C12.4195 3.75 12 4.16953 12 4.6875C12 4.88438 12.0609 5.06953 12.1664 5.21953L10.7742 6.26484C10.425 6.52734 9.92578 6.43594 9.69141 6.06797L8.08594 3.54375Z" fill="#FFD700"/>
</svg>`;

// SVGs dos assets
const circleSvg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="6" cy="6" r="6" fill="#888888"/>
</svg>`;


export default function ClubeRoyal({ navigation }) {
  const isFocused = useIsFocused();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtivo, setEnderecoAtivo] = useState(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyData, setLoyaltyData] = useState(null);

  const fetchEnderecos = async (userId) => {
    try {
      const enderecosData = await getCustomerAddresses(userId);
      setEnderecos(enderecosData || []);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setEnderecos([]);
    }
  };

  const fetchLoyaltyBalance = async (userId) => {
    try {
      const balance = await getLoyaltyBalance(userId);
      console.log('Dados da API de pontos:', balance); // Debug
      const points = balance?.current_balance || 0;
      setLoyaltyBalance(points);
      setLoyaltyData(balance);
      return points;
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      setLoyaltyBalance(0);
      setLoyaltyData(null);
      return 0;
    }
  };

  // Função para calcular dias restantes até expiração
  const getDaysUntilExpiration = () => {
    if (!loyaltyData) {
      return 0;
    }
    
    console.log('Calculando expiração com dados:', loyaltyData); // Debug
    
    // A API retorna a data de expiração diretamente no objeto
    // Formato: { accumulated_points: 100, spent_points: 0, current_balance: 100, points_expiration_date: "2025-12-06" }
    if (loyaltyData.points_expiration_date) {
      const days = calculateDaysUntilExpiration(loyaltyData.points_expiration_date);
      console.log(`Data de expiração: ${loyaltyData.points_expiration_date}, Dias restantes: ${days}`); // Debug
      return days;
    }
    
    // Fallback: se não tiver data mas tiver pontos, assume 30 dias
    if (loyaltyData.current_balance > 0) {
      return 30;
    }
    
    return 0;
  };

  const handleEnderecoAtivoChange = (data) => {
    // Verificação de segurança para evitar erro quando data é null
    if (!data) return;
    
    if (typeof data === 'object' && data.type === 'refresh') {
      // Atualiza a lista de endereços
      setEnderecos(data.enderecos);
      // Se tem endereço ativo específico, usa ele, senão define baseado na lista
      if (data.enderecoAtivo) {
        setEnderecoAtivo(data.enderecoAtivo);
      } else if (data.enderecos && data.enderecos.length > 0) {
        const enderecoPadrao = data.enderecos.find(e => e.is_default === true || e.isDefault === true);
        if (enderecoPadrao) {
          setEnderecoAtivo(enderecoPadrao);
        } else {
          const enderecosOrdenados = [...data.enderecos].sort((a, b) => 
            new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
          );
          setEnderecoAtivo(enderecosOrdenados[0]);
        }
      }
    } else {
      // Endereço ativo mudou
      setEnderecoAtivo(data);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const ok = await isAuthenticated();
        setLoggedIn(!!ok);
        if (ok) {
          const user = await getStoredUserData();
          
          // Buscar endereços e pontos se o usuário estiver logado
          if (user?.id) {
            await fetchEnderecos(user.id);
            const points = await fetchLoyaltyBalance(user.id);
            
            // Normaliza campos esperados pelo Header APÓS buscar os pontos
            const normalized = {
              name: user.full_name || user.name || 'Usuário',
              points: points.toString(), // Usa os pontos da API
              address: user.address || undefined,
              avatar: undefined,
            };
            setUserInfo(normalized);
          } else {
            setUserInfo(null);
          }
        } else {
          setUserInfo(null);
          setEnderecos([]);
        }
      } catch (e) {
        setLoggedIn(false);
        setUserInfo(null);
        setEnderecos([]);
      }
    };
    checkAuth();
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Header 
        type="logged"
        userInfo={userInfo}
        navigation={navigation}
        title="Clube Royal"
        subtitle="Seus benefícios exclusivos"
        enderecos={enderecos}
        onEnderecoAtivoChange={handleEnderecoAtivoChange}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Container de Seus Pontos */}
        <View style={styles.pointsContainer}>
          {/* Header do Container */}
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsTitle}>Seus Pontos</Text>
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
            <TouchableOpacity style={styles.historyButton}>
              <Text style={styles.historyButtonText}>Histórico de pontos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações do Clube Royal */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <View style={styles.infoBulletContainer}>
              <SvgXml xml={circleSvg} width={12} height={12} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Acumule pontos!</Text>
              <Text style={styles.infoText}>
                Ao finalizar uma compra no app, você receberá a quantia gasta em pontos.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoBulletContainer}>
              <SvgXml xml={circleSvg} width={12} height={12} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Compre com descontos!</Text>
              <Text style={styles.infoText}>
                Ao adicionar suas compras à cesta, é possível acionar os pontos e ganhar descontos.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoBulletContainer}>
              <SvgXml xml={circleSvg} width={12} height={12} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Como funciona a conversão?</Text>
              <Text style={styles.infoText}>
                A cada 1 real gasto no app, você receberá 10 pontos Royal e a cada 100 pontos acumulados, você terá 1 real de desconto.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoBulletContainer}>
              <SvgXml xml={circleSvg} width={12} height={12} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Os pontos Royal expiram?</Text>
              <Text style={styles.infoText}>
                Os pontos Royal expiram após 1 mês da sua última compra. Após realizar uma compra, os pontos se renovam por mais 1 mês.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.menuNavigationContainer}>
        <MenuNavigation navigation={navigation} currentRoute="ClubeRoyal" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Espaço para o menu de navegação
  },
  menuNavigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  // Estilos do Container de Pontos
  pointsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsHeader: {
    width: '100%',
    marginBottom: 20,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  pointsContent: {
    alignItems: 'center',
    width: '100%',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pointsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 15,
  },
  pointsExpiration: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  historyButton: {
    backgroundColor: '#FFC700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos das Informações
  infoContainer: {
    paddingHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoBulletContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginRight: 15,
    width: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});