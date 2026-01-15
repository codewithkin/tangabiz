import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const { user, token, businesses, currentBusiness, signOut, setCurrentBusiness } = useAuthStore();

  // Redirect to sign-in if not authenticated
  if (!token || !user) {
    return <Redirect href="/sign-in" />;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Tangabiz',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} className="mr-4">
              <Text className="text-white font-medium">Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Welcome Section */}
        <View className="bg-primary-500 px-6 py-8">
          <Text className="text-white text-lg">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">{user.name}</Text>
          {currentBusiness && (
            <View className="mt-4 bg-primary-600 rounded-xl px-4 py-3">
              <Text className="text-primary-100 text-sm">Current Business</Text>
              <Text className="text-white text-lg font-semibold">
                {currentBusiness.name}
              </Text>
              <Text className="text-primary-200 text-sm capitalize">
                {currentBusiness.role.toLowerCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

          <View className="flex-row flex-wrap -mx-2">
            <QuickActionCard
              icon="📦"
              title="Products"
              subtitle="Manage inventory"
              onPress={() => router.push('/products')}
            />
            <QuickActionCard
              icon="👥"
              title="Customers"
              subtitle="View customers"
              onPress={() => router.push('/customers')}
            />
            <QuickActionCard
              icon="💰"
              title="New Sale"
              subtitle="Record transaction"
              onPress={() => router.push('/transactions/new')}
            />
            <QuickActionCard
              icon="📊"
              title="Reports"
              subtitle="View analytics"
              onPress={() => router.push('/reports')}
            />
          </View>
        </View>

        {/* Business Selector */}
        {businesses.length > 1 && (
          <View className="px-6 py-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">Your Businesses</Text>
            {businesses.map((business) => (
              <TouchableOpacity
                key={business.id}
                className={`mb-3 p-4 rounded-xl border-2 ${currentBusiness?.id === business.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                  }`}
                onPress={() => setCurrentBusiness(business)}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-secondary-100 rounded-xl items-center justify-center mr-4">
                    <Text className="text-2xl">🏢</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-lg">
                      {business.name}
                    </Text>
                    <Text className="text-gray-500 capitalize">
                      {business.role.toLowerCase()}
                    </Text>
                  </View>
                  {currentBusiness?.id === business.id && (
                    <View className="bg-primary-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">Active</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Business State */}
        {businesses.length === 0 && (
          <View className="px-6 py-8 items-center">
            <View className="w-20 h-20 bg-secondary-100 rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl">🏢</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              No Business Yet
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Create your first business to start managing products, customers, and transactions.
            </Text>
            <TouchableOpacity
              className="bg-primary-500 px-6 py-3 rounded-xl"
              onPress={() => router.push('/business/new')}
            >
              <Text className="text-white font-semibold">Create Business</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon,
  title,
  subtitle,
  onPress
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="w-1/2 px-2 mb-4"
      onPress={onPress}
    >
      <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <Text className="text-3xl mb-2">{icon}</Text>
        <Text className="text-gray-900 font-semibold">{title}</Text>
        <Text className="text-gray-500 text-sm">{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}
