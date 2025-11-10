import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Resolve dinamicamente a URL base da API conforme o ambiente (emulador/dispositivo)
function resolveBaseUrl() {
  // 1) Se vier via .env, prioriza
  if (
    API_BASE_URL &&
    typeof API_BASE_URL === "string" &&
    API_BASE_URL.trim().length > 0
  ) {
    return API_BASE_URL.trim();
  }

  // 2) Tenta inferir pelo host do Metro/Expo (funciona para dispositivo físico na mesma rede)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.hostUri;
  const inferredHost = hostUri ? hostUri.split(":")[0] : null;
  if (
    inferredHost &&
    inferredHost !== "127.0.0.1" &&
    inferredHost !== "localhost"
  ) {
    return `http://${inferredHost}:5000/api`;
  }

  // 3) Fallbacks por plataforma (emuladores)
  if (Platform.OS === "android") {
    // Emulador Android (AVD)
    return "http://10.0.2.2:5000/api";
  }

  // iOS Simulator
  return "http://localhost:5000/api";
}

// URL base da API obtida das variáveis de ambiente ou heurística
const BASE_URL = resolveBaseUrl();

// Log para facilitar o diagnóstico em desenvolvimento
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[API] BASE_URL: ${BASE_URL}`);
}

// Cria uma instância do Axios com configurações padrão
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Roda ANTES de cada requisição ser enviada
api.interceptors.request.use(
  async (config) => {
    try {
      // Lista de rotas que não precisam de token
      const publicRoutes = [
        "/users/login",
        "/users/request-password-reset",
        "/users/reset-password",
        "/settings/public",
      ];

      // Rotas específicas que são públicas (usando match exato)
      const isCustomerRegistration =
        config.url === "/customers" && config.method?.toLowerCase() === "post";

      // Verifica se a rota atual é pública
      const isPublicRoute =
        publicRoutes.some((route) => config.url?.includes(route)) ||
        isCustomerRegistration;

      // Se não for uma rota pública, adiciona o token
      // IMPORTANTE: Para rotas de carrinho (/cart/*), o token é opcional
      // A API usa verify_jwt_in_request(optional=True) para permitir convidados
      if (!isPublicRoute) {
        const token = await AsyncStorage.getItem("user_token");
        const isCartRoute = config.url?.startsWith('/cart/');

        // Para rotas de carrinho, a API aceita requisições sem token (convidados)
        // Mas se houver token, envia (mesmo que inválido, a API trata opcionalmente)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          
          if (isCartRoute && __DEV__) {
            console.log('[API] Token enviado para rota de carrinho (opcional na API)');
          }
        } else if (isCartRoute && __DEV__) {
          console.log('[API] Requisição de carrinho sem token (convidado)');
        }
      }
    } catch (error) {
      // Erro silencioso ao obter token
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Roda DEPOIS de cada resposta ser recebida
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Se receber erro 401 (não autorizado), verifica se é realmente um token inválido
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;

      // Só remove o token se for realmente um problema de token inválido
      // Não remove se for apenas "MISSING_TOKEN" (pode ser problema de timing)
      if (errorCode === "TOKEN_INVALID" || errorCode === "TOKEN_EXPIRED") {
        try {
          await AsyncStorage.removeItem("user_token");
          await AsyncStorage.removeItem("user_data");
          // Aqui você pode adicionar lógica para redirecionar para a tela de login
        } catch (storageError) {
          // Erro silencioso ao remover token
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
