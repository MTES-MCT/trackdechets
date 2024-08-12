import { FavoriteType } from "@td/codegen-ui";
import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import RecepisseExemption from "../../../../Forms/Components/RecepisseExemption/RecepiceExemption";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import DisabledParagraphStep from "../../DisabledParagraphStep";

const TransporterBsvhu = ({ isDisabled }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch } = useFormContext(); // retrieve all hook methods
  const actor = "transporter";

  const transporter = watch("transporter") ?? {};

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
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
  );

  return (
    <>
      {isDisabled && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Transporter}
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
          disabled={isDisabled}
          key={orgId}
        />
      </div>
      <div className="fr-col-md-12 fr-mt-4w">
        <RecepisseExemption
          onChange={v => setValue(`${actor}.recepisse.isExempted`, v)}
          checked={transporter.recepisse?.isExempted}
          disabled={isDisabled}
        />
      </div>
    </>
  );
};

export default TransporterBsvhu;
