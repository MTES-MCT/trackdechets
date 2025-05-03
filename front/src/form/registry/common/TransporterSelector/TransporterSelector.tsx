import * as React from "react";
import { TransporterAccordion } from "../../../../Apps/Forms/Components/TransporterAccordion/TransporterAccordion";
import { TransporterForm } from "./TransporterForm";
import { TransportMode } from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../../builder/error";
import Alert from "@codegouvfr/react-dsfr/Alert";

type TransporterSelectorProps = {
  methods: UseFormReturn<any>;
  title?: string;
  disabled: boolean;
};

export const INITIAL_TRANSPORTER = {
  TransportMode: TransportMode.Road,
  CompanyType: "ETABLISSEMENT_FR",
  CompanyOrgId: "",
  RecepisseIsExempted: false,
  RecepisseNumber: "",
  CompanyName: "",
  CompanyAddress: "",
  CompanyPostalCode: "",
  CompanyCity: "",
  CompanyCountryCode: ""
};

/**
 * Ce composant reçoit les évenements au clic sur les boutons de l'accordéon et gère :
 * - l'ajout et la suppression de transporteurs à la liste.
 * - la permutation de deux transporteurs dans la liste.
 */
export function TransporterSelector({
  methods,
  title,
  disabled
}: TransporterSelectorProps) {
  const {
    fields: transporterFields,
    insert: insertTransporter,
    swap: swapTransporter,
    remove: removeTransporter
  } = useFieldArray({
    control: methods.control,
    name: `transporter`
  });
  const { errors } = methods.formState;

  // Le fonctionnement du groupe d'accordéons fait qu'un seul à la fois
  // peut être déplié. Cette variable permet d'enregistrer l'index du transporteur
  // qui doit être déplié. Si null, tous les accordéons sont repliés.
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(
    // Tous les accordéons sont repliés par défaut s'il y a plusieurs transporteurs
    transporterFields.length === 1 ? 0 : null
  );

  const insertNewTransporter = (idx: number) => {
    insertTransporter(idx, INITIAL_TRANSPORTER);
    setExpandedIdx(idx);
  };

  const disableAdd = transporterFields.length >= 5;

  return (
    <div className="fr-col">
      {title && <h5 className="fr-h5">{title}</h5>}
      {transporterFields.length === 0 && (
        <>
          <Button
            type="button"
            className="transporter__header__button"
            priority="secondary"
            iconPosition="right"
            iconId="ri-add-line"
            title="Ajouter"
            disabled={disabled}
            onClick={() => {
              insertNewTransporter(0);
            }}
          >
            Ajouter
          </Button>
          {errors?.transporter?.[0]?.CompanyOrgId && (
            <div className="fr-mt-2w">
              <Alert
                description={formatError(
                  errors?.transporter?.[0]?.CompanyOrgId
                )}
                severity="error"
                small
              />
            </div>
          )}
        </>
      )}
      {transporterFields.map((field, index) => {
        // Désactive le bouton permettant de remonter le transporteur dans
        // la liste s'il est le seul ou le premier, ou s'il a déjà pris en
        // charge le déchet, ou si le transporteur précédent a déjà pris en
        // charge le déchet
        const disableUp = transporterFields.length === 1 || index === 0;

        // Désactive le bouton permettant de descendre le transporteur dans
        // la liste s'il est le seul ou le dernier, ou s'il a déjà pris en charge
        // le déchet
        const disableDown =
          transporterFields.length === 1 ||
          index === transporterFields.length - 1;
        const name = methods.getValues(`transporter.${index}.CompanyName`);
        // Lorsqu'aucun établissement n'a été sélectionné, on affiche simplement
        // "N - Transporteur" où N est le numéro du transporteur dans la liste
        const accordionName = `${index + 1} - ${
          name && name.length > 0 ? name : "Transporteur"
        }`;
        return (
          <TransporterAccordion
            key={field.id}
            numero={index + 1}
            name={accordionName}
            hasError={!!errors?.transporter?.[index]}
            onTransporterAdd={() => {
              insertNewTransporter(index + 1);
            }}
            onTransporterDelete={() => {
              removeTransporter(index);
            }}
            onTransporterShiftDown={() => {
              const nextIndex = index + 1;
              if (nextIndex <= transporterFields.length - 1) {
                swapTransporter(index, nextIndex);
              }
            }}
            onTransporterShiftUp={() => {
              const nextIndex = index - 1;
              if (nextIndex >= 0) {
                swapTransporter(index, nextIndex);
              }
            }}
            onExpanded={() => {
              if (expandedIdx === index) {
                setExpandedIdx(null);
              } else {
                setExpandedIdx(index);
              }
            }}
            disableAdd={disableAdd}
            disableDelete={false}
            disableUp={disableUp}
            disableDown={disableDown}
            expanded={index === expandedIdx}
            deleteLabel={"Supprimer"}
          >
            <TransporterForm
              methods={methods}
              fieldName={`transporter`}
              index={index}
            />
          </TransporterAccordion>
        );
      })}
    </div>
  );
}
