import api from "./api";

/**
 * ========================================
 * SERVIÇO DE ENDEREÇOS E INTEGRAÇÃO IBGE
 * ========================================
 * Gerencia todas as operações relacionadas a endereços:
 * - Busca de CEP via API do IBGE
 * - Listagem de estados brasileiros
 * - Listagem de cidades por estado
 * - Validação de endereços
 */

/**
 * Busca dados de um CEP usando a API do IBGE.
 * @param {string} cep - CEP a ser consultado (formato: 00000-000 ou 00000000)
 * @returns {Promise<object>} - Dados do endereço
 */
export const searchCEP = async (cep) => {
  try {
    // Remove formatação do CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // API do IBGE para busca de CEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return {
      success: true,
      data: {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erro ao consultar CEP'
    };
  }
};

/**
 * Obtém todos os estados brasileiros.
 * @returns {Promise<Array>} - Lista de estados
 */
export const getStates = async () => {
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
    
    if (!response.ok) {
      throw new Error('Erro ao carregar estados');
    }

    const states = await response.json();
    
    // Ordena os estados por nome
    const sortedStates = states.sort((a, b) => a.nome.localeCompare(b.nome));
    
    return {
      success: true,
      data: sortedStates.map(state => ({
        id: state.id,
        nome: state.nome,
        sigla: state.sigla,
        regiao: state.regiao?.nome
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erro ao carregar estados'
    };
  }
};

/**
 * Obtém todas as cidades de um estado específico.
 * @param {string} stateId - ID do estado
 * @returns {Promise<Array>} - Lista de cidades
 */
export const getCitiesByState = async (stateId) => {
  try {
    if (!stateId) {
      throw new Error('ID do estado é obrigatório');
    }

    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar cidades');
    }

    const cities = await response.json();
    
    // Ordena as cidades por nome
    const sortedCities = cities.sort((a, b) => a.nome.localeCompare(b.nome));
    
    return {
      success: true,
      data: sortedCities.map(city => ({
        id: city.id,
        nome: city.nome,
        microrregiao: city.microrregiao?.nome,
        mesorregiao: city.mesorregiao?.nome
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erro ao carregar cidades'
    };
  }
};

/**
 * Obtém cidades por sigla do estado.
 * @param {string} stateSigla - Sigla do estado (ex: SP, RJ)
 * @returns {Promise<Array>} - Lista de cidades
 */
export const getCitiesByStateSigla = async (stateSigla) => {
  try {
    if (!stateSigla) {
      throw new Error('Sigla do estado é obrigatória');
    }

    // Primeiro busca o estado pela sigla
    const statesResponse = await getStates();
    if (!statesResponse.success) {
      throw new Error('Erro ao buscar estado');
    }

    const state = statesResponse.data.find(s => s.sigla === stateSigla.toUpperCase());
    if (!state) {
      throw new Error('Estado não encontrado');
    }

    // Busca as cidades do estado
    return await getCitiesByState(state.id);
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erro ao carregar cidades'
    };
  }
};

/**
 * Valida se um CEP está no formato correto.
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} - True se válido
 */
export const validateCEP = (cep) => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

/**
 * Formata um CEP para o padrão 00000-000.
 * @param {string} cep - CEP a ser formatado
 * @returns {string} - CEP formatado
 */
export const formatCEP = (cep) => {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length >= 5) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cleanCEP;
};

/**
 * Obtém informações completas de um endereço baseado no CEP.
 * @param {string} cep - CEP a ser consultado
 * @returns {Promise<object>} - Dados completos do endereço
 */
export const getCompleteAddressInfo = async (cep) => {
  try {
    const cepResult = await searchCEP(cep);
    
    if (!cepResult.success) {
      return cepResult;
    }

    const addressData = cepResult.data;
    
    // Busca as cidades do estado para validação
    const citiesResult = await getCitiesByStateSigla(addressData.uf);
    
    return {
      success: true,
      data: {
        ...addressData,
        cities: citiesResult.success ? citiesResult.data : []
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erro ao obter informações do endereço'
    };
  }
};
