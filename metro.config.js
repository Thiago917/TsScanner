const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Forçar o reconhecimento de extensões de fontes e assets
config.resolver.assetExts.push('ttf', 'otf', 'png', 'jpg');

// 2. Aplicar o NativeWind por cima da configuração base
module.exports = withNativeWind(config, { input: './global.css' });