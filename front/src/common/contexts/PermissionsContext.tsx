import React, { PropsWithChildren, useContext, useMemo } from "react";
import { Query, UserPermission, UserRole } from "@td/codegen-ui";
import { gql, useQuery } from "@apollo/client";
import { useAuth } from "./AuthContext";
import { getDefaultOrgId } from "../../Apps/common/Components/CompanySwitcher/CompanySwitcher";

type OrgPermissions = {
  orgId: string | undefined;
  role: UserRole | undefined;
  permissions: UserPermission[];
};

type PermissionsInfos = {
  orgPermissionsInfos: OrgPermissions[];
  roles: UserRole[];
  permissions: UserPermission[];
};

type PermissionsContextType = {
  permissionsInfos: PermissionsInfos;
  orgIds: string[];
  defaultOrgId: string | undefined;
};

const PERMISSIONS_INFOS = gql`
  query PermissionsInfos {
    permissionsInfos {
      orgPermissionsInfos {
        orgId
        role
        permissions
      }
      roles
      permissions
    }
  }
`;

export const PermissionsContext =
  React.createContext<PermissionsContextType | null>(null);

export function usePermissions(orgId?: string) {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }

  const { permissionsInfos, orgIds, defaultOrgId } = context;

  const orgPermissions = permissionsInfos?.orgPermissionsInfos?.find(
    infos => infos.orgId === orgId
  ) ?? {
    orgId,
    role: UserRole.Reader,
    permissions: []
  };

  return {
    permissionsInfos,
    orgPermissions,
    orgIds,
    defaultOrgId
  };
}

export function PermissionsProvider({
  children
}: PropsWithChildren<{ defaultPermissions: UserPermission[] }>) {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<Pick<Query, "permissionsInfos">>(
    PERMISSIONS_INFOS,
    { skip: !isAuthenticated }
  );

  const permissionsInfos: PermissionsInfos = useMemo(() => {
    return (
      data?.permissionsInfos ?? {
        orgPermissionsInfos: [],
        roles: [],
        permissions: []
      }
    );
  }, [data]);

  const orgIds = useMemo(() => {
    return permissionsInfos.orgPermissionsInfos
      .map(infos => infos.orgId)
      .filter(Boolean) as string[];
  }, [permissionsInfos.orgPermissionsInfos]);

  const defaultOrgId = useMemo(() => {
    return getDefaultOrgId(orgIds);
  }, [orgIds]);

  return (
    <PermissionsContext.Provider
      value={{ permissionsInfos, orgIds, defaultOrgId }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}
