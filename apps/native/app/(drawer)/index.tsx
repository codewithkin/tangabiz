import { Button } from "@/components/ui/button";
import { Pressable, View, Image, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ScrollView } from "react-native";
import { Link } from "expo-router";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import { format } from "date-fns";
import { useRecentSales, useBestPerformingProducts, useRevenueSummary, useNotificationsCount } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/auth';
import { useConnection } from '@/hooks/useConnection';
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { transactionsApi, productsApi, apiRequest } from '@/lib/api';
import { PieChart } from 'react-native-gifted-charts';

// Reusable currency formatter
function formatCurrency(amount: number, decimals = 2, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export type SaleExtract = {
  id: string;
  customerName: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'ecocash';
}

export type ProductExtact = {
  productName: string,
  unitsSold: number,
  totalRevenue: number,
  productImage?: string,
  hasRemovedBackground: boolean,
  price: number
}

export type ExpenseExract = {
  expenseName: string,
  date: string,
  amount: number
}

function Sale({ data }: { data: SaleExtract }) {
  const router = useRouter();

  const renderIcon = () => {
    switch (data.method) {
      case 'cash':
        return <FontAwesome6 name="money-bill-transfer" size={20} color="white" />;
      case 'card':
        return <Entypo name="credit-card" size={20} color="white" />;
      case 'ecocash':
        return <FontAwesome6 name="search-dollar" size={20} color="white" />;
      default:
        return <FontAwesome6 name="money-bill-transfer" size={20} color="white" />;
    }
  };

  return (
    <Pressable onPress={() => router.push(`/transactions/${data.id}`)} className="flex flex-row justify-between items-center">
      <View className="flex flex-row gap-2 items-center">
        <View className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
          {renderIcon()}
        </View>
        <View className="flex-col">
          <Text className="text-sm">{data.customerName}</Text>
          <Text className="text-xs text-gray-400">{format(new Date(data.date), 'd MMM yyyy')}</Text>
        </View>
      </View>

      <Text className="text-green-600 text-sm">
        +{formatCurrency(data.amount)}
      </Text>
    </Pressable>
  );
}

function Product({ data }: { data: ProductExtact }) {
  return (
    <View className="flex flex-col gap-2">
      {/* Product image */}
      <Image
        source={{ uri: data.productImage }}
        style={{ width: '100%', height: 150, borderRadius: 12 }}
      />

      <View className="flex-1">
        <View className="flex flex-row justify-between items-center">
          {/* Product name */}
          <Text className="font-semibold text-sm">{data.productName}</Text>
        </View>

        <View className="flex flex-row gap-2 mt-1">
          {/* Revenue */}
          <Text className="text-xs text-gray-600">
            Revenue: {formatCurrency(data.totalRevenue)}
          </Text>
        </View>

        <View className="flex flex-row gap-2 mt-1">
          {/* Units Sold */}
          <Text className="text-xs text-gray-600">
            Sold: {data.unitsSold} units
          </Text>
        </View>
      </View>
    </View>
  )
}

// Main dashboard homepage displaying business metrics: total revenue, recent sales, best performing products, and quick action buttons for common tasks with real-time API data.
export default function Dashboard() {
  const router = useRouter();
  const { currentBusiness, user, token } = useAuthStore();
  const businessId = currentBusiness?.id || null;
  const { isLoading: connectionLoading, isConnected } = useConnection();
  const [activeTab, setActiveTab] = React.useState<'sales' | 'expenses' | 'products'>('sales');

  // Check connection and redirect if offline
  useEffect(() => {
    if (!connectionLoading && !isConnected) {
      router.push('/offline');
    }
  }, [connectionLoading, isConnected]);

  // Fetch data from backend
  const { data: recentSales = [], isLoading: salesLoading } = useRecentSales(businessId);
  const { data: revenue = { totalRevenue: 0, totalTransactions: 0 }, isLoading: revenueLoading } = useRevenueSummary(businessId);
  const { data: notificationCount = 0 } = useNotificationsCount(businessId);

  // Fetch recent expenses
  const { data: recentExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['recentExpenses', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await apiRequest(
        `/api/transactions?businessId=${businessId}&type=EXPENSE&limit=5`
      );
      return response.data?.transactions || [];
    },
    enabled: !!businessId && !!token,
  });

  // Fetch new products (most recently added)
  const { data: newProducts = [], isLoading: newProductsLoading } = useQuery({
    queryKey: ['newProducts', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await apiRequest(
        `/api/products?businessId=${businessId}&limit=5&sortBy=createdAt&sortOrder=desc`
      );
      return response.data?.products || [];
    },
    enabled: !!businessId && !!token,
  });

  // Fetch total expenses
  const { data: expensesSummary = { totalExpenses: 0 }, isLoading: expensesSummaryLoading } = useQuery({
    queryKey: ['expensesSummary', businessId],
    queryFn: async () => {
      if (!businessId) return { totalExpenses: 0 };
      const response = await apiRequest(
        `/api/transactions?businessId=${businessId}&type=EXPENSE`
      );
      const transactions = response.data?.transactions || [];
      const total = transactions.reduce((sum: number, expense: any) => sum + Number(expense.total || 0), 0);
      return { totalExpenses: total };
    },
    enabled: !!businessId && !!token,
  });

  // Log auth store and API data
  React.useEffect(() => {
    console.log('=== DASHBOARD AUTH & DATA ===');
    console.log('Auth Store:', {
      user: user?.name,
      currentBusiness: currentBusiness?.name,
      businessId,
    });
    console.log('Recent Sales:', recentSales);
    console.log('Recent Expenses:', recentExpenses);
    console.log('New Products:', newProducts);
    console.log('Revenue Summary:', revenue);
    console.log('Notification Count:', notificationCount);
    console.log('Loading States:', {
      salesLoading,
      expensesLoading,
      newProductsLoading,
      revenueLoading,
    });
    console.log('============================');
  }, [user, currentBusiness, businessId, recentSales, recentExpenses, newProducts, revenue, notificationCount, salesLoading, expensesLoading, newProductsLoading, revenueLoading]);

  // Show full-page loading indicator while initial data loads
  const isInitialLoading = salesLoading || revenueLoading;

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-default-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="px-4 py-10 flex flex-col gap-10">
        {/* Header Section */}
        <Animated.View className="flex flex-col gap-4" entering={FadeIn.duration(500)}>
          <View className="flex flex-row justify-between items-center">
            <View className="flex flex-col">
              <Text className="text-2xl font-semibold">Good morning, {user?.name?.split(' ')[0] || 'User'}</Text>
              <Text className="text-gray-400 text-sm">Welcome back to <Text className="text-yellow-500">Tanga<Text className="text-green-500">Biz</Text></Text></Text>
            </View>

            <Pressable onPress={() => router.push('/notifications')}>
              <View className="relative">
                <Button size="icon" variant="outline" className="p-2">
                  <Fontisto name="bell" size={20} color="black" />
                </Button>
                {notificationCount > 0 && (
                  <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <Text className="text-white text-xs font-bold">{notificationCount > 9 ? '9+' : notificationCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>

          {/* Revenue Card */}
          <Card className="rounded-2xl px-4 flex flex-col gap-1 p-8">
            <Text className="text-gray-400 text-sm">Total Revenue</Text>
            {revenueLoading ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : (
              <>
                <Text className="text-4xl font-semibold">{formatCurrency(revenue.totalRevenue)}</Text>
                <Text className="text-xs text-gray-500 mt-1">{revenue.totalTransactions} transactions</Text>
              </>
            )}
            <Pressable onPress={() => router.push('/sale/new')} className="rounded-full bg-yellow-500 py-4 mt-2 active:opacity-80">
              <Text className="font-bold text-center text-white">Add new Sale</Text>
            </Pressable>
          </Card>

          {/* Quick Actions Grid */}
          <View className="flex flex-row gap-4">
            {/* View Report */}
            <Pressable onPress={() => router.push('/(drawer)/reports')} className="flex-1 flex flex-col items-center justify-center gap-1">
              <View className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <MaterialCommunityIcons name="chart-line" size={24} color="white" />
              </View>
              <Text className="text-xs text-center font-semibold">View reports</Text>
            </Pressable>

            {/* Add Customer */}
            <Pressable onPress={() => router.push('/(drawer)/customers/create')} className="flex-1 flex flex-col items-center justify-center gap-1">
              <View className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <MaterialCommunityIcons name="user-plus" size={24} color="white" />
              </View>
              <Text className="text-xs text-center font-semibold">Add customer</Text>
            </Pressable>

            {/* New Product */}
            <Pressable onPress={() => router.push('/(drawer)/products/create')} className="flex-1 flex flex-col items-center justify-center gap-1">
              <View className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <Entypo name="shopping-bag" size={24} color="white" />
              </View>
              <Text className="text-xs text-center font-semibold">New product</Text>
            </Pressable>

            {/* New Expenses */}
            <Pressable onPress={() => router.push('/(drawer)/expenses/create')} className="flex-1 flex flex-col items-center justify-center gap-1">
              <View className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <FontAwesome6 name="receipt" size={24} color="white" />
              </View>
              <Text className="text-xs text-center font-semibold">New expense</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Recent Activity Section with Tabs */}
        <Animated.View className="flex flex-col gap-4" entering={SlideInUp.duration(500).delay(300)}>
          <Text className="text-lg font-semibold mb-4">Recent Activity</Text>

          {/* Tabs */}
          <View className="flex flex-row">
            <Pressable
              onPress={() => setActiveTab('sales')}
              className={`flex-1 pb-3 border-b-2 ${activeTab === 'sales'
                  ? 'border-b-green-500'
                  : 'border-b-gray-300'
                }`}
            >
              <Text
                className={`text-center text-sm ${activeTab === 'sales'
                    ? 'text-green-500 font-semibold'
                    : 'text-gray-300'
                  }`}
              >
                Recent Sales
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('expenses')}
              className={`flex-1 pb-3 border-b-2 ${activeTab === 'expenses'
                  ? 'border-b-green-500'
                  : 'border-b-gray-300'
                }`}
            >
              <Text
                className={`text-center text-sm ${activeTab === 'expenses'
                    ? 'text-green-500 font-semibold'
                    : 'text-gray-300'
                  }`}
              >
                Recent Expenses
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('products')}
              className={`flex-1 pb-3 border-b-2 ${activeTab === 'products'
                  ? 'border-b-green-500'
                  : 'border-b-gray-300'
                }`}
            >
              <Text
                className={`text-center text-sm ${activeTab === 'products'
                    ? 'text-green-500 font-semibold'
                    : 'text-gray-300'
                  }`}
              >
                New Products
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <View className="mt-4">
            {/* Recent Sales Tab */}
            {activeTab === 'sales' && (
              <>
                {salesLoading ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : recentSales.length > 0 ? (
                  <View className="flex flex-col gap-4 w-full">
                    {recentSales.map((sale: SaleExtract, index: number) => (
                      <Sale key={index} data={sale} />
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-500 text-sm text-center py-4">No recent sales</Text>
                )}
              </>
            )}

            {/* Recent Expenses Tab */}
            {activeTab === 'expenses' && (
              <>
                {expensesLoading ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : recentExpenses.length > 0 ? (
                  <View className="flex flex-col gap-4 w-full">
                    {recentExpenses.map((expense: any) => (
                      <Pressable
                        key={expense.id}
                        onPress={() => router.push(`/transactions/${expense.id}`)}
                        className="flex flex-row justify-between items-center"
                      >
                        <View className="flex flex-row gap-2 items-center">
                          <View className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500">
                            <FontAwesome6 name="receipt" size={20} color="white" />
                          </View>
                          <View className="flex-col">
                            <Text className="text-sm">{expense.notes?.split(':')[0] || 'Expense'}</Text>
                            <Text className="text-xs text-gray-400">{format(new Date(expense.createdAt), 'd MMM yyyy')}</Text>
                          </View>
                        </View>
                        <Text className="text-red-600 text-sm">
                          -{formatCurrency(Number(expense.total))}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-500 text-sm text-center py-4">No recent expenses</Text>
                )}
              </>
            )}

            {/* New Products Tab */}
            {activeTab === 'products' && (
              <>
                {newProductsLoading ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : newProducts.length > 0 ? (
                  <View className="flex flex-col gap-4 w-full">
                    {newProducts.map((product: any) => (
                      <Pressable
                        key={product.id}
                        onPress={() => router.push(`/products/${product.id}`)}
                        className="flex flex-row gap-3 items-center"
                      >
                        {product.image && (
                          <Image
                            source={{ uri: product.image }}
                            style={{ width: 60, height: 60, borderRadius: 8 }}
                          />
                        )}
                        <View className="flex-1">
                          <Text className="font-semibold text-sm">{product.name}</Text>
                          <Text className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</Text>
                          <Text className="text-xs text-gray-600 mt-1">
                            {formatCurrency(Number(product.price))} • Stock: {product.quantity}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-500 text-sm text-center py-4">No new products</Text>
                )}
              </>
            )}
          </View>
        </Animated.View>

        {/* Profit vs Expenses Donut Chart */}
        <Animated.View className="flex flex-col gap-4" entering={SlideInUp.duration(500).delay(400)}>
          <Card className="rounded-2xl p-6">
            <Text className="text-lg font-semibold mb-4">Financial Overview</Text>
            
            <View className="items-center">
              <PieChart
                data={[
                  { value: 47, color: '#22c55e', text: '47%' },
                  { value: 30, color: '#ef4444', text: '30%' },
                ]}
                donut
                showText
                textColor="black"
                radius={120}
                textSize={16}
                showTextBackground
                textBackgroundRadius={22}
                focusOnPress
                showValuesAsLabels
              />
            </View>

            {/* Legend */}
            <View className="flex flex-row justify-center gap-6 mt-6">
              <View className="flex flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-green-500" />
                <Text className="text-sm text-gray-700">Revenue: {formatCurrency(47)}</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-red-500" />
                <Text className="text-sm text-gray-700">Expenses: {formatCurrency(30)}</Text>
              </View>
            </View>

            {/* Profit */}
            <View className="mt-4 pt-4 border-t border-gray-200">
              <View className="flex flex-row justify-between items-center">
                <Text className="text-sm font-medium text-gray-700">Net Profit</Text>
                <Text className="text-lg font-bold text-green-600">{formatCurrency(17)}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </View>
    </ScrollView>
  )
}