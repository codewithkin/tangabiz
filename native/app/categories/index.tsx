// Categories List Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
    useWindowDimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useResponsive } from '@/lib/useResponsive';

interface Category {
    id: string;
    name: string;
    description?: string;
    color?: string;
    _count?: {
        products: number;
    };
}

const COLORS = [
    '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

export default function CategoriesScreen() {
    const { currentBusiness } = useAuthStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formColor, setFormColor] = useState(COLORS[0]);
    const [isSaving, setIsSaving] = useState(false);

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';
    const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;

    const fetchCategories = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/categories', {
                businessId: currentBusiness.id,
            });
            setCategories(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchCategories();
    }, [fetchCategories]);

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormName('');
        setFormDescription('');
        setFormColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormName(category.name);
        setFormDescription(category.description || '');
        setFormColor(category.color || COLORS[0]);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert('Error', 'Category name is required');
            return;
        }

        if (!currentBusiness) return;

        setIsSaving(true);

        try {
            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory.id}`, {
                    businessId: currentBusiness.id,
                    name: formName.trim(),
                    description: formDescription.trim() || undefined,
                    color: formColor,
                });
            } else {
                await api.post('/api/categories', {
                    businessId: currentBusiness.id,
                    name: formName.trim(),
                    description: formDescription.trim() || undefined,
                    color: formColor,
                });
            }

            setShowModal(false);
            fetchCategories();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (category: Category) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category.name}"? Products in this category will be uncategorized.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/categories/${category.id}?businessId=${currentBusiness?.id}`);
                            fetchCategories();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete category');
                        }
                    },
                },
            ]
        );
    };

    const renderCategory = ({ item }: { item: Category }) => (
        <Pressable
            onPress={() => openEditModal(item)}
            onLongPress={() => handleDelete(item)}
            className={`bg-white ${numColumns > 1 ? 'mx-2' : 'mx-4'} mb-3 rounded-xl ${isTablet ? 'p-5' : 'p-4'} flex-row items-center shadow-sm`}
            style={numColumns > 1 ? { flex: 1 / numColumns, maxWidth: `${100 / numColumns - 2}%` } : undefined}
        >
            {/* Color Indicator */}
            <View
                className={`${isTablet ? 'w-14 h-14' : 'w-12 h-12'} rounded-full items-center justify-center mr-4`}
                style={{ backgroundColor: item.color || COLORS[0] + '20' }}
            >
                <MaterialCommunityIcons
                    name="folder"
                    size={iconSizes.medium}
                    color={item.color || COLORS[0]}
                />
            </View>

            {/* Category Info */}
            <View className="flex-1">
                <Text className={`text-gray-900 font-semibold ${isTablet ? 'text-lg' : 'text-base'}`}>{item.name}</Text>
                {item.description && (
                    <Text className={`text-gray-500 ${typography.small} mt-0.5`} numberOfLines={1}>
                        {item.description}
                    </Text>
                )}
            </View>

            {/* Product Count */}
            <View className="items-end">
                <Text className={`text-gray-400 ${typography.small}`}>Products</Text>
                <Text className={`text-gray-900 font-bold ${isTablet ? 'text-xl' : 'text-lg'}`}>
                    {item._count?.products || 0}
                </Text>
            </View>
        </Pressable>
    );

    const ListEmpty = () => (
        <View className="flex-1 items-center justify-center py-20">
            <MaterialCommunityIcons name="folder-open" size={iconSizes.xlarge} color="#d1d5db" />
            <Text className={`text-gray-400 ${isTablet ? 'text-xl' : 'text-lg'} mt-4`}>No categories yet</Text>
            <Pressable
                onPress={openCreateModal}
                className={`mt-4 bg-green-500 ${isTablet ? 'px-8 py-4' : 'px-6 py-3'} rounded-xl`}
            >
                <Text className={`text-white font-semibold ${typography.body}`}>Create First Category</Text>
            </Pressable>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Categories',
                    headerRight: () => (
                        <Pressable onPress={openCreateModal} className="mr-4">
                            <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
                        </Pressable>
                    ),
                }}
            />

            {/* Info Banner */}
            <View className={`bg-yellow-50 ${isTablet ? 'mx-6' : 'mx-4'} mt-4 mb-2 ${isTablet ? 'p-4' : 'p-3'} rounded-xl flex-row items-center`} style={isLargeTablet ? { maxWidth: 600 } : undefined}>
                <MaterialCommunityIcons name="information" size={iconSizes.small} color="#eab308" />
                <Text className={`text-yellow-700 ${typography.small} ml-2 flex-1`}>
                    Long press a category to delete it
                </Text>
            </View>

            {/* Categories List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={categories}
                    renderItem={renderCategory}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, ...(isLargeTablet && { maxWidth: 1400, alignSelf: 'center', width: '100%' }) }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={['#22c55e']}
                            tintColor="#22c55e"
                        />
                    }
                    ListEmptyComponent={ListEmpty}
                />
            )}

            {/* FAB */}
            <Pressable
                onPress={openCreateModal}
                className={`absolute bottom-6 right-6 ${isTablet ? 'w-16 h-16' : 'w-14 h-14'} bg-green-500 rounded-full items-center justify-center shadow-lg`}
            >
                <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
            </Pressable>

            {/* Create/Edit Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 pb-10">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-gray-900 text-xl font-bold">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </Text>
                            <Pressable onPress={() => setShowModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </Pressable>
                        </View>

                        {/* Name Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-medium mb-2">
                                Name <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                placeholder="Category name"
                                placeholderTextColor="#9ca3af"
                                value={formName}
                                onChangeText={setFormName}
                            />
                        </View>

                        {/* Description Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-medium mb-2">
                                Description
                            </Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                placeholder="Optional description"
                                placeholderTextColor="#9ca3af"
                                value={formDescription}
                                onChangeText={setFormDescription}
                            />
                        </View>

                        {/* Color Picker */}
                        <View className="mb-6">
                            <Text className="text-gray-700 text-sm font-medium mb-2">Color</Text>
                            <View className="flex-row flex-wrap">
                                {COLORS.map((color) => (
                                    <Pressable
                                        key={color}
                                        onPress={() => setFormColor(color)}
                                        className={`w-10 h-10 rounded-full mr-3 mb-3 items-center justify-center ${formColor === color ? 'border-2 border-gray-900' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    >
                                        {formColor === color && (
                                            <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Save Button */}
                        <Pressable
                            onPress={handleSave}
                            disabled={isSaving}
                            className={`py-4 rounded-xl items-center ${isSaving ? 'bg-green-300' : 'bg-green-500'}`}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-base">
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
