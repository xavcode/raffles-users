import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface ImageSourceModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectGallery: () => void;
    onSelectCamera: () => void;
}

const ImageSourceModal: React.FC<ImageSourceModalProps> = ({
    visible,
    onClose,
    onSelectGallery,
    onSelectCamera,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 items-center justify-center"
                onPress={onClose}
            >
                <Pressable
                    className="bg-white rounded-2xl p-6 w-80 shadow-lg"
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text className="text-xl font-quicksand-bold text-slate-800 mb-6 text-center">
                        Seleccionar imagen
                    </Text>
                    <Text className="text-base text-slate-600 mb-6 text-center">
                        ¿Cómo quieres obtener la imagen?
                    </Text>

                    <View className="space-y-3">
                        <Pressable
                            onPress={() => {
                                onSelectGallery();
                                onClose();
                            }}
                            className="flex-row items-center p-4 bg-slate-100 rounded-xl active:bg-slate-200"
                        >
                            <Ionicons name="images-outline" size={24} color="#64748b" />
                            <Text className="text-base font-quicksand-semibold text-slate-700 ml-3">
                                Galería
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                onSelectCamera();
                                onClose();
                            }}
                            className="flex-row items-center p-4 bg-slate-100 rounded-xl active:bg-slate-200"
                        >
                            <Ionicons name="camera-outline" size={24} color="#64748b" />
                            <Text className="text-base font-quicksand-semibold text-slate-700 ml-3">
                                Cámara
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={onClose}
                            className="p-4 bg-red-50 rounded-xl active:bg-red-100 mt-4"
                        >
                            <Text className="text-base font-quicksand-semibold text-red-600 text-center">
                                Cancelar
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default ImageSourceModal;