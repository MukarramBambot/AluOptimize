import { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../context/AuthContext';

/**
 * Utility functions for role-based access control
 * These are helper functions that can be used throughout the application
 */

/**
 * Check if a user has a specific role
 * @param {Object} user - User object from AuthContext
 * @param {string} role - Role to check (from USER_ROLES)
 * @returns {boolean}
 */
export const userHasRole = (user, role) => {
  if (!user) return false;
  if (user.is_superuser) return true;
  return user.role === role;
};

/**
 * Check if a user has any of the specified roles
 * @param {Object} user - User object from AuthContext
 * @param {Array<string>} roles - Array of roles to check
 * @returns {boolean}
 */
export const userHasAnyRole = (user, roles) => {
  if (!user) return false;
  if (user.is_superuser) return true;
  return roles.some(role => user.role === role);
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object from AuthContext
 * @param {string} permission - Permission to check (from PERMISSIONS)
 * @returns {boolean}
 */
export const userHasPermission = (user, permission) => {
  if (!user) return false;
  if (user.is_superuser || user.is_staff) return true;
  
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions.includes(permission);
  }
  
  // Default: grant permission to all authenticated users (current behavior)
  return true;
};

/**
 * Get all permissions for a specific role
 * @param {string} role - Role to get permissions for
 * @returns {Array<string>}
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has a specific permission
 * @param {string} role - Role to check
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const roleHasPermission = (role, permission) => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
};

/**
 * Get user's role display name
 * @param {Object} user - User object from AuthContext
 * @returns {string}
 */
export const getUserRoleDisplayName = (user) => {
  if (!user) return 'Guest';
  if (user.is_superuser) return 'Super Admin';
  if (user.is_staff) return 'Staff';
  
  const roleMap = {
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.RESEARCHER]: 'Researcher',
    [USER_ROLES.FACTORY_MANAGER]: 'Factory Manager',
    [USER_ROLES.OPERATOR]: 'Operator',
    [USER_ROLES.ANALYST]: 'Analyst'
  };
  
  return roleMap[user.role] || 'User';
};

/**
 * Example usage in components:
 * 
 * import { userHasPermission, userHasRole } from '../utils/roleHelpers';
 * import { PERMISSIONS, USER_ROLES } from '../context/AuthContext';
 * 
 * // In component:
 * const { user } = useContext(AuthContext);
 * 
 * if (userHasPermission(user, PERMISSIONS.MANAGE_USERS)) {
 *   // Show admin panel
 * }
 * 
 * if (userHasRole(user, USER_ROLES.FACTORY_MANAGER)) {
 *   // Show factory manager specific features
 * }
 */

export { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS };
