import { Input } from "@codegouvfr/react-dsfr/Input";
import { BspaohRecepisse, FavoriteType, TransportMode } from "@td/codegen-ui";
import { isForeignVat } from "@td/constants";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import RecepisseExemption from "../../../../Forms/Components/RecepisseExemption/RecepiceExemption";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { RhfTagsInputWrapper } from "../../../../Forms/Components/TagsInput/TagsInputWrapper";
import TransporterRecepisse from "../../../../Forms/Components/TransporterRecepisse/TransporterRecepisse";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { SealedFieldsContext } from "../../context";
import { clearCompanyError, setFieldError } from "../../utils";
import { RhfTransportModeSelect } from "../../../../Forms/Components/TransportMode/TransportMode";

const actor = "transporter";

export function Transporter({ errors }) {
  const { register, setValue, watch, setError, formState, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const [recepisse, setRecepisse] = useState<BspaohRecepisse>({});
  const sealedFields = useContext(SealedFieldsContext);

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

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length
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
        `${actor}.transport.plates`,
        formState.errors?.[actor]?.["transport"]?.plates,
        setError
      );
    }
  }, [errors, errors?.length, formState.errors, setError]);

  const { siret } = useParams<{ siret: string }>();
  const transporter = watch(actor) ?? {};

  const orgId = useMemo(
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
  );

  const isForeign = React.useMemo(() => isForeignVat(orgId), [orgId]);

  return (
    <>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Transporter}
        disabled={sealedFields.includes(`transporter.company.siret`)}
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
              transporter?.company?.contact || company.contact
            );
            setValue(
              `${actor}.company.phone`,
              transporter?.company?.phone || company.contactPhone
            );

            setValue(
              `${actor}.company.mail`,
              transporter?.company?.mail || company.contactEmail
            );
            setRecepisse({
              number: company.transporterReceipt?.receiptNumber,
              department: company.transporterReceipt?.department,
              validityLimit: company.transporterReceipt?.validityLimit
            });

            // country: company.codePaysEtrangerEtablissement

            if (errors?.length) {
              // server errors
              clearCompanyError(transporter, actor, clearErrors);
            }
          }
        }}
      />
      {formState.errors?.transporter?.["company"]?.siret && (
        <p className="fr-text--sm fr-error-text fr-mb-4v">
          {formState.errors?.transporter?.["company"]?.siret?.message}
        </p>
      )}
      <CompanyContactInfo
        fieldName={`${actor}.company`}
        errorObject={formState.errors?.transporter?.["company"]}
        disabled={sealedFields.includes(`transporter.company.siret`)}
        key={orgId}
      />
      {!!orgId &&
        !isForeign &&
        !transporter.recepisse.isExempted &&
        transporter.transport.mode === TransportMode.Road && (
          <TransporterRecepisse
            number={recepisse?.number}
            department={recepisse?.department}
            validityLimit={recepisse?.validityLimit}
          />
        )}

      <RecepisseExemption
        onChange={v => setValue(`${actor}.recepisse.isExempted`, v)}
        checked={transporter.recepisse?.isExempted}
        disabled={sealedFields.includes(`transporter.recepisse.isExempted`)}
      />

      <h4 className="fr-h4">Transport du déchet</h4>
      <div className="fr-grid-row">
        <div className="fr-col-6">
          <RhfTransportModeSelect
            disabled={sealedFields.includes(`transporter.transport.mode`)}
            fieldPath={`transporter.transport.mode`}
          />
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col-6">
          <RhfTagsInputWrapper
            maxTags={2}
            label="Immatriculations"
            fieldName={`${actor}.transport.plates`}
            hintText="2 max : Véhicule, remorque"
          />
          {formState.errors?.transporter?.["transport"]?.plates && (
            <p className="fr-text--sm fr-error-text fr-mb-4v">
              {formState.errors?.transporter?.["transport"]?.plates?.message}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Champ libre (optionnel)"
        disabled={sealedFields.includes("transporter.customInfo")}
        textArea
        nativeTextAreaProps={{
          ...register("transporter.customInfo")
        }}
      ></Input>
    </>
  );
}
