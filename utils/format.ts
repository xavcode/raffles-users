export const formatCOP = (amount: number): string => {
    try {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(amount);
    } catch {
        // Fallback simple si Intl no está disponible por alguna razón
        return `COP ${Math.round(amount).toLocaleString('es-CO')}`;
    }
};


