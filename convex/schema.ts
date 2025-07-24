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
        sorteoId: v.id("raffles"),
        ticketNumber: v.float64(),
        userId: v.id("users"),
    })
        .index("by_user", ["userId"])
        .index("by_raffle", ["sorteoId"])
        .index("by_raffle_and_ticket", ["sorteoId", "ticketNumber"]),

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

    users: defineTable({
        balance: v.float64(),
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        phone: v.optional(v.string())
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),
});