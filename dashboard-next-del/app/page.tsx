"use client";

import { api } from "@/convex/_generated/api";

import { useQuery } from "convex/react";

export default function Home() {
  // const users = useQuery(api.users.getAllUsers);
  const raffles = useQuery(api.raffles.getAllRaffles);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Dashboard de Rifas</h1>
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl mb-4">Rifas Disponibles</h2>
          {raffles?.map((raffle: any) => (
            <div key={raffle._id} className="p-4 border rounded-lg mb-2 bg-gray-50">
              <h3 className="font-semibold text-lg">{raffle.prize}</h3>
              <p className="text-gray-600">{raffle.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
