// convex/tickets.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Obtiene todos los boletos que NO están disponibles (reservados o vendidos) para un sorteo específico.
 * Esto es más eficiente que obtener todos los boletos si la mayoría están disponibles.
 * Devuelve un array de boletos con su número y estado, ideal para la UI.
 */
export const getNonAvailableTickets = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle_status", (q) => q.eq("raffleId", args.raffleId))
      .filter((q) => q.neq(q.field("status"), "available"))
      .collect();

    return tickets.map((ticket) => ({ ticketNumber: ticket.ticketNumber, status: ticket.status as 'sold' | 'reserved' }));
  },
});

export const reserveTickets = mutation({
  args: {
    raffleId: v.id("raffles"),
    ticketNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Debes iniciar sesión para reservar boletos.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) {
      throw new Error("Sorteo no encontrado.");
    }

    // Prevenir la reserva de boletos ya reservados o vendidos
    const existingTickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle", (q) => q.eq("raffleId", args.raffleId))
      .filter(q => q.neq(q.field("status"), "available"))
      .collect();
    const unavailableNumbers = new Set(existingTickets.map(t => t.ticketNumber));

    for (const number of args.ticketNumbers) {
      if (unavailableNumbers.has(number)) {
        throw new Error(`El boleto número ${number} ya no está disponible.`);
      }
    }

    // 1. Crear el registro de la compra (Purchase)
    const reservationExpiry = Date.now() + 30 * 60 * 1000; // 30 mins
    const purchaseId = await ctx.db.insert("purchases", {
      userId: user._id,
      raffleId: args.raffleId,
      ticketCount: args.ticketNumbers.length,
      totalAmount: raffle.ticketPrice * args.ticketNumbers.length,
      status: "pending_payment",
      expiresAt: reservationExpiry,
    });

    // 2. Crear y reservar los boletos, asociándolos a la compra
    for (const number of args.ticketNumbers) {
      await ctx.db.insert("tickets", {
        raffleId: args.raffleId, // TODO: Cambiar a raffleId
        purchaseId: purchaseId,
        ticketNumber: number,
        userId: user._id,
        status: "reserved",
        reservedUntil: reservationExpiry,
      });
    }

    return { purchaseId };
  },
});

export const soldTickets = mutation({
  args: {
    ticketNumbers: v.array(v.number()),
    raffleId: v.id("raffles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Debes iniciar sesión para reservar boletos.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) {
      throw new Error("Sorteo no encontrado.");
    }

    // Prevenir la reserva de boletos ya reservados o vendidos
    const existingTickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle", (q) => q.eq("raffleId", args.raffleId))
      .filter(q => q.neq(q.field("status"), "available"))
      .collect();
    const unavailableNumbers = new Set(existingTickets.map(t => t.ticketNumber));

    for (const number of args.ticketNumbers) {
      if (unavailableNumbers.has(number)) {
        throw new Error(`El boleto número ${number} ya no está disponible.`);
      }
    }

    // 1. Crear el registro de la compra (Purchase)
    const purchaseId = await ctx.db.insert("purchases", {
      userId: user._id,
      raffleId: args.raffleId,
      ticketCount: args.ticketNumbers.length,
      totalAmount: raffle.ticketPrice * args.ticketNumbers.length,
      status: "completed",
    });

    // 2. Crear y reservar los boletos, asociándolos a la compra
    for (const number of args.ticketNumbers) {
      await ctx.db.insert("tickets", {
        raffleId: args.raffleId,
        purchaseId: purchaseId,
        ticketNumber: number,
        userId: user._id,
        status: "sold",
      });
    }

    return { purchaseId };

  }
})

export const getAll = query({
  handler: async (ctx) => {
    // Esta es una consulta simple para probar la conexión.
    return await ctx.db.query("tickets").take(10); // Tomamos solo 10 para no sobrecargar
  },
});

export const userTicketHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Buscar todos los tickets del usuario
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("status"), "sold"))
      .collect();

    // 2. Para cada ticket, obtener la compra y el sorteo
    return await Promise.all(
      tickets.map(async (ticket) => {
        const purchase = await ctx.db.get(ticket.purchaseId);
        const raffle = await ctx.db.get(ticket.raffleId);
        return {
          ...ticket,
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          raffleTitle: raffle?.title,
          raffleId: ticket.raffleId,
          purchaseId: ticket.purchaseId,
          creationTime: ticket._creationTime,
          purchaseDate: purchase?._creationTime,
        };
      })
    );
  },
});
