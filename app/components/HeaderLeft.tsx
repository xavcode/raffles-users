import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

const HeaderLeft = () => {
    return (
        <Pressable onPress={() => router.replace('/(tabs)/')} className="ml-3">
            {({ pressed }) => (
                <View className={`flex-row items-center rounded-lg p-2 ${pressed ? 'bg-indigo-100' : 'bg-transparent'}`}>
                    <Ionicons name="home-outline" size={20} color="#4f46e5" />
                    <Text className="text-indigo-600 font-quicksand-bold text-base ml-1.5">Inicio</Text>
                </View>
            )}
        </Pressable>
    )
}

export default HeaderLeft