import { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboarding';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: number;
    image: any;
    title: string;
    description: string;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        id: 1,
        image: require('@/assets/onboarding/mobile-phone-shopping-this-is-meant-to-show-how-they-can-control-sales.svg'),
        title: 'Manage Your Business',
        description: 'Track sales, inventory, and customers all in one place. Get real-time insights to grow your business.',
        color: '#22c55e',
    },
    {
        id: 2,
        image: require('@/assets/onboarding/mobile-payments.svg'),
        title: 'Quick Point of Sale',
        description: 'Process sales quickly with our intuitive POS system. Accept multiple payment methods and generate receipts.',
        color: '#eab308',
    },
    {
        id: 3,
        image: require('@/assets/onboarding/predictive-analytics.svg'),
        title: 'AI-Powered Insights',
        description: 'Meet Tatenda, your AI assistant. Get answers about your business, trends, and smart recommendations.',
        color: '#3b82f6',
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
        <SafeAreaView className="flex-1 bg-white">
            {/* Skip Button */}
            <View className="absolute top-4 right-6 z-10">
                <Pressable onPress={handleSkip} className="px-4 py-2">
                    <Text className="text-gray-500 text-base font-medium">Skip</Text>
                </Pressable>
            </View>

            {/* Horizontal ScrollView for Slides */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            >
                {slides.map((slide) => (
                    <View
                        key={slide.id}
                        style={{ width, height: height - 100 }}
                        className="items-center justify-center px-8"
                    >
                        {/* Image */}
                        <Image
                            source={slide.image}
                            style={{ width: width * 0.8, height: width * 0.8 }}
                            resizeMode="contain"
                        />

                        {/* Title */}
                        <Text className="text-3xl font-bold text-gray-900 text-center mb-4 mt-8">
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
                <View className="flex-row justify-center mb-6">
                    {slides.map((slide, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full mx-1.5 ${index === currentIndex ? 'w-8' : 'w-2'
                                }`}
                            style={{
                                backgroundColor: index === currentIndex ? currentSlide.color : '#d1d5db',
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
            </View>
        </SafeAreaView>
    );
}
