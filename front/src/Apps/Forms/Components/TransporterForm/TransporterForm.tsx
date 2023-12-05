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
} from "codegen-ui";
import Alert from "@codegouvfr/react-dsfr/Alert";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import TransporterRecepisse from "../TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "shared/constants";

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

  // message d'erreur lié à la sélection d'un établissement. Ex :
  // - établissement non inscrit sur Trackdéchets
  // - établissement inscrit mais sans le profil transporteur
  const [companyError, setCompanyError] = React.useState<string | null>(null);

  const transporter = field.value;

  const transporterOrgId = React.useMemo(
    () => transporter?.company?.orgId ?? transporter?.company?.siret ?? null,
    [transporter?.company?.orgId, transporter?.company?.siret]
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
        department: company.transporterReceipt?.department
      };

      setValue(updatedTransporter);

      if (!company.isRegistered) {
        setCompanyError(
          "Cet établissement n'est pas inscrit sur Trackdéchets, il ne peut pas être ajouté sur le bordereau."
        );
      } else if (
        company.isRegistered &&
        !company.companyTypes?.includes(CompanyType.Transporter)
      ) {
        setCompanyError(
          "Cet établissement est bien inscrit sur Trackdéchets mais n'a pas le profil Transporteur, il ne peut pas être ajouté sur le bordereau."
        );
      } else {
        setCompanyError(null);
      }
    }
  };

  return (
    <div>
      <CompanySelectorWrapper
        orgId={orgId}
        formOrgId={transporterOrgId}
        favoriteType={FavoriteType.Transporter}
        allowForeignCompanies={true}
        disabled={false}
        onCompanySelected={onCompanySelected}
      />

      {companyError && (
        <Alert title="Entreprise" description={companyError} severity="error" />
      )}

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
