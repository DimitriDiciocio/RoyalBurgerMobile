import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BotaoCheck from '../components/BotaoCheck';
import BotaoSwitch from '../components/BotaoSwitch';
import AlterarSenhaBottomSheet from '../components/AlterarSenhaBottomSheet';
import CustomAlert from '../components/CustomAlert';
import { logout } from '../services/userService';

// SVG do ícone de voltar (igual ao produto.js)
const backArrowSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.29385 9.29365C4.90322 9.68428 4.90322 10.3187 5.29385 10.7093L11.2938 16.7093C11.6845 17.0999 12.3188 17.0999 12.7095 16.7093C13.1001 16.3187 13.1001 15.6843 12.7095 15.2937L7.41572 9.9999L12.7063 4.70615C13.097 4.31553 13.097 3.68115 12.7063 3.29053C12.3157 2.8999 11.6813 2.8999 11.2907 3.29053L5.29072 9.29053L5.29385 9.29365Z" fill="black"/>
</svg>`;

// SVG do ícone de edição (pen.svg)
const penSvg = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0744 2.26332L9.88173 3.45598L13.5447 7.11895L14.7373 5.92629C15.0986 5.5677 15.3005 5.07895 15.3005 4.56895C15.3005 4.05895 15.0986 3.5702 14.7373 3.2116L13.7891 2.26332C13.4305 1.90207 12.9417 1.7002 12.4317 1.7002C11.9217 1.7002 11.433 1.90207 11.0744 2.26332ZM8.98126 4.35645L3.26501 10.07C2.98079 10.3543 2.7736 10.7102 2.66469 11.098L1.72438 14.4927C1.66329 14.7132 1.72438 14.9522 1.88907 15.1143C2.05376 15.2763 2.29016 15.34 2.51063 15.2789L5.90532 14.336C6.29313 14.2271 6.64641 14.0225 6.93329 13.7357L12.6442 8.01941L8.98126 4.35645Z" fill="white"/>
</svg>`;

// SVG do ícone de check (check.svg)
const checkSvg = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.0995 3.56248C14.4793 3.83873 14.5643 4.36998 14.2881 4.74982L7.48809 14.0998C7.34199 14.3017 7.11621 14.4265 6.86652 14.4478C6.61684 14.469 6.37512 14.3761 6.1998 14.2008L2.7998 10.8008C2.46777 10.4687 2.46777 9.92951 2.7998 9.59748C3.13184 9.26545 3.67105 9.26545 4.00309 9.59748L6.69918 12.2936L12.9148 3.74841C13.1911 3.36857 13.7223 3.28357 14.1021 3.55982L14.0995 3.56248Z" fill="white"/>
</svg>`;

export default function Config({ navigation }) {
  const [notificacaoPedidos, setNotificacaoPedidos] = useState(false);
  const [notificacaoPromocoes, setNotificacaoPromocoes] = useState(false);
  const [verificacaoDuasEtapas, setVerificacaoDuasEtapas] = useState(false);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  // ALTERAÇÃO: Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState([]);

  // Carregar configurações do AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const pedidos = await AsyncStorage.getItem('notificacaoPedidos');
        const promocoes = await AsyncStorage.getItem('notificacaoPromocoes');
        const duasEtapas = await AsyncStorage.getItem('verificacaoDuasEtapas');
        
        if (pedidos !== null) setNotificacaoPedidos(JSON.parse(pedidos));
        if (promocoes !== null) setNotificacaoPromocoes(JSON.parse(promocoes));
        if (duasEtapas !== null) setVerificacaoDuasEtapas(JSON.parse(duasEtapas));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Salvar configurações no AsyncStorage
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('notificacaoPedidos', JSON.stringify(notificacaoPedidos));
        await AsyncStorage.setItem('notificacaoPromocoes', JSON.stringify(notificacaoPromocoes));
        await AsyncStorage.setItem('verificacaoDuasEtapas', JSON.stringify(verificacaoDuasEtapas));
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
      }
    };
    
    saveSettings();
  }, [notificacaoPedidos, notificacaoPromocoes, verificacaoDuasEtapas]);

  // Handlers para os toggles
  const handleNotificacaoPedidos = () => {
    setNotificacaoPedidos(!notificacaoPedidos);
  };

  const handleNotificacaoPromocoes = () => {
    setNotificacaoPromocoes(!notificacaoPromocoes);
  };

  const handleVerificacaoDuasEtapas = () => {
    setVerificacaoDuasEtapas(!verificacaoDuasEtapas);
  };

  const handleChangePassword = () => {
    setShowAlterarSenha(true);
  };

  const handleVerifyEmail = () => {
    console.log('Verificar email');
    // Adicione a navegação ou ação desejada aqui
  };

  const handleLogout = () => {
    // ALTERAÇÃO: Usar CustomAlert ao invés de Alert.alert
    setAlertType('warning');
    setAlertTitle('Sair da conta');
    setAlertMessage('Tem certeza que deseja sair da sua conta?');
    setAlertButtons([
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        onPress: async () => {
          try {
            await logout();
            // Navega para a tela de login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            // ALTERAÇÃO: Mostrar erro com CustomAlert
            setAlertType('delete');
            setAlertTitle('Erro');
            setAlertMessage('Não foi possível sair da conta. Tente novamente.');
            setAlertButtons([{ text: 'OK' }]);
            setAlertVisible(true);
          }
        },
      },
    ]);
    setAlertVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SvgXml xml={backArrowSvg} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção: Gerenciar notificações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciar notificações</Text>

          <BotaoSwitch
            title="Comunicações de pedidos"
            description="Irá receber notificações informando nas etapas do seu pedido"
            value={notificacaoPedidos}
            onValueChange={handleNotificacaoPedidos}
          />

          <BotaoSwitch
            title="Comunicações de promoções"
            description="Irá receber notificações informando nas últimas promoções"
            value={notificacaoPromocoes}
            onValueChange={handleNotificacaoPromocoes}
          />
        </View>

        {/* Seção: Gerenciar segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciar segurança</Text>

          <BotaoSwitch
            title="Verificação em duas etapas"
            description="Adicione um método de verificação adicional além da sua senha"
            value={verificacaoDuasEtapas}
            onValueChange={handleVerificacaoDuasEtapas}
          />

          <BotaoCheck
            title="Alterar sua senha"
            description="Troque sua senha atual por uma nova e mais segura"
            iconSvg={penSvg}
            onPress={handleChangePassword}
          />

        </View>

        {/* Botões de ação */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair da conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Deletar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sheet de Alterar Senha */}
      <AlterarSenhaBottomSheet
        visible={showAlterarSenha}
        onClose={() => setShowAlterarSenha(false)}
      />
      
      {/* ALTERAÇÃO: CustomAlert para substituir Alert.alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
