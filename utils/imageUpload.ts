// Servicio para subir imágenes usando Cloudinary
// Configuración desde variables de entorno
import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

// Función para subir imágenes a Cloudinary usando el patrón de create-raffle.tsx
export const uploadImageToCloudinary = async (imageAsset: any): Promise<UploadResult> => {
    try {
        // Verificar que las variables de entorno estén configuradas
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            return {
                success: false,
                error: 'Configuración de Cloudinary incompleta. Verifica las variables de entorno.',
            };
        }

        // Crear FormData para Cloudinary usando el patrón de create-raffle.tsx
        const formData = new FormData();
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // La forma de adjuntar el archivo es diferente en web y en nativo.
        if (Platform.OS === 'web') {
            // En web, obtenemos el blob de la URI y lo adjuntamos.
            const response = await fetch(imageAsset.uri);
            const blob = await response.blob();
            formData.append('file', blob, imageAsset.fileName ?? 'upload.jpg');
        } else {
            // En nativo, usamos el formato de objeto específico de React Native.
            formData.append('file', {
                uri: imageAsset.uri,
                type: imageAsset.mimeType ?? 'image/jpeg',
                name: imageAsset.fileName ?? 'upload.jpg',
            } as any);
        }

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            url: data.secure_url, // URL permanente de Cloudinary
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error de conexión al subir la imagen',
        };
    }
};

// Alternativa: subir a un servidor propio o usar otro servicio
export const uploadImageToCustomServer = async (imageUri: string): Promise<UploadResult> => {
    try {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('image', blob as any);

        // Cambia esta URL por tu servidor de imágenes
        const uploadResponse = await fetch('https://tu-servidor.com/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer TU_TOKEN',
            },
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok) {
            return {
                success: true,
                url: result.imageUrl,
            };
        } else {
            return {
                success: false,
                error: result.message || 'Error al subir la imagen',
            };
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: 'Error de conexión al subir la imagen',
        };
    }
};

// Función alternativa que simula la subida (para desarrollo/pruebas)
export const mockUploadImage = async (imageUri: string): Promise<UploadResult> => {
    try {
        // Simular tiempo de subida
        await new Promise(resolve => setTimeout(resolve, 2000));

        // En una implementación real, aquí subirías a ImgBB o tu servicio
        // Por ahora, devolvemos la misma URI como si fuera una URL remota
        console.log('Imagen subida exitosamente (simulada):', imageUri);

        return {
            success: true,
            url: imageUri, // En producción, esto sería la URL del servicio de almacenamiento
        };
    } catch (error) {
        console.error('Error mock upload:', error);
        return {
            success: false,
            error: 'Error simulado de subida',
        };
    }
};

// Función principal - usando Cloudinary con variables de entorno
export const uploadProfileImage = uploadImageToCloudinary;