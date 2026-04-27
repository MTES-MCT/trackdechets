import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { CompanySearchResult, CompanyType, FavoriteType } from "@td/codegen-ui";
import React, { useContext, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError } from "../../utils";
import { OPERATION } from "../utils/constants";

const DestinationBsff = () => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const destination = watch("destination");

  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`destination.company.orgId`);
    register(`destination.company.siret`);
    register(`destination.company.name`);
    register(`destination.company.contact`);
    register(`destination.company.vatNumber`);
    register(`destination.company.address`);
    register(`destination.company.mail`);
    register(`destination.transport.plates`);
  }, [register]);

  const destinationOrgId =
    destination?.company?.orgId ?? destination?.company?.siret ?? null;

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // Le destinatiare doit être inscrit
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets, il ne peut pas être ajouté sur le bordereau.";
      } else if (
        !company.companyTypes?.filter(
          type =>
            type === CompanyType.Collector ||
            type === CompanyType.Wasteprocessor
        ).length
      ) {
        return `L'installation de destination ou d'entreposage ou de reconditionnement avec le SIRET ${company.siret} n'est pas inscrite
          sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc
          pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il
          modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`;
      } else if (formState.errors?.destination?.["company"]?.siret?.message) {
        return formState.errors?.destination?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  return (
    <div className="fr-col-md-10">
      {!!sealedFields.length && <DisabledParagraphStep />}

      <h4 className="fr-h4">Destination ultérieure</h4>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Destination}
        disabled={sealedFields.includes("destination.company.siret")}
        selectedCompanyOrgId={destinationOrgId}
        selectedCompanyError={selectedCompanyError}
        onCompanySelected={company => {
          if (!company) {
            return;
          }
          // [tra-13734] don't override field with api data keep the user data value
          const currentCompany = destination?.company;
          const companyValuesToUse =
            company.siret === currentCompany?.siret ? currentCompany : null;

          const companyData = {
            orgId: company.orgId,
            siret: company.siret,
            vatNumber: company.vatNumber,
            name: companyValuesToUse?.name ?? company.name ?? "",
            address: companyValuesToUse?.address ?? company.address ?? "",
            contact: companyValuesToUse?.contact ?? company.contact ?? "",
            phone: companyValuesToUse?.phone ?? company.contactPhone ?? "",
            mail: companyValuesToUse?.mail ?? company.contactEmail ?? "",
            country: company.codePaysEtrangerEtablissement
          };

          const name = "destination.company";
          if (company.siret !== currentCompany?.siret) {
            clearCompanyError(destination, name, clearErrors);
          }

          setValue(name, companyData);
        }}
      />

      {!destination?.company?.siret &&
        formState.errors?.destination?.["company"]?.siret && (
          <p className="fr-text--sm fr-error-text fr-mb-4v">
            {formState.errors?.destination?.["company"]?.siret?.message}
          </p>
        )}

      <CompanyContactInfo
        fieldName={"destination.company"}
        errorObject={formState.errors?.destination?.["company"]}
        disabled={sealedFields.includes("destination.company")}
        key={destinationOrgId}
      />

      <div className="form__row">
        <Input
          label="CAP (optionnel)"
          nativeInputProps={{
            ...register("destination.cap")
          }}
          state={formState.errors.destination?.["cap"] ? "error" : "default"}
          stateRelatedMessage={formState.errors.destination?.["cap"]?.message}
        />
      </div>

      <div className="form__row">
        <Select
          className="fr-mt-1v fr-mb-1v"
          label="Opération d'élimination / valorisation prévue (code D/R)"
          state={
            formState.errors.destination?.["plannedOperationCode"]
              ? "error"
              : "default"
          }
          stateRelatedMessage={
            formState.errors.destination?.["plannedOperationCode"]?.message
          }
          nativeSelectProps={{
            ...register("destination.plannedOperationCode")
          }}
        >
          <option value="">Sélectionnez une valeur</option>

          {Object.values(OPERATION).map(operation => (
            <option key={operation.code} value={operation.code}>
              {operation.code} - {operation.description}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default DestinationBsff;
