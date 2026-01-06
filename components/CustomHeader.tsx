import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean;
  renderRight?: () => React.ReactNode;
};

const CustomHeader = ({ title, showBackButton = false, renderRight }: CustomHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom - 8 }}
      className='bg-white border-b border-slate-100 shadow-sm shadow-slate-200/50'
    >
      <View className='flex-row items-center h-14 px-4'>
        {showBackButton && (
          <Pressable
            onPress={handleBackPress}
            className='mr-4 w-10 h-10 items-center justify-center rounded-xl bg-slate-50 active:bg-slate-100'
          >
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </Pressable>
        )}
        <View className={'flex-1' + (showBackButton ? ' items-start' : ' items-center')}>
          <Text className="text-xl font-quicksand-bold text-slate-800 tracking-tight" numberOfLines={1}>
            {title}
          </Text>
        </View>

        {renderRight ? (
          <View className="ml-4">
            {renderRight()}
          </View>
        ) : (
          showBackButton && <View className="w-10" />
        )}
      </View>
    </View>
  );
};

export default CustomHeader;
