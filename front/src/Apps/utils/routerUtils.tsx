import React from "react";
import {
  Navigate,
  generatePath,
  useLocation,
  useParams
} from "react-router-dom";
import routes from "../routes";

export function RequireAuth({ children, isAuthenticated }) {
  const location = useLocation();
  return isAuthenticated ? (
    children
  ) : (
    <Navigate
      to={routes.login}
      state={{ returnTo: location.pathname + location.search }}
    />
  );
}

export function Redirect({ path }) {
  const { siret, id } = useParams();

  const params = {
    ...(siret && { siret: siret }),
    ...(id && { id: id })
  };

  return <Navigate to={generatePath(path, params)} replace />;
}
