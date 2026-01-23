import { Link, Stack, useRouter } from "expo-router";
import { Surface } from "heroui-native";
import { View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

// 404 screen displayed when user navigates to a non-existent route. Branded with TangaBiz colors and provides navigation back to home with a clean, minimal design.
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <Container>
        <View className="flex-1 justify-center items-center p-4 bg-default-50">
          <Surface variant="secondary" className="items-center p-8 max-w-sm rounded-2xl">
            <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-4">
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#eab308" />
            </View>
            
            <Text className="text-foreground font-bold text-2xl mb-2">Page Not Found</Text>
            <Text className="text-muted text-sm text-center mb-6">
              The page you're looking for doesn't exist or has been moved.
            </Text>

            <Pressable 
              onPress={() => router.replace('/(drawer)/index')}
              className="bg-green-500 px-6 py-3 rounded-full flex-row items-center gap-2"
            >
              <MaterialCommunityIcons name="home" size={20} color="white" />
              <Text className="text-white font-semibold">Go to Home</Text>
            </Pressable>

            <Text className="text-yellow-500 font-bold text-xs mt-6">
              Tanga<Text className="text-green-500">Biz</Text>
            </Text>
          </Surface>
        </View>
      </Container>
    </>
  );
}
