import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const paymentMethodsFields = {
  name: v.string(), // Ej: "Nequi", "Daviplata"
  paymentsNumber: v.string(),
  userName: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  config: v.optional(
    v.object({
      qrCodeUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      instructions: v.optional(v.string()),
      // Puedes agregar más campos opcionales según lo necesites
    })
  ),
  createdBy: v.optional(v.id("users"),)
}

export default defineSchema({
  raffles: defineTable({
    creatorId: v.id("users"),
    description: v.string(),
    endTime: v.float64(),
    imageUrl: v.string(),
    startTime: v.float64(),
    winCondition: v.optional(v.string()),
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
    .index("by_status", ["status"])
    .index("by_status_winnerId", ["status", "winnerId"]),


  tickets: defineTable({
    raffleId: v.id("raffles"),
    purchaseId: v.optional(v.id("purchases")), // ID de la compra a la que pertenece
    ticketNumber: v.float64(),
    userId: v.optional(v.id("users")), // El userId es opcional hasta que se confirma la compra
    status: v.union(
      v.literal("available"),
      v.literal("expired"),
      v.literal("reserved"),
      v.literal("sold")

    ),

    reservedUntil: v.optional(v.float64()), // Timestamp de cuando expira la reserva
  })
    .index("by_user", ["userId"])
    .index("by_raffle", ["raffleId"])
    .index("by_purchase", ["purchaseId"]) // Nuevo índice para buscar boletos por compra
    .index("by_raffle_status", ["raffleId", "status"])
    .index("by_raffle_and_ticket_number", ["raffleId", "ticketNumber"]),

  released_tickets: defineTable({
    purchaseId: v.id("purchases"),
    ticketNumber: v.float64(),
    userId: v.id("users"),
    releasedAt: v.float64(),
  }),

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
    transactionId: v.optional(v.id("transactions")),
    ticketCount: v.float64(),
    totalAmount: v.float64(),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("pending_payment"),
      v.literal(`pending_confirmation`),
      v.literal("expired"),
      // v.literal("rejected"),
      v.literal("completed")),
    expiresAt: v.optional(v.float64()), // Timestamp de cuando expira la reserva
  })
    .index("by_user", ["userId"])
    .index("by_raffle", ["raffleId"])
    .index("by_status", ["status"])
    .index("by_raffleId_status", ["raffleId", "status"])
    .index("by_user_and_raffle", ["userId", "raffleId"]),

  users: defineTable({
    balance: v.optional(v.float64()),
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    pushToken: v.optional(v.string()),
    userType: v.optional(v.union(v.literal("admin"), v.literal("member"))),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_pushToken", ["pushToken"])
    .index("by_userType_pushToken", ["userType", "pushToken"]),


  paymentMethods: defineTable(paymentMethodsFields),

  notifications: defineTable({
    type: v.string(), // e.g., "payment_confirmation_pending"
    message: v.string(),
    isRead: v.boolean(),
    userId: v.optional(v.id("users")),
    purchaseId: v.optional(v.id("purchases")),
    raffleId: v.optional(v.id("raffles")),
    target: v.optional(v.string()),
  }).index("by_isRead", ["isRead"]),

  settings: defineTable({
    releaseTime: v.number(),
    purchasesEnabled: v.boolean(),
    maintenanceMessage: v.optional(v.string()),
  })
});
