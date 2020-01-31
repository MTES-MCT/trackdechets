import React, { ReactNode } from "react";
import Header from "./Header";

interface AuthProps {
  isAuthenticated: boolean;
}

/**
 * Layout with common elements to all routes
 */
export default function Layout({
  children,
  isAuthenticated
}: AuthProps & { children: ReactNode }) {
  return (
    <>
      <Header isAuthenticated={isAuthenticated} />
      {children}
    </>
  );
}
