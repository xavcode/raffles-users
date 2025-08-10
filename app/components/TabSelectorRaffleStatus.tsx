import { Pressable, Text, View } from "react-native";

// Definimos los tipos para las props. Esto hace nuestro código más seguro y fácil de entender.
// 'selectedTab' puede ser solo 'active' o 'finished'.
// 'onTabChange' es una función que recibe uno de esos dos valores.
type TabSelectorProps = {
    selectedTab: 'active' | 'finished';
    onTabChange: (tab: 'active' | 'finished') => void;
};

const TabSelectorRaffleStatus = ({ selectedTab, onTabChange }: TabSelectorProps) => {
    return (
        // Contenedor principal que centra el selector y le da un fondo a juego con la pantalla.
        <View className="px-4 py-2 bg-slate-50">
            {/* El "track" del selector con fondo gris claro y bordes redondeados */}
            <View className="flex-row p-1 bg-slate-200/70 rounded-xl">
                {/* Primer botón: Activos */}
                <Pressable
                    onPress={() => onTabChange('active')}
                    // Si está activo, tiene fondo blanco y sombra para dar efecto de "elevado"
                    className={`flex-1 items-center rounded-lg py-2 ${selectedTab === 'active' ? 'bg-white shadow' : ''}`}
                >
                    <Text className={`font-quicksand-bold text-sm ${selectedTab === 'active' ? 'text-primary' : 'text-slate-500'}`}>Activos</Text>
                </Pressable>

                {/* Segundo botón: Finalizados */}
                <Pressable
                    onPress={() => onTabChange('finished')}
                    className={`flex-1 items-center rounded-lg py-2 ${selectedTab === 'finished' ? 'bg-white shadow' : ''}`}
                >
                    <Text className={`font-quicksand-bold text-sm ${selectedTab === 'finished' ? 'text-primary' : 'text-slate-500'}`}>Finalizados</Text>
                </Pressable>
            </View>
        </View>
    )
}

export default TabSelectorRaffleStatus