import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

type NetInfoContextType = {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
    loading: boolean;
};

const NetInfoContext = createContext<NetInfoContextType>({} as NetInfoContextType);

export const NetInfoProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<NetInfoContextType>({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
        loading: true,
    });

    useEffect(() => {
        // Escuta mudanças de rede de forma global
        const unsubscribe = NetInfo.addEventListener((netState) => {
            setState({
                isConnected: netState.isConnected,
                isInternetReachable: netState.isInternetReachable,
                type: netState.type,
                loading: false,
            });
        });

        return () => unsubscribe();
    }, []);

    return (
        <NetInfoContext.Provider value={state}>
            {children}
        </NetInfoContext.Provider>
    );
};

export const useGlobalNetInfo = () => useContext(NetInfoContext);