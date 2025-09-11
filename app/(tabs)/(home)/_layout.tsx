import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{

        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTintColor: '#1e293b', // text-slate-800
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
        },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[raffleId]" options={{ headerShown: false }} />
    </Stack>
  );
}