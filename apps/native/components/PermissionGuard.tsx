// Permission Guard Component - Conditionally renders children based on permissions
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Permission, usePermissions } from '@/lib/permissions';

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

/**
 * PermissionGuard - Conditionally renders content based on user permissions
 * 
 * @example
 * // Hide content if user doesn't have permission
 * <PermissionGuard permissions="view_financial_reports">
 *   <FinancialReport />
 * </PermissionGuard>
 * 
 * @example
 * // Show alternative content for users without permission
 * <PermissionGuard 
 *   permissions={['edit_products', 'delete_products']}
 *   fallback={<Text>View Only</Text>}
 * >
 *   <EditButton />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permissions,
    children,
    fallback = null,
    showAccessDenied = false,
}) => {
    const { hasAnyPermission } = usePermissions();

    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    const hasAccess = hasAnyPermission(permissionArray);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showAccessDenied) {
        return (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
                <MaterialCommunityIcons name="lock" size={32} color="#9ca3af" />
                <Text className="text-gray-500 mt-2 text-center">
                    You don't have permission to view this content
                </Text>
            </View>
        );
    }

    return null;
};

interface RoleGuardProps {
    /** Allowed roles */
    roles: ('ADMIN' | 'MANAGER' | 'STAFF')[];
    /** Content to render if role matches */
    children: React.ReactNode;
    /** Content to render if role doesn't match */
    fallback?: React.ReactNode;
}

/**
 * RoleGuard - Conditionally renders content based on user role
 * 
 * @example
 * <RoleGuard roles={['ADMIN', 'MANAGER']}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    roles,
    children,
    fallback = null,
}) => {
    const { role } = usePermissions();

    if (roles.includes(role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

/**
 * AdminOnly - Shorthand for content only admins can see
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null,
}) => (
    <RoleGuard roles={['ADMIN']} fallback={fallback}>
        {children}
    </RoleGuard>
);

/**
 * ManagerAndAbove - Content for managers and admins
 */
export const ManagerAndAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null,
}) => (
    <RoleGuard roles={['ADMIN', 'MANAGER']} fallback={fallback}>
        {children}
    </RoleGuard>
);

/**
 * StaffOnly - Content specifically for staff (not managers or admins)
 */
export const StaffOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null,
}) => (
    <RoleGuard roles={['STAFF']} fallback={fallback}>
        {children}
    </RoleGuard>
);

export default PermissionGuard;
