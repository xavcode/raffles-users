import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllRaffles = query({
    // args: {},
    handler: async (ctx) => {
        return (await ctx.db.query("raffles").collect()).sort((a, b) => b._creationTime - a._creationTime);
    }
})

export const getById = query({
    args: { id: v.id("raffles") },
    handler: async (ctx, args) => {
        const raffle = await ctx.db.get(args.id);
        return raffle;
    },
});

export const createRaffle = mutation({
    // Estos son los únicos argumentos que el dashboard necesita enviar.
    // El resto de los datos (como el creador) los obtendremos del contexto de autenticación.
    args: {
        title: v.string(),
        description: v.string(),
        totalTickets: v.float64(),
        ticketPrice: v.float64(),
        prize: v.number(), // Usar string es más flexible que un número
        startTime: v.float64(),
        endTime: v.float64(),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Obtener la identidad del usuario que llama a la mutación.
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado. Por favor, inicia sesión.");
        }

        // 2. Buscar al usuario en nuestra tabla 'users' para verificar su rol.
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador para crear un sorteo.");
        }

        // 3. Insertar el nuevo sorteo en la base de datos.
        const newRaffleId = await ctx.db.insert("raffles", {
            ...args, // Usamos todos los argumentos que vienen del formulario.
            creatorId: user._id, // El ID del creador es el del admin autenticado.
            ticketsSold: 0, // Los sorteos siempre empiezan con 0 boletos vendidos.
            status: "active", // Por defecto, el sorteo se crea como 'activo'.
        });

        return newRaffleId;
    },
});

export const updateRaffle = mutation({
    args: {
        id: v.id("raffles"),
        // Hacemos todos los campos opcionales para poder actualizar solo lo necesario
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ticketPrice: v.optional(v.float64()),
        totalTickets: v.optional(v.float64()),
        imageUrl: v.optional(v.string()),
        // Campos específicos para finalizar el sorteo
        status: v.optional(v.string()),
        winningTicketNumber: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        // 1. Verificación de permisos de administrador (¡muy importante!)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("No estás autenticado.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.userType !== "admin") {
            throw new Error("No tienes permisos de administrador para modificar un sorteo.");
        }

        // 2. Extraemos el ID y el resto de los datos a actualizar
        const { id, ...rest } = args;

        // 3. Actualizamos el documento en la base de datos usando `patch`
        // `patch` es ideal porque solo modifica los campos que le pasamos.
        await ctx.db.patch(id, rest);

        // Opcional: podrías devolver el sorteo actualizado si lo necesitas en el cliente
        return true;
    },
});
