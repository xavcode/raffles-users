import { useNetwork } from '@/contexts/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const OfflineBanner = () => {
    const { isConnected } = useNetwork();

    if (isConnected === true || isConnected === null) {
        return null;
    }

    // Esta es la versión para WEB. Es una vista estática sin animaciones.
    // No se importa 'moti' para evitar errores de compilación en web.
    return (
        <View className="absolute bottom-0 left-0 right-0 bg-slate-800 p-3 mx-4 mb-4 rounded-lg shadow-lg flex-row items-center">
            <Ionicons name="cloud-offline-outline" size={24} color="white" />
            <Text className="text-white font-quicksand-bold ml-3">Sin conexión a internet</Text>
        </View>
    );
};

export default OfflineBanner;