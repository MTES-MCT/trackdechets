import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";
import Tooltip from "../common/components/Tooltip";
import { CompanyType } from "@td/codegen-ui";
import styles from "./CompanyType.module.scss";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";

export const COMPANY_CONSTANTS = [
  {
    value: CompanyType.Producer,
    label: "Producteur de déchets : producteurs de déchets, y compris T&S",
    helpText:
      "Tous les établissements produisant des déchets et producteurs subséquents. Exemples: Ateliers de réparation véhicules, laboratoires, ateliers de traitement de surfaces, détenteurs d'équipements contenant des fluides frigorigènes et les opérateurs, producteurs de DASRI (hôpitaux, EHPAD, médecin, infirmier(e), tatoueurs, dentiste, etc.), maitre ouvrage amiante, etc. Les ménages sont exclus de la traçabilité. Un intermédiaire est un établissement qui a besoin d'avoir accès au bordereau, avec l'accord des parties prenantes dudit BSD (exemple : un maître d'oeuvre ou un intervenant tiers)."
  },
  {
    value: CompanyType.Collector,
    label: "Installation de Tri, transit regroupement de déchets",
    helpText:
      "Installations sur lesquelles sont regroupés, triés ou en transit les déchets dangereux et/ou non dangereux - installations relevant des rubriques suivantes de la nomenclature ICPE:  2711, 2713, 2714, 2715, 2716, 2718, 2719, 2731, 2792-1, 2793-1, 2793-2, 2797-1, 2798."
  },
  {
    value: CompanyType.WasteCenter,
    label:
      "Installation de collecte de déchets apportés par le producteur initial",
    helpText:
      "Déchetteries et installations relevant de la rubrique 2710 de la nomenclature ICPE"
  },
  {
    value: CompanyType.WasteVehicles,
    label:
      "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)",
    helpText:
      "Casse automobile, installations d'entreposage, dépollution, démontage de tout type de véhicules hors d'usage - installations relevant de la rubrique 2712 de la nomenclature ICPE"
  },
  {
    value: CompanyType.Wasteprocessor,
    label: "Installation de traitement",
    helpText:
      "Installations sur lesquelles sont traités les déchets, et relevant des rubriques suivantes de la nomenclature ICPE :  2720, 2730, 2740, 2750, 2751, 2752, 2760, 2770, 2771, 2780, 2781, 2782, 2790, 2791, 2792-2, 2793-3, 2794, 2795, 2797-2 et 3510, 3520, 3531, 3532, 3540, 3550, 3560."
  },
  {
    value: CompanyType.Transporter,
    label: "Transporteur",
    helpText:
      "Entreprises de transport routier immatriculées au registre national des transports, ou transporteurs pour compte propre; disposant d'un récépissé de déclaration en Préfecture de l'activité de transport par route de déchets"
  },
  {
    value: CompanyType.Trader,
    label: "Négociant",
    helpText:
      "Négociant, prenant part à la relation producteur / traiteur, disposant d'un récépissé préfectoral"
  },
  {
    value: CompanyType.Broker,
    label: "Courtier",
    helpText:
      "Courtier, acteur de la gestion des déchets qui organise la valorisation ou l'élimination de déchets pour le compte de tiers, disposant d'un récépissé préfectoral"
  },
  {
    value: CompanyType.EcoOrganisme,
    label: "Éco-organisme",
    helpText:
      "Société prenant en charge la gestion des déchets, dans le cadre de la REP (Responsabilité élargie du producteur)"
  },
  {
    value: CompanyType.Worker,
    label: "Entreprise de travaux amiante",
    helpText:
      "Entreprise qui réalise des travaux amiante relevant de la sous-section 3 ou 4, conformément aux dispositions des articles R.4412-94 à 146 du code du travail"
  },
  {
    value: CompanyType.Crematorium,
    label: "Crématorium",
    helpText:
      "Un crématorium autorisé prend en charge l'incinération des pièces anatomiques d'origine humaine"
  }
];

interface CompanyTypeFieldProps {
  handleChange(e, arrayHelpers, companyType, value): void;
}

export default function CompanyTypeField({
  field: { name, value },
  id,
  label,
  handleChange,
  subfields,
  ...props
}: FieldProps & {
  label: string;
  subfields?: object;
} & InputHTMLAttributes<HTMLInputElement> &
  CompanyTypeFieldProps) {
  return (
    <FieldArray
      name={name}
      render={arrayHelpers => (
        <>
          <div className="fr-grid-row fr-mb-2w">
            <span className="fr-text">Profil</span>
          </div>
          <div className="fr-container-fluid">
            {COMPANY_CONSTANTS.map((companyType, idx) => (
              <div key={idx}>
                <div
                  className="fr-grid-row fr-grid-row--gutters"
                  key={companyType.value}
                >
                  <div className="fr-col-11">
                    <Checkbox
                      disabled={props.disabled}
                      options={[
                        {
                          label: companyType.label,
                          nativeInputProps: {
                            name: name,
                            defaultChecked: value.includes(companyType.value),
                            onClick: e =>
                              handleChange(e, arrayHelpers, companyType, value)
                          }
                        }
                      ]}
                    />
                  </div>

                  <div className="fr-col-1">
                    <Tooltip msg={companyType.helpText} />
                  </div>
                </div>
                {subfields?.[companyType.value] ? (
                  <div className={styles.subfields}>
                    <div className="fr-grid-row">
                      {subfields?.[companyType.value]}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    />
  );
}
