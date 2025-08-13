
import { useNetwork } from '@/contexts/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Text } from 'react-native';

const OfflineBanner = () => {
    const { isConnected } = useNetwork();

    if (isConnected === true || isConnected === null) {
        return null;
    }

    return (
        <MotiView
            from={{ translateY: 100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 bg-slate-800 p-3 mx-4 mb-4 rounded-lg shadow-lg flex-row items-center"
        >
            <Ionicons name="cloud-offline-outline" size={24} color="white" />
            <Text className="text-white font-quicksand-bold ml-3">Sin conexión a internet</Text>
        </MotiView>
    );
};

export default OfflineBanner;