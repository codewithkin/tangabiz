import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    const [open, setOpen] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<string>();
    const requestIdRef = useRef(0);

    useEffect(() => {
        // Increment request ID to track this specific search
        const currentRequestId = ++requestIdRef.current;

        if (!value.trim()) {
            setResults([]);
            setOpen(false);
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
                    setOpen(true);
                }
            } catch (err: any) {
                // Only update if this is still the latest request
                if (currentRequestId === requestIdRef.current) {
                    setLocalError(err.message || 'Search failed');
                    setOpen(true);
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
        setOpen(false);
        setResults([]);
        // Clear the search text after selection
        onChangeText("");
    };

    const loading = isLoading || localLoading;
    const displayError = error || localError;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <View className={cn('w-full', className)}>
                    <View className={cn(
                        'border-2 rounded-xl',
                        open ? 'border-green-500' : 'border-gray-300'
                    )}>
                        <TextInput
                            placeholder={placeholder}
                            value={value}
                            onChangeText={onChangeText}
                            onFocus={() => {
                                if (value.trim()) setOpen(true);
                            }}
                            className={cn(
                                'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium',
                                inputClassName
                            )}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="start"
                className="w-full bg-white border border-gray-200 rounded-xl shadow-lg p-0 native:w-[90vw]"
            >
                <View className="max-h-60">
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
                            nestedScrollEnabled={true}
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
            </PopoverContent>
        </Popover>
    );
}