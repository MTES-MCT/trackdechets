import type { QueryResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getUserRoles,
  grants,
  toGraphQLPermission
} from "../../../permissions";

const permissionsInfos: QueryResolvers["permissionsInfos"] = async (
  _parent,
  _args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const userRoles = await getUserRoles(user.id);
  const orgIds = Object.keys(userRoles);
  const roles = Object.values(userRoles);
  const permissions = roles.flatMap(role => grants[role]);

  const uniquePermissions = Array.from(
    new Set(permissions.map(permission => toGraphQLPermission(permission)))
  );
  const uniqueRoles = Array.from(new Set(roles));

  const orgPermissionsInfos = orgIds.map(orgId => ({
    orgId,
    role: userRoles[orgId],
    permissions: grants[userRoles[orgId]].map(permission =>
      toGraphQLPermission(permission)
    )
  }));

  return {
    orgPermissionsInfos,
    permissions: uniquePermissions,
    roles: uniqueRoles
  };
};

export default permissionsInfos;
