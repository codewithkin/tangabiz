import { Text, TextProps } from 'react-native';
import React from 'react';

export function AppName(props: TextProps) {
    // Usage: <AppName className="text-3xl font-bold" />
    return (
        <Text accessibilityRole="header" {...props}>
            <Text className="text-yellow-500">Tanga</Text>
            <Text className="text-green-500">Biz</Text>
        </Text>
    );
}

export default AppName;
