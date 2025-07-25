import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    raffles: defineTable({
        creatorId: v.id("users"),
        description: v.string(),
        endTime: v.float64(),
        imageUrl: v.string(),
        startTime: v.float64(),
        status: v.string(),
        ticketPrice: v.float64(),
        ticketsSold: v.float64(),
        title: v.string(),
        totalTickets: v.float64(),
        winnerId: v.optional(v.id("users")),
        winningTicketNumber: v.optional(v.float64()),
        prize: v.optional(v.float64()),
    })
        .index("by_creator", ["creatorId"])
        .index("by_status", ["status"]),

    tickets: defineTable({
        raffleId: v.id("raffles"),
        purchaseId: v.id("purchases"), // ID de la compra a la que pertenece
        ticketNumber: v.float64(),
        userId: v.optional(v.id("users")), // El userId es opcional hasta que se confirma la compra
        status: v.union(
            v.literal("available"),
            v.literal("reserved"),
            v.literal("sold")
        ),
        reservedUntil: v.optional(v.float64()), // Timestamp de cuando expira la reserva
    })
        .index("by_user", ["userId"])
        .index("by_raffle", ["raffleId"])
        .index("by_purchase", ["purchaseId"]) // Nuevo índice para buscar boletos por compra
        .index("by_raffle_status", ["raffleId", "status"]),

    transactions: defineTable({
        amount: v.float64(),
        gatewayTransactionId: v.string(),
        paymentGateway: v.string(),
        status: v.string(),
        type: v.string(),
        userId: v.id("users"),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),

    purchases: defineTable({
        userId: v.id("users"),
        raffleId: v.id("raffles"),
        ticketCount: v.float64(),
        totalAmount: v.float64(),
        status: v.union(v.literal("pending_payment"), v.literal("completed"), v.literal("expired")),
        expiresAt: v.optional(v.float64()), // Timestamp de cuando expira la reserva
    })
        .index("by_user", ["userId"])
        .index("by_raffle", ["raffleId"])
        .index("by_status", ["status"])
        .index("by_user_and_raffle", ["userId", "raffleId"]),

    users: defineTable({
        balance: v.float64(),
        clerkId: v.string(),
        email: v.optional(v.string()),
        firstName: v.string(),
        lastName: v.string(),
        phone: v.optional(v.string())
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),
});
