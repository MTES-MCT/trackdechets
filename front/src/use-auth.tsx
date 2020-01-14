import { useState, useEffect } from "react";
import axios from "axios";

export function useAuth() {
  const [loading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_ENDPOINT}/isAuthenticated`, {
        withCredentials: true
      })
      .then(response => {
        setIsAuthenticated(response.data.isAuthenticated);
        setIsLoading(false);
      })
      .catch(_ => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  return { loading, isAuthenticated };
}
