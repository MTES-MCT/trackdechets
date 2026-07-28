import React, { useEffect, lazy, Suspense } from "react";
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

const ForcedMfaReconfigurationModal = lazy(
  () => import("../../login/ForcedMfaReconfigurationModal")
);

export function RequireAuth({
  children,
  needsAdminPrivilege = false,
  replace = false
}) {
  const location = useLocation();
  const { isAuthenticated, user, refreshUser } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <Navigate
        to={routes.login}
        state={{ returnTo: location.pathname + location.search }}
        replace={replace}
      />
    );
  }

  // L'utilisateur est connecté mais doit reconfigurer sa MFA avant d'accéder
  // à la plateforme. On affiche le wizard bloquant quelle que soit l'URL.
  if (user?.mustReconfigureMfa) {
    return (
      <Suspense fallback={<Loader />}>
        <ForcedMfaReconfigurationModal onComplete={refreshUser} />
      </Suspense>
    );
  }

  return children;
}

export function Redirect({ path }) {
  const { siret, id } = useParams();

  const params = {
    ...(siret && { siret: siret }),
    ...(id && { id: id })
  };

  return <Navigate to={generatePath(path, params)} replace />;
}
