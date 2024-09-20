import React from "react";
import {
  Query,
  RndtsDeclarationDelegation,
  RndtsDeclarationDelegationStatus
} from "../../../../../libs/front/codegen-ui/src";
import { isDefinedStrict } from "../../../common/helper";
import { formatDateViewDisplay } from "../common/utils";
import classnames from "classnames";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { ApolloQueryResult, OperationVariables } from "@apollo/client";

interface Props {
  delegations: RndtsDeclarationDelegation[];
  loading: boolean;
  totalCount: number;
  as: "delegator" | "delegate";
  refetch: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<Pick<Query, "rndtsDeclarationDelegations">>>;
}

const getStatusBadge = (status: RndtsDeclarationDelegationStatus) => {
  return (
    <p
      className={classnames(`fr-badge fr-badge--sm fr-badge--no-icon`, {
        "fr-badge--success":
          status === RndtsDeclarationDelegationStatus.Ongoing,
        "fr-badge--info": status === RndtsDeclarationDelegationStatus.Incoming,
        "fr-badge--error": status === RndtsDeclarationDelegationStatus.Closed
      })}
    >
      {status}
    </p>
  );
};

export const RndtsDeclarationDelegationsTable = ({
  as,
  delegations = [],
  totalCount = 0,
  loading = true,
  refetch
}: Props) => {
  const PAGE_SIZE = 10;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;
  const pageIndex = 0;
  const gotoPage = (page: number) => {
    refetch({
      after: delegations[delegations.length - 1].id,
      first: PAGE_SIZE
    });
  };

  return (
    <div className="fr-table--sm fr-table fr-table" id="table-sm-component">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <thead>
                <tr>
                  <th className="fr-py-4v" scope="col">
                    Établissement
                  </th>
                  <th scope="col">Siret</th>
                  <th scope="col">Objet</th>
                  <th scope="col">Début</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Révoquer</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map(
                  ({
                    id,
                    delegate,
                    delegator,
                    startDate,
                    endDate,
                    comment,
                    status
                  }) => {
                    const company = as === "delegate" ? delegator : delegate;

                    return (
                      <tr key={id}>
                        <td className="fr-py-4v">
                          {/* TODO: givenName is not in CompanyPublic yet */}
                          {company?.name}
                        </td>
                        <td>{company?.orgId}</td>
                        <td>{isDefinedStrict(comment) ? comment : "-"}</td>
                        <td>{formatDateViewDisplay(startDate)}</td>
                        <td>
                          {endDate ? formatDateViewDisplay(endDate) : "-"}
                        </td>
                        <td>{getStatusBadge(status)}</td>
                        <td>[X]</td>
                      </tr>
                    );
                  }
                )}

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
    </div>
  );
};
