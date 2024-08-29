import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { BspaohRecepisse, FavoriteType, TransportMode } from "@td/codegen-ui";
import { isForeignVat } from "@td/constants";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import RecepisseExemption from "../../../../Forms/Components/RecepisseExemption/RecepiceExemption";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { RhfTagsInputWrapper } from "../../../../Forms/Components/TagsInput/TagsInputWrapper";
import TransporterRecepisse from "../../../../Forms/Components/TransporterRecepisse/TransporterRecepisse";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import { SealedFieldsContext } from "../../context";

const actor = "transporter";

export function Transporter() {
  const { register, setValue, watch } = useFormContext(); // retrieve all hook methods
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
            setRecepisse({
              number: company.transporterReceipt?.receiptNumber,
              department: company.transporterReceipt?.department,
              validityLimit: company.transporterReceipt?.validityLimit
            });

            // country: company.codePaysEtrangerEtablissement
          }
        }}
      />
      <CompanyContactInfo
        fieldName={`${actor}.company`}
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
          <Select
            label="Mode de transport"
            disabled={sealedFields.includes(`transporter.transport.mode`)}
            nativeSelectProps={{
              ...register("transporter.transport.mode")
            }}
          >
            <option value="ROAD">Route</option>
            <option value="RAIL">Voie Ferroviaire</option>
            <option value="AIR">Voie Aérienne</option>
            <option value="RIVER">Voie Fluviale</option>
            <option value="SEA">Voie Maritime</option>
            <option value="OTHER">Autre</option>
          </Select>
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