import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Field } from "formik";
import React from "react";

import { WASTE_PROCESSOR_OPTIONS } from "../../common/utils";

/**
 * wasteProcessorTypes Formik fields for company creation
 */
export default function AccountCompanyAddWasteProcessor() {
  return (
    <div className="fr-container" style={{ paddingTop: "4px" }}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <Field name="wasteProcessorTypes">
            {({ field }) => {
              return (
                <Checkbox
                  options={WASTE_PROCESSOR_OPTIONS.map(option => ({
                    label: option.label,
                    nativeInputProps: {
                      name: field.name,
                      value: option.value,
                      onChange: field.onChange,
                      onBlur: field.onBlur
                    }
                  }))}
                />
              );
            }}
          </Field>
        </div>
      </div>
    </div>
  );
}
