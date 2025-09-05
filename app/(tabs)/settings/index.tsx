import Paymentmethods from '@/app/components/Paymentmethods'; // Importar el componente Paymentmethods
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type UserPreview = {
  email: string
  userName: string // Usar userName en lugar de firstName y lastName
  role: 'free' | 'admin'
}


type PaymentMethod = Doc<'paymentMethods'>

const Settings = () => {



  const [reservationMinutes, setReservationMinutes] = useState<string>('30')
  const [savedReservationMinutes, setSavedReservationMinutes] = useState<string>('30')
  const [purchasesEnabledLocal, setPurchasesEnabledLocal] = useState<boolean>(true)
  const [isSavingReservation, setIsSavingReservation] = useState(false)
  const [createPaymentMethodForm, setCreatePaymentMethodForm] = useState({ name: '', paymentsNumber: '', userName: '' })

  const [searchEmail, setSearchEmail] = useState('')
  const [queryEmail, setQueryEmail] = useState<string | null>(null)
  const [userResult, setUserResult] = useState<UserPreview | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [isCreatingPaymentMethod, setIsCreatingPaymentMethod] = useState(false)

  const settings = useQuery(api.admin.getSettingsRaffle)
  const setRafflePurchasesEnabled = useMutation(api.admin.setRafflePurchasesEnabled)
  // const setReleaseTime = useMutation(api.admin.setReleaseTime)
  const updateRole = useMutation(api.users.updateRole)
  const createPaymentMethod = useMutation(api.admin.createPaymentMethod)
  const deletePaymentMethod = useMutation(api.admin.deletePaymentMethod)


  const isReservationDirty = useMemo(() => reservationMinutes !== savedReservationMinutes, [reservationMinutes, savedReservationMinutes])
  const convexUser = useQuery(api.users.getCurrent)
  const paymentMethods = useQuery(api.admin.getPaymentMethods, convexUser?._id ? { ownerId: convexUser._id } : 'skip')

  useEffect(() => {
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
      // await setReleaseTime({ minutes })
      setSavedReservationMinutes(String(minutes))
      Toast.show({ type: 'success', text1: 'Guardado', text2: 'Tiempo de reserva actualizado.' })
    } finally {
      setIsSavingReservation(false)
    }
  }

  //Gestion paymentsMethods
  const handleCreatePaymentMethod = async () => {
    if (!createPaymentMethodForm.name.trim() || !createPaymentMethodForm.paymentsNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campos requeridos',
        text2: 'Por favor, completa el nombre y el número.',
      })
      return
    }
    const cleanedName = createPaymentMethodForm.name.trim();
    const cleanedUserName = createPaymentMethodForm.userName.trim();
    const cleanedPaymentsNumber = createPaymentMethodForm.paymentsNumber.trim().replace(/\s+/g, '');

    setIsCreatingPaymentMethod(true)
    try {
      await createPaymentMethod({
        name: cleanedName,
        paymentsNumber: cleanedPaymentsNumber,
        userName: cleanedUserName,
        isActive: true,
        ownerId: convexUser?._id as Id<'users'>
      })
      Toast.show({
        type: 'success',
        text1: '¡Guardado!',
        text2: 'El nuevo método de pago ha sido agregado.'
      })
      setCreatePaymentMethodForm({ name: '', paymentsNumber: '', userName: '' }) // Limpiar el formulario
    } catch (error) {
      console.log(error)
      Toast.show({
        type: 'error',
        text1: 'Error al crear el metodo de pago',
        text2: 'No se pudo guardar el método de pago.'
      })
    } finally {
      setIsCreatingPaymentMethod(false)
    }
  }



  // Gestión de usuarios
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
      userName: searchedUser.userName ?? '', // Asignar userName
      role: (searchedUser.userType as 'free' | 'admin') ?? 'free'
    })
  }, [searchedUser, queryEmail])

  const handleChangeRole = async (role: 'free' | 'admin') => {
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">

      {/* <Stack.Screen options={{ title: 'Configuración', headerLargeTitle: true }} /> */}
      <KeyboardAwareScrollView
        contentContainerClassName='flex-1'
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        enableResetScrollToCoords={true}
        resetScrollToCoords={{ x: 0, y: 0 }}
        extraScrollHeight={20}
      >
        <ScrollView
          className="p-4 pb-10"
          keyboardShouldPersistTaps="always"
        >


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
                    <Text className="text-base font-quicksand-bold text-slate-800" numberOfLines={1}>{userResult.userName}</Text>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>{userResult.email}</Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-slate-200">
                    <Text className="text-xs font-quicksand-bold text-slate-700 uppercase">{userResult.role === 'free' ? 'Usuario' : 'Admin'}</Text>
                  </View>
                </View>

                <View className="flex-row gap-x-3 mt-1">
                  <Pressable
                    onPress={() => handleChangeRole('free')}
                    disabled={isSavingRole || userResult.role === 'free'}
                    className={`flex-1 h-11 rounded-lg items-center justify-center ${userResult.role === 'free' ? 'bg-slate-300' : 'bg-slate-200 active:bg-slate-300'}`}
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

          {/* Sección: metodos de pago */}
          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50 mb-5">
            <View className="flex-row items-center mb-3">
              <Ionicons name="card-outline" size={18} color="#64748b" />
              <Text className="ml-2 text-base font-quicksand-bold text-slate-800">Métodos de Pago</Text>
            </View>
            <Text className="text-sm text-slate-600 mb-4">Agrega o elimina los métodos de pago que los usuarios verán al comprar.</Text>

            {/* Formulario para agregar */}
            <View className='space-y-3 gap-2 mb-4'>
              <TextInput
                className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                placeholder='Nequi - daviplata'
                value={createPaymentMethodForm.name}
                onChangeText={(text) => setCreatePaymentMethodForm({ ...createPaymentMethodForm, name: text })}
              />
              <TextInput
                className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                placeholder='Andres Perez'
                value={createPaymentMethodForm.userName}
                onChangeText={(text) => setCreatePaymentMethodForm({ ...createPaymentMethodForm, userName: text })}
              />
              <TextInput
                className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-lg px-4 text-base font-quicksand-medium"
                value={createPaymentMethodForm.paymentsNumber}
                onChangeText={(text) => setCreatePaymentMethodForm({ ...createPaymentMethodForm, paymentsNumber: text })}
                placeholder='300 000 00 00'
                keyboardType="number-pad"
              />
              <Pressable onPress={handleCreatePaymentMethod} disabled={isCreatingPaymentMethod} className="h-12 rounded-lg items-center justify-center bg-primary active:bg-primary/80 disabled:bg-primary/40">
                {isCreatingPaymentMethod ? <ActivityIndicator color="white" /> : <Text className="text-white font-quicksand-bold">Agregar Método</Text>}
              </Pressable>
            </View>

            {/* Lista de métodos existentes */}
            <View className="border-t border-slate-200 pt-3 space-y-3 gap-2">
              {paymentMethods === undefined && <ActivityIndicator className="mt-2" />}
              {/* Reemplazamos la lista manual por el componente Paymentmethods */}
              <Paymentmethods paymentMethods={paymentMethods} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Settings