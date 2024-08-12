import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect, useMemo, useContext } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
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

const EmitterBsvhu = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError } = useFormContext();

  const emitter = watch("emitter") ?? {};
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("emitter.company.orgId");
    register("emitter.company.siret");
    register("emitter.company.name");
    register("emitter.company.vatNumber");
    register("emitter.company.address");
  }, [register]);

  useEffect(() => {
    const actor = "emitter";
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
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <h4 className="fr-h4">Entreprise</h4>
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Emitter}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          selectedCompanyOrgId={orgId}
          onCompanySelected={company => {
            if (company) {
              let companyData = {
                orgId: company.orgId,
                siret: company.siret,
                vatNumber: company.vatNumber,
                name: company.name ?? "",
                address: company.address ?? "",
                contact: company.contact ?? "",
                phone: company.contactPhone ?? "",
                mail: company.contactEmail ?? "",
                country: company.codePaysEtrangerEtablissement
              };

              let agrementNumber =
                company?.vhuAgrementDemolisseur?.agrementNumber ?? "";

              // [tra-13734] don't override field with api data keep the user data value
              if (company.siret === emitter?.company?.siret) {
                companyData = {
                  orgId: company.orgId,
                  siret: company.siret,
                  vatNumber: company.vatNumber,
                  name: (emitter?.company?.name || company.name) as string,
                  address: (emitter?.company?.address ||
                    company.address) as string,
                  contact: (emitter?.company?.contact ||
                    company.contact) as string,
                  phone: (emitter?.company?.phone ||
                    company.contactPhone) as string,
                  mail: (emitter?.company?.mail ||
                    company.contactEmail) as string,
                  country: company.codePaysEtrangerEtablissement
                };

                agrementNumber = (emitter?.agrementNumber ||
                  company?.vhuAgrementDemolisseur?.agrementNumber) as string;
              }

              setValue("emitter", {
                ...emitter,
                company: {
                  ...emitter.company,
                  ...companyData
                },
                agrementNumber
              });
            }
          }}
        />
        {formState.errors?.emitter?.["company"]?.orgId?.message && (
          <p
            id="text-input-error-desc-error"
            className="fr-mb-4v fr-error-text"
          >
            {formState.errors?.emitter?.["company"]?.orgId?.message}
          </p>
        )}
        <CompanyContactInfo
          fieldName={"emitter.company"}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          key={orgId}
        />
      </div>
      <div className="fr-col-md-8">
        <Input
          label="Numéro d'agrément démolisseur"
          disabled={sealedFields.includes(`emitter.agrementNumber`)}
          nativeInputProps={{ ...register("emitter.agrementNumber") }}
        />
      </div>
    </>
  );
};

export default EmitterBsvhu;
