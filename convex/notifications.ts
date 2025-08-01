// convex/notifications.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query para obtener notificaciones no leídas para el admin
export const getUnread = query({
  handler: async (ctx) => {
    // Aquí podrías añadir lógica de roles si solo los admins pueden ver esto
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_isRead", q => q.eq("isRead", false))
      .order("desc")
      .collect();
    return notifications;
  },
});

// Mutación para marcar una notificación como leída
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    // Aquí podrías añadir lógica de roles
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Mutación para marcar todas las notificaciones como leídas
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const unreadNotifications = await ctx.db.query("notifications").withIndex("by_isRead", q => q.eq("isRead", false)).collect();
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  }
});