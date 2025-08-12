// convex/notifications.ts
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Acción interna para enviar la notificación usando el servicio de Expo
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    message: v.string(),
    title: v.string(),
    data: v.optional(v.any()), // Añadimos un campo opcional para enviar datos extra (ej: IDs para navegación)
  },
  handler: async (_, { pushToken, message, title, data }) => {
    const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

    // Comprueba si el token es un token válido de Expo
    if (!/^ExponentPushToken\[.*\]$/.test(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token.`);
      return;
    }

    // Construye el cuerpo de la solicitud
    const requestBody = {
      to: pushToken,
      // --- Propiedades para asegurar la visibilidad y el sonido/vibración ---
      sound: "default", // Reproduce el sonido de notificación por defecto.
      vibrate: true, // Activa la vibración.
      priority: "high", // Prioridad alta para que aparezca la notificación emergente.
      channelId: "alerts", // ID del canal de notificación configurado en la app.
      // --- Contenido de la notificación ---
      title: title,
      body: message,
      data: data, // Enviamos los datos para manejar la navegación al tocar la notificación
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
        await ctx.runAction(internal.notifications.sendPushNotification, {
          pushToken: user.pushToken,
          title: title,
          message: message,
          // Aquí podrías pasar datos genéricos si fuera necesario
        });
      }
    }
  },
});

/**
 * Acción interna para notificar a todos los administradores sobre un pago que necesita ser verificado.
 */
export const sendPaymentConfirmationToAdmins = internalAction({
  args: {
    title: v.string(),
    message: v.string(),
    purchaseId: v.id("purchases"),
  },
  handler: async (ctx, { title, message, purchaseId }) => {
    // 1. Obtenemos todos los usuarios que son administradores usando la query que creamos.
    const admins = await ctx.runQuery(internal.users.getAdminsWithPushTokens);

    // 2. Por cada admin, programamos una acción para enviarle la notificación.
    for (const admin of admins) {
      await ctx.runAction(internal.notifications.sendPushNotification, {
        pushToken: admin.pushToken!,
        title: title,
        message: message,
        // Enviamos el ID de la compra para que el admin pueda navegar directamente a ella.
        data: { type: 'NEW_PAYMENT_CONFIRMATION', purchaseId: purchaseId },
      });
    }
  },
});