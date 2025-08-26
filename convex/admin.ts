import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { paymentMethodsFields } from "./schema";

/**
 * Métricas generales para el panel de administración.
 * Nota: Para grandes volúmenes de datos, convendría migrar a consultas
 * basadas en índices y/o acumuladores. Para el tamaño actual del proyecto,
 * una agregación simple en memoria es suficiente.
 */
export const getMetrics = query({
    handler: async (ctx) => {
        // Raffles
        const raffles = await ctx.db.query("raffles").collect();
        const totalRaffles = raffles.length;
        const activeRaffles = raffles.filter((r) => r.status === "active").length;
        const finishedRaffles = raffles.filter((r) => r.status === "finished").length;
        const cancelledRaffles = raffles.filter((r) => r.status === "cancelled").length;
        const ticketsSold = raffles.reduce((sum, r) => sum + (r.ticketsSold ?? 0), 0);

        // Purchases
        const purchases = await ctx.db.query("purchases").collect();
        const pendingConfirmations = purchases.filter((p) => p.status === "pending_confirmation").length;
        const expiredPurchases = purchases.filter((p) => p.status === "expired").length;
        const completedPurchases = purchases.filter((p) => p.status === "completed");
        const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
        const averagePurchaseValue = completedPurchases.length > 0 ? totalRevenue / completedPurchases.length : 0;

        // Tasa de venta promedio para sorteos finalizados
        const finishedRafflesWithSales = raffles.filter(r => r.status === 'finished' && r.totalTickets > 0);
        const totalSellThroughRate = finishedRafflesWithSales.reduce((sum, r) => sum + ((r.ticketsSold ?? 0) / r.totalTickets), 0);
        const averageSellThroughRate = finishedRafflesWithSales.length > 0 ? (totalSellThroughRate / finishedRafflesWithSales.length) * 100 : 0;

        // Users
        const users = await ctx.db.query("users").collect();
        const totalUsers = users.length;
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const newUsersLast7Days = users.filter(u => u._creationTime > sevenDaysAgo).length;

        // Top raffles por ventas (ticketsSold)
        const topRafflesByTicketsSold = [...raffles]
            .sort((a, b) => (b.ticketsSold ?? 0) - (a.ticketsSold ?? 0))
            .slice(0, 5)
            .map((r) => ({
                id: r._id,
                title: r.title,
                ticketsSold: r.ticketsSold ?? 0,
                totalTickets: r.totalTickets,
                status: r.status,
                imageUrl: r.imageUrl,
            }));

        return {
            totals: {
                totalRaffles,
                activeRaffles,
                finishedRaffles,
                cancelledRaffles,
                ticketsSold,
                totalUsers,
                pendingConfirmations,
                totalRevenue,
                averagePurchaseValue,
                averageSellThroughRate,
                newUsersLast7Days,
                expiredPurchases,
            },
            topRafflesByTicketsSold,
        };
    },
});

export const generateSalesReport = action({
    args: {
        startDate: v.optional(v.float64()),
        endDate: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        // La validación de admin ya está dentro de la query que llamamos
        const purchasesWithDetails = await ctx.runQuery(
            api.tickets.getAllCompletedPurchasesForReport, { startDate: args.startDate, endDate: args.endDate }
        );

        if (purchasesWithDetails.length === 0) {
            // Devuelve un string vacío si no hay datos, el frontend lo manejará
            return "";
        }

        // Encabezados del CSV
        const headers = [
            "ID Compra",
            "Fecha",
            "Sorteo",
            "Comprador",
            "Email",
            "Boletos",
            "Monto Total (COP)"
        ];

        const csvRows = [headers.join(",")];

        for (const purchase of purchasesWithDetails) {
            const row = [
                purchase._id,
                new Date(purchase._creationTime).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
                `"${purchase.raffleTitle.replace(/"/g, '""')}"`, // Escapa comillas dobles
                `"${(purchase.userFirstName + ' ' + purchase.userLastName).replace(/"/g, '""')}"`,
                purchase.userEmail,
                purchase.ticketCount,
                purchase.totalAmount
            ];
            csvRows.push(row.join(","));
        }

        return csvRows.join("\n");
    },
});

export const getSettings = query({
    handler: async (ctx) => {
        const settings = await ctx.db.query('settings').first();
        if (!settings) {
            return { purchasesEnabled: true, releaseTime: 30, maintenanceMessage: undefined };
        }
        return {
            purchasesEnabled: settings.purchasesEnabled,
            releaseTime: settings.releaseTime,
            maintenanceMessage: settings.maintenanceMessage,
        };
    },
});



export const createPaymentMethod = mutation({
    args: paymentMethodsFields,
    handler: async (ctx, args) => {
        return await ctx.db.insert("paymentMethods", args)
    }
})

export const deletePaymentMethod = mutation({
    args: { paymentMethodId: v.id("paymentMethods") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.paymentMethodId)
    }
})

export const getPaymentMethods = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('paymentMethods').collect()
    }
})

export const setPurchasesEnabled = mutation({
    args: { enabled: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('No autenticado');
        const admin = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject)).unique();
        if (!admin || admin.userType !== 'admin') throw new Error('Permisos insuficientes');
        const settings = await ctx.db.query('settings').first();
        if (!settings) {
            await ctx.db.insert('settings', { purchasesEnabled: args.enabled, releaseTime: 30 });
        } else {
            await ctx.db.patch(settings._id, { purchasesEnabled: args.enabled });
        }
    }
});

export const setReleaseTime = mutation({
    args: { minutes: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('No autenticado');
        const admin = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject)).unique();
        if (!admin || admin.userType !== 'admin') throw new Error('Permisos insuficientes');
        const minutes = args.minutes;
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) throw new Error('Minutos inválidos');
        const settings = await ctx.db.query('settings').first();
        if (!settings) {
            await ctx.db.insert('settings', { purchasesEnabled: true, releaseTime: minutes });
        } else {
            await ctx.db.patch(settings._id, { releaseTime: minutes });
        }
    }
});
