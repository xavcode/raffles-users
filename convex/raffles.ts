import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Función auxiliar para generar un customRaffleId único
async function generateUniqueCustomRaffleId(ctx: any): Promise<string> {
  let customRaffleId: string;
  let isUnique = false;
  do {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 caracteres alfanuméricos en mayúsculas
    customRaffleId = `${datePart}-${randomPart}`;
    // Verificar unicidad: intentar obtener la rifa con este ID. Si no existe, es único.
    const existingRaffle = await ctx.db
      .query("raffles")
      .withIndex("by_customRaffleId", (q: any) => q.eq("customRaffleId", customRaffleId))
      .unique();
    isUnique = existingRaffle === null;
  } while (!isUnique);
  return customRaffleId;
}

// export const getRaffles = query({
//   args: {
//     // todos los sorteos (para el admin) o solo los activos (para usuarios).
//     status: v.optional(v.string()),
//     search: v.optional(v.string()), // Agregado para búsqueda
//     paginationOpts: paginationOptsValidator,
//   },
//   handler: async (ctx, args) => {
//     let queryBuilder;
//     // Si se provee un estado, usamos el índice para una búsqueda eficiente.
//     if (args.status) {
//       queryBuilder = ctx.db
//         .query("raffles")
//         .withIndex("by_status", (q) => q.eq("status", args.status as any));
//     } else {
//       queryBuilder = ctx.db.query("raffles");
//     }

//     // Aplicar filtro de búsqueda si existe
//     if (args.search) {
//       queryBuilder = queryBuilder.filter(q =>
//         q.or(
//           q.eq(q.field("title"), args.search),
//           q.eq(q.field("userName"), args.search)
//         )
//       );
//     }

//     return await queryBuilder.order("desc").paginate(args.paginationOpts);
//   }
// });
export const getRaffles = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(v.literal("active"), v.literal("finished"))),
    search: v.optional(v.string()), // Argumento de búsqueda
  },
  handler: async (ctx, args) => {
    // Patrón para verificar si el término de búsqueda parece un customRaffleId
    const customRaffleIdPattern = /^\d{8}-[A-Z0-9]{6}$/;
    const isCustomRaffleIdSearch = args.search && customRaffleIdPattern.test(args.search);

    let queryBuilder;

    if (isCustomRaffleIdSearch) {
      // Si parece un customRaffleId, intentar búsqueda exacta primero
      queryBuilder = ctx.db
        .query("raffles")
        .withIndex("by_customRaffleId", (q) => q.eq("customRaffleId", args.search!));

      if (args.status) {
        queryBuilder = queryBuilder.filter((q) =>
          q.eq(q.field("status"), args.status)
        );
      }
      const exactMatch = await queryBuilder.first();
      if (exactMatch) {
        // Si encontramos una coincidencia exacta por ID, devolver solo esa.
        return await ctx.db.query("raffles").filter(q => q.eq(q.field("_id"), exactMatch._id)).paginate(args.paginationOpts); // Devolver en formato paginado
      }
      // Si no hay coincidencia exacta por ID, entonces se cae a la búsqueda de texto completo
    }

    // Si no es una búsqueda por customRaffleId o no hubo coincidencia exacta, usar el searchIndex general
    if (args.search) {
      let searchResult = ctx.db
        .query("raffles")
        .withSearchIndex("by_searchable_text", (q) =>
          q.search("searchableText", args.search!)
        );

      if (args.status) {
        searchResult = searchResult.filter((q) =>
          q.eq(q.field("status"), args.status)
        );
      }
      return await searchResult.paginate(args.paginationOpts);
    } else {
      // Si no hay búsqueda en absoluto, se mantiene la lógica original
      queryBuilder = ctx.db
        .query("raffles")
        .withIndex("by_status", (q) => q.eq("status", args.status ?? "active"))
        .order("desc");
    }

    return await queryBuilder.paginate(args.paginationOpts);
  },
});


export const getMyRaffles = query({
  args: {
    search: v.optional(v.string()), // Agregado para búsqueda
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return await ctx.db.query("raffles")
        .withIndex("by_creator", q => q.eq("creatorId", "nonexistent_id" as any))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return await ctx.db.query("raffles")
        .withIndex("by_creator", q => q.eq("creatorId", "nonexistent_id" as any))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    let queryBuilder;
    if (args.search) {
      // Usar el searchIndex general y filtrar por creador
      queryBuilder = ctx.db
        .query("raffles")
        .withSearchIndex("by_searchable_text", (q) =>
          q.search("searchableText", args.search!)
        )
        .filter((q) => q.eq(q.field("creatorId"), user._id));
    } else {
      // Lógica original si no hay búsqueda
      queryBuilder = ctx.db
        .query("raffles")
        .withIndex("by_creator", q => q.eq("creatorId", user._id))
        .order("desc");
    }

    return await queryBuilder.paginate(args.paginationOpts);
  },
});

