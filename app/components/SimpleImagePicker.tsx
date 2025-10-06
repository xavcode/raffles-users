import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { uploadProfileImage } from '../../utils/imageUpload';

interface SimpleImagePickerProps {
    currentImageUrl?: string;
    onImageSelected: (imageUrl: string) => void;
    onUploadStart?: () => void;
    onUploadComplete?: () => void;
    isUploading?: boolean;
}

const SimpleImagePicker: React.FC<SimpleImagePickerProps> = ({
    currentImageUrl,
    onImageSelected,
    onUploadStart,
    onUploadComplete,
    isUploading = false,
}) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            // Solicitar permisos para la galería
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Toast.show({
                    type: 'error',
                    text1: 'Permisos requeridos',
                    text2: 'Necesitas permitir el acceso a la galería.',
                });
                return;
            }

            // Lanzar selector de imágenes directamente (sin opción de recortar)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Sin recortar
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];

                try {
                    if (onUploadStart) onUploadStart();

                    // Subir la imagen usando el patrón corregido de Cloudinary
                    const uploadResult = await uploadProfileImage(selectedImage);

                    if (uploadResult.success && uploadResult.url) {
                        setPreviewImage(uploadResult.url);
                        onImageSelected(uploadResult.url);
                        if (onUploadComplete) onUploadComplete();
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: uploadResult.error || 'No se pudo subir la imagen',
                        });
                    }
                } catch (error) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Error procesando imagen',
                    });
                }
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Error seleccionando imagen',
            });
        }
    };

    const clearImage = () => {
        setPreviewImage(null);
        onImageSelected('');
    };

    const displayImage = previewImage || currentImageUrl;

    return (
        <View className="items-center mb-6">
            <Text className="text-sm font-quicksand-bold text-slate-600 mb-3">
                Foto de Perfil
            </Text>

            <View className="relative mb-4">
                <View className="w-32 h-32 rounded-full border-4 border-slate-200 bg-slate-100 items-center justify-center overflow-hidden shadow-sm">
                    {displayImage ? (
                        <Image
                            source={{ uri: displayImage }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="person-outline" size={48} color="#94a3b8" />
                    )}
                </View>

                {displayImage && !isUploading && (
                    <Pressable
                        onPress={clearImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full items-center justify-center shadow-lg"
                    >
                        <Ionicons name="close" size={16} color="white" />
                    </Pressable>
                )}

                {isUploading && (
                    <View className="absolute inset-0 bg-black/60 rounded-full items-center justify-center">
                        <ActivityIndicator size="large" color="white" />
                    </View>
                )}
            </View>

            <Pressable
                onPress={pickImage}
                disabled={isUploading}
                className={`flex-row items-center px-6 py-3 rounded-xl transition-all duration-200 ${isUploading
                        ? 'bg-slate-400'
                        : 'bg-indigo-600 active:bg-indigo-700 shadow-lg active:shadow-xl'
                    }`}
            >
                <Ionicons name="images-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-quicksand-semibold">
                    {displayImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </Text>
            </Pressable>

            <Text className="text-sm text-slate-500 text-center mt-2">
                Selecciona una imagen de tu galería
            </Text>
        </View>
    );
};

export default SimpleImagePicker;