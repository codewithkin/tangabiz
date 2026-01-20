# Role-Based Access Control (RBAC)

## Overview

Complete permission system with:
- Three roles: ADMIN, MANAGER, STAFF
- 50+ granular permissions
- React hook for permission checks
- Guard components for conditional rendering
- Role display helpers

## Files

- [lib/permissions.ts](../apps/old-native/lib/permissions.ts) - Permission definitions and hooks
- [components/PermissionGuard.tsx](../apps/old-native/components/PermissionGuard.tsx) - Guard components

## Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| ADMIN | Full access to everything | Complete control |
| MANAGER | Most access except critical business settings | Operational control |
| STAFF | Basic operational access | Day-to-day operations |

## Permission Types

```typescript
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export type Permission =
    // Dashboard
    | 'view_dashboard'
    | 'view_sales_stats'
    | 'view_revenue'
    | 'view_profit_margin'
    
    // Products
    | 'view_products'
    | 'create_products'
    | 'edit_products'
    | 'delete_products'
    | 'view_cost_price'
    | 'manage_inventory'
    
    // Categories
    | 'view_categories'
    | 'create_categories'
    | 'edit_categories'
    | 'delete_categories'
    
    // Customers
    | 'view_customers'
    | 'create_customers'
    | 'edit_customers'
    | 'delete_customers'
    
    // Transactions
    | 'view_transactions'
    | 'create_sales'
    | 'process_refunds'
    | 'void_transactions'
    | 'view_all_transactions'
    
    // Reports
    | 'view_reports'
    | 'view_sales_reports'
    | 'view_inventory_reports'
    | 'view_financial_reports'
    | 'export_reports'
    
    // Business Settings
    | 'view_business_settings'
    | 'edit_business_settings'
    | 'manage_team'
    | 'invite_members'
    | 'remove_members'
    | 'change_roles'
    
    // Notifications
    | 'view_notifications'
    | 'manage_notification_settings';
```

## Permission Matrix

### Dashboard Permissions

| Permission | ADMIN | MANAGER | STAFF |
|------------|-------|---------|-------|
| view_dashboard | ✅ | ✅ | ✅ |
| view_sales_stats | ✅ | ✅ | ✅ |
| view_revenue | ✅ | ✅ | ❌ |
| view_profit_margin | ✅ | ❌ | ❌ |

### Product Permissions

| Permission | ADMIN | MANAGER | STAFF |
|------------|-------|---------|-------|
| view_products | ✅ | ✅ | ✅ |
| create_products | ✅ | ✅ | ❌ |
| edit_products | ✅ | ✅ | ❌ |
| delete_products | ✅ | ❌ | ❌ |
| view_cost_price | ✅ | ✅ | ❌ |
| manage_inventory | ✅ | ✅ | ✅ |

### Transaction Permissions

| Permission | ADMIN | MANAGER | STAFF |
|------------|-------|---------|-------|
| view_transactions | ✅ | ✅ | ✅ |
| create_sales | ✅ | ✅ | ✅ |
| process_refunds | ✅ | ✅ | ❌ |
| void_transactions | ✅ | ❌ | ❌ |
| view_all_transactions | ✅ | ✅ | ❌ |

### Business Settings

| Permission | ADMIN | MANAGER | STAFF |
|------------|-------|---------|-------|
| view_business_settings | ✅ | ✅ | ❌ |
| edit_business_settings | ✅ | ❌ | ❌ |
| manage_team | ✅ | ✅ | ❌ |
| invite_members | ✅ | ✅ | ❌ |
| remove_members | ✅ | ❌ | ❌ |
| change_roles | ✅ | ❌ | ❌ |

## Role Permissions Definition

```typescript
const rolePermissions: Record<Role, Permission[]> = {
    ADMIN: [
        // Full access - all permissions
        'view_dashboard', 'view_sales_stats', 'view_revenue', 'view_profit_margin',
        'view_products', 'create_products', 'edit_products', 'delete_products',
        'view_cost_price', 'manage_inventory',
        // ... all other permissions
    ],
    MANAGER: [
        // Most access except critical settings
        'view_dashboard', 'view_sales_stats', 'view_revenue',
        'view_products', 'create_products', 'edit_products',
        'view_cost_price', 'manage_inventory',
        // No: delete_products, view_profit_margin, edit_business_settings
    ],
    STAFF: [
        // Basic operational access
        'view_dashboard', 'view_sales_stats',
        'view_products', 'manage_inventory',
        'view_customers', 'create_customers',
        'view_transactions', 'create_sales',
        'view_reports', 'view_sales_reports', 'view_inventory_reports',
        'view_notifications',
    ],
};
```

## Permission Check Functions

```typescript
// Check if a role has a specific permission
export const hasPermission = (role: Role, permission: Permission): boolean => {
    return rolePermissions[role]?.includes(permission) ?? false;
};

// Check if a role has ANY of the specified permissions
export const hasAnyPermission = (role: Role, permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(role, permission));
};

// Check if a role has ALL of the specified permissions
export const hasAllPermissions = (role: Role, permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(role, permission));
};

// Get all permissions for a role
export const getPermissions = (role: Role): Permission[] => {
    return rolePermissions[role] || [];
};
```

