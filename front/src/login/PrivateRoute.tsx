import React from "react";
import { Route, Redirect, RouteProps } from "react-router";

interface IProps {
  component: React.ComponentType<any>;
}

interface AuthProps {
  isAuthenticated: boolean;
}

export default function PrivateRoute({
  component: Component,
  isAuthenticated,
  ...rest
}: IProps & AuthProps & RouteProps): any {
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}
