import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Modal } from 'react-native';
import { cn } from '@/lib/utils';

export interface SearchPopoverItem {
  id: string;
  label: string;
  subtitle?: string;
}

interface SearchPopoverProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: SearchPopoverItem) => void;
  onSearch: (query: string) => Promise<SearchPopoverItem[]>;
  isLoading?: boolean;
  error?: string;
  renderItem?: (item: SearchPopoverItem) => React.ReactNode;
  className?: string;
  inputClassName?: string;
  itemClassName?: string;
}

export const SearchPopover: React.FC<SearchPopoverProps> = ({
  placeholder = "Search...",
  value,
  onChangeText,
  onSelect,
  onSearch,
  isLoading = false,
  error,
  renderItem,
  className,
  inputClassName,
  itemClassName,
}) => {
  const [results, setResults] = useState<SearchPopoverItem[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      setShowPopover(false);
      return;
    }

    const handleSearch = async () => {
      setLocalLoading(true);
      setLocalError(undefined);
      try {
        const items = await onSearch(value);
        setResults(items);
        setShowPopover(true);
      } catch (err: any) {
        setLocalError(err.message || 'Search failed');
        setShowPopover(true);
      } finally {
        setLocalLoading(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, onSearch]);

  const handleSelectItem = (item: SearchPopoverItem) => {
    onSelect(item);
    setShowPopover(false);
    setResults([]);
  };

  const loading = isLoading || localLoading;
  const displayError = error || localError;

  return (
    <View className={cn('relative w-full', className)}>
      <View className={cn(
        'border-2 rounded-xl',
        showPopover ? 'border-green-500' : 'border-gray-300'
      )}>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => value.trim() && setShowPopover(true)}
          onBlur={() => setShowPopover(false)}
          className={cn(
            'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium',
            inputClassName
          )}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Popover */}
      {showPopover && (
        <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60">
          {loading && (
            <View className="p-4 items-center justify-center">
              <ActivityIndicator size="small" color="#22c55e" />
              <Text className="text-sm text-gray-500 mt-2">Searching...</Text>
            </View>
          )}

          {displayError && !loading && (
            <View className="p-4 items-center">
              <Text className="text-sm text-red-600 text-center">{displayError}</Text>
            </View>
          )}

          {!loading && !displayError && results.length === 0 && value.trim() && (
            <View className="p-4 items-center">
              <Text className="text-sm text-gray-500">No results found</Text>
            </View>
          )}

          {!loading && !displayError && results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectItem(item)}
                  className={cn(
                    'p-3 border-b border-gray-100 active:bg-gray-50',
                    itemClassName
                  )}
                >
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <View>
                      <Text className="font-medium text-gray-900">{item.label}</Text>
                      {item.subtitle && (
                        <Text className="text-sm text-gray-500 mt-1">{item.subtitle}</Text>
                      )}
                    </View>
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};
