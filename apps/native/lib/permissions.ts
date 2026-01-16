// Role-Based Access Control (RBAC) for Tangabiz
// Defines permissions for ADMIN, MANAGER, and STAFF roles

import { useAuthStore } from '@/store/auth';

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

// Role permissions matrix
const rolePermissions: Record<Role, Permission[]> = {
    ADMIN: [
        // Full access to everything
        'view_dashboard',
        'view_sales_stats',
        'view_revenue',
        'view_profit_margin',
        'view_products',
        'create_products',
        'edit_products',
        'delete_products',
        'view_cost_price',
        'manage_inventory',
        'view_categories',
        'create_categories',
        'edit_categories',
        'delete_categories',
        'view_customers',
        'create_customers',
        'edit_customers',
        'delete_customers',
        'view_transactions',
        'create_sales',
        'process_refunds',
        'void_transactions',
        'view_all_transactions',
        'view_reports',
        'view_sales_reports',
        'view_inventory_reports',
        'view_financial_reports',
        'export_reports',
        'view_business_settings',
        'edit_business_settings',
        'manage_team',
        'invite_members',
        'remove_members',
        'change_roles',
        'view_notifications',
        'manage_notification_settings',
    ],
    MANAGER: [
        // Most access except critical business settings and some financials
        'view_dashboard',
        'view_sales_stats',
        'view_revenue',
        // No profit margin
        'view_products',
        'create_products',
        'edit_products',
        // No delete products
        'view_cost_price',
        'manage_inventory',
        'view_categories',
        'create_categories',
        'edit_categories',
        // No delete categories
        'view_customers',
        'create_customers',
        'edit_customers',
        // No delete customers
        'view_transactions',
        'create_sales',
        'process_refunds',
        'view_all_transactions',
        // No void transactions
        'view_reports',
        'view_sales_reports',
        'view_inventory_reports',
        // No financial reports
        'export_reports',
        'view_business_settings',
        // No edit business settings
        'manage_team',
        'invite_members',
        // No remove members or change roles
        'view_notifications',
        'manage_notification_settings',
    ],
    STAFF: [
        // Basic operational access
        'view_dashboard',
        'view_sales_stats',
        // No revenue or profit margin
        'view_products',
        // No create/edit/delete products
        // No cost price
        'manage_inventory', // Can update stock counts
        'view_categories',
        // No category management
        'view_customers',
        'create_customers',
        // No edit/delete customers
        'view_transactions',
        'create_sales',
        // No refunds or void
        // Can only see own transactions (handled in API)
        'view_reports',
        'view_sales_reports',
        'view_inventory_reports',
        // No financial reports or exports
        // No business settings
        // No team management
        'view_notifications',
        // No notification settings management
    ],
};

// Check if a role has a specific permission
export const hasPermission = (role: Role, permission: Permission): boolean => {
    return rolePermissions[role]?.includes(permission) ?? false;
};

// Check if a role has any of the specified permissions
export const hasAnyPermission = (role: Role, permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(role, permission));
};

// Check if a role has all of the specified permissions
export const hasAllPermissions = (role: Role, permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(role, permission));
};

// Get all permissions for a role
export const getPermissions = (role: Role): Permission[] => {
    return rolePermissions[role] || [];
};

// React hook for permissions
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

// Permission-based component wrapper
export const canAccess = (role: Role, requiredPermissions: Permission | Permission[]): boolean => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return hasAnyPermission(role, permissions);
};

// Role display helpers
export const getRoleDisplayName = (role: Role): string => {
    switch (role) {
        case 'ADMIN':
            return 'Administrator';
        case 'MANAGER':
            return 'Manager';
        case 'STAFF':
            return 'Staff Member';
        default:
            return role;
    }
};

export const getRoleColor = (role: Role): string => {
    switch (role) {
        case 'ADMIN':
            return '#22c55e'; // green
        case 'MANAGER':
            return '#3b82f6'; // blue
        case 'STAFF':
            return '#6b7280'; // gray
        default:
            return '#9ca3af';
    }
};

export const getRoleBadgeStyle = (role: Role): { bg: string; text: string } => {
    switch (role) {
        case 'ADMIN':
            return { bg: 'bg-green-100', text: 'text-green-700' };
        case 'MANAGER':
            return { bg: 'bg-blue-100', text: 'text-blue-700' };
        case 'STAFF':
            return { bg: 'bg-gray-100', text: 'text-gray-700' };
        default:
            return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
};
