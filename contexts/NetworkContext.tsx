import { useNetInfo } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
    isConnected: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
    const netInfo = useNetInfo();
    const [isConnected, setIsConnected] = useState<boolean | null>(netInfo.isConnected);

    useEffect(() => {
        // Actualizamos el estado solo cuando netInfo ha determinado el estado de la conexión.
        // netInfo.isConnected puede ser `null` en la carga inicial.
        if (netInfo.isConnected !== null) {
            setIsConnected(netInfo.isConnected);
        }
    }, [netInfo.isConnected]);

    return (
        <NetworkContext.Provider value={{ isConnected }}>
            {children}
        </NetworkContext.Provider>
    );
};

/**
 * Hook personalizado para acceder fácilmente al estado de la conexión de red.
 */
export const useNetwork = (): NetworkContextType => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork debe ser usado dentro de un NetworkProvider');
    }
    return context;
};