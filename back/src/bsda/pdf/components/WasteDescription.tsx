import * as React from "react";
import { BsdaWaste } from "@td/codegen-back";

type Props = {
  waste?: BsdaWaste | null;
};

export function WasteDescription({ waste }: Props) {
  return (
    <>
      <p>
        Code déchet : {waste?.code}
        <br />
        Code famille : {waste?.familyCode}
        <br />
        Nom usuel du matériau : {waste?.materialName}
        <br />
        Présence de POP : {waste?.pop ? "Oui" : "Non"}
      </p>
    </>
  );
}
