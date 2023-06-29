import React, { useContext, useState, useCallback } from "react";
import { UserPermission } from "generated/graphql/types";

interface InterfacePermissions {
  children: React.ReactNode;
  defaultPermissions: UserPermission[];
}

type PermissionsContextType = {
  permissions: UserPermission[];
  updatePermissions: (newPermissions: UserPermission[]) => void;
};

const PermissionsContext = React.createContext<PermissionsContextType | null>(
  null
);

export function usePermissions() {
  return useContext(PermissionsContext) as PermissionsContextType;
}

export function PermissionsProvider({
  children,
  defaultPermissions,
}: InterfacePermissions) {
  const [permissions, setPermissions] =
    useState<UserPermission[]>(defaultPermissions);

  const updatePermissions = useCallback(
    (newPermissions: UserPermission[]) => {
      setPermissions(newPermissions);
    },
    [setPermissions]
  );

  return (
    <PermissionsContext.Provider value={{ permissions, updatePermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}
