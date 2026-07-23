import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

type NetInfoContextType = {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
    loading: boolean;
};

const NetInfoContext = createContext<NetInfoContextType>({} as NetInfoContextType);

const normalizeNetworkState = (netState: any): NetInfoContextType => {
    const isConnected = netState?.isConnected ?? false;
    const isInternetReachable = typeof netState?.isInternetReachable === 'boolean'
        ? netState.isInternetReachable
        : isConnected;

    return {
        isConnected,
        isInternetReachable,
        type: netState?.type ?? 'unknown',
        loading: false,
    };
};

export const NetInfoProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<NetInfoContextType>({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
        loading: true,
    });

    useEffect(() => {
        let mounted = true;

        const updateState = (netState: any) => {
            if (!mounted) return;
            const normalized = normalizeNetworkState(netState);
            console.log('[NetInfo] Estado de rede atualizado:', {
                type: normalized.type,
                isConnected: normalized.isConnected,
                isInternetReachable: normalized.isInternetReachable,
            });
            setState(normalized);
        };

        console.log('[NetInfo] Consultando estado inicial da rede...');
        NetInfo.fetch()
            .then(updateState)
            .catch((error) => {
                console.log('[NetInfo] Erro ao consultar estado inicial:', error);
                updateState({ isConnected: false, isInternetReachable: false, type: 'unknown' });
            });

        const unsubscribe = NetInfo.addEventListener((netState) => {
            updateState(netState);
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    return (
        <NetInfoContext.Provider value={state}>
            {children}
        </NetInfoContext.Provider>
    );
};

export const useGlobalNetInfo = () => useContext(NetInfoContext);