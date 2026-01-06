import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabScreenHeaderProps = {
  userName?: string | null;
  isAdmin?: boolean;
};

const TabScreenHeader = ({ userName, isAdmin }: TabScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom - 8 }}
      className='bg-white border-b border-slate-100 shadow-sm shadow-slate-200/50'
    >
      <View className='flex-row items-center justify-between h-14 px-4'>
        <View className="flex-1">
          {userName ? (
            <Text className="text-2xl font-quicksand-bold text-primary tracking-tight">@{userName}</Text>
          ) : (
            <Text className="text-2xl font-quicksand-bold text-slate-800 tracking-tight">Sorteos</Text>
          )}
        </View>

        <View>
          {isAdmin ? (
            <Link href="/(admin)" asChild>
              <Pressable className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 active:bg-indigo-100">
                <Ionicons name="shield-checkmark" size={18} color="#4f46e5" />
                <Text className="text-sm text-primary font-quicksand-bold ml-1.5">Admin</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default TabScreenHeader;
