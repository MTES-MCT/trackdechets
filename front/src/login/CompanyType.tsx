import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";
import Tooltip from "common/components/Tooltip";
import { CompanyType } from "../generated/graphql/types";

export const COMPANY_TYPES = [
  {
    value: CompanyType.Producer,
    label: "Producteur de déchets",
  },
  {
    value: CompanyType.Collector,
    label: "Installation de Transit, regroupement ou tri de déchets",
    helpText:
      "Installations sur lesquelles sont regroupés, triés ou en transit les déchets dangereux et/ou non dangereux - installations relevant des rubriques suivantes de la nomenclature ICPE:  2711, 2713, 2714, 2715, 2716, 2718, 2719, 2731, 2792-1, 2793-1, 2793-2, 2797-1, 2798.",
  },
  {
    value: CompanyType.WasteCenter,
    label:
      "Installation de collecte de déchets apportés par le producteur initial",
    helpText:
      "Déchetteries et installations relevant de la rubrique 2710 de la nomenclature ICPE",
  },
  {
    value: CompanyType.WasteVehicles,
    label:
      "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)",
    helpText:
      "Casse automobile, installations d'entreposage, dépollution, démontage de tout type de véhicules hors d'usage - installations relevant de la rubrique 2712 de la nomenclature ICPE",
  },
  {
    value: CompanyType.Wasteprocessor,
    label: "Installation de traitement",
    helpText:
      "Installations sur lesquelles sont traités les déchets, et relevant des rubriques suivantes de la nomenclature ICPE :  2720, 2730, 2740, 2750, 2751, 2752, 2760, 2770, 2771, 2780, 2781, 2782, 2790, 2791, 2792-2, 2793-3, 2794, 2795, 2797-2 et 3510, 3520, 3531, 3532, 3540, 3550, 3560.",
  },
  {
    value: CompanyType.Transporter,
    label: "Transporteur",
    helpText:
      "Transporteur de déchets (dangereux) disposant d'un récépissé préfectoral",
  },
  {
    value: CompanyType.Trader,
    label: "Négociant",
    helpText:
      "Négociant, prenant part à la relation producteur / traiteur, disposant d'un récépissé préfectoral",
  },
  {
    value: CompanyType.Broker,
    label: "Courtier",
    helpText:
      "Courtier, acteur de la gestion des déchets qui organise la valorisation ou l'élimination de déchets pour le compte de tiers, disposant d'un récépissé préfectoral",
  },
  {
    value: CompanyType.EcoOrganisme,
    label: "Éco-organisme",
    helpText:
      "Société prenant en charge la gestion des déchets, dans le cadre de la REP (Responsabilité élargie du producteur)",
  },
];

export default function CompanyTypeField({
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
          {COMPANY_TYPES.map((companyType, idx) => (
            <div key={idx}>
              <label
                className="tw-flex tw-items-center"
                key={companyType.value}
              >
                <input
                  type="checkbox"
                  name={name}
                  className="td-checkbox"
                  value={companyType.value}
                  checked={value.includes(companyType.value)}
                  onChange={e => {
                    if (e.target.checked) {
                      arrayHelpers.push(companyType.value);
                    } else {
                      const idx = value.indexOf(companyType.value);
                      arrayHelpers.remove(idx);
                    }
                  }}
                />
                {companyType.label}
                <Tooltip msg={companyType.helpText} />
              </label>
            </div>
          ))}
        </fieldset>
      )}
    />
  );
}
