import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthorizePayload } from "./use-oauth2";

/**
 * Retrieves authorization info from /oauth2/authorize
 */
export function useOIDC() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizePayload, setAuthorizePayload] =
    useState<AuthorizePayload | null>(null);

  const { VITE_API_ENDPOINT } = import.meta.env;

  const location = useLocation();

  const authorizeUrl = `${VITE_API_ENDPOINT}/oidc/authorize${location.search}`;

  const fallbackError = "Une erreur est survenue";

  useEffect(() => {
    fetch(authorizeUrl, { credentials: "include" })
      .then(res => {
        res.json().then(data => {
          if (res.status === 200) {
            setAuthorizePayload(data);
            setLoading(false);
          } else {
            if (data.error_description) {
              setError(data.error_description);
              setLoading(false);
            } else {
              setError(fallbackError);
              setLoading(false);
            }
          }
        });
      })
      .catch(_err => {
        setError(fallbackError);
        setLoading(false);
      });
  }, [authorizeUrl]);

  return { loading, error, authorizePayload };
}
