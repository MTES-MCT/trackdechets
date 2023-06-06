import RedErrorMessage from "common/components/RedErrorMessage";
import TdSwitch from "common/components/Switch";
import { FieldTransportModeSelect } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import {
  CompanySearchPrivate,
  Query,
  QueryCompanyPrivateInfosArgs,
  Transporter as TransporterType,
  WasteDetailsInput,
} from "generated/graphql/types";
import React from "react";
import styles from "./Transporter.module.scss";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import { formTransportIsPipeline } from "./utils/packagings";
import { onBsddTransporterCompanySelected } from "./utils/onBsddTransporterCompanySelected";
import { useQuery } from "@apollo/client";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "form/common/components/company/query";

type Values = {
  transporter: TransporterType;
  wasteDetails: WasteDetailsInput;
};

export default function Transporter() {
  const { setFieldValue, values } = useFormikContext<Values>();
  const [orgId, setOrgId] = React.useState<string>("");
  const updateBsddTransporterReceipt =
    onBsddTransporterCompanySelected(setFieldValue);
  const { loading, error, refetch } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: {
      clue: orgId!,
    },
    skip: !orgId,
    onCompleted: data => {
      console.log(data);
      if (data && typeof updateBsddTransporterReceipt === "function") {
        updateBsddTransporterReceipt(
          data.companyPrivateInfos as CompanySearchPrivate
        );
      }
    },
  });

  React.useCallback(() => {
    if (!loading && !error && orgId) {
      // fetch the data
      refetch();
    }
  }, [refetch, error, loading, orgId]);

  return !formTransportIsPipeline(values) ? (
    <>
      <h4 className="form__section-heading">Transporteur</h4>
      <CompanySelector
        name="transporter.company"
        allowForeignCompanies={true}
        registeredOnlyCompanies={true}
        onCompanySelected={() =>
          // refresh CompanyPrivateInfos and propagate the receipt form values
          setOrgId(values.transporter.company?.orgId!)
        }
      />
      {!isForeignVat(values.transporter?.company?.vatNumber!) && (
        <>
          <h4 className="form__section-heading">
            Exemption de récépissé de déclaration de transport de déchets
          </h4>
          <div className="form__row">
            <TdSwitch
              checked={!!values.transporter.isExemptedOfReceipt}
              onChange={checked =>
                setFieldValue("transporter.isExemptedOfReceipt", checked)
              }
              disabled={values.transporter.company?.orgId === null}
              label="Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'article R.541-50 du code de l'environnement."
            />
          </div>
        </>
      )}
      <div className="form__row">
        <label>
          Mode de transport
          <Field name="transporter.mode" component={FieldTransportModeSelect} />
        </label>
        <label>
          Immatriculation (optionnel)
          <Field
            type="text"
            className={`td-input ${styles.transporterNumberPlate}`}
            name="transporter.numberPlate"
            placeholder="Plaque d'immatriculation du véhicule"
          />
        </label>

        <RedErrorMessage name="transporter.numberPlate" />
      </div>
    </>
  ) : (
    <>
      <h4 className="form__section-heading">Transport par pipeline</h4>
    </>
  );
}
