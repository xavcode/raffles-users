import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAction } from 'convex/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const DateInput = ({ label, value, onPress }: { label: string, value: Date | null, onPress: () => void }) => (
    <Pressable onPress={onPress} className="flex-1 bg-slate-100 p-3 rounded-lg border border-slate-200 active:bg-slate-200">
        <Text className="text-xs font-quicksand-medium text-slate-500 mb-1">{label}</Text>
        <Text className="text-base font-quicksand-semibold text-slate-800">
            {value ? format(value, 'd MMM, yyyy', { locale: es }) : 'Seleccionar'}
        </Text>
    </Pressable>
);

const ReportsIndex = () => {
    const generateReport = useAction(api.admin.generateSalesReport);
    const [isExporting, setIsExporting] = useState(false);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || (pickerTarget === 'start' ? startDate : endDate);
        setShowPicker(Platform.OS === 'ios'); // En Android se cierra solo

        if (event.type === 'set' && currentDate) {
            if (pickerTarget === 'start') {
                setStartDate(currentDate);
                if (endDate && currentDate > endDate) {
                    setEndDate(null); // Resetea la fecha de fin si es anterior
                }
            } else if (pickerTarget === 'end') {
                setEndDate(currentDate);
            }
        }
        setPickerTarget(null);
    };

    const showDatePicker = (target: 'start' | 'end') => {
        setPickerTarget(target);
        setShowPicker(true);
    };

    const handleExport = async () => {

        if (startDate && endDate && startDate > endDate) {
            Toast.show({ type: 'error', text1: 'Rango inválido', text2: 'La fecha de inicio no puede ser posterior a la de fin.' });
            return;
        }

        setIsExporting(true);
        try {
            const csvString = await generateReport({
                startDate: startDate ? startDate.getTime() : undefined,
                endDate: endDate ? endDate.getTime() : undefined,
            });
            if (!csvString) {
                Toast.show({ type: 'info', text1: 'Sin datos', text2: 'No hay ventas en el período seleccionado.' });
                setIsExporting(false);
                return;
            }

            const date = new Date().toISOString().split('T')[0];

            if (Platform.OS === 'web') {
                // Lógica para descargar en web
                const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `reporte-ventas-${date}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                // Lógica para guardar/compartir en móvil (iOS/Android)
                const filename = `reporte-ventas-${date}.csv`;
                const uri = FileSystem.documentDirectory + filename; // Usar documentDirectory para persistencia
                await FileSystem.writeAsStringAsync(uri, `\uFEFF${csvString}`, {
                    encoding: FileSystem.EncodingType.UTF8,
                });

                if (Platform.OS === 'android') {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permisos requeridos', 'Se necesita permiso para guardar archivos en tu dispositivo.');
                        setIsExporting(false);
                        return;
                    }
                    try {
                        const asset = await MediaLibrary.createAssetAsync(uri);
                        await MediaLibrary.createAlbumAsync('Download', asset, false);
                        Toast.show({
                            type: 'success',
                            text1: 'Reporte Guardado',
                            text2: 'El archivo se ha guardado en tu carpeta de Descargas.',
                        });
                    } catch (e) {
                        console.error("Error saving to MediaLibrary:", e);
                        Alert.alert('Error', 'No se pudo guardar el archivo en Descargas.');
                    }
                } else { // Para iOS
                    // En iOS, el Share Sheet es la mejor opción para guardar en "Archivos"
                    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Guardar reporte de ventas', UTI: 'public.comma-separated-values-text' });
                }
            }
        } catch (error) {
            console.error("Error exporting report:", error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo generar el reporte. Intenta de nuevo.' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Generar Reportes' }} />
            <View className="p-4">
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-300/50">
                    <Text className="text-lg font-quicksand-bold text-slate-800 mb-1">Reporte de Ventas</Text>
                    <Text className="text-sm font-quicksand-medium text-slate-500 mb-4">Selecciona un rango de fechas para filtrar el reporte. Si no seleccionas fechas, se exportarán todas las ventas.</Text>

                    <View className="flex-row space-x-3 mb-3">
                        <DateInput label="Desde" value={startDate} onPress={() => showDatePicker('start')} />
                        <DateInput label="Hasta" value={endDate} onPress={() => showDatePicker('end')} />
                    </View>

                    {(startDate || endDate) && (
                        <Pressable onPress={() => { setStartDate(null); setEndDate(null); }} className="self-start mb-4">
                            <Text className="text-sm font-quicksand-bold text-primary">Limpiar fechas</Text>
                        </Pressable>
                    )}

                    <Pressable onPress={handleExport} disabled={isExporting} className="bg-primary h-12 rounded-lg justify-center items-center flex-row active:bg-primary/80 disabled:opacity-50">
                        {isExporting ? <ActivityIndicator color="white" /> : <><Ionicons name="download-outline" size={20} color="white" /><Text className="text-white font-quicksand-bold text-base ml-2">Exportar a CSV</Text></>}
                    </Pressable>
                </View>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={(pickerTarget === 'start' && startDate) || (pickerTarget === 'end' && endDate) || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()} // No se pueden seleccionar fechas futuras
                    minimumDate={pickerTarget === 'end' ? startDate || undefined : undefined} // La fecha de fin no puede ser anterior a la de inicio
                />
            )}
        </SafeAreaView>
    )
}

export default ReportsIndex;