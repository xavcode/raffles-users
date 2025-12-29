import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, View } from 'react-native'

const HeaderRigth = () => {
    return (
        <Pressable onPress={() => { router.push('/(admin)/settings') }}>
            {
                ({ pressed }) => (
                    <View className={`flex mr-5 p-2 rounded-lg ${pressed ? 'bg-indigo-100' : 'bg-transparent'}`}>
                        <Ionicons name="settings-outline" size={28} color={'#4f46e5'} />
                    </View>
                )
            }
        </Pressable>
    )
}

export default HeaderRigth