import CustomHeader from '@/components/CustomHeader';
import { Stack } from 'expo-router';
import React from 'react';

export default function PurchasesStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Mis Compras',
          headerLargeTitle: false,
          headerShown: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
        }}
      />
      <Stack.Screen
        name="[purchaseId]"
        options={{
          header: ({ options }) => <CustomHeader title={options.title || "Detalles de la compra"} showBackButton={true} />
        }}
      />
    </Stack>
  );
}
