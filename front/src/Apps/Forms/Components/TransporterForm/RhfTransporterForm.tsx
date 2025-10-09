import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  BsdType,
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  TransportMode
} from "@td/codegen-ui";
import CompanyContactInfo from "../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import TransporterRecepisse from "../TransporterRecepisse/TransporterRecepisse";
import { isForeignVat } from "@td/constants";
import { useTransporterRhf } from "../../hooks/useTransporterRhf";
import { AnyTransporterInput } from "../../types";
import RhfTransportPlates from "../TransportPlates/RhfTransportPlates";

type RhfTransporterFormProps = {
  orgId?: string;
  fieldName: string;
  bsdType: BsdType;
};

/**
 * Version React Hook Form du TransporterForm
 * Compatible avec TransporterList RHF
 */
export function RhfTransporterForm<T extends AnyTransporterInput>({
  orgId,
  fieldName,
  bsdType
}: RhfTransporterFormProps) {
  const { control, setValue } = useFormContext();
  const {
    transporterOrgId,
    transporter,
    transportPlatesFieldName,
    transportModeFieldName,
    transporterRecepisseIsExemptedFieldName
  } = useTransporterRhf<T>(fieldName, bsdType);

  const actor = fieldName;

  const isForeign = React.useMemo(
    () => isForeignVat(transporterOrgId),
    [transporterOrgId]
  );

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
        favoriteType={FavoriteType.Transporter}
        selectedCompanyOrgId={transporterOrgId}
        allowForeignCompanies={true}
        selectedCompanyError={selectedCompanyError}
        onCompanySelected={company => {
          if (company) {
            if (company.siret !== transporter?.company?.siret) {
              setValue(`${actor}.company.contact`, company.contact);
              setValue(`${actor}.company.phone`, company.contactPhone);
              setValue(`${actor}.company.mail`, company.contactEmail);
            } else {
              setValue(
                `${actor}.company.contact`,
                transporter?.company?.contact
              );
              setValue(`${actor}.company.phone`, transporter?.company?.phone);

              setValue(`${actor}.company.mail`, transporter?.company?.mail);
            }
            setValue(`${actor}.company.orgId`, company.orgId);
            setValue(`${actor}.company.siret`, company.siret);
            setValue(`${actor}.company.name`, company.name);
            setValue(`${actor}.company.vatNumber`, company.vatNumber);
            setValue(`${actor}.company.address`, company.address);
          }
        }}
      />

      <CompanyContactInfo fieldName={`${actor}.company`} key={orgId} />

      <Controller
        control={control}
        name={transporterRecepisseIsExemptedFieldName}
        render={({ field }) => (
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
            checked={field.value ?? false}
            disabled={isForeign}
            onChange={checked =>
              setValue(transporterRecepisseIsExemptedFieldName, checked)
            }
          />
        )}
      />

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
          <Controller
            control={control}
            name={transportModeFieldName}
            render={({ field }) => (
              <Select label="Mode de transport" nativeSelectProps={field}>
                <option value="ROAD">Route</option>
                <option value="AIR">Voie aérienne</option>
                <option value="RAIL">Voie ferrée</option>
                <option value="RIVER">Voie fluviale</option>
                <option value="SEA">Voie maritime</option>
              </Select>
            )}
          />
        </div>

        <div className="fr-col-12 fr-col-md-4">
          <RhfTransportPlates
            bsdType={bsdType}
            fieldName={transportPlatesFieldName}
          />
        </div>
      </div>
    </div>
  );
}
