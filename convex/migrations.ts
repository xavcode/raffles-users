import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const MIGRATION_BATCH_SIZE = 100;

/**
 * Acción interna para migrar los boletos.
 * Lee los boletos en lotes y llama a una mutación para parchear cada uno.
 */
export const migrateTicketsRaffleId = internalAction({
    handler: async (ctx) => {
        let cursor = null;
        let isDone = false;

        while (!isDone) {
            const { data, continueCursor, isDone: done } = await ctx.runQuery(
                internal.migrations.getTicketsToMigrate,
                cursor ? { cursor } : {}
            );
            isDone = done;
            cursor = continueCursor;

            await Promise.all(
                data.map((ticket) =>
                    ctx.runMutation(internal.migrations.patchTicket, {
                        ticketId: ticket._id,
                        raffleId: ticket.sorteoId!,
                    })
                )
            );
        }
        console.log("Migración de 'sorteoId' a 'raffleId' completada.");
    },
});

export const getTicketsToMigrate = internalQuery({
    args: { cursor: v.optional(v.string()) },
    handler: async (ctx, { cursor }) => {
        const result = await ctx.db
            .query("tickets")
            .withIndex("by_sorteoId_for_migration")
            .paginate({ numItems: MIGRATION_BATCH_SIZE, cursor: cursor ?? null });

        // Filtramos para migrar solo los que tienen sorteoId y no raffleId
        const data = result.page.filter((doc) => doc.sorteoId && !doc.raffleId);

        return { ...result, page: data };
    },
});

export const patchTicket = internalMutation({
    args: {
        ticketId: v.id("tickets"),
        raffleId: v.id("raffles"),
    },
    handler: async (ctx, { ticketId, raffleId }) => {
        await ctx.db.patch(ticketId, {
            raffleId: raffleId,
            sorteoId: undefined, // Esto elimina el campo 'sorteoId' del documento
        });
    },
});