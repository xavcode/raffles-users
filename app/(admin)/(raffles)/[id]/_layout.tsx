import { Stack } from 'expo-router'
import React from 'react'

const id_layout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#f8fafc', // slate-50
                },
                headerTintColor: '#1e293b', // text-slate-800
                headerTitleStyle: {
                    fontFamily: 'Quicksand-Bold',
                },
            }}>
            <Stack.Screen name="index" options={{ title: 'prueba', headerShown: true }} />
            <Stack.Screen name="sales" options={{ title: 'Ventas del sorteo' }} />
        </Stack>
    )
}

export default id_layout