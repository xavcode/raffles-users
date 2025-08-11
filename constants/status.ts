export const PURCHASE_STATUS = {
    PENDING_PAYMENT: 'pending_payment',
    PENDING_CONFIRMATION: 'pending_confirmation',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
} as const;

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS];

export const USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];


