import { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Surface } from 'heroui-native';
import { useOnboardingStore } from '@/store/onboarding';
import { Container } from '@/components/container';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    id: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        id: 1,
        icon: 'store',
        title: 'Manage Your Business',
        description: 'Track sales, inventory, and customers all in one place. Get real-time insights to grow your business.',
        color: '#22c55e',
    },
    {
        id: 2,
        icon: 'cart-plus',
        title: 'Quick Point of Sale',
        description: 'Process sales quickly with our intuitive POS system. Accept multiple payment methods and generate receipts.',
        color: '#eab308',
    },
    {
        id: 3,
        icon: 'robot-happy',
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
        if (currentIndex < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
            setCurrentIndex(currentIndex + 1);
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = () => {
        handleGetStarted();
    };

    const handleGetStarted = () => {
        setOnboardingComplete();
        router.replace('/sign-in');
    };

    const handleScroll = (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(slideIndex);
    };

    return (
        <Container className="bg-background">
            <View className="flex-1">
                {/* Skip Button */}
                <View className="absolute top-12 right-6 z-10">
                    <Pressable onPress={handleSkip}>
                        <Text className="text-muted text-base font-medium">Skip</Text>
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
                >
                    {slides.map((slide) => (
                        <View
                            key={slide.id}
                            style={{ width }}
                            className="flex-1 items-center justify-center px-8"
                        >
                            {/* Icon */}
                            <View
                                className="w-32 h-32 rounded-3xl items-center justify-center mb-8"
                                style={{ backgroundColor: slide.color }}
                            >
                                <MaterialCommunityIcons name={slide.icon} size={64} color="white" />
                            </View>

                            {/* Title */}
                            <Text className="text-2xl font-bold text-foreground text-center mb-4">
                                {slide.title}
                            </Text>

                            {/* Description */}
                            <Text className="text-muted text-center text-base leading-6">
                                {slide.description}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Pagination & Button */}
                <View className="px-8 pb-12">
                    {/* Dots */}
                    <View className="flex-row justify-center mb-8">
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full mx-1 ${index === currentIndex ? 'bg-primary w-6' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Button */}
                    <Button
                        variant="primary"
                        onPress={handleNext}
                        className="w-full"
                    >
                        <Button.Label>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                        </Button.Label>
                    </Button>
                </View>
            </View>
        </Container>
    );
}
