import { Stack } from 'expo-router';
import React from 'react';

// --- AÑADE ESTE CÓDIGO AQUÍ ---

export const unstable_settings = {
  initialRouteName: 'index',
};


export default function HomeStackLayout() {
  return (

    <Stack
      screenOptions={{
        headerTintColor: '#1e293b', // text-slate-800
        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }} />
      <Stack.Screen
        name="[customRaffleId]"
        options={{
          headerShown: false, // Delegamos el header al layout interno
        }} />
    </Stack>
  );
}
