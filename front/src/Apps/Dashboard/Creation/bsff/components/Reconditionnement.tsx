import React, { useContext } from "react";
import { useFormContext } from "react-hook-form";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ZodBsff } from "../schema";
import { SealedFieldsContext } from "../../context";
import MyBsffCompanySelector from "./MyBsffComapnySelector";
import { filterReconditioningCompanies } from "../utils/reconditionnement";
import ReconditioningContainerPicker from "./ReconditioningContainerPicker";
import { useReconditioningContainers } from "./useReconditioningContainers";
import { MAX_BSFF_COUNT_TABLE_DISPLAY } from "./BsffSelectableWasteTable";

export default function Reconditionnement() {
  const { watch, setValue } = useFormContext<ZodBsff>();
  const sealed = useContext(SealedFieldsContext);
  const company = watch("emitter.company");
  const id = watch("id");
  const confirmed = watch("repackaging") ?? [];
  const disabled =
    sealed.includes("repackaging") || sealed.includes("packagings");
  const { containers, total, loading, error } = useReconditioningContainers(
    company?.siret,
    id
  );
  return (
    <>
      <h4 className="form__section-heading">
        Installation de tri, transit, regroupement
      </h4>
      <MyBsffCompanySelector
        value={company}
        filter={filterReconditioningCompanies}
        disabled={
          disabled || Boolean(id) || sealed.includes("emitter.company.siret")
        }
        onChange={nextCompany => {
          if (id) return;
          if (nextCompany.siret !== company?.siret) {
            setValue("repackaging", [], { shouldDirty: true });
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
        onConfirm={selection =>
          setValue("repackaging", selection, {
            shouldDirty: true,
            shouldValidate: true
          })
        }
      />
    </>
  );
}
