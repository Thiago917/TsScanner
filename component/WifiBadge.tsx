import { useGlobalNetInfo } from '@/contexts/NetInfoContext';
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const WifiBadge = () => {
  const { isConnected, isInternetReachable, type, loading } = useGlobalNetInfo();

  if (loading) return null;

  // 1. Totalmente Sem Conexão (Offline)
  if (!isConnected || type === 'none') {
    return (
      <View style={[styles.badge, styles.bgOffline]}>
        <FontAwesome5 name="wifi" size={10} color="#fff" />
        <Text style={styles.text}>Offline</Text>
      </View>
    );
  }

  // 2. Wi-Fi conectado, mas sem internet real (Ngrok fora / Sem gateway)
  if (isInternetReachable === false) {
    return (
      <View style={[styles.badge, styles.bgWarning]}>
        <FontAwesome5 name="exclamation-triangle" size={10} color="#fff" />
        <Text style={styles.text}>Sem Internet</Text>
      </View>
    );
  }

  // 3. Conectado e estável via Wi-Fi
  if (type === 'wifi') {
    return (
      <View style={[styles.badge, styles.bgWifi]}>
        <FontAwesome5 name="wifi" size={10} color="#fff" />
        <Text style={styles.text}>Wi-Fi</Text>
      </View>
    );
  }

  // 4. Conectado via Dados Móveis (4G/5G)
  if (type === 'cellular') {
    return (
      <View style={[styles.badge, styles.bgCellular]}>
        <FontAwesome5 name="signal" size={10} color="#fff" />
        <Text style={styles.text}>Dados</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 15, // Afasta um pouco da borda direita da tela
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  bgWifi: {
    backgroundColor: '#2e7d32', // Verde
  },
  bgCellular: {
    backgroundColor: '#0288d1', // Azul
  },
  bgWarning: {
    backgroundColor: '#f57c00', // Laranja
  },
  bgOffline: {
    backgroundColor: '#d32f2f', // Vermelho
  },
});