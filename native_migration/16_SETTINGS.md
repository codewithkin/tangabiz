# Settings & More Screen

## Overview

Settings and "More" screen providing access to:
- User profile management
- Business settings and switching
- Notification preferences
- App settings (theme, biometrics)
- Support links
- Sign out functionality
- Permission-based menu items

## Files

- `app/(tabs)/more.tsx` - Main "More" tab with navigation links
- `app/settings/index.tsx` - Detailed settings screen
- `app/settings/profile.tsx` - User profile settings
- `app/settings/business.tsx` - Business settings
- `app/settings/security.tsx` - Security settings

## More Tab Screen

### File: `app/(tabs)/more.tsx`

### Features
- User profile card with avatar
- Current business card with role badge
- Business switching (if user has multiple)
- Menu items grouped by section
- Permission-based visibility
- Unread notification count badge

### User Profile Card

```tsx
<View className="bg-green-500 px-4 py-6">
    <View className="flex-row items-center">
        {/* Avatar */}
        <View
            className="bg-white/20 rounded-full items-center justify-center mr-4"
            style={{ width: 64, height: 64 }}
        >
            <Text className="text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
            </Text>
        </View>
        
        {/* Name & Email */}
        <View className="flex-1">
            <Text className="text-white text-xl font-bold">{user?.name || 'User'}</Text>
            <Text className="text-green-100">{user?.email}</Text>
        </View>
        
        {/* Edit Button */}
        <Pressable
            onPress={() => router.push('/settings/profile')}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
        >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
        </Pressable>
    </View>
</View>
```

### Business Card with Switcher

```tsx
<Pressable
    onPress={() => {
        if (businesses.length > 1) {
            Alert.alert(
                'Switch Business',
                'Select a business',
                businesses.map((b) => ({
                    text: b.name,
                    onPress: () => setCurrentBusiness(b),
                }))
            );
        }
    }}
    className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm"
>
    <View className="flex-row items-center">
        <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
            <MaterialCommunityIcons name="store" size={24} color="#22c55e" />
        </View>
        <View className="flex-1">
            <Text className="text-gray-500 text-xs uppercase">Current Business</Text>
            <Text className="text-gray-900 font-semibold text-lg">{currentBusiness.name}</Text>
            <View className="flex-row items-center mt-1">
                <View className={`${roleBadgeStyle.bg} px-2 py-0.5 rounded`}>
                    <Text className={`${roleBadgeStyle.text} text-sm font-medium`}>
                        {currentBusiness.role}
                    </Text>
                </View>
                {businesses.length > 1 && (
                    <Text className="text-gray-400 text-sm ml-2">
                        {businesses.length} businesses
                    </Text>
                )}
            </View>
        </View>
        {businesses.length > 1 && (
            <MaterialCommunityIcons name="swap-horizontal" size={24} color="#9ca3af" />
        )}
    </View>
</Pressable>
```

### Menu Item Component

```tsx
const MenuItem = ({
    icon,
    label,
    description,
    onPress,
    color = '#374151',
    showArrow = true,
    badge,
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    description?: string;
    onPress: () => void;
    color?: string;
    showArrow?: boolean;
    badge?: string;
}) => (
    <Pressable
        onPress={onPress}
        className="flex-row items-center py-4 px-4 bg-white border-b border-gray-50"
    >
        <View
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: `${color}15` }}
        >
            <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <View className="flex-1">
            <Text className="text-gray-900 font-medium">{label}</Text>
            {description && (
                <Text className="text-gray-500 text-sm mt-0.5">{description}</Text>
            )}
        </View>
        {badge && (
            <View className="bg-green-500 px-2 py-1 rounded-full mr-2">
                <Text className="text-white text-sm font-medium">{badge}</Text>
            </View>
        )}
        {showArrow && (
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
        )}
    </Pressable>
);
```

### Section Header

```tsx
const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-2 bg-gray-50">
        {title}
    </Text>
);
```

### Menu Structure

