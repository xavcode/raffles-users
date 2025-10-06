import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmitReview: (score: number, comment?: string) => void;
    sellerName: string;
    raffleTitle: string;
    isSubmitting?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    onClose,
    onSubmitReview,
    sellerName,
    raffleTitle,
    isSubmitting = false,
}) => {
    const [selectedScore, setSelectedScore] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    const handleSubmit = () => {
        if (selectedScore === 0) {
            Toast.show({
                type: 'error',
                text1: 'Calificación requerida',
                text2: 'Por favor selecciona una calificación de 1 a 5 estrellas.',
            });
            return;
        }

        onSubmitReview(selectedScore, comment.trim() || undefined);
    };

    const handleClose = () => {
        setSelectedScore(0);
        setComment('');
        onClose();
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const isSelected = i <= selectedScore;
            stars.push(
                <Pressable
                    key={i}
                    onPress={() => setSelectedScore(i)}
                    disabled={isSubmitting}
                    className="mx-1"
                >
                    <Ionicons
                        name={isSelected ? "star" : "star-outline"}
                        size={32}
                        color={isSelected ? "#fbbf24" : "#d1d5db"}
                    />
                </Pressable>
            );
        }
        return stars;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable
                className="flex-1 bg-black/50 items-center justify-center p-4"
                onPress={handleClose}
            >
                <Pressable
                    className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg"
                    onPress={(e) => e.stopPropagation()}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-quicksand-bold text-slate-800">
                            Calificar Vendedor
                        </Text>
                        {!isSubmitting && (
                            <Pressable onPress={handleClose} className="p-2">
                                <Ionicons name="close" size={24} color="#64748b" />
                            </Pressable>
                        )}
                    </View>

                    <Text className="text-base text-slate-600 mb-4">
                        ¿Cómo calificarías tu experiencia con <Text className="font-quicksand-bold text-slate-800">@{sellerName}</Text> en el sorteo "{raffleTitle}"?
                    </Text>

                    {/* Selector de estrellas */}
                    <View className="flex-row items-center justify-center mb-6">
                        {renderStars()}
                    </View>

                    {/* Área de comentario opcional */}
                    <View className="mb-6">
                        <Text className="text-sm font-quicksand-bold text-slate-600 mb-2">
                            Comentario (opcional)
                        </Text>
                        <View className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <Text className="text-sm text-slate-500 mb-2">
                                Comparte tu experiencia para ayudar a otros compradores...
                            </Text>
                            <Text className="text-xs text-slate-400">
                                Tu reseña será pública y ayudará a construir la reputación del vendedor.
                            </Text>
                        </View>
                    </View>

                    {/* Botones de acción */}
                    <View className="flex-row space-x-3">
                        <Pressable
                            onPress={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 h-12 rounded-xl items-center justify-center bg-slate-100 active:bg-slate-200"
                        >
                            <Text className="text-slate-600 font-quicksand-semibold">
                                {isSubmitting ? 'Enviando...' : 'Cancelar'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting || selectedScore === 0}
                            className={`flex-1 h-12 rounded-xl items-center justify-center ${selectedScore === 0 || isSubmitting
                                    ? 'bg-slate-400'
                                    : 'bg-indigo-600 active:bg-indigo-700'
                                }`}
                        >
                            {isSubmitting ? (
                                <Text className="text-white font-quicksand-semibold">Enviando...</Text>
                            ) : (
                                <Text className="text-white font-quicksand-semibold">
                                    Enviar Reseña
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default ReviewModal;