import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface StarRatingProps {
    rating: number; // Valor actual (puede ser decimal para mostrar, entero para seleccionar)
    maxStars?: number;
    size?: number;
    color?: string;
    emptyColor?: string;
    onRatingChange?: (rating: number) => void; // Si es undefined, es de solo lectura
    editable?: boolean;
}

/**
 * Componente de estrellas para mostrar o seleccionar rating.
 * Si onRatingChange está definido, las estrellas son interactivas.
 */
const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxStars = 5,
    size = 24,
    color = '#facc15', // Amarillo/dorado
    emptyColor = '#cbd5e1', // Gris claro
    onRatingChange,
    editable = false,
}) => {
    const handlePress = (starIndex: number) => {
        if (editable && onRatingChange) {
            onRatingChange(starIndex + 1);
        }
    };

    const renderStar = (index: number) => {
        const filled = index < Math.floor(rating);
        const halfFilled = !filled && index < rating && rating % 1 >= 0.5;

        let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        let iconColor = emptyColor;

        if (filled) {
            iconName = 'star';
            iconColor = color;
        } else if (halfFilled) {
            iconName = 'star-half';
            iconColor = color;
        }

        const StarIcon = (
            <Ionicons name={iconName} size={size} color={iconColor} />
        );

        if (editable) {
            return (
                <Pressable
                    key={index}
                    onPress={() => handlePress(index)}
                    className="active:opacity-70"
                >
                    {StarIcon}
                </Pressable>
            );
        }

        return <View key={index}>{StarIcon}</View>;
    };

    return (
        <View className="flex-row">
            {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
        </View>
    );
};

export default StarRating;
