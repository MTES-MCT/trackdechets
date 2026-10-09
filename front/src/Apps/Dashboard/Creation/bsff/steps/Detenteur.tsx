import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BsdType, BsffType } from "@td/codegen-ui";
import { useFormContext } from "react-hook-form";
import { RhfDetenteurList } from "../../../../Forms/Components/DetenteurList/RhfDetenteurList";
import { ZodBsff } from "../schema";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  buildInitialDetenteurs,
  InitialContainer,
  usesInitialDetenteurs
} from "../utils/initial-detenteurs";

const EMPTY: InitialContainer[] = [];

const DetenteurBsff = () => {
  const { siret } = useParams<{ siret: string }>();
  const { watch, setValue, getValues } = useFormContext<ZodBsff>();
  const type = watch("type");
  const containers =
    watch(type === BsffType.Groupement ? "grouping" : "repackaging") ?? EMPTY;
  const holders = watch("ficheInterventions") ?? [];

  useEffect(() => {
    if (!usesInitialDetenteurs(type)) return;
    const next = buildInitialDetenteurs(
      containers,
      getValues("ficheInterventions") ?? []
    );
    setValue("ficheInterventions", next, {
      shouldDirty: !getValues("id"),
      shouldValidate: true
    });
  }, [type, containers, getValues, setValue]);

  return (
    <div className="fr-col-md-10">
      {usesInitialDetenteurs(type) && !holders.length && (
        <Alert
          severity="info"
          small
          description={
            containers.length
              ? "Aucun détenteur n’est associé aux contenants sélectionnés dans les bordereaux initiaux."
              : "Sélectionnez puis ajoutez les contenants dans l’onglet Bordereau pour reprendre leurs détenteurs."
          }
        />
      )}
      <RhfDetenteurList
        orgId={siret}
        fieldName="ficheInterventions"
        bsdType={BsdType.Bsff}
      />
    </div>
  );
};

export default DetenteurBsff;
