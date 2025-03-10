import React, { useState } from "react";
import {
  Query,
  QueryAdminRequestsArgs,
  AdminRequestStatus
} from "@td/codegen-ui";
import { formatDateViewDisplay } from "../../common/utils";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { useQuery } from "@apollo/client";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { ADMIN_REQUESTS } from "../../../common/queries/adminRequest/adminRequest";

const getStatusLabel = (status: AdminRequestStatus) => {
  switch (status) {
    case AdminRequestStatus.Pending:
      return "EN COURS";
    case AdminRequestStatus.Accepted:
      return "ACCEPTÉE";
    case AdminRequestStatus.Refused:
      return "REFUSÉE";
  }
};

const getStatusBadge = (status: AdminRequestStatus) => {
  let severity: AlertProps.Severity = "error";
  if (status === AdminRequestStatus.Pending) severity = "info";
  else if (status === AdminRequestStatus.Accepted) severity = "success";

  return (
    <Badge severity={severity} small>
      {getStatusLabel(status)}
    </Badge>
  );
};

export const CompanyAdminRequestsTable = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const PAGE_SIZE = 10;

  const { data, loading, refetch } = useQuery<
    Pick<Query, "adminRequests">,
    QueryAdminRequestsArgs
  >(ADMIN_REQUESTS, {
    fetchPolicy: "network-only",
    variables: {
      skip: 0,
      first: PAGE_SIZE
    }
  });

  const totalCount = data?.adminRequests.totalCount;
  const requests = data?.adminRequests.edges.map(edge => edge.node) ?? [];

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
            <table className="requests-table">
              <thead>
                <tr>
                  <th className="fr-py-4v table-col" scope="col">
                    Établissement
                  </th>
                  <th scope="col">Date de la demande</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => {
                  const { id, companyName, companyOrgId, createdAt, status } =
                    request;

                  return (
                    <tr key={id}>
                      <td
                        className="fr-py-4v"
                        aria-describedby={`company-name-${companyOrgId}`}
                      >
                        {`${companyName} - ${companyOrgId}`}
                      </td>
                      <td>{formatDateViewDisplay(createdAt)}</td>
                      <td>{getStatusBadge(status)}</td>
                    </tr>
                  );
                })}

                {loading && <p className="fr-m-4v">Chargement...</p>}
                {!loading && !requests.length && (
                  <p className="fr-m-4v">Aucune demande</p>
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
