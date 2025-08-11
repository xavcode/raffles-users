import { api } from '@/convex/_generated/api'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from 'convex/react'
import { Stack } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Pressable, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

type UserPreview = {
    email: string
    firstName?: string
    lastName?: string
    role: 'member' | 'admin'
}

const Settings = () => {
    // Reserva de boletos
    const settings = useQuery(api.admin.getSettings)
    const setPurchasesEnabled = useMutation(api.admin.setPurchasesEnabled)
    const setReleaseTime = useMutation(api.admin.setReleaseTime)
    const updateRole = useMutation(api.users.updateRole)

    const [reservationMinutes, setReservationMinutes] = useState<string>('30')
    const [savedReservationMinutes, setSavedReservationMinutes] = useState<string>('30')
    const [purchasesEnabledLocal, setPurchasesEnabledLocal] = useState<boolean>(true)
    const [isSavingReservation, setIsSavingReservation] = useState(false)

    const isReservationDirty = useMemo(() => reservationMinutes !== savedReservationMinutes, [reservationMinutes, savedReservationMinutes])

    React.useEffect(() => {
        if (settings) {
            setReservationMinutes(String(settings.releaseTime ?? 30))
            setSavedReservationMinutes(String(settings.releaseTime ?? 30))
            setPurchasesEnabledLocal(settings.purchasesEnabled ?? true)
        }
    }, [settings])

    const handleSaveReservation = async () => {
        const minutes = parseInt(reservationMinutes, 10)
        if (isNaN(minutes) || minutes < 1 || minutes > 240) {
            Toast.show({ type: 'error', text1: 'Valor inválido', text2: 'Define un tiempo entre 1 y 240 minutos.' })
            return
        }
        try {
            setIsSavingReservation(true)
            await setReleaseTime({ minutes })
            setSavedReservationMinutes(String(minutes))
            Toast.show({ type: 'success', text1: 'Guardado', text2: 'Tiempo de reserva actualizado.' })
        } finally {
            setIsSavingReservation(false)
        }
    }

    // Gestión de usuarios
    const [searchEmail, setSearchEmail] = useState('')
    const [queryEmail, setQueryEmail] = useState<string | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [userResult, setUserResult] = useState<UserPreview | null>(null)
    const [isSavingRole, setIsSavingRole] = useState(false)

    const handleSearchUser = async () => {
        if (!searchEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchEmail)) {
            Toast.show({ type: 'error', text1: 'Correo inválido', text2: 'Escribe un correo válido para buscar.' })
            return
        }
        setIsSearching(true)
        setQueryEmail(searchEmail)
    }

    const searchedUser = useQuery(api.users.getByEmail, queryEmail ? { email: queryEmail } : 'skip')

    React.useEffect(() => {
        if (queryEmail === null) return
        if (searchedUser === undefined) return
        setIsSearching(false)
        if (!searchedUser) {
            setUserResult(null)
            Toast.show({ type: 'info', text1: 'Sin resultados', text2: 'No se encontró un usuario con ese correo.' })
            return
        }
        setUserResult({
            email: searchedUser.email ?? '',
            firstName: searchedUser.firstName,
            lastName: searchedUser.lastName,
            role: (searchedUser.userType as 'member' | 'admin') ?? 'member'
        })
    }, [searchedUser, queryEmail])

    const handleChangeRole = async (role: 'member' | 'admin') => {
        if (!userResult) return
        try {
            setIsSavingRole(true)
            await updateRole({ email: userResult.email, role })
            setUserResult({ ...userResult, role })
            Toast.show({ type: 'success', text1: 'Actualizado', text2: `Rol cambiado a ${role === 'admin' ? 'Admin' : 'Miembro'}.` })
        } finally {
            setIsSavingRole(false)
        }
    }

    // Preferencias locales adicionales
    const [pushEnabled, setPushEnabled] = useState(true)

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'Configuración', headerLargeTitle: true }} />

            <View className="p-4 pb-10">
                {/* Sección: Habilitar/Deshabilitar compras (Switch) */}
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Ionicons name="cart-outline" size={18} color="#64748b" />
                            <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Habilitar compras</Text>
                        </View>
                        <Switch
                            value={purchasesEnabledLocal}
                            onValueChange={async (next) => {
                                setPurchasesEnabledLocal(next)
                                try {
                                    await setPurchasesEnabled({ enabled: next })
                                    Toast.show({ type: 'success', text1: 'Actualizado', text2: next ? 'Compras habilitadas' : 'Compras deshabilitadas' })
                                } catch (e) {
                                    setPurchasesEnabledLocal(!next)
                                    Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar el estado de compras.' })
                                }
                            }}
                            thumbColor={purchasesEnabledLocal ? '#4f46e5' : undefined}
                        />
                    </View>
                    <Text className="text-xs text-slate-500 mt-2">Si las deshabilitas, los usuarios no podrán reservar/comprar boletos temporalmente.</Text>
                </View>

                {/* Sección: Reservas */}
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-5">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="time-outline" size={18} color="#64748b" />
                        <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Tiempo de reserva</Text>
                    </View>
                    <Text className="text-sm text-slate-600 mb-3">Define por cuántos minutos se reservarán los boletos antes de liberarse automáticamente.</Text>
                    <View className="flex-row items-center gap-x-3">
                        <TextInput
                            className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                            placeholder="Ej: 30"
                            keyboardType="number-pad"
                            value={reservationMinutes}
                            onChangeText={setReservationMinutes}
                            maxLength={3}
                        />
                        <Pressable
                            onPress={handleSaveReservation}
                            disabled={!isReservationDirty || isSavingReservation}
                            className={`h-12 px-4 rounded-lg items-center justify-center ${isReservationDirty ? 'bg-primary' : 'bg-primary/50'}`}
                        >
                            <Text className="text-white font-quicksand-bold">Guardar</Text>
                        </Pressable>
                    </View>
                    <Text className="text-xs text-slate-500 mt-2">Actual: {savedReservationMinutes} min</Text>
                </View>

                {/* Sección: Permisos de usuario */}
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-5">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="shield-checkmark-outline" size={18} color="#64748b" />
                        <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Permisos de usuario</Text>
                    </View>
                    <Text className="text-sm text-slate-600 mb-3">Busca un usuario por correo y cambia entre rol de Miembro o Admin.</Text>
                    <View className="flex-row gap-x-3 mb-3">
                        <TextInput
                            className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                            placeholder="correo@ejemplo.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={searchEmail}
                            onChangeText={setSearchEmail}
                        />
                        <Pressable onPress={handleSearchUser} className="h-12 px-4 rounded-lg items-center justify-center bg-indigo-600 active:bg-indigo-700">
                            <Text className="text-white font-quicksand-bold">Buscar</Text>
                        </Pressable>
                    </View>

                    {isSearching && (
                        <View className="mt-2"><Text className="text-slate-500 text-sm">Buscando...</Text></View>
                    )}

                    {userResult && !isSearching && (
                        <View className="mt-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-1 pr-2">
                                    <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>{userResult.firstName} {userResult.lastName}</Text>
                                    <Text className="text-xs text-slate-500" numberOfLines={1}>{userResult.email}</Text>
                                </View>
                                <View className="px-2.5 py-1 rounded-full bg-slate-200">
                                    <Text className="text-xs font-quicksand-bold text-slate-700 uppercase">{userResult.role}</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-x-3 mt-1">
                                <Pressable
                                    onPress={() => handleChangeRole('member')}
                                    disabled={isSavingRole || userResult.role === 'member'}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center ${userResult.role === 'member' ? 'bg-slate-300' : 'bg-slate-200 active:bg-slate-300'}`}
                                >
                                    <Text className="font-quicksand-bold text-slate-800">Miembro</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleChangeRole('admin')}
                                    disabled={isSavingRole || userResult.role === 'admin'}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center ${userResult.role === 'admin' ? 'bg-indigo-600' : 'bg-indigo-500 active:bg-indigo-600'}`}
                                >
                                    <Text className="font-quicksand-bold text-white">Admin</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>

                {/* Sección: Preferencias */}
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Ionicons name="notifications-outline" size={18} color="#64748b" />
                            <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Notificaciones push</Text>
                        </View>
                        <Switch value={pushEnabled} onValueChange={setPushEnabled} thumbColor={pushEnabled ? '#4f46e5' : undefined} />
                    </View>
                    <Text className="text-xs text-slate-500 mt-2">Activa/desactiva recordatorios y avisos generales. (Configuración local)</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Settings