import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { useEffect, useRef } from 'react';

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function useBackgroundSync() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false && !isSyncing.current) {
        runSync();
      }
    });

    const interval = setInterval(async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable !== false && !isSyncing.current) {
        runSync();
      }
    }, 15000); 

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const runSync = async () => {

    isSyncing.current = true;
    
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

      const uploadedIds: string[] = [];

      for (const conf of parsedQueue) {
        try {
          
          const response = await axios.post(`${api_url}/warehouse/move-to-slot`, conf, {
            timeout: 15000 
          });
          
          if (!response.data.error) {
            uploadedIds.push(conf.uid);
          } else {
          }
        } catch (apiErr) {
          break; 
        }
      }

      if (uploadedIds.length > 0) {
        const remainingQueue = parsedQueue.filter((item: any) => !uploadedIds.includes(item.uid));
        await AsyncStorage.setItem('checking_queue', JSON.stringify(remainingQueue));
      }

    } catch (err) {
      console.log('[Sync Service] Erro catastrófico no runSync:', err);
    } finally {
      isSyncing.current = false;
    }
  };
}