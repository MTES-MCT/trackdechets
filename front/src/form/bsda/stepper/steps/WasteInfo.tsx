import React from "react";
import { Field, useFormikContext } from "formik";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import Packagings from "form/bsda/components/packagings/Packagings";
import Tooltip from "common/components/Tooltip";
import { Bsda, BsdaConsistence, BsdaType } from "generated/graphql/types";
import TagsInput from "common/components/tags-input/TagsInput";
import { FieldSwitch } from "common/components";

export const BSDA_WASTE_CODES = [
  {
    code: "06 07 01*",
    description: "Déchets contenant de l'amiante provenant de l'électrolyse",
  },
  {
    code: "06 13 04*",
    description: "Déchets provenant de la transformation de l'amiante",
  },
  {
    code: "08 01 17*",
    description:
      "déchets provenant du décapage de peintures ou vernis contenant des solvants organiques ou autres substances dangereuses",
  },
  {
    code: "08 04 09*",
    description:
      "déchets de colles et mastics contenant des solvants organiques ou d'autres substances dangereuses",
  },
  {
    code: "10 13 09*",
    description:
      "déchets provenant de la fabrication d'amiante-ciment contenant de l'amiante",
  },
  {
    code: "12 01 16*",
    description: "déchets de grenaillage contenant des substances dangereuses",
  },
  {
    code: "15 01 11*",
    description:
      "emballages métalliques contenant une matrice poreuse solide dangereuse (par exemple amiante), y compris des conteneurs à pression vides",
  },
  {
    code: "15 02 02*",
    description:
      "absorbants, matériaux filtrants (y compris les filtres à huile non spécifiés ailleurs), chiffons d'essuyage et vêtements de protection contaminés par des substances dangereuses",
  },
  { code: "16 01 11*", description: "patins de freins contenant de l'amiante" },
  {
    code: "16 02 12*",
    description: "équipements mis au rebut contenant de l'amiante libre",
  },
  {
    code: "16 02 13*",
    description:
      "équipements mis au rebut contenant des composants dangereux (3) autres que ceux visés aux rubriques 16 02 09 à 16 02 12",
  },
  {
    code: "16 03 03*",
    description:
      "déchets d'origine minérale contenant des substances dangereuses",
  },
  {
    code: "17 01 06*",
    description:
      "mélanges ou fractions séparées de béton, briques, tuiles et céramiques contenant des substances dangereuses",
  },
  {
    code: "17 02 04*",
    description:
      "bois, verre et matières plastiques contenant des substances dangereuses ou contaminés par de telles substances",
  },
  {
    code: "17 03 01*",
    description: "mélanges bitumineux contenant du goudron",
  },
  {
    code: "17 04 09*",
    description:
      "Déchets métalliques contaminés par des substances dangereuses",
  },
  {
    code: "17 04 10*",
    description:
      "Câbles contenant des hydrocarbures, du goudron ou d'autres substances dangereuses",
  },
  {
    code: "17 05 03*",
    description: "Terres et cailloux contenant des substances dangereuses",
  },
  {
    code: "17 05 05*",
    description: "boues de dragage contenant des substances dangereuses",
  },
  {
    code: "17 05 07*",
    description: "ballast de voie contenant des substances dangereuses",
  },
  {
    code: "17 06 01*",
    description: "matériaux d'isolation contenant de l'amiante",
  },
  {
    code: "17 06 03*",
    description:
      "autres matériaux d'isolation à base de ou contenant des substances dangereuses",
  },
  {
    code: "17 06 05*",
    description: "matériaux de construction contenant de l'amiante",
  },
  {
    code: "17 08 01*",
    description:
      "matériaux de construction à base de gypse contaminés par des substances dangereuses",
  },
  {
    code: "17 09 03*",
    description:
      "autres déchets de construction et de démolition (y compris en mélange) contenant des substances dangereuses",
  },
];

export function WasteInfo({ disabled }) {
  const { values } = useFormikContext<Bsda>();
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;

  if (isEntreposageProvisoire) {
    return (
      <div className="notification">
        Vous effectuez une réexpédition. Les informations sur le déchet ont été
        automatiquement reportées et ne sont pas modifiables.
      </div>
    );
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <label>Code déchet</label>
        <Field as="select" name="waste.code" className="td-select">
          <option />
          {BSDA_WASTE_CODES.map(item => (
            <option value={item.code} key={item.code}>
              {item.code} - {item.description}
            </option>
          ))}
        </Field>
      </div>

      <WasteInfoWorker disabled={disabled} />
    </>
  );
}

