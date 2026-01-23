/**
 * Complete permission system for RBAC
 * Each permission follows the pattern: resource:action
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
    CUSTOMERS_DELETE: 'customers:delete',

    // Collections
    COLLECTIONS_READ: 'collections:read',
    COLLECTIONS_CREATE: 'collections:create',
    COLLECTIONS_UPDATE: 'collections:update',
    COLLECTIONS_DELETE: 'collections:delete',

    // Categories
    CATEGORIES_READ: 'categories:read',
    CATEGORIES_CREATE: 'categories:create',
    CATEGORIES_UPDATE: 'categories:update',
    CATEGORIES_DELETE: 'categories:delete',

    // Discounts
    DISCOUNTS_READ: 'discounts:read',
    DISCOUNTS_CREATE: 'discounts:create',
    DISCOUNTS_UPDATE: 'discounts:update',
    DISCOUNTS_DELETE: 'discounts:delete',

    // Shipping
    SHIPPING_READ: 'shipping:read',
    SHIPPING_CREATE: 'shipping:create',
    SHIPPING_UPDATE: 'shipping:update',
    SHIPPING_DELETE: 'shipping:delete',

    // Shipping Partners
    SHIPPING_PARTNERS_READ: 'shipping_partners:read',
    SHIPPING_PARTNERS_CREATE: 'shipping_partners:create',
    SHIPPING_PARTNERS_UPDATE: 'shipping_partners:update',
    SHIPPING_PARTNERS_DELETE: 'shipping_partners:delete',

    // Payments
    PAYMENTS_READ: 'payments:read',
    PAYMENTS_CREATE: 'payments:create',
    PAYMENTS_UPDATE: 'payments:update',
    PAYMENTS_DELETE: 'payments:delete',

    // Reviews
    REVIEWS_READ: 'reviews:read',
    REVIEWS_UPDATE: 'reviews:update',
    REVIEWS_DELETE: 'reviews:delete',

    // Home Settings
    HOME_SETTINGS_READ: 'home_settings:read',
    HOME_SETTINGS_UPDATE: 'home_settings:update',

    // Club Settings
    CLUB_SETTINGS_READ: 'club_settings:read',
    CLUB_SETTINGS_UPDATE: 'club_settings:update',

    // Team
    TEAM_MANAGE: 'team:manage',

    // Settings
    SETTINGS_READ: 'settings:read',
    SETTINGS_UPDATE: 'settings:update',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permission groups for UI display in role management
 */
export const PERMISSION_GROUPS = {
    Orders: [
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.ORDERS_UPDATE,
        PERMISSIONS.ORDERS_DELETE,
    ],
    Products: [
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.PRODUCTS_UPDATE,
        PERMISSIONS.PRODUCTS_DELETE,
    ],
    Inventory: [
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_UPDATE,
    ],
    Customers: [
        PERMISSIONS.CUSTOMERS_READ,
        PERMISSIONS.CUSTOMERS_UPDATE,
        PERMISSIONS.CUSTOMERS_DELETE,
    ],
    Collections: [
        PERMISSIONS.COLLECTIONS_READ,
        PERMISSIONS.COLLECTIONS_CREATE,
        PERMISSIONS.COLLECTIONS_UPDATE,
        PERMISSIONS.COLLECTIONS_DELETE,
    ],
    Categories: [
        PERMISSIONS.CATEGORIES_READ,
        PERMISSIONS.CATEGORIES_CREATE,
        PERMISSIONS.CATEGORIES_UPDATE,
        PERMISSIONS.CATEGORIES_DELETE,
    ],
    Discounts: [
        PERMISSIONS.DISCOUNTS_READ,
        PERMISSIONS.DISCOUNTS_CREATE,
        PERMISSIONS.DISCOUNTS_UPDATE,
        PERMISSIONS.DISCOUNTS_DELETE,
    ],
    Shipping: [
        PERMISSIONS.SHIPPING_READ,
        PERMISSIONS.SHIPPING_CREATE,
        PERMISSIONS.SHIPPING_UPDATE,
        PERMISSIONS.SHIPPING_DELETE,
    ],
    'Shipping Partners': [
        PERMISSIONS.SHIPPING_PARTNERS_READ,
        PERMISSIONS.SHIPPING_PARTNERS_CREATE,
        PERMISSIONS.SHIPPING_PARTNERS_UPDATE,
        PERMISSIONS.SHIPPING_PARTNERS_DELETE,
    ],
    Payments: [
        PERMISSIONS.PAYMENTS_READ,
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_UPDATE,
        PERMISSIONS.PAYMENTS_DELETE,
    ],
    Reviews: [
        PERMISSIONS.REVIEWS_READ,
        PERMISSIONS.REVIEWS_UPDATE,
        PERMISSIONS.REVIEWS_DELETE,
    ],
    'Home Settings': [
        PERMISSIONS.HOME_SETTINGS_READ,
        PERMISSIONS.HOME_SETTINGS_UPDATE,
    ],
    'Club Settings': [
        PERMISSIONS.CLUB_SETTINGS_READ,
        PERMISSIONS.CLUB_SETTINGS_UPDATE,
    ],
    Team: [PERMISSIONS.TEAM_MANAGE],
    Settings: [
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_UPDATE,
    ],
} as const;

