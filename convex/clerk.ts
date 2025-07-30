import { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

export const handleClerkWebhook = httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
        return new Response("Invalid request", { status: 400 });
    }

    switch (event.type) {
        case "user.created":
            // Se extrae el userType de los metadatos públicos de Clerk.
            // Si no está definido o no es "admin", se asigna "member" por defecto.
            const userType = (event.data.public_metadata.userType as string) === "admin" ? "admin" : "member";
            await ctx.runMutation(internal.users.createUser, {
                clerkId: event.data.id,
                email: event.data.email_addresses[0]?.email_address,
                firstName: `${event.data.first_name ?? ""}`.trim(),
                lastName: event.data.last_name ?? "",
                userType: userType,
            });
            break;

        // case "user.updated":
        //     await ctx.runMutation(internal.users.updateUser, {
        //         clerkId: event.data.id,
        //         email: event.data.email_addresses[0]?.email_address,
        //         name: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`,
        //     });
        //     break;
        case "user.deleted":
            await ctx.runMutation(internal.users.deleteUser, {
                clerkId: event.data.id as string,
            });
            break;
        default:
            console.log("Unhandled Clerk webhook event:", event.type);
    }

    return new Response(null, { status: 200 });
});

async function validateRequest(req: Request): Promise<WebhookEvent | undefined> {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
        // Esto no debería ocurrir si el entorno está bien configurado,
        // pero satisface al verificador de tipos y añade seguridad.
        throw new Error("CLERK_WEBHOOK_SECRET no está configurado en las variables de entorno.");
    }
    const webhook = new Webhook(webhookSecret);
    const payload = await req.text();
    const headers = req.headers;

    try {
        const event = webhook.verify(payload, {
            "svix-id": headers.get("svix-id")!,
            "svix-timestamp": headers.get("svix-timestamp")!,
            "svix-signature": headers.get("svix-signature")!,
        }) as WebhookEvent;
        return event;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        console.error(`Error al verificar el webhook de Clerk: ${errorMessage}`);
        return undefined;
    }
}