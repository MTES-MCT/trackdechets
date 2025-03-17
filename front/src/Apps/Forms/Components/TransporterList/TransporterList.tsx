import * as React from "react";
import { FieldArray } from "formik";
import { TransporterForm } from "../TransporterForm/TransporterForm";
import { TransporterAccordion } from "../TransporterAccordion/TransporterAccordion";
import { BsdType } from "@td/codegen-ui";
import { Loader } from "../../../common/Components";
import { initialFormTransporter } from "../../../../form/bsdd/utils/initial-state";
import TransporterDisplay from "../TransporterDisplay/TransporterDisplay";
import { AnyTransporterInput } from "../../types";
import { useTransporters } from "../../hooks/useTransporters";
import { useDeleteTransporter } from "../../hooks/useDeleteTransporter";
import { initialTransporter } from "../../../common/data/initialState";
import Button from "@codegouvfr/react-dsfr/Button";

type TransporterListProps = {
  // SIRET ou VAT de l'établissement courant
  orgId?: string;
  fieldName: string;
  // Type de bordereau
  bsdType: BsdType;
};

/**
 * Ce composant reçoit les évenements au clic sur les boutons de l'accordéon et gère :
 * - l'ajout et la suppression de transporteurs à la liste.
 * - la permutation de deux transporteurs dans la liste.
 */
export function TransporterList<TransporterInput extends AnyTransporterInput>({
  orgId,
  fieldName,
  bsdType
}: TransporterListProps) {
  const transporters = useTransporters<TransporterInput>(fieldName, bsdType);

  const [deleteFormTransporter, { loading: deleteFormTransporterLoading }] =
    useDeleteTransporter(bsdType)!;

  // Le fonctionnement du groupe d'accordéons fait qu'un seul à la fois
  // peut être déplié. Cette variable permet d'enregistrer l'index du transporteur
  // qui doit être déplié. Si null, tous les accordéons sont repliés.
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(
    // Tous les accordéons sont repliés par défaut s'il y a plusieurs transporteurs
    transporters.length === 1 ? 0 : null
  );

  const initialTransporterData = React.useMemo(
    () =>
      bsdType === BsdType.Bsdd ? initialFormTransporter : initialTransporter,
    [bsdType]
  );

  return (
    <>
      <FieldArray
        name={fieldName}
        render={arrayHelpers => (
          <>
            {transporters.length === 0 && (
              // Ce cas peut se produire lors de la modification d'un BSDD
              // crée par API avec une liste de transporteurs vide (contrairement
              // au front TD qui initialise un premier transporteur à la création du BSDD).
              <Button
                type="button"
                className="transporter__header__button"
                priority="secondary"
                iconPosition="right"
                iconId="ri-add-line"
                title="Ajouter"
                onClick={() => {
                  arrayHelpers.insert(0, initialTransporterData);
                  setExpandedIdx(0);
                }}
              >
                Ajouter
              </Button>
            )}
            {transporters.map((t, idx) => {
              const onTransporterAdd = () => {
                arrayHelpers.insert(idx + 1, initialTransporterData);
                // replie tous les formulaire sauf celui du nouveau
                // transporteur qui vient d'être crée
                setExpandedIdx(idx + 1);
              };

              const onTransporterDelete = () => {
                if (t.id) {
                  // Supprime le transporteur en base et dans le state Formik
                  return deleteFormTransporter({
                    variables: { id: t.id },
                    onCompleted: () => {
                      arrayHelpers.remove(idx);
                      if (transporters.length === 1) {
                        arrayHelpers.insert(0, initialTransporterData);
                      }
                    }
                  });
                } else {
                  // Supprime le transporteur uniquement dans le state Formik
                  // puisqu'il n'existe pas encore en base
                  arrayHelpers.remove(idx);
                  if (transporters.length === 1) {
                    arrayHelpers.insert(0, initialTransporterData);
                  }
                }
              };

              const hasTakenOver = Boolean(t.takenOverAt);
              const previousHasTakenOver =
                idx > 0 ? Boolean(transporters[idx - 1].takenOverAt) : false;
              const nextHasTakenOver =
                idx < transporters.length - 1 &&
                Boolean(transporters[idx + 1].takenOverAt);

              // Désactive la possiblité d'ajouter un transporteur après le transporteur courant
              // si le nombre total de transporteurs est égal à 5 ou si le transporteur d'après
              // a pris en charge le déchet.
              const disableAdd = transporters.length >= 5 || nextHasTakenOver;

              // Désactive la possibilité de supprimer le transporteur
              // s'il est le seul dans la liste ou s'il a déjà pris en charge le déchet
              const disableDelete =
                hasTakenOver || (transporters.length === 1 && !t.company?.name);

              const deleteLabel =
                transporters.length === 1 ? "Effacer" : "Supprimer";

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
                  onExpanded={() => {
                    if (expandedIdx === idx) {
                      setExpandedIdx(null);
                    } else {
                      setExpandedIdx(idx);
                    }
                  }}
                  disableAdd={disableAdd}
                  disableDelete={disableDelete}
                  disableUp={disableUp}
                  disableDown={disableDown}
                  expanded={idx === expandedIdx}
                  deleteLabel={deleteLabel}
                >
                  {t.takenOverAt ? (
                    <TransporterDisplay transporter={t} />
                  ) : (
                    <TransporterForm
                      orgId={orgId}
                      fieldName={`${fieldName}[${idx}]`}
                      bsdType={bsdType}
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
