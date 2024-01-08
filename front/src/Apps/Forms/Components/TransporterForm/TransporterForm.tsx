import * as React from "react";
import CompanySelectorWrapper from "../../../../form/common/components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Field, useField } from "formik";
import {
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  Transporter as FormTransporter,
  Transporter
} from "@td/codegen-ui";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import TransporterRecepisse from "../TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "@td/constants";

type TransporterFormProps = {
  // SIRET ou VAT de l'établissement courant
  orgId?: string;
  fieldName: string;
};

/**
 * Ce composant contient le formulaire de création / mise à jour
 * d'un transporteur sur un BSD. Il est en charge de modifier le
 * state Formik dès qu'un établissement est sélectionné dans le
 * CompanySelector.
 */
export function TransporterForm({ orgId, fieldName }: TransporterFormProps) {
  const [field, _, { setValue }] = useField<FormTransporter>(fieldName);

  const transporter = field.value;

  // transporter.company.orgId should always be defined
  // but let's not take the risk
  const transporterOrgId = React.useMemo(
    () =>
      transporter?.company?.orgId ??
      transporter?.company?.siret ??
      transporter?.company?.vatNumber ??
      null,
    [
      transporter?.company?.orgId,
      transporter?.company?.siret,
      transporter?.company?.vatNumber
    ]
  );

  const isForeign = React.useMemo(
    () => isForeignVat(transporterOrgId),
    [transporterOrgId]
  );

  // Callback qui est passé au CompanySelector et qui permet de
  // modifier le state Formik
  const onCompanySelected = (company?: CompanySearchResult) => {
    if (company) {
      const updatedTransporter: Transporter = {
        ...transporter,
        company: {
          ...transporter.company,
          orgId: company.orgId,
          siret: company.siret,
          vatNumber: company.vatNumber,
          country: company.codePaysEtrangerEtablissement,
          // auto-completion de la raison sociale et de l'adresse
          name: company.name ?? "",
          address: company.address ?? "",
          ...(transporterOrgId !== company.orgId
            ? {
                // auto-completion des infos de contact uniquement
                // s'il y a un changement d'établissement pour
                // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                // lors d'une modification de bordereau
                contact: company.contact ?? "",
                phone: company.contactPhone ?? "",
                mail: company.contactEmail ?? ""
              }
            : {})
        },
        // auto-complétion du récépissé de transport
        receipt: company.transporterReceipt?.receiptNumber,
        validityLimit: company.transporterReceipt?.validityLimit,
        department: company.transporterReceipt?.department,
        isExemptedOfReceipt: isForeignVat(company.vatNumber)
          ? // l'obligation de récépissé ne concerne pas les transporteurs étrangers
            // on force la valeur à `false` et on désactive le champ
            false
          : transporter.isExemptedOfReceipt
      };
      setValue(updatedTransporter);
    }
  };

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets, il ne peut pas être ajouté sur le bordereau.";
      } else if (
        !transporter.isExemptedOfReceipt &&
        !company.companyTypes?.includes(CompanyType.Transporter)
      ) {
        return (
          "Cet établissement est bien inscrit sur Trackdéchets mais n'a pas le profil Transporteur." +
          " Il ne peut pas être ajouté sur le bordereau." +
          " Si vous transportez vos propres déchets, veuillez cocher la case d'exemption après avoir vérifié" +
          " que vous remplissez bien les conditions."
        );
      }
    }
    return null;
  };

  return (
    <div className="fr-container">
      <CompanySelectorWrapper
        orgId={orgId}
        selectedCompanyOrgId={transporterOrgId}
        favoriteType={FavoriteType.Transporter}
        allowForeignCompanies={true}
        selectedCompanyError={selectedCompanyError}
        disabled={false}
        onCompanySelected={onCompanySelected}
      />

      <CompanyContactInfo fieldName={`${fieldName}.company`} />

      <Field name={`${fieldName}.isExemptedOfReceipt`}>
        {({ field, form }) => (
          <ToggleSwitch
            label={
              <div>
                Le transporteur déclare être exempté de récépissé conformément
                aux dispositions de l'
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
            inputTitle="terms"
            checked={field.value}
            disabled={isForeign}
            onChange={checked =>
              form.setFieldValue(`${fieldName}.isExemptedOfReceipt`, checked)
            }
            defaultChecked={false}
          />
        )}
      </Field>

      {!!transporterOrgId && !isForeign && !transporter.isExemptedOfReceipt && (
        <TransporterRecepisse
          number={transporter.receipt}
          department={transporter.department}
          validityLimit={transporter.validityLimit}
        />
      )}

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-12 fr-col-md-3">
          <Field name={`${fieldName}.mode`}>
            {({ field }) => (
              <Select label="Mode de transport" nativeSelectProps={field}>
                <option value="ROAD">Route</option>
                <option value="AIR">Voie aérienne</option>
                <option value="RAIL">Voie ferrée</option>
                <option value="RIVER">Voie fluviale</option>
                <option value="SEA">Voie maritime</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <Field name={`${fieldName}.numberPlate`}>
            {({ field }) => (
              <Input label="Immatriculation" nativeInputProps={field} />
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}
