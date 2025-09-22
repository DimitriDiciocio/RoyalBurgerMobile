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
      console.log(
        `🚀 Fazendo requisição: ${config.method?.toUpperCase()} ${
          config.baseURL
        }${config.url}`
      );
      console.log("📤 Dados enviados:", config.data);
      console.log("🔗 URL completa:", `${config.baseURL}${config.url}`);

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

      console.log("🔓 Rota pública?", isPublicRoute);

      // Se não for uma rota pública, adiciona o token
      if (!isPublicRoute) {
        const token = await AsyncStorage.getItem("user_token");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔑 Token adicionado ao header");
        } else {
          console.log("⚠️ Nenhum token encontrado");
        }
      } else {
        console.log("🌐 Rota pública - sem token necessário");
      }
    } catch (error) {
      console.warn("Erro ao obter token do AsyncStorage:", error);
    }

    return config;
  },
  (error) => {
    console.error("❌ Erro no interceptor de request:", error);
    return Promise.reject(error);
  }
);

// Interceptor: Roda DEPOIS de cada resposta ser recebida
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ Resposta recebida: ${
        response.status
      } ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    console.log("📥 Dados recebidos:", response.data);
    return response;
  },
  async (error) => {
    console.error(
      `❌ Erro na resposta: ${
        error.response?.status || "Network Error"
      } ${error.config?.method?.toUpperCase()} ${error.config?.url}`
    );
    console.error("📥 Dados do erro:", error.response?.data || error.message);
    console.error("🔍 Detalhes do erro:", {
      code: error.code,
      message: error.message,
      stack: error.stack?.substring(0, 200),
    });

    // Se receber erro 401 (não autorizado), remove o token e redireciona para login
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem("user_token");
        // Aqui você pode adicionar lógica para redirecionar para a tela de login
        console.log(
          "Token expirado ou inválido. Usuário deve fazer login novamente."
        );
      } catch (storageError) {
        console.warn("Erro ao remover token do AsyncStorage:", storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