## usePermissions Hook

```typescript
import { usePermissions } from '@/lib/permissions';

export const usePermissions = () => {
    const { currentBusiness } = useAuthStore();
    const role = currentBusiness?.role || 'STAFF';

    return {
        role,
        hasPermission: (permission: Permission) => hasPermission(role, permission),
        hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(role, permissions),
        hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(role, permissions),
        permissions: getPermissions(role),
        isAdmin: role === 'ADMIN',
        isManager: role === 'MANAGER',
        isStaff: role === 'STAFF',
        isAdminOrManager: role === 'ADMIN' || role === 'MANAGER',
    };
};
```

### Usage Examples

```tsx
const MyComponent = () => {
    const { hasPermission, isAdmin, isAdminOrManager } = usePermissions();

    return (
        <View>
            {/* Check single permission */}
            {hasPermission('delete_products') && (
                <Pressable onPress={handleDelete}>
                    <Text>Delete</Text>
                </Pressable>
            )}

            {/* Check role */}
            {isAdminOrManager && (
                <Text>Manager controls here</Text>
            )}

            {/* Check any permission */}
            {hasAnyPermission(['edit_products', 'delete_products']) && (
                <Text>Edit controls</Text>
            )}
        </View>
    );
};
```

## Guard Components

### PermissionGuard

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

// Hide content if user doesn't have permission
<PermissionGuard permissions="view_financial_reports">
    <FinancialReport />
</PermissionGuard>

// Show alternative content for users without permission
<PermissionGuard 
    permissions={['edit_products', 'delete_products']}
    fallback={<Text>View Only</Text>}
>
    <EditButton />
</PermissionGuard>

// Show access denied message
<PermissionGuard 
    permissions="export_reports"
    showAccessDenied
>
    <ExportButton />
</PermissionGuard>
```

### RoleGuard

```tsx
import { RoleGuard, AdminOnly, ManagerAndAbove, StaffOnly } from '@/components/PermissionGuard';

// Check specific roles
<RoleGuard roles={['ADMIN', 'MANAGER']}>
    <AdminPanel />
</RoleGuard>

// Shorthand components
<AdminOnly>
    <DangerZone />
</AdminOnly>

<ManagerAndAbove>
    <RefundButton />
</ManagerAndAbove>

<StaffOnly>
    <BasicDashboard />
</StaffOnly>
```

### Guard Component Props

```typescript
interface PermissionGuardProps {
    /** Required permission(s) - user needs ANY of these */
    permissions: Permission | Permission[];
    /** Content to render if permission is granted */
    children: React.ReactNode;
    /** Content to render if permission is denied (optional) */
    fallback?: React.ReactNode;
    /** Show a default "no access" message instead of nothing */
    showAccessDenied?: boolean;
}

interface RoleGuardProps {
    /** Allowed roles */
    roles: ('ADMIN' | 'MANAGER' | 'STAFF')[];
    /** Content to render if role matches */
    children: React.ReactNode;
    /** Content to render if role doesn't match */
    fallback?: React.ReactNode;
}
```

## Role Display Helpers

```typescript
// Get human-readable role name
export const getRoleDisplayName = (role: Role): string => {
    switch (role) {
        case 'ADMIN': return 'Administrator';
        case 'MANAGER': return 'Manager';
        case 'STAFF': return 'Staff Member';
        default: return role;
    }
};

// Get role color
export const getRoleColor = (role: Role): string => {
    switch (role) {
        case 'ADMIN': return '#22c55e';  // green
        case 'MANAGER': return '#3b82f6'; // blue
        case 'STAFF': return '#6b7280';   // gray
        default: return '#9ca3af';
    }
};

// Get role badge styles (Tailwind classes)
export const getRoleBadgeStyle = (role: Role): { bg: string; text: string } => {
    switch (role) {
        case 'ADMIN': return { bg: 'bg-green-100', text: 'text-green-700' };
        case 'MANAGER': return { bg: 'bg-blue-100', text: 'text-blue-700' };
        case 'STAFF': return { bg: 'bg-gray-100', text: 'text-gray-700' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
};
```

### Role Badge Example

```tsx
const RoleBadge = ({ role }: { role: Role }) => {
    const { bg, text } = getRoleBadgeStyle(role);
    return (
        <View className={`px-3 py-1 rounded-full ${bg}`}>
            <Text className={`text-sm font-medium ${text}`}>
                {getRoleDisplayName(role)}
            </Text>
        </View>
    );
};
```

## API Integration

The role comes from the `currentBusiness` object in the auth store:

```typescript
// From auth store
interface BusinessMembership {
    id: string;
    business: Business;
    role: 'ADMIN' | 'MANAGER' | 'STAFF';
    status: string;
}

// Usage
const { currentBusiness } = useAuthStore();
const userRole = currentBusiness?.role || 'STAFF';
```

## Best Practices

1. **Always check permissions server-side too** - Client-side guards are for UX, not security
2. **Use the hook in components** - `usePermissions()` provides all needed functions
3. **Use guard components for cleaner JSX** - Instead of inline conditionals
4. **Default to STAFF** - When role is unknown, assume lowest privilege
5. **Group related permissions** - Check multiple permissions with `hasAnyPermission`
