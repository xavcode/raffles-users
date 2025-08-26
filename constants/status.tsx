import { Doc } from "@/convex/_generated/dataModel";
import { Text, View } from "react-native";

export const PURCHASE_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_CONFIRMATION: 'pending_confirmation',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected'
} as const;

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS];

export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];


export const PURCHASE_STATUS_STYLES = {
  pending_payment: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'time-outline' as const, iconColor: '#b45309' },
  pending_confirmation: { label: 'Verificando', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'hourglass-outline' as const, iconColor: '#1d4ed8' },
  completed: { label: 'Pagado', bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle-outline' as const, iconColor: '#15803d' },
  expired: { label: 'Expirado', bg: 'bg-slate-100', text: 'text-slate-600', icon: 'close-circle-outline' as const, iconColor: '#475569' },
  rejected: { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-700', icon: 'alert-circle-outline' as const, iconColor: '#b91c1c' }
};

export const getStatusBadge = (status: Doc<'purchases'>['status']) => {
  switch (status) {
    case 'completed':
      return <View className="px-2 py-1 bg-green-100 rounded-full"><Text className="text-xs font-quicksand-bold text-green-800">Completada</Text></View>;
    case 'pending_confirmation':
      return <View className="px-2 py-1 bg-yellow-100 rounded-full"><Text className="text-xs font-quicksand-bold text-yellow-800">Pendiente de Confirmación</Text></View>;
    case 'pending_payment':
      return <View className="px-2 py-1 bg-blue-100 rounded-full"><Text className="text-xs font-quicksand-bold text-blue-800">Pendiente de Pago</Text></View>;
    case 'expired':
      return <View className="px-2 py-1 bg-red-100 rounded-full"><Text className="text-xs font-quicksand-bold text-red-800">Expirada</Text></View>;
    default:
      return <View className="px-2 py-1 bg-slate-100 rounded-full"><Text className="text-xs font-quicksand-bold text-slate-800">{status}</Text></View>;
  }
};