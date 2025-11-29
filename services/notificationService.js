import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';
import { isAuthenticated } from './userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ALTERAÇÃO: Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_TOKEN_KEY = 'expo_push_notification_token';

/**
 * Solicita permissão para notificações
 * @returns {Promise<boolean>} - true se permissão foi concedida
 */
export const requestNotificationPermissions = async () => {
  try {
    // Verificar se está em um dispositivo físico
    if (!Device.isDevice) {
      const isDev = __DEV__;
      if (isDev) {
        console.warn('[NotificationService] Notificações só funcionam em dispositivos físicos');
      }
      return false;
    }

    // Verificar permissão atual
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Se ainda não tem permissão, solicitar
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      const isDev = __DEV__;
      if (isDev) {
        console.warn('[NotificationService] Permissão de notificações negada');
      }
      return false;
    }

    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFC700',
      });
    }

    return true;
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao solicitar permissão:', error);
    }
    return false;
  }
};

/**
 * Registra o token de notificação no backend
 * @param {string} token - Token de notificação do Expo
 * @returns {Promise<boolean>} - true se registro foi bem-sucedido
 */
export const registerNotificationToken = async (token) => {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      // Se não estiver autenticado, salvar token localmente para registrar depois
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      return false;
    }

    // Registrar token no backend
    const response = await api.post('/customers/notification-token', {
      push_token: token,
      platform: Platform.OS,
    });

    if (response.data) {
      // Token registrado com sucesso
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      return true;
    }

    return false;
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao registrar token:', error);
    }
    // Salvar token localmente mesmo em caso de erro para tentar depois
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
    return false;
  }
};

/**
 * Obtém o token de notificação do Expo
 * @returns {Promise<string|null>} - Token de notificação ou null
 */
export const getNotificationToken = async () => {
  try {
    // ALTERAÇÃO: Obter projectId do Constants do Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.projectId;
    
    if (!projectId) {
      const isDev = __DEV__;
      if (isDev) {
        console.warn('[NotificationService] projectId não encontrado. Configure no app.json ou eas.json');
      }
      // Tentar obter token sem projectId (pode funcionar em alguns casos)
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    return tokenData.data;
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao obter token:', error);
    }
    return null;
  }
};

/**
 * Inicializa o sistema de notificações
 * Solicita permissão, obtém token e registra no backend
 * @returns {Promise<boolean>} - true se inicialização foi bem-sucedida
 */
export const initializeNotifications = async () => {
  try {
    // Solicitar permissão
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }

    // Obter token
    const token = await getNotificationToken();
    if (!token) {
      return false;
    }

    // Registrar token no backend
    await registerNotificationToken(token);

    return true;
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao inicializar notificações:', error);
    }
    return false;
  }
};

/**
 * Tenta registrar token salvo localmente após login
 */
export const registerPendingToken = async () => {
  try {
    const token = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    if (token) {
      await registerNotificationToken(token);
    }
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao registrar token pendente:', error);
    }
  }
};

/**
 * Remove o token de notificação do backend
 */
export const unregisterNotificationToken = async () => {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return;
    }

    await api.delete('/customers/notification-token');
    await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
  } catch (error) {
    const isDev = __DEV__;
    if (isDev) {
      console.error('[NotificationService] Erro ao remover token:', error);
    }
  }
};

/**
 * Configura listeners para notificações
 * @param {Function} onNotificationReceived - Callback quando notificação é recebida
 * @param {Function} onNotificationTapped - Callback quando notificação é tocada
 * @returns {Array} - Array com funções de remoção dos listeners
 */
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
  // Listener para notificações recebidas enquanto app está em foreground
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener para quando usuário toca na notificação
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Retornar funções para remover listeners
  return [
    () => Notifications.removeNotificationSubscription(receivedListener),
    () => Notifications.removeNotificationSubscription(responseListener),
  ];
};

/**
 * Obtém o último token salvo localmente
 * @returns {Promise<string|null>}
 */
export const getStoredNotificationToken = async () => {
  try {
    return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
  } catch (error) {
    return null;
  }
};
