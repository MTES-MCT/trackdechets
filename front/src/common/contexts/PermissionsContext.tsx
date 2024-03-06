import React, { useContext, useState, useCallback, useMemo } from "react";
import { UserPermission, UserRole } from "@td/codegen-ui";

interface InterfacePermissions {
  children: React.ReactNode;
  defaultPermissions: UserPermission[];
}

type PermissionsContextType = {
  permissions: UserPermission[];
  role?: UserRole;
  orgId?: string;
  updatePermissions: (
    newPermissions: UserPermission[],
    newRole: UserRole,
    orgId: string
  ) => void;
};

const PermissionsContext = React.createContext<PermissionsContextType | null>(
  null
);

export function usePermissions() {
  return useContext(PermissionsContext) as PermissionsContextType;
}

export function PermissionsProvider({
  children,
  defaultPermissions = []
}: InterfacePermissions) {
  const [permissions, setPermissions] =
    useState<UserPermission[]>(defaultPermissions);
  const [role, setRole] = useState<UserRole>();
  const [orgId, setOrgId] = useState<string>();

  const updatePermissions = useCallback(
    (newPermissions: UserPermission[], newRole: UserRole, orgId: string) => {
      setPermissions(newPermissions);
      setRole(newRole);
      setOrgId(orgId);
    },
    [setPermissions, setRole, setOrgId]
  );

  const permissionsObject = useMemo(() => {
    return { permissions, role, orgId, updatePermissions };
  }, [permissions, role, orgId, updatePermissions]);

  return (
    <PermissionsContext.Provider value={permissionsObject}>
      {children}
    </PermissionsContext.Provider>
  );
}
