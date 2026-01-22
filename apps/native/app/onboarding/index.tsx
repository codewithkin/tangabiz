import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function Onboarding() {
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

            {/* Content - Centered in middle */}
            <View className="flex-1 items-center justify-center px-8">
                {/* Image */}
                <View className="mb-8 bg-gray-100 rounded-3xl overflow-hidden" style={{ width: 280, height: 280 }}>
                    <Image
                        source={step.imageSource}
                        style={{ width: 280, height: 280 }}
                        resizeMode="cover"
                    />
                </View>

                {/* Heading */}
                <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                    {step.heading}
                </Text>

                {/* Description */}
                <Text className="text-gray-500 text-center text-lg leading-7">
                    {step.description}
                </Text>
            </View>

            {/* Footer - Stuck at bottom */}
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
    );
}
