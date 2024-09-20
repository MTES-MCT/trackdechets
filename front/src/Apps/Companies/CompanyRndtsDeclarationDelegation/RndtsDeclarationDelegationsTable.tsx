import React, { useState } from "react";
import {
  Query,
  RndtsDeclarationDelegationStatus
} from "../../../../../libs/front/codegen-ui/src";
import { isDefinedStrict } from "../../../common/helper";
import { formatDateViewDisplay } from "../common/utils";
import classnames from "classnames";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import "./companyRndtsDeclarationDelegation.scss";
import { useQuery } from "@apollo/client";
import { RNDTS_DECLARATION_DELEGATIONS } from "../../common/queries/rndtsDeclarationDelegation/queries";
import Button from "@codegouvfr/react-dsfr/Button";

const getStatusLabel = (status: RndtsDeclarationDelegationStatus) => {
  switch (status) {
    case RndtsDeclarationDelegationStatus.Ongoing:
      return "À VENIR";
    case RndtsDeclarationDelegationStatus.Incoming:
      return "EN COURS";
    case RndtsDeclarationDelegationStatus.Closed:
      return "CLÔTURÉE";
  }
};

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
      {getStatusLabel(status)}
    </p>
  );
};

interface Props {
  as: "delegator" | "delegate";
  companyOrgId: string;
}

export const RndtsDeclarationDelegationsTable = ({
  as,
  companyOrgId
}: Props) => {
  const [pageIndex, setPageIndex] = useState(0);

  const { data, loading, refetch } = useQuery<
    Pick<Query, "rndtsDeclarationDelegations">
  >(RNDTS_DECLARATION_DELEGATIONS, {
    skip: !companyOrgId,
    variables: {
      where:
        as === "delegate"
          ? { delegateOrgId: companyOrgId }
          : { delegatorOrgId: companyOrgId }
    }
  });

  const totalCount = data?.rndtsDeclarationDelegations.totalCount;
  const delegations =
    data?.rndtsDeclarationDelegations.edges.map(edge => edge.node) ?? [];

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
                        <td>
                          {status !==
                            RndtsDeclarationDelegationStatus.Closed && (
                            <Button
                              priority="primary"
                              size="small"
                              className="fr-my-4v"
                              nativeButtonProps={{
                                type: "button",
                                "data-testid":
                                  "company-revoke-rndtsDeclarationDelegation"
                              }}
                              disabled={false}
                              onClick={() => {}}
                            >
                              Révoquer
                            </Button>
                          )}
                        </td>
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
