import React, { useContext, useState, useCallback } from "react";
import { UserPermission, UserRole } from "@td/codegen-ui";

interface InterfacePermissions {
  children: React.ReactNode;
  defaultPermissions: UserPermission[];
}

type PermissionsContextType = {
  permissions: UserPermission[];
  role?: UserRole;
  updatePermissions: (
    newPermissions: UserPermission[],
    newRole: UserRole
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

  const updatePermissions = useCallback(
    (newPermissions: UserPermission[], newRole: UserRole) => {
      setPermissions(newPermissions);
      setRole(newRole);
    },
    [setPermissions, setRole]
  );

  return (
    <PermissionsContext.Provider
      value={{ permissions, role, updatePermissions }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}
