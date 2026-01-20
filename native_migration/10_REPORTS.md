# Reports & Analytics

## Overview

Reports dashboard with:
- Summary statistics cards
- Period selection (24h, 1w, 1m, 1y, custom)
- Sales trend chart
- Payment method breakdown
- Top products list
- PDF report generation and export
- Permission-based visibility
- Responsive layout for tablets

## File: `app/reports/index.tsx`

## Data Types

```typescript
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
```

## Period Selection

Uses `PeriodSelector` components:

```tsx
import { PeriodTags, PeriodType, CustomPeriod, getPeriodDates } from '@/components/PeriodSelector';

const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1w');
const [customPeriod, setCustomPeriod] = useState<CustomPeriod | undefined>();

// Calculate date range
const getDateRange = () => {
    return getPeriodDates(selectedPeriod, customPeriod);
};

// In JSX
<PeriodTags
    selectedPeriod={selectedPeriod}
    onSelect={setSelectedPeriod}
    customPeriod={customPeriod}
    onCustomPeriodChange={setCustomPeriod}
/>
```

## Summary Cards

Responsive grid of stat cards:

```tsx
// Card widths based on device
const cardWidth = isLargeTablet ? 'w-1/4' : isTablet ? 'w-1/4' : 'w-1/2';

<View className="flex-row flex-wrap px-2 mt-4">
    {/* Total Sales */}
    {hasPermission('view_revenue') && (
        <View className={`${cardWidth} p-2`}>
            <View className="bg-white rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 text-sm">Total Sales</Text>
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                        <MaterialCommunityIcons name="trending-up" size={16} color="#22c55e" />
                    </View>
                </View>
                <Text className="text-gray-900 text-xl font-bold mt-2">
                    {formatCurrency(reportData?.totalSales || 0)}
                </Text>
            </View>
        </View>
    )}

    {/* Refunds - Manager+ only */}
    {hasPermission('process_refunds') && (
        <View className={`${cardWidth} p-2`}>
            <View className="bg-white rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 text-sm">Refunds</Text>
                    <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                        <MaterialCommunityIcons name="trending-down" size={16} color="#ef4444" />
                    </View>
                </View>
                <Text className="text-red-600 text-xl font-bold mt-2">
                    {formatCurrency(reportData?.totalRefunds || 0)}
                </Text>
            </View>
        </View>
    )}

    {/* More cards... */}
</View>
```

### Stat Card Types

| Card | Icon | Color | Permission |
|------|------|-------|------------|
| Total Sales | trending-up | Green | view_revenue |
| Refunds | trending-down | Red | process_refunds |
| Net Revenue | cash | Blue | view_revenue |
| Transactions | receipt | Purple | All |
| Avg. Order | chart-line | Yellow | view_revenue |

## Sales Trend Chart

Simple bar chart implementation:

```tsx
const maxDailySale = Math.max(...(reportData?.dailySales.map(d => d.amount) || [1]));

<View className="bg-white mt-4 rounded-xl p-4 mx-4">
    <Text className="text-gray-900 font-semibold mb-4">Sales Trend</Text>
    <View className="flex-row items-end justify-between h-32">
        {reportData?.dailySales.map((day, index) => (
            <View key={index} className="items-center flex-1">
                <View
                    className="bg-green-500 rounded-t-sm w-6"
                    style={{
                        height: Math.max((day.amount / maxDailySale) * 100, 4),
                    }}
                />
                <Text className="text-gray-500 mt-2 text-xs">{day.date}</Text>
            </View>
        ))}
    </View>
</View>
```

## Payment Method Breakdown

```tsx
const getPaymentMethodIcon = (method: string) => {
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

<View className="bg-white mt-4 rounded-xl p-4 mx-4">
    <Text className="text-gray-900 font-semibold mb-4">Payment Methods</Text>
    {reportData?.salesByPaymentMethod.map((method, index) => (
        <View key={index} className="flex-row items-center py-3 border-b border-gray-100">
            <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: getPaymentMethodColor(method.method) + '20' }}
            >
                <MaterialCommunityIcons
                    name={getPaymentMethodIcon(method.method)}
                    size={20}
                    color={getPaymentMethodColor(method.method)}
                />
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 font-medium">
                    {method.method.replace('_', ' ')}
                </Text>
                <Text className="text-gray-500 text-sm">
                    {method.count} transactions
                </Text>
            </View>
            <Text className="text-gray-900 font-bold">
                {formatCurrency(method.amount)}
            </Text>
        </View>
    ))}
</View>
```

