import React from "react";
import { CompanyPublic } from "generated/graphql/types";
import routes from "common/routes";

type Props = Pick<CompanyPublic, "isRegistered">;

export default function CompanyRegistration(props: Props) {
  return (
    <div className="columns">
      <div
        className={`notification ${props.isRegistered ? "success" : "warning"}`}
        style={{ width: "100%" }}
      >
        {props.isRegistered ? (
          <span>Cette entreprise est inscrite sur Trackdéchets</span>
        ) : (
          <>
            <span>
              Cette entreprise n'est pas encore inscrite sur Trackdéchets
            </span>
            <br />
            <span style={{ fontStyle: "italic" }}>
              Il s'agit de votre entreprise ? Mettez à jour vos informations en{" "}
              <a href={routes.signup.index}>vous inscrivant</a>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