/**
 * Check if user has a specific permission
 * Supports wildcard permissions: '*' and 'resource:*'
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
        // Special
        '*': 'Full Access',

        // Orders
        'orders:*': 'Orders (Full)',
        'orders:read': 'View Orders',
        'orders:update': 'Update Orders',
        'orders:delete': 'Delete Orders',

        // Products
        'products:*': 'Products (Full)',
        'products:read': 'View Products',
        'products:create': 'Create Products',
        'products:update': 'Update Products',
        'products:delete': 'Delete Products',

        // Inventory
        'inventory:*': 'Inventory (Full)',
        'inventory:read': 'View Inventory',
        'inventory:update': 'Update Inventory',

        // Customers
        'customers:*': 'Customers (Full)',
        'customers:read': 'View Customers',
        'customers:update': 'Update Customers',
        'customers:delete': 'Delete Customers',

        // Collections
        'collections:*': 'Collections (Full)',
        'collections:read': 'View Collections',
        'collections:create': 'Create Collections',
        'collections:update': 'Update Collections',
        'collections:delete': 'Delete Collections',

        // Categories
        'categories:*': 'Categories (Full)',
        'categories:read': 'View Categories',
        'categories:create': 'Create Categories',
        'categories:update': 'Update Categories',
        'categories:delete': 'Delete Categories',

        // Discounts
        'discounts:*': 'Discounts (Full)',
        'discounts:read': 'View Discounts',
        'discounts:create': 'Create Discounts',
        'discounts:update': 'Update Discounts',
        'discounts:delete': 'Delete Discounts',

        // Shipping
        'shipping:*': 'Shipping (Full)',
        'shipping:read': 'View Shipping',
        'shipping:create': 'Create Shipping',
        'shipping:update': 'Update Shipping',
        'shipping:delete': 'Delete Shipping',

        // Shipping Partners
        'shipping_partners:*': 'Shipping Partners (Full)',
        'shipping_partners:read': 'View Shipping Partners',
        'shipping_partners:create': 'Create Shipping Partners',
        'shipping_partners:update': 'Update Shipping Partners',
        'shipping_partners:delete': 'Delete Shipping Partners',

        // Payments
        'payments:*': 'Payments (Full)',
        'payments:read': 'View Payments',
        'payments:create': 'Create Payments',
        'payments:update': 'Update Payments',
        'payments:delete': 'Delete Payments',

        // Reviews
        'reviews:*': 'Reviews (Full)',
        'reviews:read': 'View Reviews',
        'reviews:update': 'Update Reviews',
        'reviews:delete': 'Delete Reviews',

        // Home Settings
        'home_settings:read': 'View Home Settings',
        'home_settings:update': 'Update Home Settings',

        // Club Settings
        'club_settings:read': 'View Club Settings',
        'club_settings:update': 'Update Club Settings',

        // Team
        'team:manage': 'Manage Team',

        // Settings
        'settings:read': 'View Settings',
        'settings:update': 'Update Settings',
    };

    return labels[permission] || permission;
}

/**
 * Get detailed description explaining what a permission allows
 */
