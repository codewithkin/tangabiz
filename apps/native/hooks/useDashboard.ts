import { useQuery } from '@tanstack/react-query';
import { transactionsApi, productsApi, reportsApi, notificationsApi } from '@/lib/api';
import type { SaleExtract, ProductExtact } from '@/app/(drawer)/(tabs)/index';

/**
 * Fetches recent sales (transactions) for the dashboard
 */
export const useRecentSales = (businessId: string | null, limit: number = 5) => {
  return useQuery({
    queryKey: ['sales', businessId, limit],
    queryFn: async () => {
      if (!businessId) {
        console.log('[useRecentSales] No businessId provided, returning empty array');
        return [];
      }
      try {
        console.log('[useRecentSales] Fetching with businessId:', businessId);
        const response = await transactionsApi.list(businessId, {
          page: 1,
          limit,
          type: 'SALE',
        });
        
        console.log('[useRecentSales] API Response:', response);
        
        if (!response.success || !response.data) {
          console.warn('[useRecentSales] API call failed or returned no data');
          return [];
        }
        
        // Map transactions to SaleExtract format
        const transactions = response.data.transactions || [];
        const mappedSales = transactions.map((tx: any) => ({
          id: tx.id,
          customerName: tx.customer?.name || 'Walk-in Customer',
          amount: Number(tx.total || 0),
          date: tx.createdAt,
          method: mapPaymentMethod(tx.paymentMethod),
        })) as SaleExtract[];
        
        console.log('[useRecentSales] Mapped sales:', mappedSales);
        return mappedSales;
      } catch (error) {
        console.error('[useRecentSales] Error fetching recent sales:', error);
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
      if (!businessId) {
        console.log('[useBestPerformingProducts] No businessId provided, returning empty array');
        return [];
      }
      
      try {
        console.log('[useBestPerformingProducts] Fetching with businessId:', businessId);
        // Get products - assuming the API returns products sorted by sales/units
        const productsResponse = await productsApi.list(businessId, {
          page: 1,
          limit,
        });
        
        console.log('[useBestPerformingProducts] API Response:', productsResponse);
        
        if (!productsResponse.success || !productsResponse.data) {
          console.warn('[useBestPerformingProducts] API call failed or returned no data');
          return [];
        }
        
        // Map products to ProductExtact format
        const products = productsResponse.data.products || [];
        const mappedProducts = products.map((p: any) => ({
          productName: p.name,
          unitsSold: p.quantity || 0,
          totalRevenue: (p.price || 0) * (p.soldUnits || p.quantity || 0),
          productImage: p.image || 'https://picsum.photos/200',
          hasRemovedBackground: !!p.image,
          price: p.price || 0,
        })) as ProductExtact[];
        
        console.log('[useBestPerformingProducts] Mapped products:', mappedProducts);
        return mappedProducts;
      } catch (error) {
        console.error('[useBestPerformingProducts] Error fetching best performing products:', error);
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
      if (!businessId) {
        console.log('[useRevenueSummary] No businessId provided, returning defaults');
        return { totalRevenue: 0, totalTransactions: 0 };
      }
      
      try {
        console.log('[useRevenueSummary] Fetching with businessId:', businessId);
        const response = await reportsApi.getSummary(
          businessId,
          getStartOfDay(),
          new Date().toISOString()
        );
        
        console.log('[useRevenueSummary] API Response:', response);
        
        if (!response.success || !response.data) {
          console.warn('[useRevenueSummary] API call failed or returned no data');
          return { totalRevenue: 0, totalTransactions: 0 };
        }
        
        const summary = {
          totalRevenue: Number(response.data.totalSales || 0),
          totalTransactions: response.data.totalTransactions || 0,
        };
        
        console.log('[useRevenueSummary] Mapped summary:', summary);
        return summary;
      } catch (error) {
        console.error('[useRevenueSummary] Error fetching revenue summary:', error);
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
      if (!businessId) {
        console.log('[useNotificationsCount] No businessId provided, returning 0');
        return 0;
      }
      
      try {
        console.log('[useNotificationsCount] Fetching with businessId:', businessId);
        const response = await notificationsApi.getCount(businessId);
        
        console.log('[useNotificationsCount] API Response:', response);
        
        if (!response.success || !response.data) {
          console.warn('[useNotificationsCount] API call failed or returned no data');
          return 0;
        }
        
        const count = response.data.count || response.data.unreadCount || 0;
        console.log('[useNotificationsCount] Notification count:', count);
        return count;
      } catch (error) {
        console.error('[useNotificationsCount] Error fetching notifications count:', error);
        return 0;
      }
    },
    enabled: !!businessId,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 30000,
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
