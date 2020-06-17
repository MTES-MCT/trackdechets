import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";
import Tooltip from "../common/Tooltip";

export const COMPANY_TYPES = [
  { value: "PRODUCER", label: "Producteur de déchets" },
  {
    value: "COLLECTOR",
    label: "Installation de Transit, regroupement ou tri de déchets",
    helpText:
      "Installations sur lesquelles sont regroupés, triés ou en transit les déchets dangereux et/ou non dangereux - installations relevant des rubriques suivantes de la nomenclature ICPE:  2711, 2713, 2714, 2715, 2716, 2718, 2719, 2731, 2792-1, 2793-1, 2793-2, 2797-1, 2798.",
  },
  {
    value: "WASTE_CENTER",
    label:
      "Installation de collecte de déchets apportés par le producteur initial",
    helpText:
      "Déchetteries et installations relevant de la rubrique 2710 de la nomenclature ICPE",
  },
  {
    value: "WASTE_VEHICLES",
    label:
      "Installation d'entreposage, dépollution, démontage, découpage de VHU",
    helpText:
      "Casse automobile, installations d'entreposage, dépollution, démontage de tout type de véhicules hors d'usage - installations relevant de la rubrique 2712 de la nomenclature ICPE",
  },
  {
    value: "WASTEPROCESSOR",
    label: "Installation de traitement",
    helpText:
      "Installations sur lesquelles sont traités les déchets, et relevant des rubriques suivantes de la nomenclature ICPE :  2720, 2730, 2740, 2750, 2751, 2752, 2760, 2770, 2771, 2780, 2781, 2782, 2790, 2791, 2792-2, 2793-3, 2794, 2795, 2797-2 et 3510, 3520, 3531, 3532, 3540, 3550, 3560.",
  },
  {
    value: "TRANSPORTER",
    label: "Transporteur",
    helpText:
      "Transporteur de déchets (dangereux) disposant d'un récépissé préfectoral",
  },
  {
    value: "TRADER",
    label: "Négociant",
    helpText:
      "Négociant, prenant part à la relation producteur / traiteur, disposant d'un récépissé préfectoral",
  },
];

export default function CompanyType({
  field: { name, value },
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldArray
      name={name}
      render={arrayHelpers => (
        <fieldset className={name + "-fieldset"}>
          {COMPANY_TYPES.map((p, idx) => (
            <div key={idx}>
              <label style={{ display: "inline-block" }} key={p.value}>
                <input
                  type="checkbox"
                  name={name}
                  value={p.value}
                  checked={value.indexOf(p.value) > -1}
                  onChange={e => {
                    if (e.target.checked) arrayHelpers.push(p.value);
                    else {
                      const idx = value.indexOf(p.value);
                      arrayHelpers.remove(idx);
                    }
                  }}
                />
                {p.label}
                <br />
              </label>
              <Tooltip msg={p.helpText} />
            </div>
          ))}
        </fieldset>
      )}
    />
  );
}
