import React from "react";
import { Field, useFormikContext } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Tooltip from "common/components/Tooltip";

import { Values } from "../AccountCompanyAdd";

/**
 * Broker receipt Formik fields for company creation
 */
export default function AccountCompanyAddBrokerReceipt() {
  const { values } = useFormikContext<Values>();

  return (
    <div className="fr-container" style={{ paddingTop: "4px" }}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <Field name="hasSubSectionFour">
            {({ field }) => {
              return (
                <Checkbox
                  options={[
                    {
                      label: "Travaux relevant de la sous-section 4",
                      nativeInputProps: {
                        name: field.name,
                        checked: field.value,
                        onChange: field.onChange,
                        onBlur: field.onBlur,
                      },
                    },
                  ]}
                />
              );
            }}
          </Field>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-6">
          <Field name="hasSubSectionThree">
            {({ field }) => {
              return (
                <Checkbox
                  options={[
                    {
                      label: "Travaux relevant de la sous-section 3",
                      nativeInputProps: {
                        name: field.name,
                        checked: field.value,
                        onChange: field.onChange,
                        onBlur: field.onBlur,
                      },
                    },
                  ]}
                />
              );
            }}
          </Field>
        </div>
        <div className="fr-col-1">
          <Tooltip msg="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)" />
        </div>
      </div>
      {values.hasSubSectionThree && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-4">
            <Field name="certificationNumber">
              {({ field }) => {
                return (
                  <Input
                    label="N° certification"
                    nativeInputProps={{
                      name: field.name,
                      checked: field.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                  ></Input>
                );
              }}
            </Field>
            <RedErrorMessage name="certificationNumber" />
          </div>
          <div className="fr-col-4">
            <Field name="validityLimit">
              {({ field }) => {
                return (
                  <Input
                    label="Date de validité"
                    nativeInputProps={{
                      type: "date",
                      name: field.name,
                      checked: field.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                      max: "2999/12/31",
                    }}
                  ></Input>
                );
              }}
            </Field>
            <RedErrorMessage name="validityLimit" />
          </div>
          <div className="fr-col-4">
            <Field name="organisation">
              {({ field }) => {
                return (
                  <Select
                    label="Organisme"
                    placeholder="Organisme"
                    nativeSelectProps={{
                      name: field.name,
                      value: values.organisation,
                      onChange: e => field.onChange(e),
                    }}
                    options={[
                      {
                        value: "AFNOR Certification",
                        label: "AFNOR Certification",
                      },
                      {
                        value: "QUALIBAT",
                        label: "QUALIBAT",
                      },
                      {
                        value: "GLOBAL CERTIFICATION",
                        label: "GLOBAL CERTIFICATION",
                      },
                    ]}
                  />
                );
              }}
            </Field>
            <RedErrorMessage name="organisation" />
          </div>
        </div>
      )}
    </div>
  );
}
