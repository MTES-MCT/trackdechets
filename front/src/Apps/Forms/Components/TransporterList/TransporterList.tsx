import * as React from "react";
import { FieldArray, useField } from "formik";
import { TransporterForm } from "../TransporterForm/TransporterForm";
import { TransporterAccordion } from "../TransporterAccordion/TransporterAccordion";
import { Mutation, MutationDeleteFormTransporterArgs } from "codegen-ui";
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

              const numero = idx + 1;

              // Lorsqu'aucun établissement n'a été sélectionné, on affiche "Transporteur N"
              // où N est le numéro du transporteur dans la liste
              // const accordionName =
              //   t?.company?.name ?? `Transporteur ${numero}`;

              // On affiche uniquement `Transporteur` en attente de l'implémentation
              // du multi-modal
              const accordionName = "Transporteur";

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