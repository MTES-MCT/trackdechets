import React, { useState } from "react";
import {
  CompanyPrivate,
  Query,
  QueryRegistryDelegationsArgs,
  RegistryDelegation,
  RegistryDelegationStatus,
  UserRole
} from "@td/codegen-ui";
import { isDefinedStrict } from "../../../common/helper";
import { formatDateViewDisplay } from "../common/utils";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import "./companyRegistryDelegation.scss";
import { useQuery } from "@apollo/client";
import { REGISTRY_DELEGATIONS } from "../../common/queries/registryDelegation/queries";
import Button from "@codegouvfr/react-dsfr/Button";
import { RevokeOrCancelRegistryDelegationModal } from "./RevokeOrCancelRegistryDelegationModal";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";

const getStatusLabel = (status: RegistryDelegationStatus) => {
  switch (status) {
    case RegistryDelegationStatus.Ongoing:
      return "EN COURS";
    case RegistryDelegationStatus.Incoming:
      return "À VENIR";
    case RegistryDelegationStatus.Revoked:
      return "RÉVOQUÉE";
    case RegistryDelegationStatus.Cancelled:
      return "ANNULÉE";
    case RegistryDelegationStatus.Expired:
      return "EXPIRÉE";
  }
};

const getStatusBadge = (status: RegistryDelegationStatus) => {
  let severity: AlertProps.Severity = "error";
  if (status === RegistryDelegationStatus.Incoming) severity = "info";
  else if (status === RegistryDelegationStatus.Ongoing) severity = "success";

  return (
    <Badge severity={severity} small noIcon>
      {getStatusLabel(status)}
    </Badge>
  );
};

const getTextTooltip = (id: string, value: string | undefined | null) => {
  return (
    <span
      className="fr-tooltip fr-placement"
      id={id}
      role="tooltip"
      aria-hidden="true"
    >
      {value}
    </span>
  );
};

interface Props {
  as: "delegator" | "delegate";
  company: CompanyPrivate;
}

export const RegistryDelegationsTable = ({ as, company }: Props) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [delegationToRevokeOrCancel, setDelegationToRevokeOrCancel] =
    useState<RegistryDelegation | null>(null);

  const isAdmin = company.userRole === UserRole.Admin;

  const { data, loading, refetch } = useQuery<
    Pick<Query, "registryDelegations">,
    QueryRegistryDelegationsArgs
  >(REGISTRY_DELEGATIONS, {
    skip: !company.orgId,
    fetchPolicy: "network-only",
    variables: {
      where:
        as === "delegate"
          ? { delegateOrgId: company.orgId }
          : { delegatorOrgId: company.orgId }
    }
  });

  const totalCount = data?.registryDelegations.totalCount;
  const delegations =
    data?.registryDelegations.edges.map(edge => edge.node) ?? [];

  const PAGE_SIZE = 10;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const gotoPage = (page: number) => {
    setPageIndex(page);

    refetch({
      skip: page * PAGE_SIZE,
      first: PAGE_SIZE
    });
  };

  return (
    <div className="fr-table--sm fr-table fr-table" id="table-sm-component">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table className="delegations-table">
              <thead>
                <tr>
                  <th className="fr-py-4v table-col" scope="col">
                    Établissement
                  </th>
                  <th scope="col">Siret</th>
                  <th scope="col">Objet</th>
                  <th scope="col">Début</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Statut</th>
                  {isAdmin && <th scope="col">Révoquer</th>}
                </tr>
              </thead>
              <tbody>
                {delegations.map(delegation => {
                  const {
                    id,
                    delegate,
                    delegator,
                    startDate,
                    endDate,
                    comment,
                    status
                  } = delegation;

                  const company = as === "delegate" ? delegator : delegate;

                  const name = isDefinedStrict(company.givenName)
                    ? company.givenName
                    : company.name;

                  const canRevokeOrCancel =
                    status === RegistryDelegationStatus.Ongoing ||
                    status === RegistryDelegationStatus.Incoming;

                  return (
                    <tr key={id}>
                      <td
                        className="fr-py-4v"
                        aria-describedby={`company-name-${company.orgId}-${as}`}
                      >
                        {name}

                        {getTextTooltip(
                          `company-name-${company.orgId}-${as}`,
                          `${name} ${
                            company.givenName ? `(${company.name})` : ""
                          }`
                        )}
                      </td>
                      <td>{company?.orgId}</td>
                      <td
                        aria-describedby={`company-comment-${company.orgId}-${as}`}
                      >
                        {isDefinedStrict(comment) ? (
                          <>
                            {comment}
                            {getTextTooltip(
                              `company-comment-${company.orgId}-${as}`,
                              comment
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatDateViewDisplay(startDate)}</td>
                      <td>
                        {endDate ? formatDateViewDisplay(endDate) : "Illimité"}
                      </td>
                      <td>{getStatusBadge(status)}</td>
                      {isAdmin && (
                        <td>
                          {canRevokeOrCancel && (
                            <Button
                              priority="primary"
                              size="small"
                              className="fr-my-4v"
                              nativeButtonProps={{
                                type: "button",
                                "data-testid":
                                  "company-revoke-registryDelegation"
                              }}
                              disabled={false}
                              onClick={() =>
                                setDelegationToRevokeOrCancel(delegation)
                              }
                            >
                              {as === "delegator" ? "Révoquer" : "Annuler"}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {loading && <p className="fr-m-4v">Chargement...</p>}
                {!loading && !delegations.length && (
                  <p className="fr-m-4v">Aucune délégation</p>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <Pagination
          style={{ margin: "0 auto" }}
          showFirstLast
          count={pageCount}
          defaultPage={pageIndex + 1}
          getPageLinkProps={pageNumber => ({
            onClick: event => {
              event.preventDefault();
              gotoPage(pageNumber - 1);
            },
            href: "#",
            key: `pagination-link-${pageNumber}`
          })}
          className={"fr-mt-1w"}
        />
      </div>

      {delegationToRevokeOrCancel && (
        <RevokeOrCancelRegistryDelegationModal
          delegationId={delegationToRevokeOrCancel.id}
          to={
            as === "delegator" ? delegationToRevokeOrCancel.delegate.name : null
          }
          from={
            as === "delegate" ? delegationToRevokeOrCancel.delegator.name : null
          }
          onClose={() => setDelegationToRevokeOrCancel(null)}
        />
      )}
    </div>
  );
};
