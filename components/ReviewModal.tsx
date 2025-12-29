import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import StarRating from './StarRating';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    raffleId: Id<'raffles'>;
    creatorName: string;
}

/**
 * Modal para que los compradores dejen una review después de un sorteo.
 */
const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    onClose,
    raffleId,
    creatorName,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitReview = useMutation(api.reviews.submitReview);

    const handleSubmit = async () => {
        if (rating === 0) {
            Toast.show({
                type: 'error',
                text1: 'Rating requerido',
                text2: 'Por favor selecciona una calificación.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await submitReview({
                raffleId,
                rating,
                comment: comment.trim() || undefined,
            });

            Toast.show({
                type: 'success',
                text1: '¡Gracias por tu opinión!',
                text2: 'Tu calificación ha sido registrada.',
            });

            // Reset y cerrar
            setRating(0);
            setComment('');
            onClose();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo enviar la review.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-black/60 justify-center items-center p-4">
                <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View className="bg-indigo-100 p-3 rounded-full mb-3">
                            <Ionicons name="star" size={32} color="#4f46e5" />
                        </View>
                        <Text className="text-xl font-quicksand-bold text-slate-800 text-center">
                            ¿Cómo fue tu experiencia?
                        </Text>
                        <Text className="text-sm font-quicksand-medium text-slate-500 text-center mt-1">
                            Califica a {creatorName}
                        </Text>
                    </View>

                    {/* Star Rating */}
                    <View className="items-center mb-6">
                        <StarRating
                            rating={rating}
                            size={40}
                            editable
                            onRatingChange={setRating}
                        />
                        <Text className="text-sm font-quicksand-medium text-slate-400 mt-2">
                            {rating === 0
                                ? 'Toca para calificar'
                                : rating === 1
                                    ? 'Muy malo'
                                    : rating === 2
                                        ? 'Malo'
                                        : rating === 3
                                            ? 'Regular'
                                            : rating === 4
                                                ? 'Bueno'
                                                : 'Excelente'}
                        </Text>
                    </View>

                    {/* Comment Input */}
                    <View className="mb-6">
                        <Text className="text-sm font-quicksand-semibold text-slate-700 mb-2">
                            Comentario (opcional)
                        </Text>
                        <TextInput
                            className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-base font-quicksand-medium text-slate-800 min-h-[80px]"
                            placeholder="Cuéntanos más sobre tu experiencia..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                            maxLength={200}
                        />
                        <Text className="text-xs font-quicksand-medium text-slate-400 text-right mt-1">
                            {comment.length}/200
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 h-12 rounded-lg items-center justify-center bg-slate-200 active:bg-slate-300"
                        >
                            <Text className="font-quicksand-bold text-slate-700">Ahora no</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                            className={`flex-1 h-12 rounded-lg items-center justify-center ${rating === 0 ? 'bg-indigo-300' : 'bg-indigo-600 active:bg-indigo-700'
                                }`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="font-quicksand-bold text-white">Enviar</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ReviewModal;
