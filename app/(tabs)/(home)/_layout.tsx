import TabScreenHeader from "@/components/TabScreenHeader";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function HomeStackLayout() {
  const convexUser = useQuery(api.users.getCurrent);

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#1e293b',
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
        },
      }}>
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
        }} />
      <Stack.Screen
        name="[customRaffleId]"
        options={{
          headerShown: false,
        }} />
    </Stack>
  );
}
