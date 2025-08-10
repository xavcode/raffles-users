import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const getRaffles = query({
    args: {
        // Hacemos el filtro de estado opcional para poder obtener
        // todos los sorteos (para el admin) o solo los activos (para usuarios).
        status: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        let queryBuilder;
        // Si se provee un estado, usamos el índice para una búsqueda eficiente.
        if (args.status) {
            queryBuilder = ctx.db
                .query("raffles")
                .withIndex("by_status", (q) => q.eq("status", args.status as any));
        } else {
            queryBuilder = ctx.db.query("raffles");
        }
        return await queryBuilder.order("desc").paginate(args.paginationOpts);
    }
});

export const getById = query({
    args: { id: v.id("raffles") },
    handler: async (ctx, args) => {
        const raffle = await ctx.db.get(args.id);
        return raffle;
    },
});

export const createRaffle = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        totalTickets: v.float64(),
        ticketPrice: v.float64(),
        prize: v.number(),
        startTime: v.float64(),
        endTime: v.float64(),
        imageUrl: v.string(),
        winCondition: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado. Por favor, inicia sesión.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador para crear un sorteo.");
        }

        const newRaffleId = await ctx.db.insert("raffles", {
            ...args,
            creatorId: user._id,
            ticketsSold: 0,
            status: "active",
        });

        await ctx.scheduler.runAfter(0, internal.notifications.sendToAllUsers, {
            title: "🎉 ¡Nuevo Sorteo Disponible!",
            message: `¡No te pierdas la oportunidad de ganar en nuestro nuevo sorteo: "${args.title}"!`,
        });

        return newRaffleId;
    },
});

export const updateRaffle = mutation({
    args: {
        id: v.id("raffles"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ticketPrice: v.optional(v.float64()),
        totalTickets: v.optional(v.float64()),
        imageUrl: v.optional(v.string()),
        prize: v.optional(v.float64()),
        status: v.optional(v.string()),
        winningTicketNumber: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador para modificar un sorteo.");
        }

        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
        return true;
    },
});

export const deleteRaffle = mutation({
    args: { id: v.id("raffles") },
    handler: async (ctx, args) => {
        // 1. Verificación de permisos de administrador.
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado.");
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador para eliminar un sorteo.");
        }

        // 2. VERIFICACIÓN CRÍTICA: Comprobar si el sorteo tiene boletos vendidos.
        const ticketsSold = await ctx.db
            .query("tickets")
            .withIndex("by_raffle_status", q => q.eq("raffleId", args.id).eq("status", "sold"))
            .collect();

        if (ticketsSold.length > 0) {
            // Si hay ventas, no se puede eliminar. Se debe cancelar.
            throw new Error("Este sorteo tiene boletos vendidos y no puede ser eliminado. Solo puedes cancelarlo.");
        }

        // 3. Si no hay ventas, procedemos a eliminar el sorteo y sus datos asociados.
        const relatedTickets = await ctx.db.query("tickets").withIndex("by_raffle", q => q.eq("raffleId", args.id)).collect();
        for (const ticket of relatedTickets) {
            await ctx.db.delete(ticket._id);
        }

        const relatedPurchases = await ctx.db.query("purchases").withIndex("by_raffle", q => q.eq("raffleId", args.id)).collect();
        for (const purchase of relatedPurchases) {
            await ctx.db.delete(purchase._id);
        }

        // Finalmente, eliminar el sorteo.
        await ctx.db.delete(args.id);
        return true;
    }
});

export const cancelRaffle = mutation({
    args: { id: v.id("raffles") },
    handler: async (ctx, args) => {
        // Verificación de permisos de administrador.
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("No autenticado.");
        const user = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).unique();
        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador.");
        }

        // Simplemente marcamos el sorteo como 'cancelled'.
        // Esto es un "soft delete" que preserva todo el historial de compras y tickets.
        await ctx.db.patch(args.id, { status: "cancelled" });
        return true;
    }
});