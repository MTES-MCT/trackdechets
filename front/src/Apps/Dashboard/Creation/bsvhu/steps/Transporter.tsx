import {
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  TransportMode,
  BsvhuRecepisse
} from "@td/codegen-ui";

import React, { useEffect, useMemo, useContext, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import RecepisseExemption from "../../../../Forms/Components/RecepisseExemption/RecepiceExemption";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { clearCompanyError, setFieldError } from "../../utils";
import TransporterRecepisse from "../../../../Forms/Components/TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "@td/constants";
import { RhfTagsInputWrapper } from "../../../../Forms/Components/TagsInput/TagsInputWrapper";
import { RhfTransportModeSelect } from "../../../../Forms/Components/TransportMode/TransportMode";

const TransporterBsvhu = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const [recepisse, setRecepisse] = useState<BsvhuRecepisse>({});

  const actor = "transporter";
  const transporter = watch("transporter") ?? {};
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.contact`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
  }, [register]);

  register(`${actor}.recepisse.isExempted`);

  useEffect(() => {
    if (errors?.length) {
      setFieldError(
        errors,
        `${actor}.company.siret`,
        formState.errors?.[actor]?.["company"]?.siret,
        setError
      );

      if (transporter?.company?.contact) {
        setFieldError(
          errors,
          `${actor}.company.contact`,
          formState.errors?.[actor]?.["company"]?.contact,
          setError
        );
      }
      if (transporter?.company?.address) {
        setFieldError(
          errors,
          `${actor}.company.address`,
          formState.errors?.[actor]?.["company"]?.address,
          setError
        );
      }
      if (transporter?.company?.phone) {
        setFieldError(
          errors,
          `${actor}.company.phone`,
          formState.errors?.[actor]?.["company"]?.phone,
          setError
        );
      }
      if (transporter?.company?.mail) {
        setFieldError(
          errors,
          `${actor}.company.mail`,
          formState.errors?.[actor]?.["company"]?.mail,
          setError
        );
      }
      if (transporter?.company?.vatNumber) {
        setFieldError(
          errors,
          `${actor}.company.vatNumber`,
          formState.errors?.[actor]?.["company"]?.vatNumber,
          setError
        );
      }
      if (transporter?.transport?.plates) {
        setFieldError(
          errors,
          `${actor}.transport.plates`,
          formState.errors?.[actor]?.["transport"]?.plates,
          setError
        );
      }
    }
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors.length,
    setError,
    transporter?.company?.address,
    transporter?.company?.contact,
    transporter?.company?.mail,
    transporter?.company?.phone,
    transporter?.company?.siret,
    transporter?.company?.vatNumber,
    transporter?.transport?.plates
  ]);

  const orgId = useMemo(
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
  );

  const isForeign = React.useMemo(() => isForeignVat(orgId), [orgId]);

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets.";
      } else if (
        !transporter?.recepisse?.isExempted &&
        !company.companyTypes?.includes(CompanyType.Transporter)
      ) {
        return "Cet établissement n'a pas le profil Transporteur. Il ne pourra pas être visé comme tel sur le bordereau, il lui appartient de compléter cette information dans son profil. Si vous transportez vos propres déchets, veuillez cocher la case d'exemption.";
      } else if (formState.errors?.transporter?.["company"]?.siret?.message) {
        return formState.errors?.transporter?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <h4 className="fr-h4">Transporteur</h4>
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Transporter}
          disabled={sealedFields.includes(`${actor}.company.siret`)}
          selectedCompanyOrgId={orgId}
          allowForeignCompanies={true}
          selectedCompanyError={selectedCompanyError}
          onCompanySelected={company => {
            if (company) {
              if (company.siret !== transporter?.company?.siret) {
                setValue(`${actor}.company.contact`, company.contact);
                setValue(`${actor}.company.phone`, company.contactPhone);
                setValue(`${actor}.company.mail`, company.contactEmail);
                if (errors?.length) {
                  // server errors
                  clearCompanyError(transporter, actor, clearErrors);
                }
              } else {
                setValue(
                  `${actor}.company.contact`,
                  transporter?.company?.contact
                );
                setValue(`${actor}.company.phone`, transporter?.company?.phone);

                setValue(`${actor}.company.mail`, transporter?.company?.mail);
              }
              setValue(`${actor}.company.orgId`, company.orgId);
              setValue(`${actor}.company.siret`, company.siret);
              setValue(`${actor}.company.name`, company.name);
              setValue(`${actor}.company.vatNumber`, company.vatNumber);
              setValue(`${actor}.company.address`, company.address);
              setRecepisse({
                number: company.transporterReceipt?.receiptNumber,
                department: company.transporterReceipt?.department,
                validityLimit: company.transporterReceipt?.validityLimit
              });
            }
          }}
        />
        {!transporter?.company?.siret &&
          formState.errors?.transporter?.["company"]?.siret && (
            <p className="fr-text--sm fr-error-text fr-mb-4v">
              {formState.errors?.transporter?.["company"]?.siret?.message}
            </p>
          )}
        <CompanyContactInfo
          fieldName={`${actor}.company`}
          errorObject={formState.errors?.transporter?.["company"]}
          disabled={sealedFields.includes(`${actor}.company.siret`)}
          key={orgId}
        />
      </div>
      {!!orgId &&
        !isForeign &&
        transporter.transport.mode === TransportMode.Road &&
        !transporter.recepisse.isExempted && (
          <TransporterRecepisse
            number={recepisse?.number}
            department={recepisse?.department}
            validityLimit={recepisse?.validityLimit}
          />
        )}
      <div className="fr-col-md-12 fr-mt-4w">
        <RecepisseExemption
          onChange={v => setValue(`${actor}.recepisse.isExempted`, v)}
          checked={transporter.recepisse?.isExempted}
          disabled={sealedFields.includes(`${actor}.recepisse.isExempted`)}
        />
      </div>
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
            fieldName={`transporter.transport.plates`}
            hintText="2 max : Véhicule, remorque"
          />
        </div>
      </div>
    </>
  );
};

export default TransporterBsvhu;
