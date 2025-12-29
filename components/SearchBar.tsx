import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const SearchBar = ({ onSearch, initialQuery = '' }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Wrapped onSearch with useCallback for stability in debounce
  const debouncedOnSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, 900), // Adjusted debounce to 900ms as requested
    [onSearch]
  );

  useEffect(() => {
    if (searchQuery !== initialQuery) {
      debouncedOnSearch(searchQuery);
    }
    return () => {
      debouncedOnSearch.cancel();
    };
  }, [searchQuery, initialQuery, debouncedOnSearch]);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  return (
    <View className="px-4 my-2 bg-gray-50">
      <View className="flex-row items-center bg-white rounded-xl p-1 border border-gray-200/80 shadow-sm">
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          placeholder="Buscar por titulo/id de rifa o Usuario..."
          className="flex-1 ml-3 text-base font-quicksand-medium text-slate-800"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => {
            setSearchQuery('');
            onSearch(''); // Also trigger immediate search clear
          }} className="p-1">
            <Ionicons name="close-circle" size={28} color="#cbd5e1" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default SearchBar;
