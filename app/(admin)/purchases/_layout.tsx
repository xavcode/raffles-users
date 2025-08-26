import { Stack } from 'expo-router';
import React from 'react';

export default function PurchasesStackLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    // Ocultamos este header porque el título "Ventas"
                    // ya lo gestiona el layout de pestañas principal.
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[purchaseId]"
                options={{
                    title: 'Detalle de la Compra',
                }}
            />
        </Stack>
    );
}