import { Link, router, Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 404 screen displayed when user navigates to a non-existent route. Branded with TangaBiz colors and provides navigation back to home with a clean, minimal design.
export default function NotFoundScreen() {

  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <Container>
        <View className="flex-1 justify-center items-center p-4 bg-default-50">
          <Card className="items-center p-8 max-w-sm rounded-2xl">
            <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-4">
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#eab308" />
            </View>

            <View className="flex flex-col justify-center items-center">
              <Text className="text-foreground font-bold text-2xl mb-2">Page Not Found</Text>
              <Text className="text-gray-600 text-sm text-center mb-6">
                The page you're looking for doesn't exist or has been moved.
              </Text>
            </View>

            <Button
              onPress={() => router.push('/(drawer)/index')}
              className="bg-green-500 py-4 px-8 h-auto rounded-full flex-row items-center gap-2"
            >
              <MaterialCommunityIcons name="home" size={20} color="white" />
              <Text className="text-white font-semibold">Go to dashboard</Text>
            </Button>

            <Text className="text-yellow-500 font-bold text-xs mt-6">
              Tanga<Text className="text-green-500">Biz</Text>
            </Text>
          </Card>
        </View>
      </Container>
    </>
  );
}
