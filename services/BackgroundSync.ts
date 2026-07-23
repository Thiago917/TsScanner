import { useGlobalNetInfo } from '@/contexts/NetInfoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function useBackgroundSync() {
  const isSyncing = useRef(false);
  const { isConnected, isInternetReachable } = useGlobalNetInfo(); 

  const hasNetworkAccess = isConnected === true && (isInternetReachable === true || isInternetReachable === null);

  const runSync = useCallback(async () => {
    console.log('[Sync Service] runSync chamado:', {
      isSyncing: isSyncing.current,
      isConnected,
      isInternetReachable,
      hasNetworkAccess,
    });

    if (isSyncing.current || !hasNetworkAccess) {
      console.log('[Sync Service] Sincronização ignorada:', {
        motivo: isSyncing.current ? 'já existe uma sincronização em andamento' : 'sem acesso à rede',
      });
      return;
    }

    isSyncing.current = true;
    console.log('[Sync Service] Rede disponível. Verificando fila offline...');
    
    try {
      const saved = await AsyncStorage.getItem('checking_queue');
      console.log('[Sync Service] AsyncStorage checking_queue:', saved ? `${saved.length} caracteres` : 'chave inexistente');
      if (!saved) { isSyncing.current = false; return; }

      const parsedQueue = JSON.parse(saved);
      console.log('[Sync Service] Fila parseada:', {
        isArray: Array.isArray(parsedQueue),
        total: Array.isArray(parsedQueue) ? parsedQueue.length : 'inválida',
        itens: Array.isArray(parsedQueue) ? parsedQueue.map((item: any) => ({ uid: item?.uid, op: item?.op, status: item?.status })) : [],
      });
      if (!Array.isArray(parsedQueue) || parsedQueue.length === 0) { isSyncing.current = false; return; }

      console.log(`[Sync Service] Fila local contém ${parsedQueue.length} OPs para enviar.`);
      const uploadedIds: string[] = [];

      for (const conf of parsedQueue) {
        try {
          console.log('[Sync Service] Tentando enviar item:', {
            uid: conf?.uid,
            op: conf?.op,
            apiUrl: `${api_url}/warehouse/move-to-slot`,
          });
          
          const response = await axios.post(`${api_url}/warehouse/move-to-slot`, conf, {
            timeout: 15000 
          });
          
          if (!response.data.error) {
            uploadedIds.push(conf.uid);
            console.log('[Sync Service] Item enviado com sucesso:', { uid: conf.uid, op: conf.op, response: response.data });
          } else {
            console.log('[Sync Service] API recusou o item:', { uid: conf.uid, op: conf.op, response: response.data });
          }
        } catch (apiErr) {
          if (axios.isAxiosError(apiErr)) {
            console.log('[Sync Service] Falha HTTP ao enviar item:', {
              uid: conf?.uid,
              op: conf?.op,
              message: apiErr.message,
              code: apiErr.code,
              status: apiErr.response?.status,
              response: apiErr.response?.data,
            });
          } else {
            console.log('[Sync Service] Falha desconhecida ao enviar item:', { uid: conf?.uid, op: conf?.op, error: apiErr });
          }
          console.log('[Sync Service] Parando loop para preservar os itens restantes da fila.');
          break; 
        }
      }

      if (uploadedIds.length > 0) {
        const remainingQueue = parsedQueue.filter((item: any) => !uploadedIds.includes(item.uid));
        await AsyncStorage.setItem('checking_queue', JSON.stringify(remainingQueue));
        console.log('[Sync Service] Fila atualizada:', {
          enviados: uploadedIds,
          restantes: remainingQueue.map((item: any) => ({ uid: item?.uid, op: item?.op })),
        });
      } else {
        console.log('[Sync Service] Nenhum item foi removido da fila nesta tentativa.');
      }

    } catch (err) {
      console.log('[Sync Service] Erro catastrófico no runSync:', err);
    } finally {
      isSyncing.current = false;
      console.log('[Sync Service] runSync finalizado.');
    }
  }, [hasNetworkAccess, isConnected, isInternetReachable]);

  useEffect(() => {
    console.log('[Sync Service] Efeito de rede executado:', { hasNetworkAccess, isConnected, isInternetReachable });
    if (!hasNetworkAccess) return;
    void runSync();
  }, [hasNetworkAccess, isConnected, isInternetReachable, runSync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[Sync Service] AppState mudou:', { nextAppState, hasNetworkAccess });
      if (nextAppState === 'active' && hasNetworkAccess) {
        void runSync();
      }
    });

    return () => subscription.remove();
  }, [hasNetworkAccess, runSync]);
}