export function WasteInfoWorker({ disabled }) {
  const { values } = useFormikContext<Bsda>();
  const isDechetterie = values?.type === "COLLECTION_2710";

  return (
    <>
      <div className="form__row">
        <label>
          Code famille
          <Field
            as="select"
            name="waste.familyCode"
            className="td-select"
            disabled={disabled}
          >
            <option value="...">Sélectionnez une valeur...</option>
            <option value="1">
              1 - amiante pur utilisé en bourrage ou en sac
            </option>
            <option value="2">
              2 - amiante mélangé dans des poudres ou des produits minéraux sans
              liaison forte
            </option>
            <option value="3">
              3 - amiante intégré dans des liquides ou des solutions visqueuses
            </option>
            <option value="4">4 - amiante tissé ou tressé</option>
            <option value="5">5 - amiante en feuilles ou en plaques</option>
            <option value="6">6 - amiante lié à des matériaux inertes</option>
            <option value="7">
              7 - amiante noyé dans une résine ou une matière plastique
            </option>
            <option value="8">
              8 - amiante dans des matériels et équipements
            </option>
            <option value="9">
              9 - tous les matériaux contaminés susceptibles d'émettre des
              fibres
            </option>
          </Field>
        </label>
      </div>

      <div className="form__row">
        <label>
          Nom du matériau
          <Field
            disabled={disabled}
            type="text"
            name="waste.materialName"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Mention au titre des règlements ADR/RID/ADN/IMDG (Optionnel)
          <Field
            disabled={disabled}
            type="text"
            name="waste.adr"
            className="td-input"
          />
        </label>
      </div>

      <div className="form__row" style={{ flexDirection: "row" }}>
        <Field
          type="checkbox"
          component={FieldSwitch}
          name="waste.pop"
          label={
            <span>
              Le déchet contient des{" "}
              <a
                className="tw-underline"
                href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
                target="_blank"
                rel="noopener noreferrer"
              >
                polluants organiques persistants
              </a>
            </span>
          }
        />
        <div className="tw-ml-1">
          <Tooltip
            msg="Le terme POP recouvre un ensemble de substances organiques qui
        possèdent 4 propriétés : persistantes, bioaccumulables, toxiques et mobiles."
          />
        </div>
      </div>

      <h4 className="form__section-heading">Conditionnement</h4>
      <Field disabled={disabled} name="packagings" component={Packagings} />

      <div className="form__row">
        <label>
          Consistance
          <Field
            as="select"
            name="waste.consistence"
            id="id_mode"
            className="td-select td-input--small"
            disabled={disabled}
          >
            <option value={BsdaConsistence.Solide}>Solide</option>
            <option value={BsdaConsistence.Pulverulent}>Pulvérulents</option>
            <option value={BsdaConsistence.Other}>Autre</option>
          </Field>
        </label>
      </div>

      <h4 className="form__section-heading">Quantité</h4>
      <div className="form__row">
        <label>
          Quantité (en tonnes)
          <Field
            disabled={disabled}
            component={NumberInput}
            name="weight.value"
            className="td-input td-input--small"
            min="0"
            step="0.001"
          />
        </label>

        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="weight.isEstimate"
              className="td-checkbox"
            />
            Ce poids est estimé
          </label>
        </div>
      </div>

      {!isDechetterie && (
        <>
          <h4 className="form__section-heading">
            Numéros de scellés{" "}
            <Tooltip msg="Ils peuvent être remplis au moment de la signature. Vous n'êtes pas obligé de les compléter à la création du bordereau." />
          </h4>
          <div className="form__row">
            <label>
              Numéros de scellés
              <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
              <TagsInput name="waste.sealNumbers" disabled={disabled} />
            </label>
          </div>
          <p>
            Vous avez saisi {values.waste?.sealNumbers?.length ?? 0} scellé(s)
            et{" "}
            {values.packagings?.reduce((prev, cur) => prev + cur.quantity, 0) ??
              0}{" "}
            conditionnement(s).
          </p>
        </>
      )}
    </>
  );
}
