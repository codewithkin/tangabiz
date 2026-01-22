import { useState } from 'react';
import { Image, Text, Pressable } from "react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboarding';

interface Step {
    id: number;
    imageSource: any;
    heading: string;
    description: string;
    color: string;
}

const steps: Step[] = [
    {
        id: 1,
        imageSource: require('@/assets/onboarding/dude-cartoon-holding-a-phone-looking-at-sales-analytics-wearing-blue-blue-charts.png'),
        heading: 'Manage Your Business',
        description: 'Track sales, inventory, and customers all in one place. Get real-time insights to grow your business.',
        color: '#22c55e',
    },
    {
        id: 2,
        imageSource: require('@/assets/onboarding/dude-cartoon-holding-a-phone-looking-at-sales-analytics-wearing-blue-blue-charts.png'),
        heading: 'Quick Point of Sale',
        description: 'Process sales quickly with our intuitive POS system. Accept multiple payment methods and generate receipts.',
        color: '#eab308',
    },
    {
        id: 3,
        imageSource: require('@/assets/onboarding/dude-cartoon-holding-a-phone-looking-at-sales-analytics-wearing-blue-blue-charts.png'),
        heading: 'AI-Powered Insights',
        description: 'Meet Tatenda, your AI assistant. Get answers about your business, trends, and smart recommendations.',
        color: '#3b82f6',
    },
];

export default function OnboardingIndex() {
    const [currentStep, setCurrentStep] = useState(0);
    const { setOnboardingComplete } = useOnboardingStore();
    const router = useRouter();

    const step = steps[currentStep];

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleGetStarted();
    };

    const handleGetStarted = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOnboardingComplete();
        router.replace('/sign-in');
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            {/* Header with Skip */}
            <View className="px-6 py-4 flex-row justify-end">
                <Pressable onPress={handleSkip} className="px-4 py-2">
                    <Text className="text-gray-500 text-base font-medium">Skip</Text>
                </Pressable>
            </View>

            <View className="flex flex-col flex-1 items-center justify-center">
                {/* Onboarding image */}
                <View className="my-12 items-center">
                    <Image
                        source={step.imageSource}
                        className="w-64 h-64 rounded-full"
                    />
                </View>

                <View className="flex flex-col justify-center items-center px-8">
                    <Text className="text-2xl font-semibold">{step.heading}</Text>
                    <Text className="text-gray-400 font-light text-center">{step.description}</Text>
                </View>
            </View>

            {/* Footer */}
            <View className="px-8 pb-8 gap-6">
                {/* Dots */}
                <View className="flex-row justify-center">
                    {steps.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full mx-1.5 ${index === currentStep ? 'w-8' : 'w-2'
                                }`}
                            style={{
                                backgroundColor: index === currentStep ? step.color : '#d1d5db',
                            }}
                        />
                    ))}
                </View>

                {/* Button */}
                <Pressable
                    onPress={handleNext}
                    className="py-4 rounded-2xl items-center justify-center active:opacity-90"
                    style={{ backgroundColor: step.color }}
                >
                    <Text className="text-white font-bold text-lg">
                        {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}