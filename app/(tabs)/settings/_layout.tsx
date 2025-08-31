import { Stack } from 'expo-router'
import React from 'react'

const SettingsStackLayout = () => {
    return (
        <Stack>
            <Stack.Screen name="index"
                options={{
                    title: 'Configuración',
                    headerLargeTitle: true,
                    headerShown: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#f8fafc' },
                    headerTitleStyle: { fontFamily: 'Quicksand-Bold' },

                }} />
        </Stack>
    )
}

export default SettingsStackLayout