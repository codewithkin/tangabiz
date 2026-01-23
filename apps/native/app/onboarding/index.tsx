import { useState } from 'react';
import { Image, Text, Pressable } from "react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/store/onboarding';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import AppName from '@/components/app-name';

interface Step {
    id: number;
    image: any;
    heading: string;
    description: string;
    color: string;
}

const steps: Step[] = [
    {
        id: 1,
        image: require('@/assets/onboarding/mobile-payments.png'),
        heading: 'Manage Your Business',
        description: 'Track sales, inventory, and customers all in one place. Get real-time insights to grow your business.',
        color: '#22c55e',
    },
    {
        id: 2,
        image: require('@/assets/onboarding/credit-cards-payments.png'),
        heading: 'Quick Point of Sale',
        description: 'Process sales quickly with our intuitive POS system. Accept multiple payment methods and generate receipts.',
        color: '#eab308',
    },
    {
        id: 3,
        image: require('@/assets/onboarding/analytics.png'),
        heading: 'AI-Powered Insights',
        description: 'Meet Tatenda, your AI assistant. Get answers about your business, trends, and smart recommendations.',
        color: '#3b82f6',
    },
];

export default function OnboardingIndex() {
    const [currentStep, setCurrentStep] = useState(0);
    const { setOnboardingComplete } = useOnboardingStore();
    const router = useRouter();
    const translateX = useSharedValue(0);

    const step = steps[currentStep];

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleGetStarted();
        }
    };

    const handlePrevious = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleGetStarted();
    };

    const handleGetStarted = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOnboardingComplete();
        // Mark onboarding as viewed in AsyncStorage
        AsyncStorage.setItem('onboardingViewed', 'true');
        router.replace('/sign-in');
    };

    const swipeGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
        })
        .onEnd((event) => {
            const threshold = 50;
            if (event.translationX > threshold) {
                // Swiped right - previous
                handlePrevious();
            } else if (event.translationX < -threshold) {
                // Swiped left - next
                handleNext();
            }
            translateX.value = withSpring(0);
        });

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
            <View className="flex flex-col h-full">
                {/* Branding Header */}
                <View className="px-6 py-3 items-center border-b border-gray-200">
                    <AppName className="text-2xl font-bold text-primary-600" />
                </View>

                {/* Header with Skip */}
                <View className="px-6 py-4 flex-row justify-end">
                    <Pressable onPress={handleSkip} className="px-4 py-2">
                        <Text className="text-gray-500 text-base font-medium">Skip</Text>
                    </Pressable>
                </View>

                <GestureDetector gesture={swipeGesture}>
                    <Animated.View className="flex flex-col flex-1 items-center justify-center">
                        {/* Onboarding image */}
                        <View className="my-8 items-center">
                            <Image
                                source={step.image}
                                className="rounded-full"
                                style={{ width: 250, height: 250, resizeMode: 'contain' }}
                            />
                        </View>

                        <View className="flex flex-col justify-center items-center px-8">
                            <Text className="text-2xl font-semibold text-center">{step.heading}</Text>
                            <Text className="text-gray-400 font-light text-center mt-2">{step.description}</Text>
                        </View>
                    </Animated.View>
                </GestureDetector>

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
            </View>
        </SafeAreaView>
    )
}