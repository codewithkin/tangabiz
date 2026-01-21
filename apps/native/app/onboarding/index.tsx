import { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboarding';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    id: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    color: string;
    bgColor: string;
}

const slides: OnboardingSlide[] = [
    {
        id: 1,
        icon: 'store-outline',
        title: 'Manage Your Business',
        description: 'Track sales, inventory, and customers all in one place. Get real-time insights to grow your business.',
        color: '#22c55e',
        bgColor: '#f0fdf4',
    },
    {
        id: 2,
        icon: 'cart-plus',
        title: 'Quick Point of Sale',
        description: 'Process sales quickly with our intuitive POS system. Accept multiple payment methods and generate receipts.',
        color: '#eab308',
        bgColor: '#fefce8',
    },
    {
        id: 3,
        icon: 'robot-happy-outline',
        title: 'AI-Powered Insights',
        description: 'Meet Tatenda, your AI assistant. Get answers about your business, trends, and smart recommendations.',
        color: '#3b82f6',
        bgColor: '#eff6ff',
    },
];

export default function Onboarding() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const { setOnboardingComplete } = useOnboardingStore();
    const router = useRouter();

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
            setCurrentIndex(currentIndex + 1);
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

    const handleScroll = (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (slideIndex !== currentIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(slideIndex);
        }
    };

    const currentSlide = slides[currentIndex];

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: currentSlide.bgColor }}
        >
            {/* Skip Button */}
            <View className="absolute top-16 right-6 z-10">
                <Pressable
                    onPress={handleSkip}
                    className="px-4 py-2"
                >
                    <Text className="text-gray-500 text-base font-medium">Skip</Text>
                </Pressable>
            </View>

            {/* Slides */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                className="flex-1"
            >
                {slides.map((slide) => (
                    <View
                        key={slide.id}
                        style={{ width }}
                        className="flex-1 items-center justify-center px-8"
                    >
                        {/* Icon Container */}
                        <View
                            className="w-36 h-36 rounded-[32px] items-center justify-center mb-10 shadow-lg"
                            style={{ backgroundColor: slide.color }}
                        >
                            <MaterialCommunityIcons name={slide.icon} size={72} color="white" />
                        </View>

                        {/* Title */}
                        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                            {slide.title}
                        </Text>

                        {/* Description */}
                        <Text className="text-gray-500 text-center text-lg leading-7 px-4">
                            {slide.description}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* Pagination & Button */}
            <View className="px-8 pb-8">
                {/* Dots */}
                <View className="flex-row justify-center mb-8">
                    {slides.map((slide, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full mx-1.5 transition-all ${index === currentIndex ? 'w-8' : 'w-2'
                                }`}
                            style={{
                                backgroundColor: index === currentIndex ? slide.color : '#d1d5db'
                            }}
                        />
                    ))}
                </View>

                {/* Button */}
                <Pressable
                    onPress={handleNext}
                    className="py-4 rounded-2xl items-center justify-center active:opacity-90"
                    style={{ backgroundColor: currentSlide.color }}
                >
                    <Text className="text-white font-bold text-lg">
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </Pressable>

                {/* Page indicator */}
                <Text className="text-center text-gray-400 text-sm mt-4">
                    {currentIndex + 1} of {slides.length}
                </Text>
            </View>
        </SafeAreaView>
    );
}
