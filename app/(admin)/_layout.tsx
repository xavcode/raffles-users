import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link, Redirect, Tabs, useRouter } from 'expo-router'; // Importar Link y useRouter
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native'; // Importar Pressable

const AdminLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const convexUser = useQuery(api.users.getCurrent);
  const router = useRouter(); // Inicializar useRouter

  if (!isLoaded || !isSignedIn || convexUser === undefined) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-2 text-slate-500">Cargando...</Text>
      </View>
    );
  }

  // Redirigir si el usuario no es administrador
  if (convexUser === null || convexUser.userType !== 'admin') {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Mantenerlo falso aquí y activarlo por pantalla si se necesita encabezado nativo
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontFamily: 'Quicksand-Bold',
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          headerShown: true, // Activar encabezado para esta pantalla
          headerLeft: () => ( // Añadir botón de inicio
            <Link href="/(tabs)/" asChild>
              <Pressable className="ml-3 flex-row items-center p-2 rounded-lg active:bg-indigo-100">
                <Ionicons name="home-outline" size={20} color="#4f46e5" />
                <Text className="text-primary font-quicksand-bold ml-1.5">Inicio</Text>
              </Pressable>
            </Link>
          ),
          headerTitleStyle: { fontFamily: 'Quicksand-Bold', fontSize: 18 }, // Estilo del título
          tabBarIcon: ({ color }) => <Ionicons name="analytics-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users/index"
        options={{
          title: 'Gestión de Usuarios', // Título actualizado para ser más descriptivo
          headerShown: true, // Activar encabezado para esta pantalla
          headerLeft: () => ( // Añadir botón de inicio
            <Link href="/(tabs)/" asChild>
              <Pressable className="ml-3 flex-row items-center p-2 rounded-lg active:bg-indigo-100">
                <Ionicons name="home-outline" size={20} color="#4f46e5" />
                <Text className="text-primary font-quicksand-bold ml-1.5">Inicio</Text>
              </Pressable>
            </Link>
          ),
          headerTitleStyle: { fontFamily: 'Quicksand-Bold', fontSize: 18 }, // Estilo del título
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="raffles/index"
        options={{
          title: 'Gestión de Rifas', // Título actualizado
          headerShown: true, // Activar encabezado para esta pantalla
          headerLeft: () => ( // Añadir botón de inicio
            <Link href="/(tabs)/" asChild>
              <Pressable className="ml-3 flex-row items-center p-2 rounded-lg active:bg-indigo-100">
                <Ionicons name="home-outline" size={20} color="#4f46e5" />
                <Text className="text-primary font-quicksand-bold ml-1.5">Inicio</Text>
              </Pressable>
            </Link>
          ),
          headerTitleStyle: { fontFamily: 'Quicksand-Bold', fontSize: 18 }, // Estilo del título
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="purchases/_layout" options={{ href: null }} />
      <Tabs.Screen name="reports/index" options={{ href: null }} />
      <Tabs.Screen name="winners/index" options={{ href: null }} />
    </Tabs>
  );
};

export default AdminLayout;