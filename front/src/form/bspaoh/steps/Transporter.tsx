import React, { useMemo, useState, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import CompanySelectorWrapper from "../../../form/common/components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import { FavoriteType, TransportMode, BspaohRecepisse } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import TransporterRecepisse from "../../../Apps/Forms/Components/TransporterRecepisse/TransporterRecepisse";
import { RhfTagsInputWrapper } from "../../../Apps/Forms/Components/TagsInput/TagsInputWrapper";

import { isForeignVat } from "@td/constants";

import { SealedFieldsContext } from "../context";

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
      <h4 className="fr-h4">
        Exemption de récépissé de déclaration de transport de déchets
      </h4>
      <ToggleSwitch
        disabled={sealedFields.includes(`transporter.recepisse.isExempted`)}
        label={
          <div>
            Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'
            <a
              className="fr-link"
              target="_blank"
              rel="noreferrer"
              href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046669839"
            >
              article R.541-50 du code de l'environnement
            </a>
          </div>
        }
        checked={transporter.recepisse?.isExempted}
        onChange={v => setValue(`${actor}.recepisse.isExempted`, v)}
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
