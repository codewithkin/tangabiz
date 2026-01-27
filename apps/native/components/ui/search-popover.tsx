import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Keyboard } from 'react-native';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface SearchPopoverItem {
    id: string;
    label: string;
    subtitle?: string;
    metadata?: any;
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

    // Handle text change - show loading immediately when typing starts
    const handleTextChange = useCallback((text: string) => {
        onChangeText(text);

        // Immediately show loading when user starts typing
        if (text.trim()) {
            setLocalLoading(true);
            setShowPopover(true);
        } else {
            setLocalLoading(false);
            setShowPopover(false);
            setResults([]);
        }
    }, [onChangeText]);

    useEffect(() => {
        // Increment request ID to track this specific search
        const currentRequestId = ++requestIdRef.current;

        if (!value.trim()) {
            setResults([]);
            setLocalLoading(false);
            return;
        }

        const handleSearch = async () => {
            setLocalError(undefined);
            try {
                const items = await onSearch(value);
                // Only update if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setResults(items);
                    setLocalLoading(false);
                }
            } catch (err: any) {
                // Only update if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setLocalError(err.message || 'Search failed');
                    setLocalLoading(false);
                }
            }
        };

        const debounceTimer = setTimeout(handleSearch, 100);
        return () => clearTimeout(debounceTimer);
    }, [value, onSearch]);

    const handleSelectItem = useCallback((item: SearchPopoverItem) => {
        Keyboard.dismiss();
        onSelect(item);
        setShowPopover(false);
        setResults([]);
        onChangeText("");
    }, [onSelect, onChangeText]);

    const loading = isLoading || localLoading;
    const displayError = error || localError;

    return (
        <View className={cn('relative w-full z-50', className)}>
            <View className={cn(
                'border-2 rounded-xl',
                showPopover ? 'border-green-500' : 'border-gray-300'
            )}>
                <TextInput
                    placeholder={placeholder}
                    value={value}
                    onChangeText={handleTextChange}
                    onFocus={() => {
                        if (value.trim()) {
                            setShowPopover(true);
                        }
                    }}
                    className={cn(
                        'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium',
                        inputClassName
                    )}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Dropdown Popover */}
            {showPopover && (
                <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                    {loading && (
                        <View className="p-4 gap-3">
                            {/* Skeleton Loader - Item 1 */}
                            <View className="flex flex-row items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <View className="gap-2 flex-1">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-3 w-24" />
                                </View>
                            </View>

                            {/* Skeleton Loader - Item 2 */}
                            <View className="flex flex-row items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <View className="gap-2 flex-1">
                                    <Skeleton className="h-4 w-44" />
                                    <Skeleton className="h-3 w-28" />
                                </View>
                            </View>

                            {/* Skeleton Loader - Item 3 */}
                            <View className="flex flex-row items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <View className="gap-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-26" />
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
                            keyboardShouldPersistTaps="handled"
                            scrollEnabled={true}
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelectItem(item)}
                                    activeOpacity={0.7}
                                    className={cn(
                                        'p-3 border-b border-gray-100',
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
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}
        </View>
    );
}