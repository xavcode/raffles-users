import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean;
};

const CustomHeader = ({ title, showBackButton = false }: CustomHeaderProps) => {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View
      className='flex-row p-0 items-center justify-center h-20 px-4 bg-slate-50'
    >
      {showBackButton && (
        <Pressable onPress={handleBackPress} className='mr-3 active:opacity-30' >
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </Pressable>
      )}
      <View className={'flex-1' + (showBackButton ? ' items-start' : ' items-center')}>
        <Text className="text-2xl font-quicksand-bold text-gray-800">
          {title}
        </Text>
      </View>
    </View>
  );
};

export default CustomHeader;
