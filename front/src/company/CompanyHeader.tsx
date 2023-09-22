import React from "react";
import { CompanySearchResult } from "codegen-ui";

type Props = Pick<CompanySearchResult, "name" | "siret" | "naf" | "libelleNaf">;

export default function CompanyHeader(props: Props) {
  return (
    <div
      className="columns"
      style={{
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div className="company__info">
        <h3>{`${props.name} (${props.siret})`}</h3>
        {props.naf && <h4>{`${props.naf} - ${props.libelleNaf}`}</h4>}
      </div>
      <div>
        <img
          className="company__logo"
          src="/logo-placeholder.png"
          alt="logo-placeholder"
        ></img>
      </div>
    </div>
  );
}
