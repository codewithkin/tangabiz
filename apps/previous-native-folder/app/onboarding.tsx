// Onboarding screen - 3 step intro for first-time users
import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    Dimensions,
    FlatList,
    Pressable,
    Animated,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    image?: any;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Welcome to Tangabiz',
        description:
            'Your all-in-one business management platform. Track sales, manage inventory, and grow your business with ease.',
        // TODO: Add actual inventory.png image to assets/images/
        // image: require('@/assets/images/inventory.png'),
        icon: 'store',
        color: '#22c55e',
    },
    {
        id: '2',
        title: 'Powerful Features',
        description:
            'Record transactions, generate reports, manage customers, and track your products - all from your pocket.',
        // TODO: Add actual sales.png image to assets/images/
        // image: require('@/assets/images/sales.png'),
        icon: 'chart-line',
        color: '#eab308',
    },
    {
        id: '3',
        title: 'Get Started',
        description:
            'Sign in with your Christus Veritas Technologies account or create a new one to begin your journey.',
        icon: 'rocket-launch',
        color: '#22c55e',
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    const { setOnboardingComplete } = useOnboardingStore();

    // Bubble-up animation loop
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(bubbleAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(bubbleAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    const handleSkip = () => {
        setOnboardingComplete();
        router.replace('/sign-in');
    };

    const handleSignIn = () => {
        setOnboardingComplete();
        router.replace('/sign-in');
    };

    const handleSignUp = () => {
        setOnboardingComplete();
        router.replace('/sign-up');
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const isLastSlide = index === slides.length - 1;

        // Bubble animation interpolations
        const bubbleTranslateY = bubbleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -15],
        });

        const bubbleScale = bubbleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.08, 1],
        });

        return (
            <View
                className="flex-1 items-center justify-center px-8"
                style={{ width }}
            >
                {/* Image with bubble animation or Icon */}
                {item.image ? (
                    <Animated.View
                        style={{
                            transform: [
                                { translateY: bubbleTranslateY },
                                { scale: bubbleScale },
                            ],
                        }}
                        className="mb-12"
                    >
                        <Image
                            source={item.image}
                            style={{ width: 280, height: 280 }}
                            resizeMode="contain"
                        />
                    </Animated.View>
                ) : (
                    <View
                        className="w-40 h-40 rounded-full items-center justify-center mb-12"
                        style={{ backgroundColor: `${item.color}20` }}
                    >
                        <MaterialCommunityIcons
                            name={item.icon!}
                            size={80}
                            color={item.color}
                        />
                    </View>
                )}

                {/* Title */}
                <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                    {item.title}
                </Text>

                {/* Description */}
                <Text className="text-lg text-gray-600 text-center mb-8 leading-7 px-4">
                    {item.description}
                </Text>

                {/* Buttons for last slide */}
                {isLastSlide && (
                    <View className="w-full mt-4 px-4">
                        <Pressable
                            onPress={handleSignIn}
                            className="w-full bg-green-500 py-4 rounded-xl mb-3 active:bg-green-600"
                        >
                            <Text className="text-white text-lg font-semibold text-center">
                                Sign In
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSignUp}
                            className="w-full bg-gray-200 py-4 rounded-xl active:bg-gray-300 border border-gray-300"
                        >
                            <Text className="text-black text-lg font-semibold text-center">
                                Create Account
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        );
    };

    const renderPagination = () => {
        return (
            <View className="flex-row justify-center items-center mb-8">
                {slides.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 30, 10],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            className="h-2.5 rounded-full mx-1 bg-green-500"
                            style={{
                                width: dotWidth,
                                opacity,
                            }}
                        />
                    );
                })}
            </View>
        );
    };

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <View className="flex-1 bg-white">
            {/* Skip Button */}
            {!isLastSlide && (
                <Pressable
                    onPress={handleSkip}
                    className="absolute top-16 right-6 z-10"
                >
                    <Text className="text-gray-500 text-lg">Skip</Text>
                </Pressable>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 100 }}
            />

            {/* Bottom Section */}
            <View className="pb-10 px-8">
                {/* Pagination Dots */}
                {renderPagination()}

                {/* Next Button (hidden on last slide) */}
                {!isLastSlide && (
                    <Pressable
                        onPress={handleNext}
                        className="w-full bg-green-500 py-4 rounded-xl active:bg-green-600"
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Next
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}
