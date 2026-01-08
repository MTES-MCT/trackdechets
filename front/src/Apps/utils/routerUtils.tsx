import React, { useEffect } from "react";
import {
  Navigate,
  generatePath,
  useLocation,
  useParams
} from "react-router-dom";
import * as Sentry from "@sentry/browser";
import Loader from "../common/Components/Loader/Loaders";
import routes from "../routes";
import { useAuth } from "../../common/contexts/AuthContext";
import { envConfig } from "../../common/envConfig";

export function RequireAuth({
  children,
  needsAdminPrivilege = false,
  replace = false
}) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (envConfig.VITE_SENTRY_DSN && user?.email) {
      Sentry.setUser({ email: user.email });
    }
  }, [user?.email]);

  const isAdmin = isAuthenticated && Boolean(user?.isAdmin);

  if (isAuthenticated && !user) {
    return <Loader />;
  }

  if (needsAdminPrivilege && !isAdmin) {
    return <div>Vous n'êtes pas autorisé à consulter cette page</div>;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate
      to={routes.login}
      state={{ returnTo: location.pathname + location.search }}
      replace={replace}
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
