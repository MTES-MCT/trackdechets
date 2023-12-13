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

type TransporterListProps = {
  // SIRET ou VAT de l'établissement courant
  orgId?: string;
  fieldName: string;
};

/**
 * Ce composant reçoit les évenements au clic sur les boutons de l'accordéon et gère :
 * - l'ajout et la suppression de transporteurs à la liste.
 * - la permutation de deux transporteurs dans la liste.
 */
export function TransporterList({ orgId, fieldName }: TransporterListProps) {
  const [field] = useField<CreateOrUpdateTransporterInput[]>({
    name: fieldName
  });

  const transporters = field.value;

  const [deleteFormTransporter, { loading: deleteFormTransporterLoading }] =
    useMutation<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER);

  return (
    <>
      <FieldArray
        name={fieldName}
        render={arrayHelpers => (
          <>
            {transporters.map((t, idx) => {
              // On crée un transporteur BSD en base qui nous permet d'initialiser le
              // state Formik. Les modifications qui sont faites ensuite dans le formulaire
              // ainsi que l'association du transporteur au bordereau sont gérés au
              // moment de la soumission du formulaire.
              const onTransporterAdd = () => {
                arrayHelpers.insert(idx + 1, initialFormTransporter);
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

              // On désactive la possibilité de supprimer le transporteur
              // s'il est le seul dans la liste
              const disableDelete = transporters.length === 1;

              // Désactive le bouton permettant de remonter le transporteur dans
              // la liste s'il est le seul ou le premier
              const disableUp = transporters.length === 1 || idx === 0;

              // Désactive le bouton permettant de descendre le transporteur dans
              // la liste s'il est le seul ou le dernier
              const disableDown =
                transporters.length === 1 || idx === transporters.length - 1;

              // Désactive la possibilité de replier le formulaire transporteur
              // s'il est le seul
              const disableFold = transporters.length === 1;

              const numero = idx + 1;

              // Lorsqu'aucun établissement n'a été sélectionné, on affiche "Transporteur N"
              // où N est le numéro du transporteur dans la liste
              const accordionName =
                t?.company?.name && t.company.name.length > 0
                  ? t.company.name
                  : `Transporteur ${numero}`;

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
                  disableDelete={disableDelete}
                  disableUp={disableUp}
                  disableDown={disableDown}
                  disableFold={disableFold}
                >
                  <TransporterForm
                    orgId={orgId}
                    fieldName={`${fieldName}[${idx}]`}
                  />
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
