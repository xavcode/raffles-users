// convex/notifications.ts
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Acción interna para enviar la notificación usando el servicio de Expo
export const send = internalAction({
  args: {
    pushToken: v.string(),
    message: v.string(),
    title: v.string(),
  },
  handler: async (_, { pushToken, message, title }) => {
    const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

    // Comprueba si el token es un token válido de Expo
    if (!/^ExponentPushToken\[.*\]$/.test(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token.`);
      return;
    }

    // Construye el cuerpo de la solicitud
    const requestBody = {
      to: pushToken,
      // Aquí especificamos el nombre del archivo de sonido que añadimos en assets/sounds.
      // Expo se encargará de encontrarlo y usarlo en la notificación.
      // sound: "notification.wav",
      sound: "default",
      title: title,
      body: message,
      data: { withSome: "data" }, // Puedes enviar datos adicionales aquí para manejar la navegación
    };

    // Envía la notificación
    try {
      const response = await fetch(expoPushEndpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Puedes añadir lógica para manejar la respuesta de Expo si es necesario
      const result = await response.json();
      if (result.data.status === 'error') {
        console.error(`Error sending notification: ${result.data.message}`);
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  },
});


export const sendToAllUsers = internalAction({
  args: {
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { title, message }) => {
    // 1. Obtenemos todos los usuarios que tienen un token de notificación.
    // Usamos `runQuery` porque las acciones no pueden acceder a la BD directamente.
    const users = await ctx.runQuery(internal.users.getUsersWithPushTokens);

    // 2. Por cada usuario, programamos una acción para enviarle la notificación.
    // Hacemos esto para que los envíos se procesen en paralelo y no bloqueen la acción principal.
    for (const user of users) {
      if (user.pushToken) {
        await ctx.runAction(internal.notifications.send, {
          pushToken: user.pushToken,
          title: title,
          message: message,
        });
      }
    }
  },
});