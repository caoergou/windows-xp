import type { AppRole, AppRoleMap } from './contract';

export const appRoleRef = (role: AppRole): `role:${AppRole}` => `role:${role}`;

export function resolveAppRole(
  appOrRole: string,
  roles: Partial<AppRoleMap> | undefined
): string | undefined {
  if (!appOrRole.startsWith('role:')) return appOrRole;
  const role = appOrRole.slice(5) as AppRole;
  return roles?.[role];
}
