import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

// URL base da API obtida das variáveis de ambiente
const BASE_URL = API_BASE_URL || "http://10.0.2.2:5000/api";

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
        "/customers",
        "/users/forgot-password",
        "/users/reset-password",
      ];

      // Verifica se a rota atual é pública
      const isPublicRoute = publicRoutes.some((route) =>
        config.url?.includes(route)
      );

      // Se não for uma rota pública, adiciona o token
      if (!isPublicRoute) {
        const token = await AsyncStorage.getItem("user_token");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
    // Se receber erro 401 (não autorizado), remove o token e redireciona para login
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem("user_token");
        // Aqui você pode adicionar lógica para redirecionar para a tela de login
      } catch (storageError) {
        // Erro silencioso ao remover token
      }
    }

    return Promise.reject(error);
  }
);

export default api;
