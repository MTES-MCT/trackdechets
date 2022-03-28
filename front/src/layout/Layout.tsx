import React, { ReactNode } from "react";
import { gql, useQuery } from "@apollo/client";
import { Query } from "generated/graphql/types";
import Header from "./Header";

interface AuthProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}
const { VITE_WARNING_MESSAGE } = import.meta.env;

const GET_WARNING_MESSAGE = gql`
  query GetWarningMessage {
    warningMessage
  }
`;

/**
 * Layout with common elements to all routes
 */
export default function Layout({
  children,
  isAuthenticated,
  isAdmin,
}: AuthProps & { children: ReactNode }) {
  const { data } = useQuery<Pick<Query, "warningMessage">>(GET_WARNING_MESSAGE);
  const messages = [VITE_WARNING_MESSAGE, data?.warningMessage].filter(
    Boolean
  ) as string[];

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          className="notification notification--error tw-text-center"
          style={{ borderRadius: 0, border: 0, margin: 0 }}
        >
          {message}
        </div>
      ))}
      <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      {children}
    </>
  );
}
