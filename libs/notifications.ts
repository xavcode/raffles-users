import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración global para cómo se manejan las notificaciones cuando la app está en primer plano.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function handleRegistrationError(errorMessage: string) {
    // En producción, podrías registrar este error en un servicio de monitoreo.
    console.error(errorMessage);
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            handleRegistrationError('Permission not granted to get push token for push notification!');
            return;
        }
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            handleRegistrationError('Project ID not found in app.json/app.config.js');
            return;
        }
        try {
            return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
        }
    } else {
        // No es un error crítico si es un emulador.
        console.log('Must use physical device for Push Notifications');
    }
}