import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Envía una review para un creador de sorteo.
 * Solo usuarios que compraron boletos en un sorteo finalizado pueden votar.
 */
export const submitReview = mutation({
    args: {
        raffleId: v.id("raffles"),
        rating: v.number(), // 1-5
        comment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado.");
        }

        // Obtener el usuario que hace la review
        const reviewer = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!reviewer) {
            throw new Error("Usuario no encontrado.");
        }

        // Validar que el rating esté entre 1 y 5
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("El rating debe estar entre 1 y 5.");
        }

        // Obtener la rifa
        const raffle = await ctx.db.get(args.raffleId);
        if (!raffle) {
            throw new Error("Sorteo no encontrado.");
        }

        // Verificar que el sorteo esté finalizado
        if (raffle.status !== "finished") {
            throw new Error("Solo puedes votar en sorteos finalizados.");
        }

        // Verificar que el usuario haya comprado boletos en este sorteo
        const purchase = await ctx.db
            .query("purchases")
            .withIndex("by_user_and_raffle", (q) =>
                q.eq("userId", reviewer._id).eq("raffleId", args.raffleId)
            )
            .filter((q) => q.eq(q.field("status"), "completed"))
            .first();

        if (!purchase) {
            throw new Error("Solo compradores de este sorteo pueden votar.");
        }

        // Verificar que no haya votado ya
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_raffle_reviewer", (q) =>
                q.eq("raffleId", args.raffleId).eq("reviewerId", reviewer._id)
            )
            .first();

        if (existingReview) {
            throw new Error("Ya has votado en este sorteo.");
        }

        // Crear la review
        await ctx.db.insert("reviews", {
            raffleId: args.raffleId,
            reviewerId: reviewer._id,
            reviewedUserId: raffle.creatorId,
            rating: args.rating,
            comment: args.comment,
        });

        // Actualizar estadísticas del creador
        const reviewedUser = await ctx.db.get(raffle.creatorId);
        if (reviewedUser) {
            const currentTotal = reviewedUser.totalReviewsReceived ?? 0;
            const currentAverage = reviewedUser.averageRating ?? 0;

            // Calcular nuevo promedio
            const newTotal = currentTotal + 1;
            const newAverage =
                (currentAverage * currentTotal + args.rating) / newTotal;

            await ctx.db.patch(raffle.creatorId, {
                totalReviewsReceived: newTotal,
                averageRating: newAverage,
            });
        }

        return { success: true };
    },
});

/**
 * Verifica si el usuario actual ya votó en un sorteo específico.
 */
export const hasUserReviewed = query({
    args: { raffleId: v.id("raffles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return false;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return false;
        }

        const review = await ctx.db
            .query("reviews")
            .withIndex("by_raffle_reviewer", (q) =>
                q.eq("raffleId", args.raffleId).eq("reviewerId", user._id)
            )
            .first();

        return review !== null;
    },
});

/**
 * Verifica si el usuario puede votar en un sorteo (compró boletos y no ha votado).
 */
export const canUserReview = query({
    args: { raffleId: v.id("raffles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { canReview: false, reason: "not_authenticated" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return { canReview: false, reason: "user_not_found" };
        }

        // Verificar que haya comprado boletos
        const purchase = await ctx.db
            .query("purchases")
            .withIndex("by_user_and_raffle", (q) =>
                q.eq("userId", user._id).eq("raffleId", args.raffleId)
            )
            .filter((q) => q.eq(q.field("status"), "completed"))
            .first();

        if (!purchase) {
            return { canReview: false, reason: "not_a_buyer" };
        }

        // Verificar que no haya votado ya
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_raffle_reviewer", (q) =>
                q.eq("raffleId", args.raffleId).eq("reviewerId", user._id)
            )
            .first();

        if (existingReview) {
            return { canReview: false, reason: "already_reviewed" };
        }

        return { canReview: true };
    },
});

/**
 * Obtiene el perfil público de un creador con su reputación.
 */
export const getCreatorProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            return null;
        }

        // Obtener sorteos completados del creador
        const completedRaffles = await ctx.db
            .query("raffles")
            .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
            .filter((q) => q.eq(q.field("status"), "finished"))
            .collect();

        // Obtener reviews recientes (últimas 10)
        const recentReviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewed_user", (q) => q.eq("reviewedUserId", args.userId))
            .order("desc")
            .take(10);

        // Obtener nombres de los reviewers
        const reviewsWithNames = await Promise.all(
            recentReviews.map(async (review) => {
                const reviewer = await ctx.db.get(review.reviewerId);
                return {
                    ...review,
                    reviewerName: reviewer?.userName ?? "Usuario",
                };
            })
        );

        return {
            _id: user._id,
            userName: user.userName,
            profileImageUrl: user.profileImageUrl,
            bio: user.bio,
            totalReviewsReceived: user.totalReviewsReceived ?? 0,
            averageRating: user.averageRating ?? 0,
            completedRafflesCount: completedRaffles.length,
            recentReviews: reviewsWithNames,
            memberSince: user._creationTime,
        };
    },
});

/**
 * Obtiene la reputación resumida de un creador (para mostrar en tarjetas).
 */
export const getCreatorReputation = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            return null;
        }

        return {
            totalReviews: user.totalReviewsReceived ?? 0,
            averageRating: user.averageRating ?? 0,
            profileImageUrl: user.profileImageUrl,
        };
    },
});
