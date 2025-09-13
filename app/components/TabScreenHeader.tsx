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
    <View style={{ backgroundColor: '#f8fafc', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 50, paddingHorizontal: 16 }}>
        <View style={{ marginRight: 'auto' }}>
          {userName ? (
            <Text className="text-lg font-quicksand-semibold text-primary">@{userName}</Text>
          ) : null}
        </View>

        <View style={{ marginLeft: 'auto' }}>
          {isAdmin ? (
            <Link href="/(admin)" asChild>
              <Pressable className="flex-row items-center bg-white p-3 rounded-full shadow-lg shadow-gray-300/50 active:bg-gray-100">
                <Ionicons name="shield-checkmark-outline" size={24} color="#4f46e5" />
                <Text className="text-primary font-quicksand-bold ml-2">Admin</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default TabScreenHeader;
