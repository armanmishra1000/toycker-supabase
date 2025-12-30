/**
 * Permission system utilities for RBAC
 */

export const PERMISSIONS = {
    // Orders
    ORDERS_READ: 'orders:read',
    ORDERS_UPDATE: 'orders:update',
    ORDERS_DELETE: 'orders:delete',
    // Products  
    PRODUCTS_READ: 'products:read',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_UPDATE: 'products:update',
    PRODUCTS_DELETE: 'products:delete',
    // Inventory
    INVENTORY_READ: 'inventory:read',
    INVENTORY_UPDATE: 'inventory:update',
    // Customers
    CUSTOMERS_READ: 'customers:read',
    CUSTOMERS_UPDATE: 'customers:update',
    // Team
    TEAM_MANAGE: 'team:manage',
    // Settings
    SETTINGS_READ: 'settings:read',
    SETTINGS_UPDATE: 'settings:update',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if user has a specific permission
 * Supports wildcard permissions like "orders:*" and full access "*"
 */
export function hasPermission(
    userPermissions: string[],
    required: Permission
): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;

    // Full access wildcard
    if (userPermissions.includes('*')) return true;

    // Direct match
    if (userPermissions.includes(required)) return true;

    // Category wildcard match (e.g., "orders:*" matches "orders:read")
    const [category] = required.split(':');
    const categoryWildcard = `${category}:*`;
    if (userPermissions.includes(categoryWildcard)) return true;

    return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
    userPermissions: string[],
    required: Permission[]
): boolean {
    return required.some(perm => hasPermission(userPermissions, perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
    userPermissions: string[],
    required: Permission[]
): boolean {
    return required.every(perm => hasPermission(userPermissions, perm));
}

/**
 * Get human-readable label for a permission
 */
export function getPermissionLabel(permission: string): string {
    const labels: Record<string, string> = {
        '*': 'Full Access',
        'orders:*': 'Orders (Full)',
        'orders:read': 'View Orders',
        'orders:update': 'Update Orders',
        'orders:delete': 'Delete Orders',
        'products:*': 'Products (Full)',
        'products:read': 'View Products',
        'products:create': 'Create Products',
        'products:update': 'Update Products',
        'products:delete': 'Delete Products',
        'inventory:*': 'Inventory (Full)',
        'inventory:read': 'View Inventory',
        'inventory:update': 'Update Inventory',
        'customers:read': 'View Customers',
        'customers:update': 'Update Customers',
        'team:manage': 'Manage Team',
        'settings:read': 'View Settings',
        'settings:update': 'Update Settings',
    };
    return labels[permission] || permission;
}
