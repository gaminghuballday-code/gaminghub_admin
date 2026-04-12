import type { AdminUser } from '@services/api/users.api';
import type { Host } from '@services/api/hostApplications.api';
import type { AdminOrganization } from '@services/api/organizations.api';

/** Mongo user id for DELETE /api/admin/users/:userId — host user row */
export const getHostAccountUserId = (host: Host): string | undefined => {
  const id = host._id ?? host.hostId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
};

/** Org manager / owner user id for org row actions */
export const getOrganizationOwnerUserId = (org: AdminOrganization): string | undefined => {
  const o = org.ownerUserId;
  if (typeof o === 'string' && o.length > 0) {
    return o;
  }
  if (typeof o === 'object' && o !== null && typeof o._id === 'string' && o._id.length > 0) {
    return o._id;
  }
  return undefined;
};

export const getAdminUserId = (user: AdminUser): string | undefined => {
  const id = user.userId ?? user._id;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
};
