import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar, TabView } from 'react-native-tab-view';
import AuthFallback from '../../components/AuthFallback';
import { RaffleCardSkeleton } from '../../components/RaffleCard';
import RaffleList from '../../components/RaffleList';
import SearchBar from '../../components/SearchBar';

const HomeScreen = () => {
  const layout = useWindowDimensions();
  const convexUser = useQuery(api.users.getCurrent);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'active', title: 'Activos' },
    { key: 'finished', title: 'Finalizados' },
    { key: 'myRaffles', title: 'Mis Sorteos' },
  ]);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const renderScene = ({ route }: { route: { key: string } }) => {
    if (route.key === 'myRaffles' && !convexUser) {
      return null;
    }
    return <RaffleList type={route.key as 'active' | 'finished' | 'myRaffles'} search={debouncedSearch} currentUserId={convexUser?._id} />;
  };

  const renderTabBar = (props: any) => (
    <View>
      <TabBar
        {...props}
        indicatorStyle={{ backgroundColor: '#6366f1' }}
        // style={{ backgroundColor: '#f8fafc', shadowOpacity: 0, elevation: 0, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}
        // labelStyle={{ fontSize: 14, fontFamily: 'Quicksand-Bold', textTransform: 'none' }}
        activeColor={'#6366f1'}
        inactiveColor={'#64748b'}
      />
      <SearchBar onSearch={setDebouncedSearch} initialQuery={debouncedSearch} />
    </View>
  );

  const filteredRoutes = convexUser ? routes : routes.filter(r => r.key !== 'myRaffles');

  if (convexUser === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="pt-4">
          {[...Array(3)].map((_, i) => <RaffleCardSkeleton key={i} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (convexUser === null) {
    return <AuthFallback />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <TabView
        navigationState={{ index, routes: filteredRoutes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        style={{ flex: 1 }}
      />
      <Link href="/(raffles)/create-raffle" asChild>
        <Pressable className="absolute bottom-10 right-6 bg-primary rounded-full p-4 shadow-2xl active:opacity-90">
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </Link>
    </View>
  );
};

export default HomeScreen;