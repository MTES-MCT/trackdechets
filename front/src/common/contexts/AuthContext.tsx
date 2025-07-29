import { gql, useQuery } from "@apollo/client";
import { Query } from "@td/codegen-ui";
import React, { useContext, useMemo, useCallback } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  user:
    | {
        id: string;
        email: string;
        isAdmin?: boolean | null;
        trackingConsent: boolean;
        trackingConsentUntil?: string | null;
      }
    | undefined;
  refreshUser: () => Promise<void>;
};

export const IS_AUTHENTICATED = gql`
  query IsAuthenticated {
    isAuthenticated
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      isAdmin
      trackingConsent
      trackingConsentUntil
    }
  }
`;

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { isAuthenticated, user, refreshUser } = context;

  return {
    isAuthenticated,
    user,
    refreshUser
  };
}

export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const { data: authData } = useQuery<Pick<Query, "isAuthenticated">>(
    IS_AUTHENTICATED,
    { fetchPolicy: "network-only" }
  );
  const { data: meData, refetch: refetchMe } = useQuery<Pick<Query, "me">>(
    GET_ME,
    {
      fetchPolicy: "network-only",
      skip: !authData?.isAuthenticated
    }
  );

  const isAuthenticated: boolean = useMemo(() => {
    return authData?.isAuthenticated ?? false;
  }, [authData]);

  const user = useMemo(() => {
    return meData?.me ?? undefined;
  }, [meData]);
  const refreshUser = useCallback(async () => {
    if (isAuthenticated) {
      await refetchMe();
    }
  }, [refetchMe, isAuthenticated]);
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
