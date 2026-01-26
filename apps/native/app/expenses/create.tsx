import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";

const EXPENSE_CATEGORIES = [
    { id: "RENT", label: "Rent", icon: "home-city" },
    { id: "UTILITIES", label: "Utilities", icon: "flash" },
    { id: "SUPPLIES", label: "Supplies", icon: "package-variant" },
    { id: "SALARIES", label: "Salaries", icon: "account-cash" },
    { id: "MARKETING", label: "Marketing", icon: "bullhorn" },
    { id: "MAINTENANCE", label: "Maintenance", icon: "tools" },
    { id: "TRANSPORT", label: "Transport", icon: "car" },
    { id: "OTHER", label: "Other", icon: "dots-horizontal" },
];

const PAYMENT_METHODS = [
    { id: "CASH", label: "Cash", icon: "cash" },
    { id: "CARD", label: "Card", icon: "credit-card" },
    { id: "BANK_TRANSFER", label: "Bank Transfer", icon: "bank" },
    { id: "MOBILE_MONEY", label: "Mobile Money", icon: "cellphone" },
    { id: "OTHER", label: "Other", icon: "help-circle" },
];

export default function CreateExpense() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { currentBusiness, token } = useAuthStore();
    const businessId = currentBusiness?.id;

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("OTHER");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [notes, setNotes] = useState("");

    const createExpenseMutation = useMutation({
        mutationFn: async (expenseData: any) => {
            const response = await apiRequest('/api/transactions', {
                method: 'POST',
                body: expenseData,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses", businessId] });
            queryClient.invalidateQueries({ queryKey: ["revenueSummary", businessId] });
            Alert.alert("Success", "Expense created successfully!");
            router.back();
        },
        onError: (error: any) => {
            console.error("[CreateExpense] Error:", error?.response?.data || error.message);
            Alert.alert(
                "Error",
                error?.response?.data?.details || error?.response?.data?.error || "Failed to create expense. Please try again."
            );
        },
    });

    const handleSubmit = () => {
        // Validation
        if (!description.trim()) {
            Alert.alert("Validation Error", "Please enter a description");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert("Validation Error", "Please enter a valid amount");
            return;
        }

        if (!businessId) {
            Alert.alert("Error", "No business selected");
            return;
        }

        const expenseData = {
            businessId,
            type: "EXPENSE",
            paymentMethod,
            items: [
                {
                    productId: "expense-placeholder", // Expenses don't have products
                    quantity: 1,
                    unitPrice: parseFloat(amount),
                    discount: 0,
                },
            ],
            discount: 0,
            amountPaid: parseFloat(amount),
            notes: `${category}: ${description}${notes ? `\n${notes}` : ""}`,
        };

        createExpenseMutation.mutate(expenseData);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView className="flex-1 bg-default-50">
                <View className="px-4 py-6 flex flex-col gap-6">
                    {/* Header */}
                    <View className="flex flex-row items-center gap-3">
                        <Pressable onPress={() => router.back()} className="mr-2">
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </Pressable>
                        <View>
                            <Text className="text-2xl font-bold">New Expense</Text>
                            <Text className="text-gray-500 text-sm">Record a business expense</Text>
                        </View>
                    </View>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Expense Details</CardTitle>
                            <CardDescription>Fill in the expense information</CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-6">
                            {/* Description */}
                            <View className="flex flex-col gap-2">
                                <Label nativeID="description">Description *</Label>
                                <Input
                                    placeholder="e.g., Monthly office rent"
                                    value={description}
                                    onChangeText={setDescription}
                                    aria-labelledby="description"
                                />
                            </View>

                            {/* Amount */}
                            <View className="flex flex-col gap-2">
                                <Label nativeID="amount">Amount *</Label>
                                <Input
                                    placeholder="0.00"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                    aria-labelledby="amount"
                                />
                            </View>

                            {/* Category */}
                            <View className="flex flex-col gap-2">
                                <Label>Category</Label>
                                <View className="flex flex-row flex-wrap gap-2">
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => setCategory(cat.id)}
                                            className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg border ${category === cat.id ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                                                }`}
                                        >
                                            <MaterialCommunityIcons
                                                name={cat.icon as any}
                                                size={18}
                                                color={category === cat.id ? "white" : "black"}
                                            />
                                            <Text className={category === cat.id ? "text-white font-medium" : "text-gray-700"}>
                                                {cat.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Payment Method */}
                            <View className="flex flex-col gap-2">
                                <Label>Payment Method</Label>
                                <View className="flex flex-row flex-wrap gap-2">
                                    {PAYMENT_METHODS.map((method) => (
                                        <Pressable
                                            key={method.id}
                                            onPress={() => setPaymentMethod(method.id)}
                                            className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg border ${paymentMethod === method.id ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"
                                                }`}
                                        >
                                            <MaterialCommunityIcons
                                                name={method.icon as any}
                                                size={18}
                                                color={paymentMethod === method.id ? "white" : "black"}
                                            />
                                            <Text className={paymentMethod === method.id ? "text-white font-medium" : "text-gray-700"}>
                                                {method.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Additional Notes */}
                            <View className="flex flex-col gap-2">
                                <Label nativeID="notes">Additional Notes (Optional)</Label>
                                <Input
                                    placeholder="Any additional details..."
                                    value={notes}
                                    onChangeText={setNotes}
                                    aria-labelledby="notes"
                                    multiline
                                    numberOfLines={3}
                                    style={{ height: 80, textAlignVertical: "top" }}
                                />
                            </View>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                onPress={handleSubmit}
                                disabled={createExpenseMutation.isPending}
                                className="w-full bg-green-500"
                            >
                                {createExpenseMutation.isPending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-semibold">Create Expense</Text>
                                )}
                            </Button>
                            <Button variant="outline" onPress={() => router.back()} className="w-full">
                                <Text>Cancel</Text>
                            </Button>
                        </CardFooter>
                    </Card>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
