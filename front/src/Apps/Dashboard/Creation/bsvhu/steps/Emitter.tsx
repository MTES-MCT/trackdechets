import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect, useMemo } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";

const EmitterBsvhu = ({ isDisabled }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch } = useFormContext();

  const emitter = watch("emitter") ?? {};

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("emitter.company.orgId");
    register("emitter.company.siret");
    register("emitter.company.name");
    register("emitter.company.vatNumber");
    register("emitter.company.address");
  }, [register]);

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  return (
    <>
      {isDisabled && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Emitter}
          disabled={isDisabled}
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
        <CompanyContactInfo
          fieldName={"emitter.company"}
          disabled={isDisabled}
          key={orgId}
        />
      </div>
      <div className="fr-col-md-8">
        <Input
          label="Numéro d'agrément démolisseur"
          disabled={isDisabled}
          nativeInputProps={{ ...register("emitter.agrementNumber") }}
        />
      </div>
    </>
  );
};

export default EmitterBsvhu;
