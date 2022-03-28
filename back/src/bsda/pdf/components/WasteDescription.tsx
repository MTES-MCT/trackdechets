import * as React from "react";
import { BsdaWaste } from "../../../generated/graphql/types";

type Props = {
  waste?: BsdaWaste;
};

export function WasteDescription({ waste }: Props) {
  return (
    <>
      <p>
        Code déchet : {waste?.code}
        <br />
        Dénomination : {waste?.name}
        <br />
        Code famille : {waste?.familyCode}
        <br />
        Nom du matériau : {waste?.materialName}
      </p>
    </>
  );
}
