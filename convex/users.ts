import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

/**
 * Obtiene el usuario actual basado en la identidad de Clerk.
 * Si el usuario no existe en la tabla `users`, lo crea.
 * Esta función es útil para asegurar que un usuario exista antes de realizar acciones.
 */
// export const getOrCreateUser = mutation({
//   handler: async (ctx) => {
//     const identity = await ctx.auth.getUserIdentity();
//     if (!identity) {
//       throw new Error("No hay un usuario autenticado.");
//     }

//     const user = await ctx.db
//       .query("users")
//       .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
//       .unique();

//     if (user) {
//       return user;
//     }

//     // Si el usuario no existe, lo creamos
//     const newUser = {
//       email: identity.email,
//       firstName: identity.givenName ?? "",
//       lastName: identity.familyName ?? "",
//       clerkId: identity.subject,
//       balance: 0,
//       userType: "free" as "free",
//       freeRafflesResetDate: 0,
//       raffleCredits: 0,
//       subscriptionTier: "free" as "free", // 
//       freeRafflesUsedThisMonth: 0, //  
//     };
//     const newUserId = await ctx.db.insert("users", newUser);
//     return await ctx.db.get(newUserId);
//   },
// });

/**
 * Obtiene el documento del usuario actual que ha iniciado sesión.
 * Devuelve `null` si el usuario no está autenticado o no se encuentra en la BD.
 */
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
    });
  },
});
export const update = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
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
    await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      profileImageUrl: args.profileImageUrl,
      userName: args.userName, // Actualizar el userName
    });
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