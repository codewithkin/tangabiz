import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Modal } from 'react-native';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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
    const requestIdRef = useRef(0);

    useEffect(() => {
        // Increment request ID to track this specific search
        const currentRequestId = ++requestIdRef.current;

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
                // Only update if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setResults(items);
                    setShowPopover(true);
                }
            } catch (err: any) {
                // Only update if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setLocalError(err.message || 'Search failed');
                    setShowPopover(true);
                }
            } finally {
                // Only clear loading if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setLocalLoading(false);
                }
            }
        };

        const debounceTimer = setTimeout(handleSearch, 100);
        return () => clearTimeout(debounceTimer);
    }, [value, onSearch]);

    const handleSelectItem = (item: SearchPopoverItem) => {
        onSelect(item);
        setShowPopover(false);
        setResults([]);
        // Clear the search text after selection
        onChangeText("");
    };

    const loading = isLoading || localLoading;
    const displayError = error || localError;

    return (
        <View className={cn('w-full', className)}>
            <View className={cn(
                'border-2 rounded-xl',
                showPopover ? 'border-green-500' : 'border-gray-300'
            )}>
                <TextInput
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => {
                        if (value.trim()) setShowPopover(true);
                    }}
                    className={cn(
                        'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium',
                        inputClassName
                    )}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Popover Modal */}
            <Modal
                visible={showPopover}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPopover(false)}
            >
                <Pressable
                    className="flex-1"
                    onPress={() => setShowPopover(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/50 p-4">
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <View className="bg-white rounded-xl shadow-lg max-h-80 w-80">
                                {loading && (
                                    <View className="p-4 gap-3">
                                        {/* Skeleton Loader - Item 1 */}
                                        <View className="flex flex-row items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <View className="gap-2 flex-1">
                                                <Skeleton className="h-4 w-[150px]" />
                                                <Skeleton className="h-3 w-[100px]" />
                                            </View>
                                        </View>

                                        {/* Skeleton Loader - Item 2 */}
                                        <View className="flex flex-row items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <View className="gap-2 flex-1">
                                                <Skeleton className="h-4 w-[180px]" />
                                                <Skeleton className="h-3 w-[120px]" />
                                            </View>
                                        </View>

                                        {/* Skeleton Loader - Item 3 */}
                                        <View className="flex flex-row items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <View className="gap-2 flex-1">
                                                <Skeleton className="h-4 w-[160px]" />
                                                <Skeleton className="h-3 w-[110px]" />
                                            </View>
                                        </View>
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
                                        scrollEnabled={true}
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
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}