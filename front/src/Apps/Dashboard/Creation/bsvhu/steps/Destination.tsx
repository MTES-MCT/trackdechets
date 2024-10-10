import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError, setFieldError } from "../../utils";

const DestinationBsvhu = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const [selectedDestination, setSelectedDestination] =
    useState<CompanySearchResult | null>(null);
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const actor = "destination";
  const wasteCode = watch("wasteCode");
  const isDangerousWasteCode = wasteCode === "16 01 04*";
  const destination = watch(actor) ?? {};
  const agrementNumber = watch("destination.agrementNumber");
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    if (isDangerousWasteCode) {
      setValue("destination.type", "DEMOLISSEUR");
    }
  }, [isDangerousWasteCode, setValue]);

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length &&
      !destination?.company?.siret
    ) {
      setFieldError(
        errors,
        `${actor}.company.siret`,
        formState.errors?.[actor]?.["company"]?.siret,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.contact`,
        formState.errors?.[actor]?.["company"]?.contact,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.address`,
        formState.errors?.[actor]?.["company"]?.address,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.phone`,
        formState.errors?.[actor]?.["company"]?.phone,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.mail`,
        formState.errors?.[actor]?.["company"]?.mail,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.vatNumber`,
        formState.errors?.[actor]?.["company"]?.vatNumber,
        setError
      );

      setFieldError(
        errors,
        `${actor}.agrementNumber`,
        formState.errors?.[actor]?.["agrementNumber"],
        setError
      );
    }
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors.length,
    setError,
    destination?.company?.siret
  ]);

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
    register(`${actor}.company.contact`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
    register(`${actor}.transport.plates`);
    register(`${actor}.agrementNumber`);
  }, [register]);

  register(`${actor}.recepisse.isExempted`);

  const orgId = useMemo(
    () => destination?.company?.orgId ?? destination?.company?.siret ?? null,
    [destination?.company?.orgId, destination?.company?.siret]
  );
  const orgIdNextDestination = useMemo(
    () =>
      destination?.operation?.nextDestination.company.orgId ??
      destination?.operation?.nextDestination?.company.siret ??
      null,
    [
      destination?.operation?.nextDestination.company.orgId,
      destination?.operation?.nextDestination.company.siret
    ]
  );

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      {isDangerousWasteCode && (
        <Alert
          description=" Vous avez saisi le code déchet dangereux 16 01 04*. Le destinataire est obligatoirement un démolisseur agréé."
          severity="info"
          small
          className="fr-mb-2w"
        />
      )}

      <div className="fr-col-12 fr-col-md-6">
        <RadioButtons
          legend="L'installation de destination est un"
          disabled={
            isDangerousWasteCode || sealedFields.includes("destination.type")
          }
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
        <h4 className="fr-h4">Installation de destination</h4>
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Destination}
          disabled={sealedFields.includes(`${actor}.company.siret`)}
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
                destination?.company?.contact || company.contact
              );
              setValue(
                `${actor}.company.phone`,
                destination?.company?.phone || company.contactPhone
              );

              setValue(
                `${actor}.company.mail`,
                destination?.company?.mail || company.contactEmail
              );

              setSelectedDestination(company);
              updateAgrementNumber(company, destination?.type);

              if (errors?.length) {
                // server errors
                clearCompanyError(destination, actor, clearErrors);
                clearErrors(`${actor}.agrementNumber`);
              }
            }
          }}
        />
        {formState.errors?.destination?.["company"]?.siret && (
          <p className="fr-text--sm fr-error-text fr-mb-4v">
            {formState.errors?.destination?.["company"]?.siret?.message}
          </p>
        )}
        <CompanyContactInfo
          fieldName={`${actor}.company`}
          name={actor}
          disabled={sealedFields.includes(`${actor}.company.siret`)}
          key={orgId}
        />
      </div>

      <div className="fr-col-md-8 fr-mt-4w">
        <Input
          label="Numéro d'agrément"
          disabled={sealedFields.includes(`${actor}.agrementNumber`)}
          nativeInputProps={{
            ...register(`${actor}.agrementNumber`),
            value: agrementNumber
          }}
          state={formState.errors?.destination?.["agrementNumber"] && "error"}
          stateRelatedMessage={
            (formState.errors?.destination?.["agrementNumber"]
              ?.message as string) ?? ""
          }
        />
      </div>
      <div className="fr-col-md-8 fr-mt-4w">
        <Select
          label="Opération d'élimination / valorisation prévue (code D/R)"
          nativeSelectProps={{
            ...register("destination.plannedOperationCode")
          }}
          disabled={sealedFields.includes("destination.plannedOperationCode")}
        >
          {!isDangerousWasteCode && (
            <option value="R 4">
              R 4 - Recyclage ou récupération des métaux et des composés
              métalliques
            </option>
          )}
          <option value="R 12">
            R 12 - Échange de déchets en vue de les soumettre à l'une des
            opérations numérotées R1 à R11
          </option>
        </Select>
      </div>
      {destination?.type === "DEMOLISSEUR" && (
        <div className="fr-col-md-10 fr-mt-4w">
          <h4 className="fr-h4 fr-mt-2w">
            Installation de broyage prévisionelle
          </h4>
          <CompanySelectorWrapper
            orgId={siret}
            favoriteType={FavoriteType.Destination}
            disabled={sealedFields.includes(
              `${actor}.operation.nextDestination.company.siret`
            )}
            selectedCompanyOrgId={orgIdNextDestination}
            onCompanySelected={company => {
              if (company) {
                const name = `${actor}.operation.nextDestination.company`;
                setValue(`${name}.orgId`, company.orgId);
                setValue(`${name}.siret`, company.siret);
                setValue(`${name}.name`, company.name);
                setValue(`${name}.vatNumber`, company.vatNumber);
                setValue(`${name}.address`, company.address);
                setValue(
                  `${name}.contact`,
                  destination?.operation?.nextDestinationcompany?.contact ||
                    company.contact
                );
                setValue(
                  `${name}.phone`,
                  destination?.operation?.nextDestinationcompany
                    ?.contactPhone || company.contactPhone
                );

                setValue(
                  `${name}.mail`,
                  destination?.operation?.nextDestinationcompany
                    ?.contactEmail || company.contactEmail
                );
              }
            }}
          />
          <CompanyContactInfo
            fieldName={`${actor}.operation.nextDestination.company`}
            disabled={sealedFields.includes(
              `${actor}.operation.nextDestination.company.siret`
            )}
            key={orgIdNextDestination}
          />
        </div>
      )}
    </>
  );
};

export default DestinationBsvhu;
