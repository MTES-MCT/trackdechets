import * as React from "react";
import { useField } from "formik";
import {
  Bsff,
  BsffFicheIntervention,
  BsffPackagingInput,
  BsffWeightInput,
  BsffType
} from "@td/codegen-ui";
import Tooltip from "../../common/components/Tooltip";
import { getInitialState } from "./utils/initial-state";

const options = [
  {
    value: BsffType.CollectePetitesQuantites,
    label:
      "Un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides) lors d'opérations sur les équipements en contenant de ses clients"
  },
  {
    value: BsffType.TracerFluide,
    label:
      "Un détenteur de contenant(s) de déchets de fluides à tracer (sans fiche d'intervention)",
    tooltip:
      "Exemple : Centre VHU (fluides retirés des VHU), installation qui trace un contenant après rupture de traçabilité"
  },
  {
    value: BsffType.Groupement,
    label: "Une installation dans le cadre d'un regroupement"
  },
  {
    value: BsffType.Reconditionnement,
    label: "Une installation dans le cadre d'un reconditionnement"
  },
  {
    value: BsffType.Reexpedition,
    label: "Une installation dans le cadre d'une réexpédition"
  }
];

const initialState = getInitialState();

export function BsffTypeSelector() {
  const [{ value: id }] = useField<BsffType>("id");
  const [{ value: type }, , { setValue: setType }] = useField<BsffType>("type");
  const [{ value: packagings }, , { setValue: setPackagings }] =
    useField<BsffPackagingInput[]>("packagings");
  const [, , { setValue: setWeight }] = useField<BsffWeightInput>("weight");
  const [{ value: ficheInterventions }, , { setValue: setFicheInterventions }] =
    useField<BsffFicheIntervention[]>("ficheInterventions");
  const [{ value: previousPackagings }, , { setValue: setPreviousBsffs }] =
    useField<Bsff[]>("previousPackagings");
  const [, , { setValue: setWasteCode }] = useField<string | null>(
    "waste.code"
  );

  return (
    <>
      <h4 className="form__section-heading">Type de BSFF</h4>

      <div className="form__row">
        <p>L'émetteur du BSFF est :</p>
      </div>

      <div className="form__row">
        {options.map(option => (
          <React.Fragment key={option.value}>
            <label>
              <input
                type="radio"
                disabled={!!id}
                className="td-radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => {
                  if (
                    [
                      BsffType.TracerFluide,
                      BsffType.CollectePetitesQuantites
                    ].includes(option.value)
                  ) {
                    const errors = [
                      ...(previousPackagings.length > 0
                        ? [
                            `Ce BSFF fait actuellement référence à ${previousPackagings.length} précédent(s) contenant(s). Hors le nouveau type de BSFF que vous avez choisit ne permet pas de reéxpédier, grouper ou reconditionner d'autres contenants.`,
                            `Pour continuer, ces BSFFs vont être dissociés.`
                          ]
                        : [])
                    ];
                    if (
                      errors.length > 0 &&
                      !window.confirm(
                        [...errors, `Souhaitez-vous continuer ?`].join("\n\n")
                      )
                    ) {
                      return;
                    }

                    setPreviousBsffs([]);
                    setPackagings([]);
                    setWeight({ value: 0, isEstimate: false });
                    setFicheInterventions([]);
                    setWasteCode(initialState.waste?.code!);
                    setType(option.value);
                    return;
                  }

                  if (option.value === BsffType.Groupement) {
                    const errors = [
                      ...(previousPackagings.length > 0
                        ? [
                            `Ce BSFF fait actuellement référénce à ${previousPackagings.length} précédents contenants. Hors certains d'entre eux peuvent avoir déclaré un traitement incompatible avec le groupement.`,
                            `Pour continuer, ces BSFFs vont être dissociés.`
                          ]
                        : []),
                      ...(packagings.length > 0
                        ? [
                            `Ce BSFF liste actuellement ${packagings.length} contenants. Hors le groupement ne permet pas de changer les contenants des BSFFs groupés.`,
                            `Pour continuer, les contenants actuels vont être retirés.`
                          ]
                        : []),
                      ...(ficheInterventions.length > 0
                        ? [
                            `Ce BSFF liste actuellement ${ficheInterventions.length} fiches d'intervention. Hors le groupement ne fait pas suite à une intervention.`,
                            `Pour continuer, les fiches d'intervention vont être dissociées.`
                          ]
                        : [])
                    ];
                    if (
                      errors.length > 0 &&
                      !window.confirm(
                        [...errors, `Souhaitez-vous continuer ?`].join("\n\n")
                      )
                    ) {
                      return;
                    }

                    setPreviousBsffs([]);
                    setPackagings([]);
                    setWeight({ value: 0, isEstimate: false });
                    setFicheInterventions([]);
                    setWasteCode("");
                    setType(option.value);
                    return;
                  }

                  if (option.value === BsffType.Reconditionnement) {
                    const errors = [
                      ...(previousPackagings.length > 0
                        ? [
                            `Ce BSFF fait actuellement référénce à ${previousPackagings.length} précédents contenants. Hors certains d'entre eux peuvent avoir déclaré un traitement incompatible avec le groupement.`,
                            `Pour continuer, ces BSFFs vont être dissociés.`
                          ]
                        : []),
                      ...(ficheInterventions.length > 0
                        ? [
                            `Ce BSFF liste actuellement ${ficheInterventions.length} fiches d'intervention. Hors le groupement ne fait pas suite à une intervention.`,
                            `Pour continuer, les fiches d'intervention vont être dissociées.`
                          ]
                        : [])
                    ];
                    if (
                      errors.length > 0 &&
                      !window.confirm(
                        [...errors, `Souhaitez-vous continuer ?`].join("\n\n")
                      )
                    ) {
                      return;
                    }

                    setPreviousBsffs([]);
                    setPackagings([]);
                    setWeight({ value: 0, isEstimate: false });
                    setFicheInterventions([]);
                    setWasteCode("");
                    setType(option.value);
                    return;
                  }

                  if (option.value === BsffType.Reexpedition) {
                    const errors = [
                      ...(previousPackagings.length > 0
                        ? [
                            `Ce BSFF fait actuellement référénce à ${previousPackagings.length} précédents contenants. Hors certains d'entre eux peuvent avoir déclaré un traitement incompatible avec une réexpédition.`,
                            `Pour continuer, ces BSFFs vont être dissociés.`
                          ]
                        : []),
                      ...(packagings.length > 0
                        ? [
                            `Ce BSFF liste actuellement ${packagings.length} contenants. Hors la réexpédition ne permet pas de changer les contenants du BSFF réexpédié.`,
                            `Pour continuer, les contenants actuels vont être retirés.`
                          ]
                        : []),
                      ...(ficheInterventions.length > 0
                        ? [
                            `Ce BSFF liste actuellement ${ficheInterventions.length} fiches d'intervention. Hors la réexpédition ne fait pas suite à une intervention.`,
                            `Pour continuer, les fiches d'intervention vont être dissociées.`
                          ]
                        : [])
                    ];
                    if (
                      errors.length > 0 &&
                      !window.confirm(
                        [...errors, `Souhaitez-vous continuer ?`].join("\n\n")
                      )
                    ) {
                      return;
                    }

                    setPreviousBsffs([]);
                    setPackagings([]);
                    setWeight({ value: 0, isEstimate: false });
                    setFicheInterventions([]);
                    setWasteCode("");
                    setType(option.value);
                    return;
                  }

                  throw new Error(
                    `The logic for the bsff type ${option.value} is not implemented`
                  );
                }}
              />{" "}
              {option.label}
              {option.tooltip && <Tooltip msg={option.tooltip} />}
            </label>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
