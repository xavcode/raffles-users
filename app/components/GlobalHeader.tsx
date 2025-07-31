import { useUser } from '@clerk/clerk-expo';
import { View, Text, Image } from 'react-native';

const GlobalHeader = () => {
    const { user } = useUser();

    return (
        <View className="flex-row items-center justify-between p-4 bg-white-100 border-b border-gray-200">
            <View>
                <Text className="text-lg font-quicksand-medium text-gray-500">Hola,</Text>
                <Text className="text-xl font-quicksand-bold text-dark-100">{user?.firstName || 'Usuario'}</Text>
            </View>
            <Image source={{ uri: user?.imageUrl }} className="w-12 h-12 rounded-full" />
        </View>
    );
};

export default GlobalHeader;
