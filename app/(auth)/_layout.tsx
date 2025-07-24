import { Stack } from 'expo-router'
import React from 'react'

const Auth_layout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" options={{ title: 'Iniciar Sesión' }} />
            <Stack.Screen name="sign-up" options={{ title: 'Crear Cuenta' }} />
        </Stack>
    )
}

export default Auth_layout