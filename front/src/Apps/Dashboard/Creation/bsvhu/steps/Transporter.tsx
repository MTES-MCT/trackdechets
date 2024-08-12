import { FavoriteType } from "@td/codegen-ui";
import React, { useEffect, useMemo, useContext } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import RecepisseExemption from "../../../../Forms/Components/RecepisseExemption/RecepiceExemption";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import {
  isCompanyAddressPath,
  isCompanyContactPath,
  isCompanyMailPath,
  isCompanyPhonePath,
  isCompanySiretPath,
  isVatNumberPath
} from "../../utils";

const TransporterBsvhu = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError } = useFormContext(); // retrieve all hook methods
  const actor = "transporter";
  const transporter = watch("transporter") ?? {};
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
  }, [register]);

  register(`${actor}.recepisse.isExempted`);

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length
    ) {
      const siretError = isCompanySiretPath(errors, actor);
      if (
        siretError &&
        !!formState.errors?.[actor]?.["company"]?.siret === false
      ) {
        setError(`${actor}.company.siret`, {
          type: "custom",
          message: siretError
        });
      }

      const contactError = isCompanyContactPath(errors, actor);
      if (
        contactError &&
        !!formState.errors?.[actor]?.["company"]?.contact === false
      ) {
        setError(`${actor}.company.contact`, {
          type: "custom",
          message: contactError
        });
      }

      const adressError = isCompanyAddressPath(errors, actor);
      if (
        adressError &&
        !!formState.errors?.[actor]?.["company"]?.address === false
      ) {
        setError(`${actor}.company.address`, {
          type: "custom",
          message: adressError
        });
      }
      const phoneError = isCompanyPhonePath(errors, actor);
      if (
        phoneError &&
        !!formState.errors?.[actor]?.["company"]?.phone === false
      ) {
        setError(`${actor}.company.phone`, {
          type: "custom",
          message: phoneError
        });
      }
      const mailError = isCompanyMailPath(errors, actor);
      if (
        mailError &&
        !!formState.errors?.[actor]?.["company"]?.mail === false
      ) {
        setError(`${actor}.company.mail`, {
          type: "custom",
          message: mailError
        });
      }

      const vatNumberError = isVatNumberPath(errors, actor);
      if (
        vatNumberError &&
        !!formState.errors?.[actor]?.["company"]?.vatNumber === false
      ) {
        setError(`${actor}.company.vatNumber`, {
          type: "custom",
          message: vatNumberError
        });
      }
    }
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors?.length,
    setError
  ]);

  const orgId = useMemo(
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
  );

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <h4 className="fr-h4">Entreprise</h4>
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Transporter}
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
                company.contact || transporter?.company?.contact
              );
              setValue(
                `${actor}.company.phone`,
                company.contactPhone || transporter?.company?.phone
              );

              setValue(
                `${actor}.company.mail`,
                company.contactEmail || transporter?.company?.mail
              );
            }
          }}
        />
        <CompanyContactInfo
          fieldName={`${actor}.company`}
          disabled={sealedFields.includes(`${actor}.company.siret`)}
          key={orgId}
        />
      </div>
      <div className="fr-col-md-12 fr-mt-4w">
        <RecepisseExemption
          onChange={v => setValue(`${actor}.recepisse.isExempted`, v)}
          checked={transporter.recepisse?.isExempted}
          disabled={sealedFields.includes(`${actor}.recepisse.isExempted`)}
        />
      </div>
    </>
  );
};

export default TransporterBsvhu;
