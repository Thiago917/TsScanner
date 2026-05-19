import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { useEffect, useRef } from 'react';

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function useBackgroundSync() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      
      if (state.isConnected && state.isInternetReachable !== false && !isSyncing.current) {
        await runSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const runSync = async () => {
    isSyncing.current = true;
    console.log('[Sync Service] Internet ativa detectada. Checando fila...');

    try {
      const saved = await AsyncStorage.getItem('checking_queue');
      if (!saved) {
        isSyncing.current = false;
        return;
      }

      let parsedQueue = JSON.parse(saved);

      if (parsedQueue.length === 0) {
        isSyncing.current = false;
        return;
      }

      console.log(`[Sync Service] Encontradas ${parsedQueue.length} conferências pendentes.`);

      const uploadedIds: string[] = [];

      for (const conf of parsedQueue) {
        try {
          console.log(`[Sync Service] Sincronizando OP: ${conf.op}...`);
          
          const response = await axios.post(`${api_url}/warehouse/move-to-slot`, conf);
          
          if (!response.data.error) {
            uploadedIds.push(conf.uid);
            console.log(`[Sync Service] OP ${conf.op} sincronizada com sucesso!`);
          } else {
            console.log(`[Sync Service] Servidor recusou a OP ${conf.op}:`, response.data.message);
          }
        } catch (apiErr) {
          console.log(`[Sync Service] Erro de rede ao enviar a OP ${conf.op}. Abortando loop.`);
          break;
        }
      }

      if (uploadedIds.length > 0) {
        const remainingQueue = parsedQueue.filter((item: any) => !uploadedIds.includes(item.uid));
        await AsyncStorage.setItem('checking_queue', JSON.stringify(remainingQueue));
        console.log(`[Sync Service] Fila atualizada. Restam ${remainingQueue.length} itens.`);
      }

    } catch (err) {
      console.log('[Sync Service] Erro crítico no processo de sincronização:', err);
    } finally {
      isSyncing.current = false;
    }
  };
}