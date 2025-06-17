import { gql, useQuery } from "@apollo/client";
import { Query } from "@td/codegen-ui";
import React, { useContext, useMemo } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  user: { id: string; email: string; isAdmin?: boolean | null } | undefined;
};

const IS_AUTHENTICATED = gql`
  query IsAuthenticated {
    isAuthenticated
  }
`;

const GET_ME = gql`
  query Me {
    me {
      id
      email
      isAdmin
    }
  }
`;

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { isAuthenticated, user } = context;

  return {
    isAuthenticated,
    user
  };
}

export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const { data: authData } = useQuery<Pick<Query, "isAuthenticated">>(
    IS_AUTHENTICATED,
    { fetchPolicy: "network-only" }
  );
  const { data: meData } = useQuery<Pick<Query, "me">>(GET_ME, {
    fetchPolicy: "network-only",
    skip: !authData?.isAuthenticated
  });

  const isAuthenticated: boolean = useMemo(() => {
    return authData?.isAuthenticated ?? false;
  }, [authData]);

  const user = useMemo(() => {
    return meData?.me ?? undefined;
  }, [meData]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
