import { useQuery } from '@tanstack/react-query';
import { transactionsApi, productsApi, reportsApi } from '@/lib/api';
import type { SaleExtract, ProductExtact } from '@/app/(drawer)/(tabs)/index';

/**
 * Fetches recent sales (transactions) for the dashboard
 */
export const useRecentSales = (businessId: string | null, limit: number = 5) => {
  return useQuery({
    queryKey: ['sales', businessId, limit],
    queryFn: async () => {
      if (!businessId) return [];
      try {
        const response = await transactionsApi.list(businessId, {
          page: 1,
          limit,
          type: 'SALE',
        });
        
        if (!response.success || !response.data) return [];
        
        // Map transactions to SaleExtract format
        const transactions = response.data.transactions || [];
        return transactions.map((tx: any) => ({
          id: tx.id,
          customerName: tx.customer?.name || 'Walk-in Customer',
          amount: Number(tx.total || 0),
          date: tx.createdAt,
          method: mapPaymentMethod(tx.paymentMethod),
        })) as SaleExtract[];
      } catch (error) {
        console.error('Failed to fetch recent sales:', error);
        return [];
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetches best performing products for the dashboard
 */
export const useBestPerformingProducts = (businessId: string | null, limit: number = 5) => {
  return useQuery({
    queryKey: ['products', businessId, 'best-performing', limit],
    queryFn: async () => {
      if (!businessId) return [];
      
      try {
        // Get products - assuming the API returns products sorted by sales/units
        const productsResponse = await productsApi.list(businessId, {
          page: 1,
          limit,
        });
        
        if (!productsResponse.success || !productsResponse.data) return [];
        
        // Map products to ProductExtact format
        const products = productsResponse.data.products || [];
        return products.map((p: any) => ({
          productName: p.name,
          unitsSold: p.quantity || 0,
          totalRevenue: (p.price || 0) * (p.soldUnits || p.quantity || 0),
          productImage: p.image || 'https://picsum.photos/200',
          hasRemovedBackground: !!p.image,
          price: p.price || 0,
        })) as ProductExtact[];
      } catch (error) {
        console.error('Failed to fetch best performing products:', error);
        return [];
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetches total revenue/sales summary for the dashboard
 */
export const useRevenueSummary = (businessId: string | null) => {
  return useQuery({
    queryKey: ['revenue', businessId],
    queryFn: async () => {
      if (!businessId) return { totalRevenue: 0, totalTransactions: 0 };
      
      try {
        const response = await reportsApi.getSummary(
          businessId,
          getStartOfDay(),
          new Date().toISOString()
        );
        
        if (!response.success || !response.data) {
          return { totalRevenue: 0, totalTransactions: 0 };
        }
        
        return {
          totalRevenue: Number(response.data.totalSales || 0),
          totalTransactions: response.data.totalTransactions || 0,
        };
      } catch (error) {
        console.error('Failed to fetch revenue summary:', error);
        return { totalRevenue: 0, totalTransactions: 0 };
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetches unread notifications count
 */
export const useNotificationsCount = (businessId: string | null) => {
  return useQuery({
    queryKey: ['notifications', businessId, 'count'],
    queryFn: async () => {
      if (!businessId) return 0;
      
      try {
        const response = await fetch(`/api/notifications/count?businessId=${businessId}`);
        if (!response.ok) return 0;
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        console.error('Failed to fetch notifications count:', error);
        return 0;
      }
    },
    enabled: !!businessId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Helper functions
function mapPaymentMethod(method: string): 'cash' | 'card' | 'ecocash' {
  if (!method) return 'cash';
  
  const normalized = method.toUpperCase();
  switch (normalized) {
    case 'CASH':
      return 'cash';
    case 'CARD':
    case 'DEBIT_CARD':
    case 'CREDIT_CARD':
      return 'card';
    case 'MOBILE_MONEY':
    case 'ECOCASH':
    case 'BANK_TRANSFER':
      return 'ecocash';
    default:
      return 'cash';
  }
}

function getStartOfDay(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
