import React, { ReactNode } from "react";
import Header from "./Header";

interface AuthProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}
const { REACT_APP_WARNING_MESSAGE } = process.env;

/**
 * Layout with common elements to all routes
 */
export default function Layout({
  children,
  isAuthenticated,
  isAdmin,
}: AuthProps & { children: ReactNode }) {
  return (
    <>
      {!!REACT_APP_WARNING_MESSAGE && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            padding: "10px",
            fontWeight: "bold",
            color: "#721c24",
          }}
          className="tw-text-center"
        >
          {REACT_APP_WARNING_MESSAGE}
        </div>
      )}
      <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      {children}
    </>
  );
}
