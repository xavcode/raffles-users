import { Stack } from 'expo-router';
import React from 'react';

export default function PurchasesStackLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerTitle: 'Mis Compras',
                    headerLargeTitle: true,
                    headerShown: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#f8fafc' },
                    headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
                }}
            />
            <Stack.Screen
                name="[purchaseId]" // Asegúrate que esto coincida con tu archivo de detalle, ej: [purchaseId]
                options={{
                    title: 'Detalle de la compra',
                    // headerShown: false,
                    headerStyle: { backgroundColor: '#f8fafc' },
                    headerTitleStyle: { fontFamily: 'Quicksand-Bold' },
                }}
            />
        </Stack>
    );
}