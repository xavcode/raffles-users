import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, View } from 'react-native'

const HeaderRigth = () => {
    return (
        <Pressable onPress={() => { router.push('/(admin)/settings') }}>
            {
                ({ pressed }) => (
                    <View className={`w-12 h-12 items-center justify-center rounded-2xl ${pressed ? 'bg-indigo-100' : 'bg-indigo-50'}`}>
                        <Ionicons name="settings-sharp" size={24} color={'#4f46e5'} />
                    </View>
                )
            }
        </Pressable>
    )
}

export default HeaderRigth
