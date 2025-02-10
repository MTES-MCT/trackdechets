import React, { useState } from "react";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import {
  AdministrativeTransfer,
  CompanyPrivate,
  CompanySearchResult,
  CompanyType,
  Mutation,
  MutationCancelAdministrativeTransferArgs,
  MutationCreateAdministrativeTransferArgs
} from "@td/codegen-ui";
import CompanySelectorWrapper from "../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { format } from "date-fns";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  CANCEL_ADMINISTRATIVE_TRANSFER,
  CREATE_ADMINISTRATIVE_TRANSFER
} from "../common/queries";
import { useMutation } from "@apollo/client";
import { NotificationError } from "../../common/Components/Error/Error";

type Props = {
  company: CompanyPrivate;
};

const STEPS = [
  { title: "Conditions à respecter" },
  { title: "Établissement d'arrivée" },
  { title: "Confirmer le transfert" },
  { title: "Attente d'approbation" },
  { title: "Transfert finalisé" }
];

export function RequestAdministrativeTranfer({ company }: Props) {
  const [siret, setSiret] = useState("");

  const administrativeTranfer = company.givenAdministrativeTransfers?.find(
    transfer => transfer.status === "PENDING" || transfer.status === "ACCEPTED"
  );
  const [currentStepIdx, setCurrentStepIdx] = useState(() => {
    if (!administrativeTranfer) {
      return 0;
    }

    if (administrativeTranfer.status === "PENDING") {
      return 3;
    }

    if (administrativeTranfer.status === "REFUSED") {
      return 0;
    }

    return 4;
  });

  const { title } = STEPS[currentStepIdx];

  const [selectedCompany, setSelectedCompany] =
    useState<CompanySearchResult | null>(null);

  const selectedCompanyError = (selectedCompany?: CompanySearchResult) => {
    if (selectedCompany) {
      if (!selectedCompany.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets.";
      } else if (
        !selectedCompany.companyTypes?.includes(CompanyType.Collector)
      ) {
        return "L'établissement d'arrivée doit être une Installation de collecte de déchets. Impossible de réaliser le transfert.";
      }
    }

    return null;
  };

  const destinationIsValid =
    selectedCompany && selectedCompanyError(selectedCompany) === null;

  const [
    createAdministrativeTransfer,
    { loading: loadingCreate, error: errorCreate }
  ] = useMutation<
    Pick<Mutation, "createAdministrativeTransfer">,
    MutationCreateAdministrativeTransferArgs
  >(CREATE_ADMINISTRATIVE_TRANSFER, {
    update(cache, { data }) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          givenAdministrativeTransfers(existingTransfers = []) {
            return [...existingTransfers, data?.createAdministrativeTransfer];
          }
        }
      });
    }
  });

  const [
    cancelAdministrativeTransfer,
    { loading: loadingCancel, error: errorCancel }
  ] = useMutation<
    Pick<Mutation, "cancelAdministrativeTransfer">,
    MutationCancelAdministrativeTransferArgs
  >(CANCEL_ADMINISTRATIVE_TRANSFER, {
    update(cache) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          givenAdministrativeTransfers() {
            return [] as AdministrativeTransfer[];
          }
        }
      });
    }
  });

  return (
    <div className="company-advanced__section">
      <h3 className="company-advanced__title">
        Transfert administratif de bordereaux
      </h3>
      <p className="company-advanced__description">
        La fonctionnalité de transfert de bordereaux concerne les établissements
        qui changent de SIRET mais conservent leurs activités. Elle permet de
        transférer uniquement des bordereaux au statut "en attente de
        regroupement" vers le nouveau SIRET de façon à ce que le nouvel
        établissement puisse établir les bordereaux suites (annexes 2) et
        poursuivre l'activité.
      </p>

      <Stepper
        currentStep={currentStepIdx + 1}
        nextTitle={STEPS[currentStepIdx + 1]?.title}
        stepCount={STEPS.length}
        title={title}
      />

      {currentStepIdx === 0 && (
        <div className="company-advanced__description">
          <p className="tw-mb-2">
            Conditions de transfert de bordereaux vers un nouvel établissement :
          </p>
          <ul className="tw-list-disc">
            <li>
              L'établissement de départ doit être mis en sommeil au préalable.
            </li>
            <li>
              L'établissement de départ et celui d'arrivée doivent avoir les
              mêmes sous-profils TTR de cochés (Tri-Transit-Regroupement dans
              l'onglet "Informations" de vos établissements) - l'établissement
              d'arrivée peut avoir plus de sous-profil TTR cochés, mais pas
              moins.
            </li>
            <li>L'ensemble des bordereaux en attente est transféré.</li>
            <li>
              L'établissement d'arrivée devra valider le transfert depuis
              l'onglet "avancé de son établissement
            </li>
            <li>
              L'ensemble des bordereaux (BSDD au statut "awaiting-group" et BSDA
              au statut "awaiting-child" soit En attente de regroupement) sera
              transféré (pas de sélection possible).
            </li>
            <li>L'opération est irréversible.</li>
          </ul>
        </div>
      )}

      {currentStepIdx === 1 && (
        <div>
          <CompanySelectorWrapper
            orgId={company.orgId}
            selectedCompanyOrgId={selectedCompany?.orgId}
            selectedCompanyError={selectedCompanyError}
            onCompanySelected={selectedCompany => {
              if (selectedCompany) {
                setSelectedCompany(selectedCompany);
              }
            }}
          />

          {destinationIsValid && (
            <div className="tw-mb-2">
              <Alert
                description="Cet établissement est compatible pour le transfert"
                severity="success"
                small
              />
            </div>
          )}
        </div>
      )}

      {currentStepIdx === 2 && (
        <div className="tw-mb-4">
          <p className="tw-font-bold tw-mb-4">
            Êtes vous sur de vouloir transférer vos bordereaux vers
            l'établissement{" "}
            {[selectedCompany?.name, selectedCompany?.siret].join(" - ")} ?
          </p>
          <p className="tw-font-bold tw-mb-4">
            Pour confirmer le transfert saisissez le numéro de SIRET de
            l'établissement de départ
          </p>

          <Input
            label="N° de SIRET"
            nativeInputProps={{ onChange: e => setSiret(e.target.value) }}
          />
        </div>
      )}

      {currentStepIdx === 3 && (
        <div className="tw-mb-4">
          <p className="tw-font-bold tw-mb-4">
            Votre demande de transfert doit être validée par l'établissement
            d'arrivée.
          </p>
          <p className="tw-font-bold tw-mb-4">
            Demande de transfert faite le{" "}
            {administrativeTranfer?.createdAt
              ? format(
                  new Date(administrativeTranfer.createdAt),
                  "dd/MM/yyyy à HH:mm"
                )
              : null}
          </p>
        </div>
      )}

      {currentStepIdx === 4 && (
        <div>
          Le transfert des bordereaux a été finalisé le{" "}
          {administrativeTranfer?.approvedAt
            ? format(
                new Date(administrativeTranfer.approvedAt),
                "dd/MM/yyyy à HH:mm"
              )
            : null}
        </div>
      )}

      <div className="tw-flex tw-items-center">
        {currentStepIdx > 0 && currentStepIdx < 3 && (
          <Button
            size="small"
            onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
            iconId="fr-icon-arrow-left-line"
            iconPosition="left"
            className="tw-mr-2"
            priority="secondary"
          >
            Précédent
          </Button>
        )}

        {currentStepIdx < 2 && (
          <Button
            size="small"
            disabled={currentStepIdx === 1 && !destinationIsValid}
            onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
          >
            Suivant
          </Button>
        )}

        {currentStepIdx === 2 && (
          <Button
            size="small"
            disabled={loadingCreate || siret !== company.siret}
            onClick={async () => {
              if (!selectedCompany) {
                return;
              }

              await createAdministrativeTransfer({
                variables: {
                  input: { from: company.orgId, to: selectedCompany.orgId }
                }
              });

              setCurrentStepIdx(currentStepIdx + 1);
            }}
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
          >
            Confirmer le transfert
          </Button>
        )}

        {currentStepIdx === 3 && (
          <Button
            size="small"
            disabled={loadingCancel}
            onClick={async () => {
              if (!administrativeTranfer) {
                return;
              }

              await cancelAdministrativeTransfer({
                variables: { id: administrativeTranfer.id }
              });

              setCurrentStepIdx(0);
            }}
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
          >
            Annuler le transfert
          </Button>
        )}
      </div>

      {errorCreate && <NotificationError apolloError={errorCreate} />}
      {errorCancel && <NotificationError apolloError={errorCancel} />}
    </div>
  );
}
