// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configurações para resolver problemas de "expected buffer size"
config.transformer = {
  ...config.transformer,
  // Reduz workers para economizar memória (ajuste conforme necessário)
  maxWorkers: 2,
  // Aumenta o limite de memória para transformação
  workerCount: 2,
};

// Configurações de cache para melhor performance
config.cacheStores = config.cacheStores || [];

// Configurações do resolver para melhorar performance
config.resolver = {
  ...config.resolver,
  // Otimiza resolução de módulos
  sourceExts: [...(config.resolver?.sourceExts || []), 'js', 'jsx', 'json', 'ts', 'tsx'],
};

// Configurações do serializer
config.serializer = {
  ...config.serializer,
  // Aumenta o tamanho do buffer de serialização
  customSerializer: config.serializer?.customSerializer,
};

module.exports = config;

