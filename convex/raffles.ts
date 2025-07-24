import { query } from "@/convex/_generated/server";
import { v } from "convex/values";

export const getAllRaffles = query({
    // args: {},
    handler: async (ctx) => {
        return await ctx.db.query("raffles").collect()
    }
})

export const getById = query({
    args: { id: v.id("raffles") },
    handler: async (ctx, args) => {
        const raffle = await ctx.db.get(args.id);
        return raffle;
    },
});