## Top Products List

```tsx
<View className="bg-white mt-4 rounded-xl p-4 mx-4">
    <Text className="text-gray-900 font-semibold mb-4">Top Products</Text>
    {reportData?.topProducts.map((product, index) => (
        <View key={product.id} className="flex-row items-center py-3 border-b border-gray-100">
            {/* Rank Badge */}
            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Text className="text-gray-600 font-bold">{index + 1}</Text>
            </View>
            
            {/* Product Info */}
            <View className="flex-1">
                <Text className="text-gray-900 font-medium">{product.name}</Text>
                <Text className="text-gray-500 text-sm">
                    {product.quantity} units sold
                </Text>
            </View>
            
            {/* Revenue */}
            <Text className="text-green-600 font-bold">
                {formatCurrency(product.revenue)}
            </Text>
        </View>
    ))}
</View>
```

## PDF Report Generation

### Dependencies

```bash
npm install expo-file-system expo-sharing expo-intent-launcher
```

### Report Type Selection

```typescript
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
```

### PDF Generation & Download

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

const generateAndDownloadPdf = async (type: ReportType) => {
    if (!currentBusiness) {
        Alert.alert('Error', 'No business selected');
        return;
    }

    setIsGeneratingPdf(true);

    try {
        const { startDate, endDate } = getDateRange();

        // Request PDF generation from server
        const res = await api.post('/api/reports/generate', {
            businessId: currentBusiness.id,
            type,
            period: selectedPeriod.toUpperCase(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            name: `${type} Report - ${selectedPeriod}`,
        });

        if (!res.success || !res.data?.downloadUrl) {
            throw new Error(res.error || 'Failed to generate report');
        }

        const downloadUrl = res.data.downloadUrl;
        const filename = `${type.toLowerCase()}_report_${Date.now()}.pdf`;
        const fileUri = FileSystem.documentDirectory + filename;

        // Download the PDF
        const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

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
            const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
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
```

## Responsive Layout

```typescript
// Breakpoints
const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    largeTablet: 1024,
};

const { width } = useWindowDimensions();
const isTablet = width >= BREAKPOINTS.tablet;
const isLargeTablet = width >= BREAKPOINTS.largeTablet;

// Responsive values
const cardPadding = isTablet ? 'p-6' : 'p-4';
const titleSize = isTablet ? 'text-2xl' : 'text-xl';
const subtitleSize = isTablet ? 'text-base' : 'text-sm';
```

### Tablet Two-Column Layout

```tsx
{/* Responsive Layout for Charts and Lists */}
<View className={isTablet ? 'flex-row flex-wrap' : ''}>
    {/* Left Column - Charts */}
    <View className={isTablet ? 'w-1/2' : 'w-full'}>
        {/* Sales Chart */}
    </View>

    {/* Right Column - Lists */}
    <View className={isTablet ? 'w-1/2' : 'w-full'}>
        {/* Payment Methods */}
        {/* Top Products */}
    </View>
</View>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/summary` | Get report summary data |
| POST | `/api/reports/generate` | Generate PDF report |
| GET | `/api/reports/products` | Top selling products |
| GET | `/api/reports/customers` | Customer analytics |

### Query Parameters for Summary

| Parameter | Type | Description |
|-----------|------|-------------|
| businessId | string | Required |
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |

### Generate Report Body

| Field | Type | Description |
|-------|------|-------------|
| businessId | string | Required |
| type | string | SALES, INVENTORY, or CUSTOMERS |
| period | string | 24H, 1W, 1M, 1Y, CUSTOM |
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |
| name | string | Report name |

## Permissions

- `view_reports` - Access reports screen
- `view_revenue` - See revenue/sales figures
- `export_reports` - Download PDF reports
- `process_refunds` - See refund statistics
