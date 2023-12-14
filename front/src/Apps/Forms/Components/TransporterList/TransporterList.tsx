import * as React from "react";
import { FieldArray, useField } from "formik";
import { TransporterForm } from "../TransporterForm/TransporterForm";
import { TransporterAccordion } from "../TransporterAccordion/TransporterAccordion";
import { Mutation, MutationDeleteFormTransporterArgs } from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import { DELETE_FORM_TRANSPORTER } from "../query";
import { Loader } from "../../../common/Components";
import {
  CreateOrUpdateTransporterInput,
  initialFormTransporter
} from "../../../../form/bsdd/utils/initial-state";
import TransporterDisplay from "../TransporterDisplay/TransporterDisplay";

type TransporterListProps = {
  // SIRET ou VAT de l'établissement courant
  orgId?: string;
  // Identifiant du bordereau (le cas échant)
  bsdId?: string | null;
  // Nom du champ Formik stockant la liste des transporteurs
  fieldName: string;
};

/**
 * Ce composant reçoit les évenements au clic sur les boutons de l'accordéon et gère :
 * - l'ajout et la suppression de transporteurs à la liste.
 * - la permutation de deux transporteurs dans la liste.
 */
export function TransporterList({
  orgId,
  fieldName,
  bsdId
}: TransporterListProps) {
  const [field] = useField<CreateOrUpdateTransporterInput[]>({
    name: fieldName
  });

  const transporters = field.value;

  const [deleteFormTransporter, { loading: deleteFormTransporterLoading }] =
    useMutation<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER);

  // `defaultExpanded` contrôle l'état initial des accordéons
  const [defaultExpanded, setDefaultExpanded] = React.useState(
    // Tous les accordéons sont repliés en cas d'update du bordereau
    // s'il y a plusieurs transporteurs
    !(Boolean(bsdId) && transporters.length > 1)
  );

  const disableAdd = transporters.length >= 5;

  return (
    <>
      <FieldArray
        name={fieldName}
        render={arrayHelpers => (
          <>
            {transporters.map((t, idx) => {
              const onTransporterAdd = () => {
                arrayHelpers.insert(idx + 1, initialFormTransporter);
                // lorsqu'on ajoute un nouveau transporteur, on souhaite
                // que le formulaire soit déplié
                setDefaultExpanded(true);
              };

              const onTransporterDelete = () => {
                if (t.id) {
                  // Supprime le transporteur en base et dans le state Formik
                  return deleteFormTransporter({
                    variables: { id: t.id },
                    onCompleted: () => arrayHelpers.remove(idx)
                  });
                } else {
                  // Supprime le transporteur uniquement dans le state Formik
                  // puisqu'il n'existe pas encore en base
                  arrayHelpers.remove(idx);
                }
              };

              const hasTakenOver = Boolean(t.takenOverAt);
              const previousHasTakenOver =
                idx > 0 ? Boolean(transporters[idx - 1].takenOverAt) : false;

              // Désactive la possibilité de supprimer le transporteur
              // s'il est le seul dans la liste ou s'il a déjà pris en charge le déchet
              const disableDelete = hasTakenOver || transporters.length === 1;

              // Désactive le bouton permettant de remonter le transporteur dans
              // la liste s'il est le seul ou le premier, ou s'il a déjà pris en
              // charge le déchet, ou si le transporteur précédent a déjà pris en
              // charge le déchet
              const disableUp =
                hasTakenOver ||
                previousHasTakenOver ||
                transporters.length === 1 ||
                idx === 0;

              // Désactive le bouton permettant de descendre le transporteur dans
              // la liste s'il est le seul ou le dernier, ou s'il a déjà pris en charge
              // le déchet
              const disableDown =
                hasTakenOver ||
                transporters.length === 1 ||
                idx === transporters.length - 1;

              const numero = idx + 1;

              // Lorsqu'aucun établissement n'a été sélectionné, on affiche simplement
              // "N - Transporteur" où N est le numéro du transporteur dans la liste
              const accordionName = `${numero} - ${
                t?.company?.name && t.company.name.length > 0
                  ? t.company.name
                  : "Transporteur"
              }`;

              return (
                <TransporterAccordion
                  key={idx}
                  numero={numero}
                  name={accordionName}
                  onTransporterAdd={onTransporterAdd}
                  onTransporterDelete={onTransporterDelete}
                  onTransporterShiftDown={() => {
                    const nextIndex = idx + 1;
                    if (nextIndex <= transporters.length - 1) {
                      arrayHelpers.swap(idx, nextIndex);
                    }
                  }}
                  onTransporterShiftUp={() => {
                    const nextIndex = idx - 1;
                    if (nextIndex >= 0) {
                      arrayHelpers.swap(idx, nextIndex);
                    }
                  }}
                  disableAdd={disableAdd}
                  disableDelete={disableDelete}
                  disableUp={disableUp}
                  disableDown={disableDown}
                  defaultExpanded={defaultExpanded}
                >
                  {t.takenOverAt ? (
                    <TransporterDisplay transporter={t} />
                  ) : (
                    <TransporterForm
                      orgId={orgId}
                      fieldName={`${fieldName}[${idx}]`}
                    />
                  )}
                </TransporterAccordion>
              );
            })}
          </>
        )}
      ></FieldArray>
      {deleteFormTransporterLoading && <Loader />}
    </>
  );
}
