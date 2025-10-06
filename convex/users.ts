import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const getCurrent = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      // No hay un usuario autenticado
      return null;
    }

    // Busca al usuario en la tabla `users` usando el ID de Clerk
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const createUser = internalMutation({

  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    userType: v.union(v.literal("admin"), v.literal("free")),
    phone: v.optional(v.string()), // Agregado
    raffleCredits: v.number(), // Agregado
    subscriptionTier: v.union(v.literal('free'), v.literal('premium')), // Agregado y corregido a union
    freeRafflesUsedThisMonth: v.number(), // Agregado
    freeRafflesResetDate: v.number(), // Agregado
    userName: v.string(), // Añadir userName como argumento
    profileImageUrl: v.optional(v.string()), // Agregado
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      userName: args.userName, // Usar el userName pasado como argumento
      balance: 0,
      userType: args.userType,
      // phone: args.phone ?? "", // Agregado y con default
      raffleCredits: args.raffleCredits,
      subscriptionTier: args.subscriptionTier,
      freeRafflesUsedThisMonth: args.freeRafflesUsedThisMonth,
      freeRafflesResetDate: args.freeRafflesResetDate,
      profileImageUrl: args.profileImageUrl, // Guardar la URL de la imagen de perfil
      freeRafflesRemaining: 3, // Inicializar con 3 rifas gratuitas
      termsAccepted: false, // Inicializar como no aceptado
      // Campos de reputación inicializados en 0/null
      reputationScore: 0,
      totalReviews: 0,
      rafflesCreated: 0,
    });
  },
});
export const update = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()), // Permitir actualizar la imagen de perfil
    userName: v.optional(v.string()), // Permitir actualizar el userName
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

    // Solo actualizar los campos que se proporcionan
    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.profileImageUrl !== undefined) updates.profileImageUrl = args.profileImageUrl;
    if (args.userName !== undefined) updates.userName = args.userName;

    await ctx.db.patch(user._id, updates);
  },
});

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId)).unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  }
});

export const storePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found.");
    }

    await ctx.db.patch(user._id, { pushToken: args.token });
  },
});


export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query('users').withIndex('by_email', q => q.eq('email', args.email)).unique();
    return user ?? null;
  }
});

export const updateRole = mutation({
  args: { email: v.string(), role: v.union(v.literal('admin'), v.literal('free')) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('No autenticado');
    const requester = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject)).unique();
    if (!requester || requester.userType !== 'admin') throw new Error('Permisos insuficientes');

    const user = await ctx.db.query('users').withIndex('by_email', q => q.eq('email', args.email)).unique();
    if (!user) throw new Error('Usuario no encontrado');
    await ctx.db.patch(user._id, { userType: args.role });
    return true;
  }
});

export const getUsersWithPushTokens = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_pushToken", q => q.gt("pushToken", undefined))
      .collect();
  },
});

export const getAdminsWithPushTokens = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userType_pushToken", q => q.eq("userType", "admin").gt("pushToken", undefined))
      .collect();
  },
});

export const checkUserNameExists = internalQuery({
  args: { userName: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userName", (q) => q.eq("userName", args.userName))
      .unique();
    return user !== null;
  },
});

export const acceptTerms = mutation({
  handler: async (ctx) => {
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

    await ctx.db.patch(user._id, { termsAccepted: true });
    return true;
  },
});

export const getUsersForAdmin = query({
  args: {
    search: v.optional(v.string()), // Opcional: para futuras búsquedas
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Solo los administradores pueden ver esta lista completa de usuarios
    if (!user || user.userType !== "admin") {
      throw new Error("Permisos insuficientes.");
    }

    let users = await ctx.db.query("users").collect();

    if (args.search) {
      const searchQuery = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.userName.toLowerCase().includes(searchQuery) ||
          (u.email && u.email.toLowerCase().includes(searchQuery))
      );
    }

    return users;
  },
});

// ===== FUNCIONES DE REPUTACIÓN =====

// Crear una nueva reseña
export const createReview = mutation({
  args: {
    reviewedUserId: v.id("users"),
    raffleId: v.id("raffles"),
    score: v.float64(), // 1-5 estrellas
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No estás autenticado.");
    }

    const reviewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!reviewer) {
      throw new Error("Usuario no encontrado.");
    }

    // Verificar que el score esté en el rango correcto
    if (args.score < 1 || args.score > 5) {
      throw new Error("El puntaje debe estar entre 1 y 5 estrellas.");
    }

    // Verificar que no exista ya una reseña para este sorteo por este usuario
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", reviewer._id))
      .filter((q) => q.eq(q.field("raffleId"), args.raffleId))
      .first();

    if (existingReview) {
      throw new Error("Ya has reseñado este sorteo.");
    }

    // Crear la reseña
    const reviewId = await ctx.db.insert("reviews", {
      reviewerId: reviewer._id,
      reviewedUserId: args.reviewedUserId,
      raffleId: args.raffleId,
      score: args.score,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Actualizar la reputación del usuario reseñado
    await updateUserReputation(ctx, args.reviewedUserId);

    return reviewId;
  },
});

// Función interna para actualizar la reputación de un usuario
const updateUserReputation = async (ctx: any, userId: any) => {
  // Obtener todas las reseñas del usuario
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_reviewed_user", (q: any) => q.eq("reviewedUserId", userId))
    .collect();

  if (reviews.length === 0) {
    // Si no tiene reseñas, reputación = 0
    await ctx.db.patch(userId, {
      reputationScore: 0,
      totalReviews: 0,
    });
    return;
  }

  // Calcular promedio
  const totalScore = reviews.reduce((sum: number, review: any) => sum + review.score, 0);
  const averageScore = totalScore / reviews.length;

  // Actualizar reputación
  await ctx.db.patch(userId, {
    reputationScore: averageScore,
    totalReviews: reviews.length,
  });
};

// Obtener reseñas de un usuario
export const getUserReviews = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_reviewed_user", (q) => q.eq("reviewedUserId", args.userId))
      .collect();
  },
});

// Incrementar contador de sorteos creados
export const incrementRafflesCreated = mutation({
  handler: async (ctx) => {
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

    const currentRaffles = user.rafflesCreated || 0;

    await ctx.db.patch(user._id, {
      rafflesCreated: currentRaffles + 1,
    });

    return currentRaffles + 1;
  },
});

// Obtener estadísticas de reputación de un usuario
export const getUserReputationStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewed_user", (q) => q.eq("reviewedUserId", args.userId))
      .collect();

    return {
      reputationScore: user.reputationScore || 0,
      totalReviews: user.totalReviews || 0,
      rafflesCreated: user.rafflesCreated || 0,
      isNewUser: (user.rafflesCreated || 0) < 3,
      reviews: reviews,
    };
  },
});