import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  BsvhuDestinationType,
  CompanySearchResult,
  FavoriteType
} from "@td/codegen-ui";
import subMonths from "date-fns/subMonths";
import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import IdentificationNumber from "../../../../Forms/Components/IdentificationNumbers/IdentificationNumber";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import RhfOperationModeSelect from "../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import format from "date-fns/format";

const DestinationBsvhu = ({ isDisabled }) => {
  const { siret } = useParams<{ siret: string }>();
  const [selectedDestination, setSelectedDestination] =
    useState<CompanySearchResult | null>(null);
  const { register, setValue, watch, formState } = useFormContext(); // retrieve all hook methods
  const actor = "destination";
  const wasteCode = watch("wasteCode");
  const isDangerousWasteCode = wasteCode === "16 01 04*";
  const destination = watch(actor) ?? {};
  const { fields } = useFieldArray({
    name: "destination.reception.identification.numbers"
  });

  useEffect(() => {
    if (isDangerousWasteCode) {
      setValue("destination.type", "DEMOLISSEUR");
    }
  }, [isDangerousWasteCode, setValue]);

  const updateAgrementNumber = (destination, type?) => {
    const destinationType = type || destination?.type;

    const agrementNumber =
      destinationType === "BROYEUR"
        ? destination?.vhuAgrementBroyeur?.agrementNumber
        : destination?.vhuAgrementDemolisseur?.agrementNumber;

    if (agrementNumber) {
      setValue("destination.agrementNumber", agrementNumber);
    } else {
      setValue("destination.agrementNumber", "");
    }
  };

  const onChangeDestinationType = type => {
    setValue("destination.type", type);
    updateAgrementNumber(selectedDestination, type);
  };

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
    register(`${actor}.transport.plates`);
  }, [register]);

  register(`${actor}.recepisse.isExempted`);

  const orgId = useMemo(
    () => destination?.company?.orgId ?? destination?.company?.siret ?? null,
    [destination?.company?.orgId, destination?.company?.siret]
  );
  const TODAY = new Date();

  return (
    <>
      {isDisabled && (
        <>
          <h4 className="fr-h4">Réception</h4>
          <Input
            label="Date de réception"
            //@ts-ignore
            state={formState.errors?.destination?.reception?.date && "error"}
            stateRelatedMessage={
              //@ts-ignore
              formState.errors?.destination?.reception?.date?.message as string
            }
            nativeInputProps={{
              type: "date",
              min: format(subMonths(TODAY, 2), "yyyy-MM-dd"),
              max: format(TODAY, "yyyy-MM-dd"),
              required: true,
              ...register("destination.reception.date"),
              onChange: e =>
                setValue("destination.reception.date", e.target.value)
            }}
          />
          <div className="fr-col-12 fr-col-md-6">
            <RadioButtons
              legend="Lot accepté"
              disabled={isDangerousWasteCode || isDisabled}
              options={[
                {
                  label: "Accepté en totalité",
                  nativeInputProps: {
                    ...register("destination.reception.acceptationStatus"),
                    value: "ACCEPTED"
                  }
                },
                {
                  label: "Refusé",
                  nativeInputProps: {
                    ...register("destination.reception.acceptationStatus"),
                    value: "REFUSED"
                  }
                },
                {
                  label: "Refus partiel",
                  nativeInputProps: {
                    ...register("destination.reception.acceptationStatus"),
                    value: "PARTIALLY_REFUSED"
                  }
                }
              ]}
            />

            {!!["REFUSED", "PARTIALLY_REFUSED"].includes(
              destination?.reception?.acceptationStatus
            ) && (
              <Input
                textArea
                label="Motif de refus"
                nativeTextAreaProps={{
                  ...register("destination.reception.refusalReason")
                }}
              />
            )}
          </div>
          <div>
            <Input
              label="Poids accepté en tonnes"
              className="fr-col-md-6"
              disabled={destination?.reception?.acceptationStatus === "REFUSED"}
              nativeInputProps={{
                ...register("destination.reception.weight"),
                type: "number",
                inputMode: "decimal",
                step: "1"
              }}
            />
          </div>
          <div>
            {destination?.reception?.acceptationStatus !== "REFUSED" && (
              <>
                {destination?.type === BsvhuDestinationType.Demolisseur && (
                  <>
                    <h4 className="fr-h4">Identification</h4>

                    {fields.map(field => (
                      <IdentificationNumber
                        key={field.id}
                        title="Identification des numeros entrant des lots ou de véhicules hors d'usage (livre de police)"
                        disabled={isDisabled}
                        name="destination.reception.identification.numbers"
                      />
                    ))}
                  </>
                )}
                <h4 className="fr-h4 fr-mt-4w">Opération</h4>
                <Input
                  label="Date de l'opération"
                  state={
                    //@ts-ignore
                    formState.errors?.destination?.operation?.date && "error"
                  }
                  stateRelatedMessage={
                    //@ts-ignore
                    formState.errors?.destination?.operation?.date
                      ?.message as string
                  }
                  nativeInputProps={{
                    type: "date",
                    min: format(subMonths(TODAY, 2), "yyyy-MM-dd"),
                    max: format(TODAY, "yyyy-MM-dd"),
                    ...register("destination.operation.date"),
                    onChange: e =>
                      setValue("destination.operation.date", e.target.value),
                    required: true
                  }}
                />

                <div className="fr-col-md-8 fr-pb-4w">
                  <Select
                    label="Opération d'élimination / valorisation effectuée"
                    nativeSelectProps={{
                      ...register("destination.operation.code")
                    }}
                  >
                    <option value="...">Sélectionnez une valeur...</option>
                    <option value="R 4">
                      R 4 - Recyclage ou récupération des métaux et des composés
                      métalliques
                    </option>
                    <option value="R 12">
                      R 12 - Échange de déchets en vue de les soumettre à l'une
                      des opérations numérotées R1 à R11
                    </option>
                  </Select>
                </div>
                <RhfOperationModeSelect
                  path="destination.operation.code"
                  operationCode={destination?.operation?.code}
                />
              </>
            )}
          </div>
          <DisabledParagraphStep />
        </>
      )}
      {isDangerousWasteCode && (
        <div className="notification success tw-mb-2">
          Vous avez saisi le code déchet dangereux <strong>16 01 04*</strong>.
          Le destinataire est obligatoirement un démolisseur agréé.
        </div>
      )}

      <div className="fr-col-12 fr-col-md-6">
        <RadioButtons
          legend="L'installation de destination est un"
          disabled={isDangerousWasteCode || isDisabled}
          options={[
            {
              label: "Broyeur agréé",
              nativeInputProps: {
                ...register("destination.type"),
                onChange: () => onChangeDestinationType("BROYEUR"),
                value: "BROYEUR"
              }
            },
            {
              label: "Démolisseur agréé",
              nativeInputProps: {
                ...register("destination.type"),
                onChange: () => onChangeDestinationType("DEMOLISSEUR"),
                value: "DEMOLISSEUR"
              }
            }
          ]}
        />
      </div>
      <div className="fr-col-md-10 fr-mt-4w">
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Destination}
          disabled={isDisabled}
          selectedCompanyOrgId={orgId}
          onCompanySelected={company => {
            if (company) {
              setValue(`${actor}.company.orgId`, company.orgId);
              setValue(`${actor}.company.siret`, company.siret);
              setValue(`${actor}.company.name`, company.name);
              setValue(`${actor}.company.vatNumber`, company.vatNumber);
              setValue(`${actor}.company.address`, company.address);
              setValue(
                `${actor}.company.contact`,
                company.contact || destination?.company?.contact
              );
              setValue(
                `${actor}.company.phone`,
                company.contactPhone || destination?.company?.phone
              );

              setValue(
                `${actor}.company.mail`,
                company.contactEmail || destination?.company?.mail
              );

              setSelectedDestination(destination);
              updateAgrementNumber(destination);
            }
          }}
        />
        <CompanyContactInfo
          fieldName={`${actor}.company`}
          disabled={isDisabled}
          key={orgId}
        />
      </div>

      <div className="fr-col-md-8 fr-mt-4w">
        <Input
          label="Numéro d'agrément"
          disabled={isDisabled}
          nativeInputProps={{
            ...register(`${actor}.agrementNumber`)
          }}
        />
      </div>
      <div className="fr-col-md-8 fr-mt-4w">
        <Select
          label="Opération d'élimination / valorisation prévue (code D/R)"
          nativeSelectProps={{
            ...register("destination.plannedOperationCode")
          }}
          disabled={isDisabled}
        >
          <option value="R 4">
            R 4 - Recyclage ou récupération des métaux et des composés
            métalliques
          </option>
          <option value="R 12">
            R 12 - Échange de déchets en vue de les soumettre à l'une des
            opérations numérotées R1 à R11
          </option>
        </Select>
      </div>
      {destination?.type === "DEMOLISSEUR" && (
        <div className="fr-col-md-10 fr-mt-4w">
          <CompanySelectorWrapper
            orgId={siret}
            favoriteType={FavoriteType.Destination}
            disabled={isDisabled}
            selectedCompanyOrgId={orgId}
            onCompanySelected={company => {
              if (company) {
                const agrementNumber =
                  destination?.type === "BROYEUR"
                    ? destination?.vhuAgrementBroyeur?.agrementNumber
                    : destination?.vhuAgrementDemolisseur?.agrementNumber;

                if (agrementNumber) {
                  setValue("destination.agrementNumber", agrementNumber);
                } else {
                  setValue("destination.agrementNumber", "");
                }
              }
            }}
          />
          <CompanyContactInfo
            fieldName={`${actor}.company`}
            disabled={isDisabled}
            key={orgId}
          />
        </div>
      )}
    </>
  );
};

export default DestinationBsvhu;