```tsx
{/* Management */}
<SectionHeader title="Management" />
<View className="bg-white">
    <MenuItem
        icon="bell"
        label="Notifications"
        description="View business alerts and updates"
        onPress={() => router.push('/notifications')}
        color="#f59e0b"
        badge={unreadNotifications > 0 ? String(unreadNotifications) : undefined}
    />
    
    <PermissionGuard permissions="view_customers">
        <MenuItem
            icon="account-group"
            label="Customers"
            description="Manage your customer database"
            onPress={() => router.push('/customers')}
            color="#3b82f6"
        />
    </PermissionGuard>
    
    <PermissionGuard permissions="view_reports">
        <MenuItem
            icon="chart-line"
            label="Reports"
            description="View business analytics"
            onPress={() => router.push('/reports')}
            color="#22c55e"
        />
    </PermissionGuard>
    
    <MenuItem
        icon="robot"
        label="Tatenda AI"
        description="Chat with your AI assistant"
        onPress={() => router.push('/ai')}
        color="#8b5cf6"
    />
</View>

{/* Business - Admin Only */}
<ManagerAndAbove>
    <SectionHeader title="Business" />
    <View className="bg-white">
        <MenuItem
            icon="account-multiple"
            label="Team"
            description="Manage team members"
            onPress={() => router.push('/team')}
            color="#22c55e"
        />
        <MenuItem
            icon="tag-multiple"
            label="Categories"
            description="Product categories"
            onPress={() => router.push('/categories')}
            color="#f59e0b"
        />
    </View>
</ManagerAndAbove>

{/* Account */}
<SectionHeader title="Account" />
<View className="bg-white">
    <MenuItem
        icon="cog"
        label="Settings"
        onPress={() => router.push('/settings')}
        color="#6b7280"
    />
    <MenuItem
        icon="logout"
        label="Sign Out"
        onPress={handleSignOut}
        color="#ef4444"
        showArrow={false}
    />
</View>
```

## Settings Screen

### File: `app/settings/index.tsx`

### Features
- Business info header
- Account settings section
- App settings with switches
- Support links
- App version display
- Reset onboarding option (dev)

### Settings with Toggle

```tsx
<MenuItem
    icon="bell"
    title="Notifications"
    rightElement={
        <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={notifications ? '#22c55e' : '#f4f4f5'}
        />
    }
/>

<MenuItem
    icon="palette"
    title="Appearance"
    subtitle="Dark mode"
    rightElement={
        <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={darkMode ? '#22c55e' : '#f4f4f5'}
        />
    }
/>

<MenuItem
    icon="fingerprint"
    title="Biometric Login"
    subtitle="Use Face ID or fingerprint"
    rightElement={
        <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={biometrics ? '#22c55e' : '#f4f4f5'}
        />
    }
/>
```

### Sign Out with Confirmation

```typescript
const handleSignOut = () => {
    Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/sign-in');
                },
            },
        ]
    );
};
```

### External Links

```typescript
const handleSupport = () => {
    Linking.openURL('mailto:support@tangabiz.com');
};

const handlePrivacy = () => {
    Linking.openURL('https://tangabiz.com/privacy');
};

const handleTerms = () => {
    Linking.openURL('https://tangabiz.com/terms');
};
```

### App Version Display

```tsx
import * as Application from 'expo-application';

<View className="items-center py-6">
    <Text className="text-gray-400 text-sm">
        Version {Application.nativeApplicationVersion || '1.0.0'}
    </Text>
    <Text className="text-gray-300 text-xs mt-1">
        Build {Application.nativeBuildVersion || '1'}
    </Text>
</View>
```

### Reset Onboarding (Development)

```typescript
const handleResetOnboarding = () => {
    Alert.alert(
        'Reset Onboarding',
        'This will show the onboarding screens again next time you open the app.',
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                onPress: () => {
                    resetOnboarding();
                    Alert.alert('Done', 'Onboarding has been reset');
                },
            },
        ]
    );
};
```

## Notifications Screen

### Features
- Real-time notification list
- Unread count badge
- Mark as read functionality
- WebSocket for real-time updates

### Notification Types

| Type | Icon | Color |
|------|------|-------|
| SALE | receipt | Green |
| LOW_STOCK | package-variant | Yellow |
| NEW_CUSTOMER | account-plus | Blue |
| ALERT | alert-circle | Red |
| INFO | information | Gray |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/count` | Get unread count |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/mark-all-read` | Mark all as read |

## Dependencies

```json
{
    "expo-application": "~6.0.2",
    "expo-linking": "~7.0.4"
}
```
