import CustomHeader from '@/components/CustomHeader';
import TabScreenHeader from '@/components/TabScreenHeader';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import React from 'react';

export default function PurchasesStackLayout() {
  const convexUser = useQuery(api.users.getCurrent);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => (
            <TabScreenHeader
              userName={convexUser?.userName}
              isAdmin={convexUser?.userType === 'admin'}
            />
          ),
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
