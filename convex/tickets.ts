// convex/tickets.ts

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";


export const getNonAvailableTickets = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const reservedTickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle_status", q => q.eq("raffleId", args.raffleId).eq("status", "reserved"))
      .collect()

    const soldTickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle_status", q => q.eq("raffleId", args.raffleId).eq("status", "sold"))
      .collect()

    const tickets = reservedTickets.concat(soldTickets)

    const items_return = tickets.map((ticket) => ({
      ticketNumber: ticket.ticketNumber,
      status: ticket.status
    }))

    return items_return

  },
});

export const reserveTickets = mutation({
  args: {
    raffleId: v.id("raffles"),
    ticketNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    // Bloqueo global de compras
    const settings = await ctx.db.query('settings').first();
    if (settings && settings.purchasesEnabled === false) {
      throw new Error('Las compras están temporalmente deshabilitadas por el administrador. Intente más tarde.');
    }
    // Autenticación y validaciones
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

    // Verifica que los boletos estén disponibles
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

    // Crea la compra
    const releaseMinutes = settings?.releaseTime ?? 30;
    const reservationExpiry = Date.now() + releaseMinutes * 60 * 1000; // en minutos
    const purchaseId = await ctx.db.insert("purchases", {
      userId: user._id,
      raffleId: args.raffleId,
      ticketCount: args.ticketNumbers.length,
      totalAmount: raffle.ticketPrice * args.ticketNumbers.length,
      status: "pending_payment",
      expiresAt: reservationExpiry,
    });

    // Reserva los boletos
    for (const number of args.ticketNumbers) {
      await ctx.db.insert("tickets", {
        raffleId: args.raffleId,
        purchaseId: purchaseId,
        ticketNumber: number,
        userId: user._id,
        status: "reserved",
        reservedUntil: reservationExpiry,
      });
    }

    // Programa la liberación automática
    await ctx.scheduler.runAfter(
      releaseMinutes * 60 * 1000,
      internal.tickets.releaseIfUnpaid,
      { purchaseId }
    );

    return { purchaseId };
  },
});

export const releaseIfUnpaid = internalMutation({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    // Busca la compra
    const purchase = await ctx.db.get(args.purchaseId);

    // Si la compra no existe, o si ya fue completada (o expirada por otro medio), no hacemos nada.
    // Solo procedemos si la compra sigue en estado 'pending_payment' o 'pending_confirmation'.
    if (!purchase || (purchase.status !== "pending_payment" && purchase.status !== "pending_confirmation")) {
      return;
    }
    // Marca la compra como expirada
    await ctx.db.patch(args.purchaseId, { status: "expired" });

    // Busca y libera los tickets asociados
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .collect();

    for (const ticket of tickets) {
      // Guarda el historial antes de liberar
      await ctx.db.insert("released_tickets", {
        purchaseId: args.purchaseId,
        ticketNumber: ticket.ticketNumber,
        userId: ticket.userId!,
        releasedAt: Date.now(),
      });
      // Libera el ticket
      await ctx.db.patch(ticket._id, {
        status: "available",
        userId: undefined,
        reservedUntil: undefined,
        purchaseId: undefined,
      });
    }
  },
});

//notifacion de un usuario a un admin que la compra fue pagada y se debe confirmar manualmente por un admin. 
export const adminNotifyPayment = mutation({
  args: { purchaseId: v.id("purchases"), imageUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Usuario no autenticado.");

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Compra no encontrada.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user._id !== purchase.userId) throw new Error("No tienes permiso para realizar esta acción.");

    if (purchase.status !== 'pending_payment') throw new Error("Esta compra no está pendiente de pago.");

    // 1. Actualiza el estado de la compra para que el admin la verifique
    await ctx.db.patch(args.purchaseId, { status: "pending_confirmation", imageUrl: args.imageUrl });


    // 2. Obtenemos datos del sorteo para un mensaje más descriptivo.
    const raffle = await ctx.db.get(purchase.raffleId);

    // 3. Programamos la acción para enviar la notificación PUSH a los admins.
    // Esto se ejecuta en segundo plano y no retrasa la respuesta al usuario.
    await ctx.scheduler.runAfter(0, internal.notifications.sendPaymentConfirmationToAdmins, {
      purchaseId: args.purchaseId,
      title: "💰 Pago por Verificar",
      message: `El usuario ${user.firstName ?? 'N/A'} ${user.lastName ?? 'N/A'} ha reportado un pago para el sorteo "${raffle?.title ?? 'N/A'}".`,
    });

    return { success: true }; // Mantenemos la respuesta al cliente
  },
});

