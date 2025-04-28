import * as React from "react";
import CompanySelectorWrapper from "../../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import { Controller, UseFormReturn } from "react-hook-form";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { formatError } from "../../builder/error";
import { COMPANY_TYPES } from "../CompanySelector";
import { InlineAddress } from "../Address";
import Input from "@codegouvfr/react-dsfr/Input";

type TransporterFormProps = {
  fieldName: string;
  index?: number;
  methods: UseFormReturn<any>;
};

export function TransporterForm({
  fieldName,
  index,
  methods
}: TransporterFormProps) {
  const fullFieldName =
    typeof index === "number" ? `${fieldName}.${index}` : fieldName;
  const transporter = methods.watch(fullFieldName);
  const transporterOrgId = transporter?.CompanyOrgId;
  const { errors } = methods.formState;
  const error =
    typeof index === "number"
      ? errors?.[fieldName]?.[index]
      : errors?.[fieldName];

  console.log(errors);
  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-8 fr-mb-2w">
          <Select
            label={`Type de transporteur`}
            nativeSelectProps={{
              ...methods.register(`${fullFieldName}.CompanyType`)
            }}
          >
            {Object.entries(COMPANY_TYPES).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {transporter?.CompanyType === "ETABLISSEMENT_FR" ? (
        <>
          <CompanySelectorWrapper
            selectedCompanyOrgId={transporterOrgId}
            favoriteType={FavoriteType.Transporter}
            allowForeignCompanies={false}
            disabled={false}
            onCompanySelected={(company: CompanySearchResult) => {
              console.log(company);
              if (company) {
                methods.setValue(
                  `${fullFieldName}.CompanyOrgId`,
                  company.orgId ?? ""
                );

                methods.setValue(
                  `${fullFieldName}.CompanyName`,
                  company.name ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.CompanyAddress`,
                  company.addressVoie ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.CompanyCity`,
                  company.addressCity ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.CompanyPostalCode`,
                  company.addressPostalCode ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.CompanyCountryCode`,
                  company.codePaysEtrangerEtablissement || "FR"
                );
                methods.setValue(
                  `${fullFieldName}.RecepisseNumber`,
                  company.transporterReceipt?.receiptNumber ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.RecepisseDepartment`,
                  company.transporterReceipt?.department ?? ""
                );
                methods.setValue(
                  `${fullFieldName}.RecepisseValidityLimit`,
                  company.transporterReceipt?.validityLimit ?? ""
                );
              }
            }}
          />
          {error && (
            <Alert description={formatError(error)} severity="error" small />
          )}
        </>
      ) : (
        transporter?.CompanyType !== "" && (
          <div className="fr-grid-row fr-grid-row--gutters">
            {transporter?.CompanyType !== "COMMUNES" && (
              <div className="fr-col-8">
                <Input
                  label="Numéro d'identification"
                  nativeInputProps={{
                    type: "text",
                    ...methods.register(`${fullFieldName}.CompanyOrgId`)
                  }}
                  state={error?.CompanyOrgId && "error"}
                  stateRelatedMessage={formatError(error?.CompanyOrgId)}
                />
              </div>
            )}
            {!["COMMUNES", "PERSONNE_PHYSIQUE"].includes(
              transporter?.CompanyType
            ) && (
              <div className="fr-col-8">
                <Input
                  label="Raison sociale"
                  nativeInputProps={{
                    type: "text",
                    ...methods.register(`${fullFieldName}.CompanyName`)
                  }}
                  state={error?.CompanyName && "error"}
                  stateRelatedMessage={formatError(error?.CompanyName)}
                />
              </div>
            )}

            <InlineAddress
              prefix={`${fullFieldName}.Company`}
              methods={methods}
            />
          </div>
        )
      )}

      <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
        <div className={"fr-col-12"}>
          <Controller
            name={`${fullFieldName}.RecepisseIsExempted`}
            control={methods.control}
            render={({ field: controllerField }) => (
              <ToggleSwitch
                label={
                  <div>
                    Le transporteur déclare être exempté de récépissé
                    conformément aux dispositions de l'
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
                inputTitle={"terms"}
                showCheckedHint={false}
                defaultChecked={false}
                disabled={transporter?.CompanyType !== "ETABLISSEMENT_FR"}
                checked={controllerField.value}
                onChange={checked => controllerField.onChange(checked)}
              />
            )}
          />
        </div>
      </div>

      {transporter?.CompanyType === "ETABLISSEMENT_FR" && (
        <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
          <div className={"fr-col-12"}>
            <Input
              label={"Numéro de récépissé"}
              disabled={transporter?.RecepisseIsExempted}
              nativeInputProps={{
                type: "text",
                ...methods.register(`${fullFieldName}.RecepisseNumber`)
              }}
              state={error?.RecepisseNumber && "error"}
              stateRelatedMessage={formatError(error?.RecepisseNumber)}
            />
          </div>
        </div>
      )}

      <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
        <div className={"fr-col-12"}>
          <Select
            label={"Mode de transport"}
            nativeSelectProps={{
              ...methods.register(`${fullFieldName}.TransportMode`)
            }}
            disabled={false}
            state={error?.TransportMode && "error"}
            stateRelatedMessage={formatError(error?.TransportMode)}
          >
            <option value="ROAD">Route</option>
            <option value="AIR">Voie aérienne</option>
            <option value="RAIL">Voie ferrée</option>
            <option value="RIVER">Voie fluviale</option>
            <option value="SEA">Voie maritime</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
