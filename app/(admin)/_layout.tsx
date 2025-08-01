import { Slot } from 'expo-router'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AdminNotifications from '../components/admin/AdminNotifications'

const AdminLayout = () => {
    return (
        <SafeAreaView className='flex-1 '>
            <AdminNotifications />
            <Slot />
            {/* <Tabs>
                <Tabs.Screen name="raffles"
                    options={{ title: 'Sorteos' }}
                />
                <Tabs.Screen name="create-raffle"
                    options={{ href: null }}
                />
            </Tabs> */}

        </SafeAreaView>
    )
}

export default AdminLayout