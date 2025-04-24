import * as React from "react";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Field } from "formik";
import {
  BsdType,
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  TransportMode
} from "@td/codegen-ui";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import TransporterRecepisse from "../TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "@td/constants";
import { useTransporter } from "../../hooks/useTransporter";
import { AnyTransporterInput } from "../../types";
import TransportPlates from "../TransportPlates/TransportPlates";

type TransporterFormProps = {
  // SIRET ou VAT de l'établissement courant
  orgId?: string;
  fieldName: string;
  bsdType: BsdType;
};

/**
 * Ce composant contient le formulaire de création / mise à jour
 * d'un transporteur sur un BSD. Il est en charge de modifier le
 * state Formik dès qu'un établissement est sélectionné dans le
 * CompanySelector.
 */
export function TransporterForm<T extends AnyTransporterInput>({
  orgId,
  fieldName,
  bsdType
}: TransporterFormProps) {
  const {
    transporterOrgId,
    transporter,
    setTransporter,
    transportPlatesFieldName,
    transportModeFieldName,
    transporterRecepisseIsExemptedFieldName
  } = useTransporter<T>(fieldName, bsdType);

  const isForeign = React.useMemo(
    () => isForeignVat(transporterOrgId),
    [transporterOrgId]
  );

  // Callback qui est passé au CompanySelector et qui permet de
  // modifier le state Formik
  const onCompanySelected = (company?: CompanySearchResult) => {
    if (company) {
      setTransporter(company);
    }
  };

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets.";
      } else if (
        !transporter?.recepisse?.isExempted &&
        !company.companyTypes?.includes(CompanyType.Transporter)
      ) {
        return "Cet établissement n'a pas le profil Transporteur. Si vous transportez vos propres déchets, veuillez cocher la case d'exemption.";
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

      <Field name={transporterRecepisseIsExemptedFieldName}>
        {({ field, form }) => (
          <ToggleSwitch
            label={
              <div>
                Le transporteur déclare être exempté de récépissé conformément
                aux dispositions de l'
                <a
                  className="fr-link force-external-link-content force-underline-link"
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
              form.setFieldValue(
                transporterRecepisseIsExemptedFieldName,
                checked
              )
            }
            defaultChecked={false}
          />
        )}
      </Field>

      {!!transporterOrgId &&
        !isForeign &&
        !transporter?.recepisse?.isExempted &&
        transporter?.transport?.mode === TransportMode.Road && (
          <TransporterRecepisse
            number={transporter?.recepisse?.number}
            department={transporter?.recepisse?.department}
            validityLimit={transporter?.recepisse?.validityLimit}
          />
        )}

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top fr-mt-1w">
        <div className="fr-col-12 fr-col-md-3">
          <Field name={transportModeFieldName}>
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
        <div className="fr-col-12 fr-col-md-4">
          <TransportPlates
            bsdType={bsdType}
            fieldName={transportPlatesFieldName}
          />
        </div>
      </div>
    </div>
  );
}