//notificacion de admin a usuario que la compra fue verificada y aprobada
export const aprovalPurchase = mutation({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    // Validación: solo un admin puede confirmar pagos
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!requester || requester.userType !== "admin") {
      throw new Error("Permisos insuficientes");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("No se encontró la compra.");
    }
    if (purchase.status !== 'pending_confirmation') {
      throw new Error("Esta compra no está esperando confirmación.");
    }

    // 1. Marcar la compra como completada
    await ctx.db.patch(args.purchaseId, { status: "completed" });

    // 2. Encontrar todos los boletos reservados de esta compra y marcarlos como vendidos
    const ticketsToUpdate = await ctx.db
      .query("tickets")
      .withIndex("by_purchase", q => q.eq("purchaseId", args.purchaseId))
      .collect();

    for (const ticket of ticketsToUpdate) {
      await ctx.db.patch(ticket._id, { status: "sold", reservedUntil: undefined });
    }
    // 3. Actualizar el contador de boletos vendidos en el sorteo
    const raffle = await ctx.db.get(purchase.raffleId);
    if (raffle) {
      await ctx.db.patch(raffle._id, { ticketsSold: raffle.ticketsSold + purchase.ticketCount });
    }
    // --- INICIO: Lógica de Notificación ---
    if (purchase.userId) {
      const user = await ctx.db.get(purchase.userId);
      const raffle = await ctx.db.get(purchase.raffleId);

      // Si el usuario tiene un pushToken, le enviamos la notificación
      if (user && user.pushToken) {
        await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
          pushToken: user.pushToken,
          title: "✅ Pago Aprobado!",
          message: `Tus boletos para "${raffle?.title}" han sido asignados. ¡Mucha suerte!`,
        });
      }
    }
    // --- FIN: Lógica de Notificación ---
  }
});

export const rejectPurchase = mutation({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    // Validación: solo un admin puede rechazar pagos
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!requester || requester.userType !== "admin") {
      throw new Error("Permisos insuficientes");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Compra no encontrada.");
    }

    // Solo se pueden rechazar las compras que están pendientes de confirmación
    if (purchase.status !== 'pending_confirmation') {
      throw new Error("Esta compra no puede ser rechazada en su estado actual.");
    }

    // 1. Marcar la compra como expirada
    await ctx.db.patch(args.purchaseId, { status: "expired" });
    // await ctx.db.patch(args.purchaseId, { status: "rejected" });

    // 2. Buscar y liberar los boletos asociados
    const ticketsToUpdate = await ctx.db
      .query("tickets")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .collect();

    for (const ticket of ticketsToUpdate) {
      await ctx.db.patch(ticket._id, {
        status: "available",
        userId: undefined,
        reservedUntil: undefined,
        purchaseId: undefined,
      });
    }
    if (purchase.userId) {
      const user = await ctx.db.get(purchase.userId);
      const raffle = await ctx.db.get(purchase.raffleId);

      // Si el usuario tiene un pushToken, le enviamos la notificación
      if (user && user.pushToken) {
        await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
          pushToken: user.pushToken,
          title: "❌ ¡Pago Rechazado!",
          message: `Tu pago de ${ticketsToUpdate.length} boletos para "${raffle?.title}" ha sido rechazado`,
        });
      }
    }
    return { success: true };
  },
});

