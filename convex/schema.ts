import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const paymentMethodFields = {
  ownerId: v.id("users"),
  name: v.string(), // ej Nequi - Daviplata
  paymentsNumber: v.string(),
  userName: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  config: v.optional(
    v.object({
      qrCodeUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      instructions: v.optional(v.string()),
    })
  ),
  createdBy: v.optional(v.id("users")),
}

export const userFields = {

  // --- Identificación y Perfil ---
  clerkId: v.string(), // ID único de Clerk, usado para enlazar la sesión.
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()), // Opcional, ya que algunos métodos de login podrían no proveerlo.
  phone: v.optional(v.string()), // Para contacto o verificación.
  pushToken: v.optional(v.string()), // Token para notificaciones push.
  userName: v.string(),
  profileImageUrl: v.optional(v.string()), // Nuevo campo para la URL de la imagen de perfil del usuario

  // --- Permisos de la Plataforma ---
  userType: v.union(v.literal("admin"), v.literal("free")), // "admin" es Super Admin, "member" es usuario normal.

  // --- Monederos y Monetización ---
  balance: v.float64(), // Saldo en dinero real (ej. COP) para comprar boletos. Se inicializa en 0.
  raffleCredits: v.float64(), // "Moneda" virtual para crear sorteos. Se inicializa en 0.

  // --- Estado de Suscripción (gestionado por RevenueCat) ---
  subscriptionTier: v.union(v.literal("free"), v.literal("premium")), // Nivel de suscripción actual.
  subscriptionId: v.optional(v.string()), // ID de la suscripción de RevenueCat/Play Store.
  subscriptionExpiresAt: v.optional(v.float64()), // Timestamp de cuándo caduca la suscripción.

  // --- Límites del Plan Gratuito ---
  freeRafflesUsedThisMonth: v.float64(), // Contador de sorteos gratuitos usados.
  freeRafflesResetDate: v.float64(), // Timestamp de cuándo se debe resetear el contador.
}

export const raffleFields = {
  creatorId: v.id("users"),
  userName: v.string(),
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
  creatorName: v.optional(v.string()),
  customRaffleId: v.string(), // Nuevo campo para el ID de rifa legible
  searchableText: v.string(), // Nuevo campo para la búsqueda de texto completo (combinará ID, título, username)
  enabledPurchases: v.boolean(),
  releaseTime: v.number(), // Nuevo campo para el tiempo de liberación de tickets
}


export default defineSchema({

  users: defineTable(userFields)
    // Índices para búsquedas eficientes
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_subscriptionId", ["subscriptionId"]) // Para que los webhooks de RevenueCat encuentren al usuario.
    .index("by_pushToken", ["pushToken"])
    .index("by_userType_pushToken", ["userType", "pushToken"])
    .index("by_userName", ["userName"]), // New index for userName


  raffles: defineTable(raffleFields)
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_status_winnerId", ["status", "winnerId"])
    .index("by_customRaffleId", ["customRaffleId"]) // Nuevo índice para el customRaffleId
    .searchIndex("by_searchable_text", {
      searchField: "searchableText", // Ahora busca en el campo combinado
      // Podemos filtrar por estado dentro de la búsqueda para más eficiencia
      filterFields: ["status"]
    }),


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
    creatorId: v.id("users"),
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
      v.literal("rejected"),
      v.literal("completed")),
    expiresAt: v.optional(v.float64()), // Timestamp de cuando expira la reserva
    rejectionReason: v.optional(v.string()), // Campo para la razón de rechazo
  })
    .index("by_user", ["userId"])
    .index("by_raffle", ["raffleId"])
    .index("by_status", ["status"])
    .index("by_raffleId_status", ["raffleId", "status"])
    .index("by_user_and_raffle", ["userId", "raffleId"])
    .index("by_creator_and_status", ["creatorId", "status"]),




  paymentMethods: defineTable(paymentMethodFields)
    .index("by_owner", ["ownerId"]),

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
    ownerId: v.id("users"),
    releaseTime: v.number(),
    purchasesEnabled: v.boolean(),
    maintenanceMessage: v.optional(v.string()),
  })
});
