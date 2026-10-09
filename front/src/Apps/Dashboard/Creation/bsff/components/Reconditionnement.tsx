import React, { useContext } from "react";
import { BsffType } from "@td/codegen-ui";
import { useFormContext } from "react-hook-form";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ZodBsff } from "../schema";
import { SealedFieldsContext } from "../../context";
import MyBsffCompanySelector from "./MyBsffComapnySelector";
import {
  filterReconditioningCompanies,
  getGroupingPackagings,
  getInitialWaste
} from "../utils/reconditionnement";
import { hasInitialValue } from "../utils/initial-detenteurs";
import ReconditioningContainerPicker from "./ReconditioningContainerPicker";
import { useReconditioningContainers } from "./useReconditioningContainers";
import { MAX_BSFF_COUNT_TABLE_DISPLAY } from "./BsffSelectableWasteTable";

// The editable form may contain historical omissions until Zod validates submission.
type InitialContainersFormValues = Omit<ZodBsff, "packagings"> & {
  packagings?: ReturnType<typeof getGroupingPackagings>;
};

export default function Reconditionnement() {
  const { watch, setValue, getValues } =
    useFormContext<InitialContainersFormValues>();
  const sealed = useContext(SealedFieldsContext);
  const company = watch("emitter.company");
  const id = watch("id");
  const type = watch("type");
  const selectionField =
    type === BsffType.Groupement ? "grouping" : "repackaging";
  const confirmed = watch(selectionField) ?? [];
  const disabled =
    sealed.includes(selectionField) || sealed.includes("packagings");
  const { containers, total, loading, error } = useReconditioningContainers(
    company?.siret,
    id,
    type === BsffType.Groupement
      ? BsffType.Groupement
      : BsffType.Reconditionnement
  );
  return (
    <>
      <h4 className="form__section-heading">
        {selectionField === "grouping"
          ? "Installation de tri, transit, regroupement ou traitement"
          : "Installation de tri, transit, regroupement"}
      </h4>
      <MyBsffCompanySelector
        value={company}
        filter={
          selectionField === "repackaging"
            ? filterReconditioningCompanies
            : undefined
        }
        disabled={
          disabled || Boolean(id) || sealed.includes("emitter.company.siret")
        }
        onChange={nextCompany => {
          if (id) return;
          if (nextCompany.siret !== company?.siret) {
            setValue(selectionField, [], { shouldDirty: true });
            setValue("ficheInterventions", []);
            if (selectionField === "grouping") {
              setValue("packagings", []);
              setValue("weight.value", 0);
              for (const field of ["code", "description", "adr"] as const) {
                if (hasInitialValue(getInitialWaste(confirmed[0])[field]))
                  setValue(`waste.${field}`, "");
              }
            }
          }
          setValue("emitter.company", nextCompany, { shouldDirty: true });
        }}
      />
      <p className="fr-info-text">
        Seuls les établissements avec des contenants en attente de retraitement
        sont éligibles
      </p>
      {loading && <p role="status">Chargement des contenants...</p>}
      {error && (
        <Alert
          severity="error"
          small
          title="Erreur"
          description={error.message}
        />
      )}
      {total > containers.length && (
        <Alert
          severity="warning"
          small
          description={`Seuls les ${MAX_BSFF_COUNT_TABLE_DISPLAY} premiers contenants sont affichés sur ${total}. Les filtres portent sur les contenants affichés.`}
        />
      )}
      <ReconditioningContainerPicker
        key={`${id ?? "new"}-${company?.siret ?? ""}`}
        containers={company?.siret && !loading && !error ? containers : []}
        confirmed={confirmed}
        disabled={disabled || !company?.siret || loading || Boolean(error)}
        onConfirm={selection => {
          if (selectionField === "grouping") {
            // Also populate before visiting Waste, e.g. when saving a draft directly.
            const packagings = getGroupingPackagings(
              selection,
              getValues("packagings") ?? []
            );
            setValue("packagings", packagings);
            setValue(
              "weight.value",
              packagings.reduce(
                (sum, packaging) => sum + (packaging.weight ?? 0),
                0
              )
            );
            const waste = getInitialWaste(selection[0]);
            const previous = getInitialWaste(confirmed[0]);
            for (const field of ["code", "description", "adr"] as const) {
              if (hasInitialValue(waste[field])) {
                setValue(`waste.${field}`, waste[field]);
              } else if (
                !selection.length ||
                hasInitialValue(previous[field])
              ) {
                setValue(`waste.${field}`, "");
              }
            }
          }
          setValue(selectionField, selection, {
            shouldDirty: true,
            shouldValidate: true
          });
        }}
      />
    </>
  );
}
