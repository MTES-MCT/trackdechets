import React from "react";
import { CompanyPublic } from "../generated/graphql/types";

type Props = Pick<CompanyPublic, "name" | "siret" | "naf" | "libelleNaf">;

export default function CompanyHeader(props: Props) {
  return (
    <div
      className="columns"
      style={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div className="company__info">
        <h3>{`${props.name} (${props.siret})`}</h3>
        <h4>{`${props.naf} - ${props.libelleNaf}`}</h4>
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
