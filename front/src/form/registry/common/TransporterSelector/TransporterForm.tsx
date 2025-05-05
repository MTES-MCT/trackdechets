import React from "react";
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
import { INITIAL_TRANSPORTER } from "./TransporterSelector";
type TransporterFormProps = {
  fieldName: string;
  index?: number;
  methods: UseFormReturn<any>;
};

export const TRANSPORT_MODES = [
  { label: "Route", value: "ROAD" },
  { label: "Voie aérienne", value: "AIR" },
  { label: "Voie ferrée", value: "RAIL" },
  { label: "Voie fluviale", value: "RIVER" },
  { label: "Voie maritime", value: "SEA" }
];

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
  const transporterError =
    typeof index === "number"
      ? errors?.[fieldName]?.[index]
      : errors?.[fieldName];
  const { onChange: onChangeCompanyType, ...typeSelectMethods } =
    methods.register(`${fullFieldName}.CompanyType`);

  return (
    <div className="fr-container fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-8 fr-mb-2w">
          <Select
            label={`Type de transporteur`}
            nativeSelectProps={{
              ...typeSelectMethods,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                methods.setValue(
                  `${fullFieldName}.TransportMode`,
                  INITIAL_TRANSPORTER.TransportMode
                );
                methods.setValue(
                  `${fullFieldName}.CompanyOrgId`,
                  INITIAL_TRANSPORTER.CompanyOrgId
                );
                methods.setValue(
                  `${fullFieldName}.RecepisseIsExempted`,
                  INITIAL_TRANSPORTER.RecepisseIsExempted
                );
                methods.setValue(
                  `${fullFieldName}.CompanyName`,
                  INITIAL_TRANSPORTER.CompanyName
                );
                methods.setValue(
                  `${fullFieldName}.CompanyAddress`,
                  INITIAL_TRANSPORTER.CompanyAddress
                );
                methods.setValue(
                  `${fullFieldName}.CompanyCity`,
                  INITIAL_TRANSPORTER.CompanyCity
                );
                methods.setValue(
                  `${fullFieldName}.CompanyPostalCode`,
                  INITIAL_TRANSPORTER.CompanyPostalCode
                );
                methods.setValue(
                  `${fullFieldName}.CompanyCountryCode`,
                  INITIAL_TRANSPORTER.CompanyCountryCode
                );
                methods.setValue(
                  `${fullFieldName}.RecepisseNumber`,
                  INITIAL_TRANSPORTER.RecepisseNumber
                );
                onChangeCompanyType(e);
              }
            }}
          >
            {Object.entries(COMPANY_TYPES)
              .filter(([key]) =>
                index === 0
                  ? key !== "COMMUNES"
                  : !["COMMUNES", "PERSONNE_PHYSIQUE"].includes(key)
              )
              .map(([key, value]) => (
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
                if (
                  !transporter.RecepisseNumber &&
                  company.transporterReceipt?.receiptNumber
                ) {
                  methods.setValue(
                    `${fullFieldName}.RecepisseNumber`,
                    company.transporterReceipt?.receiptNumber ?? ""
                  );
                }
              }
            }}
          />
          {(transporterError?.CompanyOrgId ||
            transporterError?.CompanyAddress) && (
            <div className="fr-mb-2w">
              <Alert
                description={formatError(
                  transporterError?.CompanyOrgId ||
                    transporterError?.CompanyAddress
                )}
                severity="error"
                small
              />
            </div>
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
                  state={transporterError?.CompanyOrgId && "error"}
                  stateRelatedMessage={formatError(
                    transporterError?.CompanyOrgId
                  )}
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
                  state={transporterError?.CompanyName && "error"}
                  stateRelatedMessage={formatError(
                    transporterError?.CompanyName
                  )}
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
                checked={controllerField.value}
                onChange={checked => controllerField.onChange(checked)}
              />
            )}
          />
        </div>
      </div>

      <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
        <div className={"fr-col-12"}>
          <Input
            label={"Numéro de récépissé"}
            disabled={transporter?.RecepisseIsExempted}
            nativeInputProps={{
              type: "text",
              ...methods.register(`${fullFieldName}.RecepisseNumber`)
            }}
            state={transporterError?.RecepisseNumber && "error"}
            stateRelatedMessage={formatError(transporterError?.RecepisseNumber)}
          />
        </div>
      </div>

      <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
        <div className={"fr-col-12"}>
          <Select
            label={"Mode de transport"}
            nativeSelectProps={{
              ...methods.register(`${fullFieldName}.TransportMode`)
            }}
            disabled={false}
            state={transporterError?.TransportMode && "error"}
            stateRelatedMessage={formatError(transporterError?.TransportMode)}
          >
            {TRANSPORT_MODES.map(({ label, value }) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
