import * as React from "react";
import type { BsdaPickupSite } from "@td/codegen-back";
import { isDefinedStrict } from "../../../common/helpers";

type Props = {
  pickupSite?: BsdaPickupSite | null;
};

export function PickupSite({ pickupSite }: Props) {
  return (
    <>
      <p>
        <strong>Informations chantier (si différente)</strong>
      </p>
      <p>
        Nom du chantier / collecte : {pickupSite?.name}
        <br />
        Adresse chantier / collecte : {pickupSite?.address}{" "}
        {pickupSite?.postalCode} {pickupSite?.city}
        <br />
        {isDefinedStrict(pickupSite?.infos) && (
          <>
            Informations complémentaires : {pickupSite?.infos}
            <br />
          </>
        )}
      </p>
    </>
  );
}
