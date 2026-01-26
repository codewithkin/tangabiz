import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface Option<T> {
    value: T;
    label: string;
}

interface OptionSelectorProps<T> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export function OptionSelector<T extends string>({
    options,
    value,
    onChange,
    className,
}: OptionSelectorProps<T>) {
    return (
        <View className={cn('flex-row flex-wrap gap-2', className)}>
            {options.map((option) => (
                <Pressable
                    key={option.value}
                    className={`px-4 py-2 rounded-xl ${value === option.value ? 'bg-green-500' : 'bg-gray-100'}`}
                    onPress={() => onChange(option.value)}
                >
                    <Text className={`font-medium ${value === option.value ? 'text-white' : 'text-gray-700'}`}>
                        {option.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}
