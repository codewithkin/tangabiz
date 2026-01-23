import { Button } from "@/components/ui/button";
import { Pressable, View, Image } from "react-native";
import { useRouter } from 'expo-router';
import Fontisto from '@expo/vector-icons/Fontisto';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function Dashboard() {
    const dummySales: SaleExtract[] = [
        {
            id: 's_1',
            customerName: "John Doe",
            amount: 150.75,
            date: "2026-01-22",
            method: "cash",
        },
        {
            id: 's_2',
            customerName: "Jane Smith",
            amount: 320.00,
            date: "2026-01-21",
            method: "card",
        },
        {
            id: 's_3',
            customerName: "Michael Brown",
            amount: 50.25,
            date: "2026-01-20",
            method: "ecocash",
        },
        {
            id: 's_4',
            customerName: "Emily Davis",
            amount: 200.00,
            date: "2026-01-19",
            method: "cash",
        },
        {
            id: 's_5',
            customerName: "Chris Wilson",
            amount: 75.50,
            date: "2026-01-18",
            method: "card",
        },
    ]

    return (
        <ScrollView>
            <View className="px-4 py-10 flex flex-col gap-10">
                <View className="flex flex-col gap-4">
                    <View className="flex flex-row justify-between items-center">
                        <View className="flex flex-col">
                            <Text className="text-2xl font-semibold">Good morning, name</Text>
                            <Text className="text-gray-400 text-sm">Welcome back to <Text className="text-yellow-500">Tanga<Text className="text-green-500">Biz</Text></Text></Text>
                        </View>

                        <Button size="icon" variant="outline" className="p-2">
                            <Fontisto name="bell" size={20} color="black" />
                        </Button>
                    </View>

                    {/* Card showing balance */}
                    <Card className="rounded-2xl px-4 flex flex-col gap-1 p-8">
                        <Text className="text-gray-400 text-sm">Total Received</Text>

                        {/* Amount with 2 DP */}
                        <Text className="text-4xl font-semibold">$3,000.00</Text>

                        {/* redirect to the new sale page */}
                        <Button className="rounded-full bg-yellow-500 py-4 h-auto mt-2">
                            <Text className="font-bold">Add new Sale</Text>
                        </Button>
                    </Card>

                    <View className="rounded-2xl overflow-hidden relative h-48">
                        <LinearGradient
                            colors={['#3b82f6', '#6b21a8']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 1, y: 0 }}
                            className="flex-1 p-8 justify-between"
                        >
                            <Text className="text-white text-base font-semibold">Explore your business financial reports, see expenses, sales and net profit !</Text>
                            
                            <Button className="self-start rounded-full bg-white">
                                <Text className="text-blue-600 font-bold" onPress={() => useRouter().push('/(drawer)/reports')}>See reports</Text>
                            </Button>

                            <Image
                                source={require('@/assets/send_money.svg')}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 120,
                                    height: 120,
                                    opacity: 0.3,
                                }}
                            />
                        </LinearGradient>
                    </View>

                </View>

                {/* Recent sales section - Take the most recent 5 sales from the db */}
                <View className="flex flex-col gap-2">
                    <View className="flex flex-row justify-between items-center">
                        <Text className="text-lg">Recent Sales</Text>

                        <Link href="#" className="text-gray-400 text-sm">See All</Link>
                    </View>

                    {/* Map the recent Sales (5 latest ones from the db) */}
                    <View className="flex flex-col gap-4 w-full mt-2">
                        {
                            dummySales.map((sale: SaleExtract, index: number) => (
                                <Sale key={index} data={sale} />
                            ))
                        }
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}