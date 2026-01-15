// Create Product Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { toast, haptics, pickImage, takePhoto } from '@/lib';

interface Category {
    id: string;
    name: string;
}

export default function CreateProductScreen() {
    const { currentBusiness, user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minQuantity, setMinQuantity] = useState('');
    const [unit, setUnit] = useState('piece');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        if (!currentBusiness) return;
        try {
            const res = await api.get('/api/products/categories', {
                businessId: currentBusiness.id,
            });
            setCategories(res.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handlePickImage = async () => {
        Alert.alert('Add Image', 'Choose an option', [
            {
                text: 'Camera',
                onPress: async () => {
                    const result = await takePhoto({ quality: 0.8 });
                    if (result) {
                        setImage(result.uri);
                    }
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const result = await pickImage({ quality: 0.8 });
                    if (result && result[0]) {
                        setImage(result[0].uri);
                    }
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (!price || Number(price) <= 0) {
            toast.error('Valid price is required');
            return;
        }

        setIsLoading(true);
        haptics.medium();

        try {
            const productData = {
                businessId: currentBusiness?.id,
                name: name.trim(),
                description: description.trim() || undefined,
                sku: sku.trim() || undefined,
                barcode: barcode.trim() || undefined,
                price: Number(price),
                costPrice: costPrice ? Number(costPrice) : undefined,
                quantity: Number(quantity) || 0,
                minQuantity: Number(minQuantity) || 0,
                unit: unit.trim() || 'piece',
                categoryId: categoryId || undefined,
                image: image || undefined,
            };

            const res = await api.post('/api/products', productData);

            if (res.success) {
                haptics.success();
                toast.success('Product created!', name);
                router.back();
            } else {
                toast.error('Failed to create product', res.error);
            }
        } catch (error) {
            console.error('Create product failed:', error);
            toast.error('Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    const FormInput = ({
        label,
        value,
        onChangeText,
        placeholder,
        keyboardType = 'default',
        multiline = false,
        required = false,
    }: {
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        placeholder?: string;
        keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
        multiline?: boolean;
        required?: boolean;
    }) => (
        <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1.5">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TextInput
                className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 ${multiline ? 'h-24' : ''
                    }`}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen
                options={{
                    title: 'Add Product',
                    headerRight: () => (
                        <Pressable
                            onPress={handleSubmit}
                            disabled={isLoading}
                            className="mr-4"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-semibold">Save</Text>
                            )}
                        </Pressable>
                    ),
                }}
            />

            <ScrollView className="flex-1 px-5 pt-4">
                {/* Image Upload */}
                <Pressable
                    onPress={handlePickImage}
                    className="w-full h-48 bg-gray-100 rounded-xl items-center justify-center mb-6 overflow-hidden"
                >
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="items-center">
                            <MaterialCommunityIcons name="camera-plus" size={48} color="#9ca3af" />
                            <Text className="text-gray-400 mt-2">Add Product Image</Text>
                        </View>
                    )}
                </Pressable>

                {/* Basic Info */}
                <FormInput
                    label="Product Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter product name"
                    required
                />

                <FormInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter product description"
                    multiline
                />

                {/* Pricing */}
                <View className="flex-row">
                    <View className="flex-1 mr-2">
                        <FormInput
                            label="Price"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            required
                        />
                    </View>
                    <View className="flex-1 ml-2">
                        <FormInput
                            label="Cost Price"
                            value={costPrice}
                            onChangeText={setCostPrice}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>

                {/* Stock */}
                <View className="flex-row">
                    <View className="flex-1 mr-2">
                        <FormInput
                            label="Quantity"
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="0"
                            keyboardType="number-pad"
                        />
                    </View>
                    <View className="flex-1 ml-2">
                        <FormInput
                            label="Min. Stock Alert"
                            value={minQuantity}
                            onChangeText={setMinQuantity}
                            placeholder="0"
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                {/* Identifiers */}
                <View className="flex-row">
                    <View className="flex-1 mr-2">
                        <FormInput
                            label="SKU"
                            value={sku}
                            onChangeText={setSku}
                            placeholder="SKU-001"
                        />
                    </View>
                    <View className="flex-1 ml-2">
                        <FormInput
                            label="Barcode"
                            value={barcode}
                            onChangeText={setBarcode}
                            placeholder="123456789"
                        />
                    </View>
                </View>

                {/* Unit */}
                <FormInput
                    label="Unit"
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="piece, kg, liter, etc."
                />

                {/* Category */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-1.5">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <Pressable
                            onPress={() => setCategoryId(null)}
                            className={`px-4 py-2 rounded-full mr-2 ${!categoryId ? 'bg-green-500' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={!categoryId ? 'text-white' : 'text-gray-600'}>
                                None
                            </Text>
                        </Pressable>
                        {categories.map((cat) => (
                            <Pressable
                                key={cat.id}
                                onPress={() => setCategoryId(cat.id)}
                                className={`px-4 py-2 rounded-full mr-2 ${categoryId === cat.id ? 'bg-green-500' : 'bg-gray-100'
                                    }`}
                            >
                                <Text className={categoryId === cat.id ? 'text-white' : 'text-gray-600'}>
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Submit Button */}
                <Pressable
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className={`py-4 rounded-xl items-center mb-8 ${isLoading ? 'bg-gray-300' : 'bg-green-500'
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">Create Product</Text>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}
