import { BsdaPicker } from "form/bsda/components/bsdaPicker/BsdaPicker";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import { Bsda, BsdaType } from "generated/graphql/types";
import React, { useEffect } from "react";

type Props = { disabled: boolean };

const OPTIONS = [
  {
    title: "la collecte amiante sur un chantier",
    value: BsdaType.OtherCollections,
  },
  {
    title: "la collecte en déchèterie relevant de la rubrique 2710-1",
    value: BsdaType.Collection_2710,
  },
  {
    title:
      "le groupement de déchets entreposés sur un site relevant de la rubrique 2718 (ou 2710-1)",
    value: BsdaType.Gathering,
  },
  {
    title: "la réexpédition après entreposage provisoire",
    value: BsdaType.Reshipment,
  },
];

export function Type({ disabled }: Props) {
  const { setFieldValue } = useFormikContext<Bsda>();
  const [{ value: type }] = useField<BsdaType>("type");

  useEffect(() => {
    if (type !== BsdaType.Gathering) {
      setFieldValue("grouping", []);
    }
    if (type !== BsdaType.Reshipment) {
      setFieldValue("forwarding", null);
    }
  }, [type, setFieldValue]);

  return (
    <>
      <h4 className="form__section-heading">Type de BSDA</h4>

      <div className="form__row">
        <p>J'édite un BSDA pour :</p>
      </div>

      <div className="form__row">
        {OPTIONS.map(option => (
          <Field
            key={option.value}
            disabled={disabled}
            name="type"
            id={option.value}
            label={option.title}
            component={RadioButton}
          />
        ))}
      </div>
      <div className="tw-mt-4">
        {BsdaType.Gathering === type && (
          <BsdaPicker name="grouping" code="D 13" />
        )}
        {BsdaType.Reshipment === type && (
          <BsdaPicker name="forwarding" code="D 15" />
        )}
      </div>
    </>
  );
}
