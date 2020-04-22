import React from "react";
import { Route, Redirect, RouteProps, useLocation } from "react-router";

interface IProps {
  component: React.ComponentType<any>;
}

interface AuthProps {
  isAuthenticated: boolean;
}

export default function PrivateRoute({
  component: Component,
  isAuthenticated,
  ...routerProps
}: IProps & AuthProps & RouteProps): any {
  const location = useLocation();

  return (
    <Route
      {...routerProps}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { returnTo: location.pathname + location.search },
            }}
          />
        )
      }
    />
  );
}
