import { useState, useEffect } from "react";
import "whatwg-fetch";

export function useAuth() {
  const [loading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const GETisAuthenticated = `${process.env.REACT_APP_API_ENDPOINT}/isAuthenticated`;
    fetch(GETisAuthenticated, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const { isAuthenticated } = data;
        setIsAuthenticated(isAuthenticated);
        setIsLoading(false);
      })
      .catch(_err => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  return { loading, isAuthenticated };
}
