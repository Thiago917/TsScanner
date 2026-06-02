import { useGlobalNetInfo } from '@/contexts/NetInfoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useRef } from 'react';

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function useBackgroundSync() {
  const isSyncing = useRef(false);
  const { isConnected, isInternetReachable } = useGlobalNetInfo(); 

  useEffect(() => {
    const podeRodarSync = isConnected && isInternetReachable !== false;

    if (podeRodarSync && !isSyncing.current) {
      console.log('[Sync Service] Rede restabelecida ou estável via Contexto Global. Rodando Sync...');
      runSync();
    }
  }, [isConnected, isInternetReachable]); 

  const runSync = async () => {
    isSyncing.current = true;
    console.log('[Sync Service] Iniciando varredura da fila offline...');
    
    try {
      const saved = await AsyncStorage.getItem('checking_queue');
      if (!saved) { isSyncing.current = false; return; }

      let parsedQueue = JSON.parse(saved);
      if (parsedQueue.length === 0) { isSyncing.current = false; return; }

      console.log(`[Sync Service] Fila local contém ${parsedQueue.length} OPs para enviar.`);
      const uploadedIds: string[] = [];

      for (const conf of parsedQueue) {
        try {
          console.log(`[Sync Service] Tentando enviar OP: ${conf.op}...`);
          
          const response = await axios.post(`${api_url}/warehouse/move-to-slot`, conf, {
            timeout: 15000 
          });
          
          if (!response.data.error) {
            uploadedIds.push(conf.uid);
            console.log(`[Sync Service] OP ${conf.op} enviada com sucesso!`);
          } else {
            console.log(`[Sync Service] Laravel recusou a OP ${conf.op}:`, response.data.message);
          }
        } catch (apiErr) {
          console.log(`[Sync Service] Falha na tentativa de envio da OP ${conf.op}. Parando loop.`);
          break; 
        }
      }

      if (uploadedIds.length > 0) {
        const remainingQueue = parsedQueue.filter((item: any) => !uploadedIds.includes(item.uid));
        await AsyncStorage.setItem('checking_queue', JSON.stringify(remainingQueue));
        console.log(`[Sync Service] Fila limpa! Restaram ${remainingQueue.length} itens no celular.`);
      }

    } catch (err) {
      console.log('[Sync Service] Erro catastrófico no runSync:', err);
    } finally {
      isSyncing.current = false;
    }
  };
}