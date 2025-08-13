import { Stack } from 'expo-router';
import React from 'react';

export default function RafflesStackLayout() {
    return (
        <Stack
            screenOptions={{
                // Reutilizamos los estilos de header que ya tenías para consistencia
                headerStyle: {
                    backgroundColor: '#f8fafc', // slate-50
                },
                headerTintColor: '#1e293b', // text-slate-800
                headerTitleStyle: {
                    fontFamily: 'Quicksand-Bold',
                    fontSize: 18,
                },
                headerTitleAlign: 'center',
            }}>
            <Stack.Screen name="index" options={{ title: 'Administrar Sorteos' }} />
            <Stack.Screen name="[id]" options={{ title: 'Editar Sorteo' }} />
        </Stack>
    );
}