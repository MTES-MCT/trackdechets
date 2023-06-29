import React, { ReactNode } from "react";
import { gql, useQuery } from "@apollo/client";
import { Query } from "generated/graphql/types";
import Header from "./Header";

import sandboxIcon from "./assets/code-sandbox.svg";
import downtimeIcon from "./assets/code-downtime.svg";

interface AuthProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}
const { VITE_WARNING_MESSAGE, VITE_DOWNTIME_MESSAGE } = import.meta.env;

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
}: AuthProps & {
  children: ReactNode;
}) {
  const { data } = useQuery<Pick<Query, "warningMessage">>(GET_WARNING_MESSAGE);

  const isIE11 = !!navigator.userAgent.match(/Trident.*rv:11\./);

  return (
    <>
      {isIE11 && (
        <div
          className="notification notification--error tw-text-center"
          style={{ borderRadius: 0, border: 0, margin: 0 }}
        >
          Votre navigateur (IE11) ne sera bientôt plus supporté par
          Trackdéchets. Veuillez utiliser un navigateur plus récent.
        </div>
      )}
      {VITE_WARNING_MESSAGE && (
        <div
          className="notification notification--platform tw-text-center"
          style={{ borderRadius: 0, border: 0, margin: 0 }}
        >
          <img src={sandboxIcon} alt="" />
          <div
            dangerouslySetInnerHTML={{ __html: VITE_WARNING_MESSAGE as string }}
          ></div>
        </div>
      )}
      {VITE_DOWNTIME_MESSAGE && (
        <div
          className="notification notification--downtime tw-text-center"
          style={{ borderRadius: 0, border: 0, margin: 0 }}
        >
          <img src={downtimeIcon} alt="" />
          <div
            dangerouslySetInnerHTML={{
              __html: VITE_DOWNTIME_MESSAGE as string,
            }}
          ></div>
        </div>
      )}
      {data?.warningMessage && (
        <div
          className="notification notification--error tw-text-center"
          style={{
            borderRadius: 0,
            border: 0,
            margin: 0,
            backgroundColor: "red",
            color: "white",
            fontWeight: "bold",
          }}
        >
          {data.warningMessage}
        </div>
      )}
      <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      {children}
    </>
  );
}
