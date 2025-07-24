// convex/tickets.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Obtiene todos los boletos comprados para un sorteo específico.
 * Para que esta consulta sea eficiente, asegúrate de tener un índice en tu schema.
 * En `convex/schema.ts`, dentro de la definición de la tabla "tickets":
 * .index("by_raffleId", ["sorteoId"])
 */
export const getTicketsByRaffle = query({
    args: { sorteoId: v.id("raffles") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tickets")
            .withIndex("by_raffle", (q) => q.eq("sorteoId", args.sorteoId))
            .collect();
    },
});

/**
 * Procesa la compra de uno o más boletos para un sorteo.
 */
export const purchaseTickets = mutation({
    args: {
        raffleId: v.id("raffles"),
        ticketNumbers: v.array(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Debes iniciar sesión para comprar boletos.");
        }

        const userId = identity.subject; // El user ID de Clerk

        const raffle = await ctx.db.get(args.raffleId);
        if (!raffle) {
            throw new Error("Sorteo no encontrado.");
        }

        // 1. Prevenir la venta de boletos ya comprados (importante para evitar race conditions)
        const existingTickets = await ctx.db.query("tickets").withIndex("by_raffle", (q) => q.eq("sorteoId", args.raffleId)).collect();
        const boughtNumbers = new Set(existingTickets.map(t => t.ticketNumber));

        for (const number of args.ticketNumbers) {
            if (boughtNumbers.has(number)) {
                throw new Error(`El boleto número ${number} ya fue vendido. Por favor, refresca y elige otros.`);
            }
        }

        // 2. Insertar los nuevos boletos en la base de datos
        for (const number of args.ticketNumbers) {
            await ctx.db.insert("tickets", {
                sorteoId: args.raffleId,
                ticketNumber: number,
                userId: userId,
            });
        }

        // 3. Actualizar el contador de boletos vendidos en el documento del sorteo
        await ctx.db.patch(args.raffleId, {
            ticketsSold: raffle.ticketsSold + args.ticketNumbers.length,
        });

        return { success: true };
    },
});