export const getAll = query({
  handler: async (ctx) => {
    // Esta es una consulta simple para probar la conexión.
    return await ctx.db.query("tickets").take(10); // Tomamos solo 10 para no sobrecargar
  },
});

export const getPurchases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    return purchases;
  }
})

export const getUserPurchasesWithDetails = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginatedPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const { page: purchases, isDone, continueCursor } = paginatedPurchases;

    if (purchases.length === 0) return { page: [], isDone: true, continueCursor };

    // OPTIMIZACIÓN: En lugar de hacer consultas dentro del bucle (problema N+1),
    // obtenemos todos los datos necesarios en lotes.

    // 1. Obtenemos los IDs de todos los sorteos de una vez.
    const raffleIds = [...new Set(purchases.map(p => p.raffleId))];

    // 2. Hacemos una sola tanda de consultas para obtener todos los sorteos.
    const raffles = await Promise.all(raffleIds.map(id => ctx.db.get(id)));
    const rafflesById = new Map(raffles.filter(Boolean).map(r => [r!._id, r]));

    // 3. Construimos la respuesta con los datos ya obtenidos, sin más consultas a la BD.
    //    Devolvemos un objeto "resumen" mucho más ligero, sin la lista de boletos.
    const purchasesWithDetails = purchases.map((purchase) => {
      const raffle = rafflesById.get(purchase.raffleId);
      return {
        ...purchase,
        raffleTitle: raffle?.title ?? "Sorteo no encontrado",
        raffleImageUrl: raffle?.imageUrl,
        raffleStatus: raffle?.status,
      };
    });

    return {
      page: purchasesWithDetails,
      isDone,
      continueCursor,
    };
  },
});

export const getPurchaseDetails = query({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) return null;

    // Control de acceso: solo dueño o admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!requester) return null;
    const isOwner = requester._id === purchase.userId;
    const isAdmin = requester.userType === "admin";
    if (!isOwner && !isAdmin) return null;

    const raffle = await ctx.db.get(purchase.raffleId);
    const user = await ctx.db.get(purchase.userId);

    // Tickets pagados/asociados a la compra
    const paidTickets = await ctx.db
      .query("tickets")
      .withIndex("by_purchase", q => q.eq("purchaseId", purchase._id))
      .collect();

    // Tickets liberados de esta compra
    const releasedTickets = await ctx.db
      .query("released_tickets")
      .filter(q => q.eq(q.field("purchaseId"), purchase._id))
      .collect();

    const allTickets = [
      ...paidTickets.map(t => ({
        ...t,
        type: "paid",
      })),
      ...releasedTickets.map(rt => ({
        ticketNumber: rt.ticketNumber,
        status: "released",
        userId: rt.userId,
        releasedAt: rt.releasedAt,
        type: "released",

      })),
    ];

    return { purchase, raffle, tickets: allTickets, user };
  }
});

export const getPendingConfirmationPurchases = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {

    const paginatedPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("status", "pending_confirmation"))
      .order("desc")
      .paginate(args.paginationOpts);

    const { page: purchases, isDone, continueCursor } = paginatedPurchases;

    if (purchases.length === 0) return { page: [], isDone: true, continueCursor };

    // OPTIMIZACIÓN: Solucionamos el problema N+1 obteniendo todos los datos en lotes.
    const raffleIds = [...new Set(purchases.map(p => p.raffleId))];
    const userIds = [...new Set(purchases.map(p => p.userId))];

    const [raffles, users] = await Promise.all([
      Promise.all(raffleIds.map(id => ctx.db.get(id))),
      Promise.all(userIds.map(id => ctx.db.get(id)))
    ]);

    const rafflesById = new Map(raffles.filter(Boolean).map(r => [r!._id, r]));
    const usersById = new Map(users.filter(Boolean).map(u => [u!._id, u]));

    const purchasesWithDetails = purchases.map((purchase) => {
      const raffle = rafflesById.get(purchase.raffleId);
      const user = usersById.get(purchase.userId);
      return {
        ...purchase,
        raffleTitle: raffle?.title ?? "Sorteo no encontrado",
        userFirstName: user?.firstName ?? "Usuario desconocido",
        userLastName: user?.lastName ?? "Usuario desconocido",
      };
    });

    return { page: purchasesWithDetails, isDone, continueCursor };
  },
});

