import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import CompanySelectorWrapper from "../../../form/common/components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import { FavoriteType, TransportMode } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import TransporterRecepisse from "../../../Apps/Forms/Components/TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "@td/constants";
import { PlatesWidget } from "../components/TransporterPlates";

const actor = "transporter";

export function Transporter() {
  const {
    register,
    setValue,
    formState: { errors },
    watch
  } = useFormContext(); // retrieve all hook methods
  const [recepisse, setRecepisse] = useState({});

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
    register("transporter.transport.plates");
  }, [register]);

  register(`${actor}.recepisse.isExempted`);

  const { siret } = useParams<{ siret: string }>();
  const transporter = watch(actor) ?? {};

  const orgId = useMemo(
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
  );
  // const orgId = transporter?.company?.orgId ?? transporter?.company?.siret ?? null

  const isForeign = React.useMemo(() => isForeignVat(orgId), [orgId]);

  return (
    <>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Transporter}
        disabled={false}
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
          }
        }}
      />

      <CompanyContactInfo
        fieldName={`${actor}.company`}
        disabled={false}
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

      <h3 className="fr-h4">
        Exemption de récépissé de déclaration de transport de déchets
      </h3>
      <ToggleSwitch
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
      <Input
        label="Champ libre (optionnel)"
        textArea
        nativeTextAreaProps={{
          ...register("transporter.customInfo")
        }}
      ></Input>
      <h3 className="fr-h3">Transport du déchet</h3>
      <Select
        label="Mode de transport"
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

      <PlatesWidget maxPlates={2} fieldName="transporter.transport.plates" />
    </>
  );
}
