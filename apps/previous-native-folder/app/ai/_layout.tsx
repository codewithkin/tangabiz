import { Stack } from 'expo-router';

export default function AILayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Tatenda AI',
                    headerBackTitle: 'Back',
                }}
            />
        </Stack>
    );
}
