import routes from "Apps/routes";
import React from "react";
import { Route, Redirect, RouteProps, useLocation } from "react-router-dom";

interface AuthProps {
  isAuthenticated: boolean;
}

export default function PrivateRoute({
  children,
  isAuthenticated,
  ...routerProps
}: AuthProps & RouteProps): any {
  const location = useLocation();

  return (
    <Route {...routerProps}>
      {isAuthenticated ? (
        children
      ) : (
        <Redirect
          to={{
            pathname: routes.login,
            state: { returnTo: location.pathname + location.search },
          }}
        />
      )}
    </Route>
  );
}
