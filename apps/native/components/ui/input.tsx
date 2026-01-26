import { cn } from '@/lib/utils';
import { Platform, TextInput, type TextInputProps, View } from 'react-native';
import { useState } from 'react';

function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn(
      'border-2 rounded-xl',
      isFocused ? 'border-green-500' : 'border-gray-300'
    )}>
      <TextInput
        className={cn(
          'bg-gray-100 px-4 py-3 text-gray-900 font-medium',
          className
        )}
        placeholderTextColor="#9ca3af"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

export { Input };