export function getPermissionDescription(permission: string): string {
    const descriptions: Record<string, string> = {
        // Orders
        'orders:read': 'View order details, customer information, and order history',
        'orders:update': 'Accept orders, mark as delivered, cancel orders, and update order status',
        'orders:delete': 'Permanently delete orders from the system',

        // Products
        'products:read': 'View product listings, details, pricing, and inventory status',
        'products:create': 'Add new products to the catalog with images and details',
        'products:update': 'Edit product information, pricing, images, and availability',
        'products:delete': 'Remove products from the catalog permanently',

        // Inventory
        'inventory:read': 'View stock levels and inventory tracking information',
        'inventory:update': 'Adjust stock quantities and manage inventory levels',

        // Customers
        'customers:read': 'View customer profiles, contact information, and order history',
        'customers:update': 'Edit customer details and account information',
        'customers:delete': 'Permanently remove customer accounts and data',

        // Collections
        'collections:read': 'View product collections and groupings',
        'collections:create': 'Create new product collections to organize the catalog',
        'collections:update': 'Edit collection names, products, and settings',
        'collections:delete': 'Remove collections from the store',

        // Categories
        'categories:read': 'View product categories and organization structure',
        'categories:create': 'Add new categories to organize products',
        'categories:update': 'Edit category names and hierarchies',
        'categories:delete': 'Remove categories from the system',

        // Discounts
        'discounts:read': 'View active promotions, discount codes, and pricing rules',
        'discounts:create': 'Create new discount codes and promotional offers',
        'discounts:update': 'Modify existing discounts and promotion settings',
        'discounts:delete': 'Remove discount codes and end promotions',

        // Shipping
        'shipping:read': 'View shipping methods, zones, and delivery rates',
        'shipping:create': 'Add new shipping options and delivery methods',
        'shipping:update': 'Modify shipping rates, zones, and delivery settings',
        'shipping:delete': 'Remove shipping methods and delivery options',

        // Shipping Partners
        'shipping_partners:read': 'View courier services and logistics partners',
        'shipping_partners:create': 'Add new shipping partners and courier services',
        'shipping_partners:update': 'Update partner details and service configurations',
        'shipping_partners:delete': 'Remove shipping partners from the system',

        // Payments
        'payments:read': 'View payment transactions, methods, and financial records',
        'payments:create': 'Process payments and record transactions',
        'payments:update': 'Modify payment status and transaction details',
        'payments:delete': 'Remove payment records (use with caution)',

        // Reviews
        'reviews:read': 'View customer reviews and product ratings',
        'reviews:update': 'Moderate reviews, approve or hide feedback',
        'reviews:delete': 'Permanently remove customer reviews',

        // Home Settings
        'home_settings:read': 'View homepage banners, featured collections, and layout',
        'home_settings:update': 'Edit homepage content, banners, and featured sections',

        // Club Settings
        'club_settings:read': 'View membership pricing, benefits, and club configurations',
        'club_settings:update': 'Modify club membership settings and pricing tiers',

        // Team
        'team:manage': 'Invite team members, assign roles, and manage staff permissions',

        // Settings
        'settings:read': 'View store configuration and system settings',
        'settings:update': 'Modify store settings, branding, and configurations',
    };

    return descriptions[permission] || 'Manage ' + permission.replace(/:/g, ' - ');
}
