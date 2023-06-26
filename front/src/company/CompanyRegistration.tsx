import React from "react";
import { CompanySearchResult } from "generated/graphql/types";
import routes from "Apps/routes";
import { COMPANY_CONSTANTS } from "login/CompanyType";

type Props = Pick<
  CompanySearchResult,
  "isRegistered" | "companyTypes" | "etatAdministratif"
>;

export default function CompanyRegistration(props: Props) {
  return (
    <div className="rows">
      <div
        className={`notification ${
          props.isRegistered ? "notification--success" : "notification--error"
        }`}
        style={{ width: "100%" }}
      >
        {props.isRegistered ? (
          <>
            <span>
              Cette entreprise est inscrite sur Trackdéchets en tant que:
            </span>
            <ul className="tw-list-disc tw-list-inside">
              {props.companyTypes?.map((companyType, idx) => (
                <li key={idx}>
                  {COMPANY_CONSTANTS.find(t => t.value === companyType)?.label}
                </li>
              ))}
            </ul>
          </>
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
      {props.etatAdministratif?.toUpperCase() === "F" && (
        <div
          className={`notification notification--error`}
          style={{ width: "100%" }}
        >
          <span>Cet établissement est fermé selon l'INSEE</span>
        </div>
      )}
    </div>
  );
}
