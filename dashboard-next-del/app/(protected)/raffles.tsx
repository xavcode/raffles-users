"use client"; // ¡Importante! Esto lo convierte en un Componente de Cliente.

import { useMutation } from "convex/react";
import { useState } from "react";
// Asegúrate de que tu tsconfig.json tenga el alias para @/convex/*
// si estás en un multirepo. Si no, la ruta podría ser diferente.
import { api } from "@/convex/_generated/api";

export default function RafflesPage() {
    // Hook de mutación de Convex
    const createRaffle = useMutation(api.raffles.createRaffle);

    // Estado del formulario
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [totalTickets, setTotalTickets] = useState(100);
    const [ticketPrice, setTicketPrice] = useState(5000);
    const [prize, setPrize] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startTime || !endTime) {
            alert("Por favor, selecciona las fechas de inicio y fin.");
            return;
        }
        setIsLoading(true);

        try {
            // Convertir las fechas a timestamp (número de milisegundos)
            const startTimeMs = new Date(startTime).getTime();
            const endTimeMs = new Date(endTime).getTime();

            await createRaffle({
                title,
                description,
                totalTickets,
                ticketPrice,
                prize,
                startTime: startTimeMs,
                endTime: endTimeMs,
                imageUrl,
            });

            alert("¡Sorteo creado con éxito!");
            // Limpiar el formulario
            setTitle("");
            setDescription("");
            setTotalTickets(100);
            setTicketPrice(5000);
            setPrize("");
            setStartTime("");
            setEndTime("");
            setImageUrl("");

        } catch (error: any) {
            console.error("Error al crear el sorteo:", error);
            // El error de Convex suele venir en `error.data` o `error.message`
            alert(`Error: ${error.data?.message || error.message || "Ocurrió un error desconocido."}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-md rounded-lg mt-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Crear Nuevo Sorteo</h1>
            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-6">
                    <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">Título del Sorteo</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Ej: Rifa para el viaje de fin de año" required />
                </div>

                {/* Description */}
                <div className="mb-6">
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">Descripción</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Describe los detalles del sorteo" required></textarea>
                </div>

                {/* Prize */}
                <div className="mb-6">
                    <label htmlFor="prize" className="block mb-2 text-sm font-medium text-gray-900">Premio</label>
                    <input type="text" id="prize" value={prize} onChange={(e) => setPrize(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Ej: $1,000,000 COP o Un Viaje a Cancún" required />
                </div>

                {/* Tickets and Price */}
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
                        <label htmlFor="totalTickets" className="block mb-2 text-sm font-medium text-gray-900">Total de Boletos</label>
                        <input type="number" id="totalTickets" value={totalTickets} onChange={(e) => setTotalTickets(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label htmlFor="ticketPrice" className="block mb-2 text-sm font-medium text-gray-900">Precio por Boleto (COP)</label>
                        <input type="number" id="ticketPrice" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                </div>

                {/* Image URL */}
                <div className="mb-6">
                    <label htmlFor="imageUrl" className="block mb-2 text-sm font-medium text-gray-900">URL de la Imagen</label>
                    <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="https://ejemplo.com/imagen.png" required />
                </div>

                {/* Dates */}
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                    <div>
                        <label htmlFor="startTime" className="block mb-2 text-sm font-medium text-gray-900">Fecha y Hora de Inicio</label>
                        <input type="datetime-local" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block mb-2 text-sm font-medium text-gray-900">Fecha y Hora de Fin</label>
                        <input type="datetime-local" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Creando..." : "Crear Sorteo"}
                </button>
            </form>
        </div>
    );
}