// export const getMyRaffles = query({
//   args: {
//     paginationOpts: paginationOptsValidator,
//     search: v.optional(v.string()), // Argumento de búsqueda
//   },
//   handler: async (ctx, args) => {
//     const identity = await ctx.auth.getUserIdentity();
//     if (!identity) {
//       return { page: [], isDone: true, continueCursor: "" };
//     }

//     const user = await ctx.db
//       .query("users")
//       .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.tokenIdentifier))
//       .unique();

//     if (!user) {
//       return { page: [], isDone: true, continueCursor: "" };
//     }

//     // Si hay búsqueda, la aplicamos filtrando solo las rifas del usuario
//     if (args.search) {
//       return await ctx.db
//         .query("raffles")
//         .withSearchIndex("by_searchable_text", (q) =>
//           q.search("searchableText", args.search!)
//         )
//         .filter((q) => q.eq(q.field("creatorId"), user._id)) // Filtramos por el ID del creador
//         .paginate(args.paginationOpts);
//     }

//     // Lógica original si no hay búsqueda
//     const queryBuilder = ctx.db
//       .query("raffles")
//       .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
//       .order("desc");

//     return await queryBuilder.paginate(args.paginationOpts);
//   },
// });



export const getById = query({
  args: { id: v.id("raffles") },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.id);
    return raffle;
  },
});

export const createRaffle = mutation({

  args: v.object({
    title: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    ticketPrice: v.float64(),
    totalTickets: v.float64(),
    startTime: v.float64(),
    endTime: v.float64(),
    winCondition: v.string(),
    prize: v.optional(v.float64()),
    releaseTime: v.number(), // Nuevo campo para el tiempo de liberación de tickets
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No estás autenticado. Por favor, inicia sesión.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("No se encontró un usuario correspondiente para crear la rifa.");
    }

    const newCustomRaffleId = await generateUniqueCustomRaffleId(ctx);

    const newRaffleId = await ctx.db.insert("raffles", {
      ...args,
      customRaffleId: newCustomRaffleId, // Asignar el ID único generado
      creatorId: user._id,
      userName: user.userName, // El userName ahora es string por schema
      searchableText: `${newCustomRaffleId} ${args.title} ${user.userName}`, // Combinar para búsqueda de texto completo
      enabledPurchases: true,
      ticketsSold: 0,
      status: "active",
    });

    // await ctx.scheduler.runAfter(0, internal.notifications.sendToAllUsers, {
    //   title: "🎉 ¡Nuevo Sorteo Disponible!",
    //   message: `¡No te pierdas la oportunidad de ganar en nuestro nuevo sorteo: "${args.title}"!`,

    // });
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
    winCondition: v.optional(v.string()), // Hacemos winCondition opcional aquí
    startTime: v.optional(v.float64()), // Hacemos startTime opcional
    endTime: v.optional(v.float64()),   // Hacemos endTime opcional
    prize: v.optional(v.float64()),
    status: v.optional(v.string()),
    winningTicketNumber: v.optional(v.float64()),
    releaseTime: v.optional(v.number()), // Nuevo campo opcional para actualizar
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

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const { id, ...rest } = args;
    const oldRaffle = await ctx.db.get(id);
    if (!oldRaffle) {
      throw new Error("Sorteo no encontrado.");
    }

    // Solo el creador del sorteo puede modificarlo.
    if (oldRaffle.creatorId !== user._id) {
      throw new Error("No tienes permisos para modificar este sorteo.");
    }

    // La lógica de notificación del ganador se ha movido a `finishRaffle`
    if (rest.status === 'finished' && oldRaffle?.status !== 'finished') {
      throw new Error("Para finalizar un sorteo, utiliza la función 'finishRaffle' en lugar de 'updateRaffle'.");
    }
    await ctx.db.patch(id, rest);
    return true;
  },
});

