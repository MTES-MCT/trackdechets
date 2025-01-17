import React from "react";
import {
  Navigate,
  generatePath,
  useLocation,
  useParams
} from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import { Query } from "@td/codegen-ui";
import Loader from "../common/Components/Loader/Loaders";
import routes from "../routes";

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      isAdmin
      companies {
        orgId
        siret
        securityCode
      }
      featureFlags
    }
  }
`;

export function RequireAuth({
  children,
  needsAdminPrivilege = false,
  replace = false
}) {
  const location = useLocation();

  const { data, loading } = useQuery<Pick<Query, "me">>(GET_ME, {
    onCompleted: ({ me }) => {
      if (import.meta.env.VITE_SENTRY_DSN && me.email) {
        Sentry.setUser({ email: me.email });
      }
    }
  });

  const isAuthenticated = !loading && data != null;
  const isAdmin = isAuthenticated && Boolean(data?.me?.isAdmin);

  if (loading) {
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
