import { useState, useEffect } from "react";
import "whatwg-fetch";
import { useLocation } from "react-router-dom";

export interface AuthorizePayload {
  transactionID: string;
  redirectURI: string;
  user: {
    name: string;
  };
  client: {
    name: string;
    logo: string;
  };
}

/**
 * Retrieves authorization info from /oauth2/authorize
 */
export function useOAuth2() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [
    authorizePayload,
    setAuthorizePayload
  ] = useState<AuthorizePayload | null>(null);

  const { REACT_APP_API_ENDPOINT } = process.env;

  const location = useLocation();

  const authorizeUrl = `${REACT_APP_API_ENDPOINT}/oauth2/authorize${location.search}`;

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
  }, []);

  return { loading, error, authorizePayload };
}