export const getAllPurchasesWithDetails = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(
      v.literal("completed"),
      v.literal("pending_confirmation"),
      v.literal("pending_payment"),
      v.literal("expired")
    ))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado. No se pueden obtener las compras.");
    }

    const userMakingRequest = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!userMakingRequest || userMakingRequest.userType !== "admin") {
      throw new Error("No autorizado. Se requieren permisos de administrador.");
    }

    const query = ctx.db.query("purchases");
    const paginatedPurchases = await (args.status
      ? query.withIndex("by_status", (q) => q.eq("status", args.status!))
      : query
    )
      .order("desc")
      .paginate(args.paginationOpts);

    const { page: purchases, isDone, continueCursor } = paginatedPurchases;

    if (purchases.length === 0) return { page: [], isDone: true, continueCursor };

    const raffleIds = [...new Set(purchases.map(p => p.raffleId))];
    const userIds = [...new Set(purchases.map(p => p.userId))];

    const [raffles, users] = await Promise.all([
      Promise.all(raffleIds.map(id => ctx.db.get(id))),
      Promise.all(userIds.map(id => ctx.db.get(id)))
    ]);

    const rafflesById = new Map(raffles.filter(Boolean).map(r => [r!._id, r]));
    const usersById = new Map(users.filter(Boolean).map(u => [u!._id, u]));

    const purchasesWithDetails = purchases.map((purchase) => {
      const raffle = rafflesById.get(purchase.raffleId);
      const user = usersById.get(purchase.userId);
      return { ...purchase, raffleTitle: raffle?.title ?? "Sorteo no encontrado", userFirstName: user?.firstName ?? "Usuario", userLastName: user?.lastName ?? "", userEmail: user?.email ?? "email no disponible" };
    });
    return { page: purchasesWithDetails, isDone, continueCursor };
  },
});

export const getAllCompletedPurchasesForReport = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Admin validation
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado.");
    }
    const userMakingRequest = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!userMakingRequest || userMakingRequest.userType !== "admin") {
      throw new Error("No autorizado.");
    }

    // Fetch all completed purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => {
        const query = q.eq("status", "completed");
        if (args.startDate && args.endDate) {
          // Add a day's worth of milliseconds to include the entire end date
          return query.gte("_creationTime", args.startDate).lte("_creationTime", args.endDate + 86400000);
        } else if (args.startDate) {
          return query.gte("_creationTime", args.startDate);
        } else if (args.endDate) {
          return query.lte("_creationTime", args.endDate + 86400000);
        }
        return query;
      })
      .order("desc")
      .collect();

    if (purchases.length === 0) return [];

    // Optimization to avoid N+1 problem
    const raffleIds = [...new Set(purchases.map(p => p.raffleId))];
    const userIds = [...new Set(purchases.map(p => p.userId))];

    const [raffles, users] = await Promise.all([
      Promise.all(raffleIds.map(id => ctx.db.get(id))),
      Promise.all(userIds.map(id => ctx.db.get(id)))
    ]);

    const rafflesById = new Map(raffles.filter(Boolean).map(r => [r!._id, r]));
    const usersById = new Map(users.filter(Boolean).map(u => [u!._id, u]));

    return purchases.map((purchase) => {
      const raffle = rafflesById.get(purchase.raffleId);
      const user = usersById.get(purchase.userId);
      return { ...purchase, raffleTitle: raffle?.title ?? "Sorteo no encontrado", userFirstName: user?.firstName ?? "Usuario", userLastName: user?.lastName ?? "", userEmail: user?.email ?? "email no disponible" };
    });
  },
});
