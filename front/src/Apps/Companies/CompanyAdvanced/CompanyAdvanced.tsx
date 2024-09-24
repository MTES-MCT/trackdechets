import { useMutation } from "@apollo/client";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  CompanyPrivate,
  Mutation,
  MutationDeleteCompanyArgs,
  MutationToggleDormantCompanyArgs
} from "@td/codegen-ui";
import { format } from "date-fns";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../common/components";
import { NotificationError } from "../../common/Components/Error/Error";
import routes from "../../routes";
import {
  DELETE_COMPANY,
  GET_ME,
  MY_COMPANIES,
  TOGGLE_DORMANT_COMPANY
} from "../common/queries";
import { RequestAdministrativeTranfer } from "./RequestAdministrativeTransfer";
import "./advanced.scss";
import { ApproveAdministrativeTransfer } from "./ApproveAdministrativeTransfer";

interface AdvancedProps {
  company: CompanyPrivate;
}
const CompanyAdvanced = ({ company }: AdvancedProps) => {
  const navigate = useNavigate();
  const [isModalOpened, setIsModalOpened] = useState<boolean>(false);
  const [siretOrOrgId, setSiretOrOrgId] = useState<string>("");
  const [hasSiretError, setHasSiretError] = useState<boolean>(false);

  const [
    toggleDormantCompany,
    { loading: loadingIsDormant, error: errorIsDormant }
  ] = useMutation<
    Pick<Mutation, "toggleDormantCompany">,
    MutationToggleDormantCompanyArgs
  >(TOGGLE_DORMANT_COMPANY, {
    variables: { id: company.id },
    update(cache) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          isDormantSince() {
            return company.isDormantSince ? null : new Date();
          }
        }
      });
    }
  });

  const [deleteCompany, { loading, error }] = useMutation<
    Pick<Mutation, "deleteCompany">,
    MutationDeleteCompanyArgs
  >(DELETE_COMPANY, {
    variables: { id: company.id },
    refetchQueries: [GET_ME, { query: MY_COMPANIES, variables: { first: 10 } }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      navigate(routes.companies.index);
    }
  });
  const companyFullname = [company?.name, company?.givenName]
    .filter(Boolean)
    .join(" - ");

  const onClick = () => {
    setIsModalOpened(true);
  };
  const onCloseModal = () => {
    setSiretOrOrgId("");
    setIsModalOpened(false);
    setHasSiretError(false);
  };
  const onRemoveCompany = () => {
    if (siretOrOrgId === company.siret || siretOrOrgId === company.orgId) {
      deleteCompany();
    } else {
      setHasSiretError(true);
    }
  };
  const onChangeSiret = e => {
    setHasSiretError(false); //reset
    setSiretOrOrgId(e.currentTarget.value);
  };

  return (
    <div className="company-advanced">
      <div className="company-advanced__section">
        <h4 className="company-advanced__title">
          Mise en sommeil de l'établissement
        </h4>
        <p className="company-advanced__description">
          La mise en sommeil de votre établissement ne permettra plus de viser
          son SIRET sur de nouveaux bordereaux. Elle permettra de gérer les
          bordereaux résiduels, et de consulter les registres.
        </p>

        {company.isDormantSince ? (
          <>
            <p className="tw-font-bold tw-text-sm">
              Etablissement mis en sommeil le{" "}
              {format(new Date(company.isDormantSince), "dd/MM/yyyy")}
            </p>
            <Button
              size="small"
              onClick={() => toggleDormantCompany()}
              disabled={loadingIsDormant}
            >
              Réveiller
            </Button>
          </>
        ) : (
          <Button
            size="small"
            onClick={() => {
              if (
                !window.confirm(
                  `Souhaitez-vous mettre l'établissement ${companyFullname} en sommeil ?`
                )
              ) {
                return;
              }

              toggleDormantCompany();
            }}
            disabled={loadingIsDormant}
          >
            Mettre en sommeil
          </Button>
        )}

        {errorIsDormant && <NotificationError apolloError={errorIsDormant} />}
      </div>

      {company.isDormantSince && (
        <RequestAdministrativeTranfer company={company} />
      )}

      <ApproveAdministrativeTransfer company={company} />

      <h4 className="company-advanced__title">
        Suppression de l'établissement
      </h4>
      <p className="company-advanced__description">
        En supprimant cet établissement, vous supprimez les accès de tous ses
        membres et vous ne pourrez plus accéder, ni au suivi des bordereaux, ni
        au registre.
      </p>
      <Button
        size="small"
        onClick={onClick}
        disabled={isModalOpened}
        nativeButtonProps={{ className: "btn-red" }}
      >
        Supprimer
      </Button>

      <Modal
        ariaLabel="Suppression de l'établissement"
        onClose={onCloseModal}
        isOpen={isModalOpened}
      >
        <h4 className="company-advanced__modal-title">
          Supprimer {company?.name} - {company?.givenName}
        </h4>

        <p className="company-advanced__modal-description">
          Êtes vous sur de vouloir supprimer l'établissement {companyFullname} ?
          En supprimant cet établissement, vous supprimez les accès de tous les
          administrateurs et collaborateurs et vous ne pourrez plus accéder ni
          au suivi des bordereaux, ni au registre.
        </p>

        <b>
          Pour supprimer l'établissement, saisissez son numéro de SIRET ou N° de
          TVA intracommunautaire
        </b>
        <br />
        <br />
        <Input
          label="SIRET ou N° de TVA intracommunautaire "
          nativeInputProps={{
            value: siretOrOrgId,
            onChange: onChangeSiret,
            ...{ "data-testid": "siretOrOrgId" }
          }}
          state={hasSiretError ? "error" : "default"}
          stateRelatedMessage="Le SIRET renseigné ne correspond pas à l'établissement"
        />

        {error && <NotificationError apolloError={error} />}

        <div className="company-advanced__modal-cta">
          <Button
            size="small"
            onClick={onRemoveCompany}
            disabled={loading || hasSiretError}
            nativeButtonProps={{ className: "btn-red" }}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
          <Button size="small" onClick={onCloseModal} disabled={loading}>
            Ne pas supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyAdvanced;
