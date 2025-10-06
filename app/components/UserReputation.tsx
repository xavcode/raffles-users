import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface UserReputationProps {
    reputationScore?: number;
    totalReviews?: number;
    rafflesCreated?: number;
    size?: 'small' | 'medium' | 'large';
    showDetails?: boolean;
}

const UserReputation: React.FC<UserReputationProps> = ({
    reputationScore = 0,
    totalReviews = 0,
    rafflesCreated = 0,
    size = 'medium',
    showDetails = true,
}) => {
    // Determinar si es un usuario nuevo
    const isNewUser = rafflesCreated < 3;

    // Función para renderizar estrellas
    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(reputationScore);
        const hasHalfStar = reputationScore % 1 >= 0.5;

        // Estrellas completas
        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Ionicons
                    key={`star-${i}`}
                    name="star"
                    size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
                    color="#fbbf24"
                />
            );
        }

        // Media estrella si aplica
        if (hasHalfStar) {
            stars.push(
                <Ionicons
                    key="half-star"
                    name="star-half"
                    size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
                    color="#fbbf24"
                />
            );
        }

        // Estrellas vacías
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Ionicons
                    key={`empty-star-${i}`}
                    name="star-outline"
                    size={size === 'small' ? 12 : size === 'medium' ? 16 : 20}
                    color="#d1d5db"
                />
            );
        }

        return stars;
    };

    // Función para obtener el nivel de reputación
    const getReputationLevel = () => {
        if (isNewUser) return { text: 'Nuevo vendedor', color: '#10b981', bgColor: '#d1fae5' };
        if (reputationScore >= 4.5) return { text: 'Legendario', color: '#f59e0b', bgColor: '#fef3c7' };
        if (reputationScore >= 4.0) return { text: 'Experto', color: '#3b82f6', bgColor: '#dbeafe' };
        if (reputationScore >= 3.5) return { text: 'Experimentado', color: '#8b5cf6', bgColor: '#ede9fe' };
        if (reputationScore >= 3.0) return { text: 'Principiante', color: '#6b7280', bgColor: '#f3f4f6' };
        return { text: 'Sin calificaciones', color: '#9ca3af', bgColor: '#f9fafb' };
    };

    const level = getReputationLevel();

    if (isNewUser) {
        return (
            <View className={`px-3 py-2 rounded-full ${level.bgColor} border border-green-200`}>
                <Text className={`font-quicksand-bold text-center`} style={{ color: level.color, fontSize: size === 'small' ? 10 : size === 'medium' ? 12 : 14 }}>
                    🆕 {level.text}
                </Text>
            </View>
        );
    }

    return (
        <View className="items-center">
            {/* Estrellas y puntaje */}
            <View className="flex-row items-center mb-1">
                {renderStars()}
                {showDetails && (
                    <Text className={`ml-2 font-quicksand-bold ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
                        }`} style={{ color: '#374151' }}>
                        {reputationScore > 0 ? reputationScore.toFixed(1) : '0.0'}
                    </Text>
                )}
            </View>

            {/* Nivel de reputación */}
            {showDetails && (
                <View className={`px-2 py-1 rounded-full ${level.bgColor}`}>
                    <Text className={`font-quicksand-semibold text-center`} style={{
                        color: level.color,
                        fontSize: size === 'small' ? 9 : size === 'medium' ? 11 : 13
                    }}>
                        {level.text}
                    </Text>
                </View>
            )}

            {/* Número de reseñas */}
            {showDetails && totalReviews > 0 && (
                <Text className={`text-center mt-1 ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
                    }`} style={{ color: '#6b7280' }}>
                    {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
                </Text>
            )}
        </View>
    );
};

export default UserReputation;