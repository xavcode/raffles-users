import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

const NumberCircle = ({ number, isSelected, isBought, onSelect }: { number: number, isSelected: boolean, isBought: boolean, onSelect: (num: number) => void }) => {
    // Define los estilos basados en el estado del número
    const circleClassName = isBought
        ? 'bg-gray-300 border-gray-400' // Estilo para números comprados
        : isSelected
            ? 'bg-primary border-indigo-700' // Estilo para números seleccionados por el usuario
            : 'bg-white border-gray-200 active:opacity-70'; // Estilo para números disponibles

    const textClassName = isBought
        ? 'text-gray-500'
        : isSelected
            ? 'text-white'
            : 'text-gray-700';

    return (
        <Pressable
            onPress={() => onSelect(number)}
            disabled={isBought} // Deshabilita el botón si el número ya fue comprado
            className={`
                w-14 h-14 rounded-full items-center justify-center m-1 border-2
                ${circleClassName}
            `}
        >
            <Text
                className={`
                    font-quicksand-bold text-lg
                    ${textClassName}
                `}
            >
                {number}
            </Text>
        </Pressable>
    );
};

type TableNumbersProps = {
    totalTickets: number;
    boughtTickets: number[];
};

const TableNumbers = ({ totalTickets, boughtTickets }: TableNumbersProps) => {
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);

    const handleSelectNumber = (number: number) => {
        // Evita que se pueda seleccionar un número ya comprado
        if (boughtTickets.includes(number)) return;

        setSelectedNumbers(prevSelected => {
            if (prevSelected.includes(number)) {
                // Deseleccionar el número
                return prevSelected.filter(n => n !== number);
            } else {
                // Seleccionar el número
                return [...prevSelected, number];
            }
        });
    };

    const handlePurchase = () => {
        if (selectedNumbers.length === 0) {
            Alert.alert("Sin selección", "Por favor, selecciona al menos un número para comprar.");
            return;
        }
        // Aquí es donde llamarías a una mutación de Convex para procesar la compra.
        // Por ahora, mostramos una alerta de confirmación.
        Alert.alert(
            "Confirmar Compra",
            `Vas a comprar los números: ${selectedNumbers.sort((a, b) => a - b).join(', ')}`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Comprar", onPress: () => console.log("Comprando números:", selectedNumbers) }
            ]
        );
    };

    return (
        <View className="w-full px-2 py-4 bg-gray-100 rounded-lg shadow-inner">
            <Text className="text-2xl font-quicksand-bold text-center mb-4 text-gray-800">
                Selecciona tus Números
            </Text>
            <FlatList
                data={numbers}
                renderItem={({ item }) => (
                    <NumberCircle
                        number={item}
                        isSelected={selectedNumbers.includes(item)}
                        isBought={boughtTickets.includes(item)}
                        onSelect={handleSelectNumber}
                    />
                )}
                keyExtractor={item => item.toString()}
                numColumns={5} // 5 columnas se ven bien en la mayoría de móviles
                columnWrapperStyle={{ justifyContent: 'center' }}
                contentContainerStyle={{ alignItems: 'center' }}
            />
            <View className="mt-6 px-4">
                <Pressable
                    onPress={handlePurchase}
                    disabled={selectedNumbers.length === 0}
                    className={`
                        p-4 rounded-lg items-center transition-colors
                        ${selectedNumbers.length > 0 ? 'bg-green-500' : 'bg-gray-400'} active:opacity-80
                    `}
                >
                    <Text className="text-white font-quicksand-bold text-lg">
                        Comprar {selectedNumbers.length > 0 ? `${selectedNumbers.length} Número(s)` : ''}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default TableNumbers;