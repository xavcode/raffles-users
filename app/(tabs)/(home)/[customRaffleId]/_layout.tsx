import CustomHeader from "@/components/CustomHeader";
import { Stack } from 'expo-router';
import React from 'react';

export default function RaffleDetailLayout() {
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
                    header: ({ options }) => <CustomHeader title={options.title || ""} showBackButton={true} />
                }} />
            <Stack.Screen
                name="sales"
                options={{
                    headerShown: true,
                    title: 'Ventas del Sorteo'
                }} />
        </Stack>
    );
}
