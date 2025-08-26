import { View } from "react-native";

const PurchaseListItemSkeleton = () => (
    <View className="bg-white mx-4 mb-3 rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden">
        <View className="p-4 space-y-3">
            <View className="flex-row justify-between items-start">
                <View className="w-3/4 space-y-2">
                    <View className="h-5 bg-slate-200 rounded w-full" />
                    <View className="h-5 bg-slate-200 rounded w-2/3" />
                </View>
                <View className="h-6 w-1/5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row items-center space-x-3">
                <View className="h-5 w-1/3 bg-slate-200 rounded" />
                <View className="h-5 w-1/3 bg-slate-200 rounded" />
            </View>
        </View>
        <View className="bg-slate-50/70 px-4 py-3 border-t border-slate-200/80">
            <View className="h-4 w-1/2 bg-slate-200 rounded" />
        </View>
    </View>
);

export default PurchaseListItemSkeleton