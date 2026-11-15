// Who may open the admin area.
//  - main admin: isAdmin, full access
//  - store owner (sub-admin): isSubAdmin, only their own store
export const isMainAdmin = user => Boolean(user?.isAdmin);
export const isStoreOwner = user => Boolean(user?.isSubAdmin) && !user?.isAdmin;
export const isStaff = user => isMainAdmin(user) || isStoreOwner(user);
