import { View, Animated, Pressable } from 'react-native';
import { useRef, useEffect } from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  nativeID?: string;
  className?: string;
}

function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  nativeID,
  className = '',
}: SwitchProps) {
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [checked]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      nativeID={nativeID}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <View
        className={`w-12 h-7 rounded-full flex-row items-center ${checked ? 'bg-green-500' : 'bg-gray-300'
          } ${disabled ? 'opacity-50' : ''} ${className}`}
      >
        <Animated.View
          style={{
            transform: [{ translateX }],
          }}
          className="w-6 h-6 rounded-full bg-white"
        />
      </View>
    </Pressable>
  );
}

export { Switch };
