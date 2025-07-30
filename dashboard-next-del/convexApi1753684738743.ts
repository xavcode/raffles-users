import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  raffles: {
    getAllRaffles: FunctionReference<"query", "public", any, any>;
    getById: FunctionReference<"query", "public", { id: Id<"raffles"> }, any>;
  };
  tickets: {
    getNonAvailableTickets: FunctionReference<
      "query",
      "public",
      { raffleId: Id<"raffles"> },
      any
    >;
    reserveTickets: FunctionReference<
      "mutation",
      "public",
      { raffleId: Id<"raffles">; ticketNumbers: Array<number> },
      any
    >;
    getAll: FunctionReference<"query", "public", any, any>;
  };
  users: {
    getOrCreateUser: FunctionReference<"mutation", "public", any, any>;
    getCurrent: FunctionReference<"query", "public", any, any>;
    update: FunctionReference<
      "mutation",
      "public",
      { firstName: string; lastName: string; phone?: string },
      any
    >;
  };
};
export type InternalApiType = {};
