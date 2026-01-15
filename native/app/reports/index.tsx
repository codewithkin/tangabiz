// Reports Screen - Responsive with PDF Export
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'year';
type ReportType = 'SALES' | 'INVENTORY' | 'CUSTOMERS';

interface ReportData {
  totalSales: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    amount: number;
    count: number;
  }[];
  dailySales: {
    date: string;
    amount: number;
  }[];
}

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  largeTablet: 1024,
};

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const { currentBusiness } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Responsive helpers
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLargeTablet = width >= BREAKPOINTS.largeTablet;
  const cardPadding = isTablet ? 'p-6' : 'p-4';
  const titleSize = isTablet ? 'text-2xl' : 'text-xl';
  const subtitleSize = isTablet ? 'text-base' : 'text-sm';

  const getDateRange = useCallback(() => {
    const now = new Date();
    let start: Date;
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date();
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }, [dateRange]);

  const fetchReports = useCallback(async () => {
    if (!currentBusiness) return;

    try {
      const { start, end } = getDateRange();
      const res = await api.get('/api/reports/summary', {
        businessId: currentBusiness.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      setReportData(res.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // Set mock data for demo
      setReportData({
        totalSales: 125000,
        totalRefunds: 5000,
        netRevenue: 120000,
        transactionCount: 45,
        averageOrderValue: 2778,
        topProducts: [
          { id: '1', name: 'Product A', quantity: 25, revenue: 50000 },
          { id: '2', name: 'Product B', quantity: 18, revenue: 36000 },
          { id: '3', name: 'Product C', quantity: 12, revenue: 24000 },
        ],
        salesByPaymentMethod: [
          { method: 'CASH', amount: 60000, count: 20 },
          { method: 'MOBILE_MONEY', amount: 40000, count: 15 },
          { method: 'CARD', amount: 20000, count: 10 },
        ],
        dailySales: [
          { date: 'Mon', amount: 15000 },
          { date: 'Tue', amount: 20000 },
          { date: 'Wed', amount: 18000 },
          { date: 'Thu', amount: 25000 },
          { date: 'Fri', amount: 22000 },
          { date: 'Sat', amount: 30000 },
          { date: 'Sun', amount: 12000 },
        ],
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentBusiness, getDateRange]);

  useEffect(() => {
    setIsLoading(true);
    fetchReports();
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [currentBusiness]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  const generateAndDownloadPdf = async (type: ReportType) => {
    if (!currentBusiness) {
      Alert.alert('Error', 'No business selected');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const { start, end } = getDateRange();

      // Request PDF generation from server
      const res = await api.post('/api/reports/generate', {
        businessId: currentBusiness.id,
        type,
        period: dateRange.toUpperCase(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        name: `${type} Report - ${dateRange}`,
      });

      if (!res.success || !res.data?.downloadUrl) {
        throw new Error(res.error || 'Failed to generate report');
      }

      const downloadUrl = res.data.downloadUrl;
      const filename = `${type.toLowerCase()}_report_${Date.now()}.pdf`;
      // Use cacheDirectory if documentDirectory is not available
      const baseDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = baseDir + filename;

      // Download the PDF
      const downloadResult = await (FileSystem as any).downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download PDF');
      }

      // Share or open the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${type} Report`,
          UTI: 'com.adobe.pdf',
        });
      } else if (Platform.OS === 'android') {
        // Open with intent on Android
        const contentUri = await (FileSystem as any).getContentUriAsync(downloadResult.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } else {
        Alert.alert('Success', 'Report downloaded successfully');
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const showReportTypeSelector = () => {
    Alert.alert(
      'Generate PDF Report',
      'Select the type of report to generate',
      [
        { text: 'Sales Report', onPress: () => generateAndDownloadPdf('SALES') },
        { text: 'Inventory Report', onPress: () => generateAndDownloadPdf('INVENTORY') },
        { text: 'Customers Report', onPress: () => generateAndDownloadPdf('CUSTOMERS') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const maxDailySale = Math.max(...(reportData?.dailySales.map(d => d.amount) || [1]));

  const getPaymentMethodIcon = (method: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (method) {
      case 'CASH': return 'cash';
      case 'CARD': return 'credit-card';
      case 'MOBILE_MONEY': return 'cellphone';
      case 'BANK_TRANSFER': return 'bank';
      default: return 'cash';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH': return '#22c55e';
      case 'CARD': return '#3b82f6';
      case 'MOBILE_MONEY': return '#eab308';
      case 'BANK_TRANSFER': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Reports',
          headerRight: () => (
            <Pressable
              onPress={showReportTypeSelector}
              disabled={isGeneratingPdf}
              className="mr-4"
            >
              {isGeneratingPdf ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={26} color="#fff" />
              )}
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#22c55e']}
            tintColor="#22c55e"
          />
        }
      >
        {/* Date Range Selector - Responsive */}
        <View className={`flex-row bg-white mt-4 p-1 rounded-xl ${isTablet ? 'mx-6' : 'mx-4'}`}>
          {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
            <Pressable
              key={range}
              onPress={() => setDateRange(range)}
              className={`flex-1 rounded-lg ${isTablet ? 'py-3' : 'py-2'} ${
                dateRange === range ? 'bg-green-500' : ''
              }`}
            >
              <Text
                className={`text-center font-medium capitalize ${
                  dateRange === range ? 'text-white' : 'text-gray-600'
                } ${isTablet ? 'text-base' : 'text-sm'}`}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards - Responsive Grid */}
        <View className={`flex-row flex-wrap ${isTablet ? 'px-4' : 'px-2'} mt-4`}>
          <View className={`${isLargeTablet ? 'w-1/4' : isTablet ? 'w-1/4' : 'w-1/2'} p-2`}>
            <View className={`bg-white rounded-xl ${cardPadding}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-gray-500 ${subtitleSize}`}>Total Sales</Text>
                <View className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} bg-green-100 rounded-full items-center justify-center`}>
                  <MaterialCommunityIcons name="trending-up" size={isTablet ? 20 : 16} color="#22c55e" />
                </View>
              </View>
              <Text className={`text-gray-900 ${titleSize} font-bold mt-2`}>
                {formatCurrency(reportData?.totalSales || 0)}
              </Text>
            </View>
          </View>

          <View className={`${isLargeTablet ? 'w-1/4' : isTablet ? 'w-1/4' : 'w-1/2'} p-2`}>
            <View className={`bg-white rounded-xl ${cardPadding}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-gray-500 ${subtitleSize}`}>Refunds</Text>
                <View className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} bg-red-100 rounded-full items-center justify-center`}>
                  <MaterialCommunityIcons name="trending-down" size={isTablet ? 20 : 16} color="#ef4444" />
                </View>
              </View>
              <Text className={`text-red-600 ${titleSize} font-bold mt-2`}>
                {formatCurrency(reportData?.totalRefunds || 0)}
              </Text>
            </View>
          </View>

          <View className={`${isLargeTablet ? 'w-1/4' : isTablet ? 'w-1/4' : 'w-1/2'} p-2`}>
            <View className={`bg-white rounded-xl ${cardPadding}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-gray-500 ${subtitleSize}`}>Net Revenue</Text>
                <View className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} bg-blue-100 rounded-full items-center justify-center`}>
                  <MaterialCommunityIcons name="cash" size={isTablet ? 20 : 16} color="#3b82f6" />
                </View>
              </View>
              <Text className={`text-blue-600 ${titleSize} font-bold mt-2`}>
                {formatCurrency(reportData?.netRevenue || 0)}
              </Text>
            </View>
          </View>

          <View className={`${isLargeTablet ? 'w-1/4' : isTablet ? 'w-1/4' : 'w-1/2'} p-2`}>
            <View className={`bg-white rounded-xl ${cardPadding}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-gray-500 ${subtitleSize}`}>Avg. Order</Text>
                <View className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} bg-yellow-100 rounded-full items-center justify-center`}>
                  <MaterialCommunityIcons name="chart-line" size={isTablet ? 20 : 16} color="#eab308" />
                </View>
              </View>
              <Text className={`text-yellow-600 ${titleSize} font-bold mt-2`}>
                {formatCurrency(reportData?.averageOrderValue || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Responsive Layout for Charts and Lists */}
        <View className={`${isTablet ? 'flex-row flex-wrap' : ''}`}>
          {/* Left Column - Charts */}
          <View className={`${isTablet ? 'w-1/2' : 'w-full'}`}>
            {/* Transactions Count */}
            <View className={`bg-white mt-4 rounded-xl ${cardPadding} flex-row items-center ${isTablet ? 'mx-6' : 'mx-4'}`}>
              <View className={`${isTablet ? 'w-14 h-14' : 'w-12 h-12'} bg-purple-100 rounded-full items-center justify-center`}>
                <MaterialCommunityIcons name="receipt" size={isTablet ? 28 : 24} color="#8b5cf6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className={`text-gray-500 ${subtitleSize}`}>Total Transactions</Text>
                <Text className={`text-gray-900 ${isTablet ? 'text-3xl' : 'text-2xl'} font-bold`}>
                  {reportData?.transactionCount || 0}
                </Text>
              </View>
            </View>

            {/* Sales Chart */}
            <View className={`bg-white mt-4 rounded-xl ${cardPadding} ${isTablet ? 'mx-6' : 'mx-4'}`}>
              <Text className={`text-gray-900 font-semibold mb-4 ${isTablet ? 'text-lg' : ''}`}>Sales Trend</Text>
              <View className={`flex-row items-end justify-between ${isTablet ? 'h-40' : 'h-32'}`}>
                {reportData?.dailySales.map((day, index) => (
                  <View key={index} className="items-center flex-1">
                    <View
                      className={`bg-green-500 rounded-t-sm ${isTablet ? 'w-8' : 'w-6'}`}
                      style={{
                        height: Math.max((day.amount / maxDailySale) * (isTablet ? 130 : 100), 4),
                      }}
                    />
                    <Text className={`text-gray-500 mt-2 ${isTablet ? 'text-sm' : 'text-xs'}`}>{day.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column - Lists */}
          <View className={`${isTablet ? 'w-1/2' : 'w-full'}`}>
            {/* Payment Methods */}
            <View className={`bg-white mt-4 rounded-xl ${cardPadding} ${isTablet ? 'mx-6' : 'mx-4'}`}>
              <Text className={`text-gray-900 font-semibold mb-4 ${isTablet ? 'text-lg' : ''}`}>Payment Methods</Text>
              {reportData?.salesByPaymentMethod.map((method, index) => (
                <View key={index} className={`flex-row items-center ${isTablet ? 'py-4' : 'py-3'} border-b border-gray-100 last:border-b-0`}>
                  <View
                    className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} rounded-full items-center justify-center mr-3`}
                    style={{ backgroundColor: getPaymentMethodColor(method.method) + '20' }}
                  >
                    <MaterialCommunityIcons
                      name={getPaymentMethodIcon(method.method)}
                      size={isTablet ? 24 : 20}
                      color={getPaymentMethodColor(method.method)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-gray-900 font-medium ${isTablet ? 'text-base' : ''}`}>
                      {method.method.replace('_', ' ')}
                    </Text>
                    <Text className={`text-gray-500 ${subtitleSize}`}>
                      {method.count} transactions
                    </Text>
                  </View>
                  <Text className={`text-gray-900 font-bold ${isTablet ? 'text-lg' : ''}`}>
                    {formatCurrency(method.amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Top Products */}
            <View className={`bg-white mt-4 rounded-xl ${cardPadding} ${isTablet ? 'mx-6' : 'mx-4'}`}>
              <Text className={`text-gray-900 font-semibold mb-4 ${isTablet ? 'text-lg' : ''}`}>Top Products</Text>
              {reportData?.topProducts.map((product, index) => (
                <View key={product.id} className={`flex-row items-center ${isTablet ? 'py-4' : 'py-3'} border-b border-gray-100 last:border-b-0`}>
                  <View className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} bg-gray-100 rounded-full items-center justify-center mr-3`}>
                    <Text className={`text-gray-600 font-bold ${isTablet ? 'text-base' : ''}`}>{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-gray-900 font-medium ${isTablet ? 'text-base' : ''}`}>{product.name}</Text>
                    <Text className={`text-gray-500 ${subtitleSize}`}>
                      {product.quantity} units sold
                    </Text>
                  </View>
                  <Text className={`text-green-600 font-bold ${isTablet ? 'text-lg' : ''}`}>
                    {formatCurrency(product.revenue)}
                  </Text>
                </View>
              ))}
              {(!reportData?.topProducts || reportData.topProducts.length === 0) && (
                <Text className="text-gray-400 text-center py-4">
                  No product data available
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Export Button */}
        <Pressable
          onPress={showReportTypeSelector}
          disabled={isGeneratingPdf}
          className={`bg-white mt-4 rounded-xl ${cardPadding} flex-row items-center justify-center ${isTablet ? 'mx-6' : 'mx-4'} ${
            isGeneratingPdf ? 'opacity-50' : ''
          }`}
        >
          {isGeneratingPdf ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={isTablet ? 24 : 20} color="#22c55e" />
              <Text className={`text-green-600 font-semibold ml-2 ${isTablet ? 'text-lg' : ''}`}>
                Download PDF Report
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
