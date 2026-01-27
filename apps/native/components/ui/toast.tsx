import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { cn } from '@/lib/utils';

export interface ToastConfig {
    id: string;
    message: string;
    description?: string;
    type: 'error' | 'success' | 'warning' | 'info';
    duration?: number;
    onDismiss?: () => void;
}

interface ToastProps extends ToastConfig {
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    description,
    type,
    duration = 5000,
    onDismiss,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) {
        setTimeout(() => onDismiss(), 300);
        return null;
    }

    const bgColor = {
        error: 'bg-red-50 border-red-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    }[type];

    const iconColor = {
        error: '#dc2626',
        success: '#22c55e',
        warning: '#eab308',
        info: '#3b82f6',
    }[type];

    const iconName = {
        error: 'alert-circle',
        success: 'check-circle',
        warning: 'alert',
        info: 'information',
    }[type];

    const textColor = {
        error: 'text-red-900',
        success: 'text-green-900',
        warning: 'text-yellow-900',
        info: 'text-blue-900',
    }[type];

    const descriptionColor = {
        error: 'text-red-700',
        success: 'text-green-700',
        warning: 'text-yellow-700',
        info: 'text-blue-700',
    }[type];

    return (
        <Animated.View
            entering={SlideInUp.duration(300)}
            exiting={SlideOutDown.duration(300)}
            className="w-full px-4 mb-4"
        >
            <View className={cn('rounded-lg border p-4 flex-row gap-3 items-start shadow-md', bgColor)}>
                <View className="pt-1">
                    <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
                </View>
                <View className="flex-1">
                    <Text className={cn('font-semibold text-base', textColor)}>
                        {message}
                    </Text>
                    {description && (
                        <Text className={cn('text-sm mt-1', descriptionColor)}>
                            {description}
                        </Text>
                    )}
                </View>
                <Pressable onPress={handleDismiss} className="p-1">
                    <MaterialCommunityIcons name="close" size={18} color={iconColor} />
                </Pressable>
            </View>
        </Animated.View>
    );
};

export interface ToastManagerRef {
    show: (config: Omit<ToastConfig, 'id'>) => void;
    dismiss: (id: string) => void;
}

interface ToastManagerProps {
    ref: React.Ref<ToastManagerRef>;
}

export const ToastManager = React.forwardRef<ToastManagerRef, ToastManagerProps>((_, ref) => {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);

    React.useImperativeHandle(ref, () => ({
        show: (config: Omit<ToastConfig, 'id'>) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const toast: ToastConfig = { ...config, id };
            setToasts((prev) => [...prev, toast]);
        },
        dismiss: (id: string) => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        },
    }));

    const handleDismiss = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <View className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
            <View className="pointer-events-auto">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onDismiss={() => handleDismiss(toast.id)}
                    />
                ))}
            </View>
        </View>
    );
});

ToastManager.displayName = 'ToastManager';

// Create a global toast instance
let toastRef: React.RefObject<ToastManagerRef> | null = null;

export const setToastRef = (ref: React.RefObject<ToastManagerRef>) => {
    toastRef = ref;
};

export const showToast = (config: Omit<ToastConfig, 'id'>) => {
    if (toastRef?.current) {
        toastRef.current.show(config);
    }
};

export const dismissToast = (id: string) => {
    if (toastRef?.current) {
        toastRef.current.dismiss(id);
    }
};