export const getPurchasesForRaffle = query({
  args: {
    raffleId: v.id("raffles"),
  },
  handler: async (ctx, args) => {
    // 1. Obtener todas las compras para este sorteo (sin filtrar por estado inicialmente)
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_raffle", (q) => q.eq("raffleId", args.raffleId))
      .order("desc")
      .collect();

    if (purchases.length === 0) {
      return [];
    }

    // 2. Recopilar todos los userIds únicos de las compras
    const userIds = [...new Set(purchases.map(p => p.userId))];

    // 3. Obtener los detalles de todos los usuarios de una vez
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const usersById = new Map(users.filter(Boolean).map(u => [u!._id, u]));

    // 4. Obtener todos los tickets asociados a este sorteo
    const allTickets = await ctx.db
      .query("tickets")
      .withIndex("by_raffle", (q) => q.eq("raffleId", args.raffleId))
      .collect();

    // Organizar tickets por purchaseId para un acceso eficiente
    const ticketsByPurchaseId = new Map<Id<"purchases">, Doc<"tickets">[]>();
    for (const ticket of allTickets) {
      if (ticket.purchaseId) {
        const existingTickets = ticketsByPurchaseId.get(ticket.purchaseId) || [];
        existingTickets.push(ticket);
        ticketsByPurchaseId.set(ticket.purchaseId, existingTickets);
      }
    }

    // 5. Combinar los datos de compras, usuarios y tickets
    const purchasesWithDetails = purchases.map((purchase) => {
      const user = usersById.get(purchase.userId);
      const associatedTickets = ticketsByPurchaseId.get(purchase._id) || [];

      return {
        ...purchase,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        } : null,
        tickets: associatedTickets,
        // El status y rejectionReason ya están directamente en 'purchase'
      };
    });

    return purchasesWithDetails;
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
    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const raffleToDelete = await ctx.db.get(args.id);
    if (!raffleToDelete) throw new Error("Sorteo no encontrado.");

    // Solo el creador del sorteo puede eliminarlo.
    if (raffleToDelete.creatorId !== user._id) throw new Error("No tienes permisos para eliminar este sorteo.");

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

export const finishRaffle = mutation({
  args: {
    id: v.id("raffles"),
    winningTicketNumber: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No estás autenticado.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const raffleToFinish = await ctx.db.get(args.id);
    if (!raffleToFinish) throw new Error("Sorteo no encontrado.");

    // Solo el creador puede finalizar su propio sorteo.
    if (raffleToFinish.creatorId !== user._id)
      throw new Error("No tienes permisos para finalizar este sorteo.");

    const { id, winningTicketNumber } = args;

    // Actualizamos el sorteo a 'finished'
    await ctx.db.patch(id, {
      status: 'finished',
      winningTicketNumber: winningTicketNumber,
    });

    // --- Lógica de Notificación al Ganador ---
    console.log(`finishRaffle: Finalizando sorteo. Boleto ganador: ${winningTicketNumber}`);
    try {
      const winningTicket = await ctx.db
        .query("tickets")
        .withIndex("by_raffle_and_ticket_number", (q) =>
          q.eq("raffleId", id).eq("ticketNumber", winningTicketNumber)
        )
        .filter(q => q.eq(q.field("status"), "sold"))
        .unique();

      if (winningTicket && winningTicket.purchaseId) {
        const purchase = await ctx.db.get(winningTicket.purchaseId);
        if (purchase && purchase.userId) {
          const winner = await ctx.db.get(purchase.userId);
          const raffle = await ctx.db.get(id);

          if (winner && winner.pushToken) {
            console.log(`finishRaffle: Ganador encontrado con pushToken. Enviando notificación a ${winner.pushToken}`);
            await ctx.scheduler.runAfter(0, internal.notifications.sendPushNotification, {
              pushToken: winner.pushToken,
              title: "🏆 ¡Felicidades, eres el ganador!",
              message: `¡Ganaste el sorteo "${raffle?.title}" con el boleto #${winningTicketNumber}!`,
            });
          } else {
            console.log("finishRaffle: El usuario ganador no tiene un pushToken registrado.");
          }
        }
      } else {
        console.log("finishRaffle: No se encontró un boleto vendido con ese número o no tiene purchaseId.");
      }
    } catch (error) {
      console.error("finishRaffle: ERROR al buscar el boleto ganador o enviar la notificación.", error);
    }
    return true;
  },
});

export const cancelRaffle = mutation({
  args: { id: v.id("raffles") },
  handler: async (ctx, args) => {
    // Verificación de permisos de administrador.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no encontrado.");

    const raffleToCancel = await ctx.db.get(args.id);
    if (!raffleToCancel) throw new Error("Sorteo no encontrado.");

    // Solo el creador puede cancelar su propio sorteo.
    if (raffleToCancel.creatorId !== user._id) throw new Error("No tienes permisos para cancelar este sorteo.");

    // Simplemente marcamos el sorteo como 'cancelled'.
    // Esto es un "soft delete" que preserva todo el historial de compras y tickets.
    await ctx.db.patch(args.id, { status: "cancelled" });
    return true;
  }
});

export const getFinishedRafflesWithWinners = query({
  handler: async (ctx) => {
    // 1. Obtener todos los sorteos finalizados que tengan un ganador

    const finishedRaffles = await ctx.db
      .query("raffles")
      .withIndex("by_status_winnerId", q =>
        q.eq("status", "finished")
      )
      .order("desc")
      .collect();

    if (finishedRaffles.length === 0) {
      return [];
    }

    // 2. Obtener los IDs de los ganadores para buscarlos todos de una vez
    const winnerIds = finishedRaffles.map(r => r.winnerId as Id<'users'>);

    // 3. Buscar los datos de todos los usuarios ganadores
    const winners = await Promise.all(winnerIds.map(id => ctx.db.get(id)));
    const winnersById = new Map(winners.filter(Boolean).map(u => [u!._id, u]));

    // 4. Combinar los datos del sorteo y del ganador
    const results = finishedRaffles.map(raffle => {
      const winner = winnersById.get(raffle.winnerId as Id<'users'>);
      return {
        raffleId: raffle._id,
        raffleTitle: raffle.title,
        rafflePrize: raffle.prize,
        winningTicketNumber: raffle.winningTicketNumber,
        finishedAt: raffle.endTime,
        winnerName: winner ? `${winner.firstName} ${winner.lastName}` : "Usuario no encontrado",
      };
    });

    return results;
  },
});