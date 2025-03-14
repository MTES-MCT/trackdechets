import React, { useState } from "react";
import {
  Query,
  QueryAdminRequestsAdminArgs,
  Mutation,
  MutationAcceptAdminRequestArgs,
  MutationRefuseAdminRequestArgs
} from "@td/codegen-ui";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { useMutation, useQuery } from "@apollo/client";
import {
  ACCEPT_ADMIN_REQUEST,
  ADMIN_REQUESTS_ADMIN,
  REFUSE_ADMIN_REQUEST
} from "../../Apps/common/queries/adminRequest/adminRequest";
import { formatDateViewDisplay } from "../../Apps/Companies/common/utils";
import Button from "@codegouvfr/react-dsfr/Button";
import toast from "react-hot-toast";
import { getStatusBadge } from "../../Apps/Companies/CompanyManage/CompanyAdminRequest/CompanyAdminRequestsTable";

export const AdminRequests = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const PAGE_SIZE = 10;

  const { data, loading, refetch } = useQuery<
    Pick<Query, "adminRequestsAdmin">,
    QueryAdminRequestsAdminArgs
  >(ADMIN_REQUESTS_ADMIN, {
    fetchPolicy: "network-only",
    variables: {
      skip: 0,
      first: PAGE_SIZE
    }
  });

  const [acceptAdminRequest, { loading: loadingAccept }] = useMutation<
    Pick<Mutation, "acceptAdminRequest">,
    MutationAcceptAdminRequestArgs
  >(ACCEPT_ADMIN_REQUEST);

  const [refuseAdminRequest, { loading: loadingRefuse }] = useMutation<
    Pick<Mutation, "refuseAdminRequest">,
    MutationRefuseAdminRequestArgs
  >(REFUSE_ADMIN_REQUEST);

  const totalCount = data?.adminRequestsAdmin.totalCount;
  const requests = data?.adminRequestsAdmin.edges.map(edge => edge.node) ?? [];

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
                  <th scope="col">Utilisateur</th>
                  <th className="fr-py-4v table-col" scope="col">
                    Établissement
                  </th>
                  <th scope="col">Méthode</th>
                  <th scope="col">Date de la demande</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => {
                  const {
                    id,
                    company,
                    user,
                    createdAt,
                    status,
                    validationMethod
                  } = request;

                  return (
                    <tr key={id}>
                      <td>{user.name}</td>
                      <td
                        className="fr-py-4v"
                        aria-describedby={`company-name-${company.orgId}`}
                      >
                        {`${company.name} - ${company.orgId}`}
                      </td>
                      <td>{validationMethod}</td>
                      <td>{formatDateViewDisplay(createdAt)}</td>
                      <td>{getStatusBadge(status)}</td>
                      <td>
                        <Button
                          disabled={loadingAccept || loadingRefuse}
                          priority="primary"
                          className="fr-mr-2w"
                          onClick={() => {
                            acceptAdminRequest({
                              variables: { input: { adminRequestId: id } },
                              onCompleted: () => {
                                toast.success("Demande accordée");
                              },
                              onError: e => toast.error(e.message)
                            });
                          }}
                          type="button"
                        >
                          Accepter
                        </Button>

                        <Button
                          priority="secondary"
                          type="submit"
                          disabled={loadingAccept || loadingRefuse}
                          onClick={() => {
                            refuseAdminRequest({
                              variables: { adminRequestId: id },
                              onCompleted: () => {
                                toast.success("Demande refusée");
                              },
                              onError: e => toast.error(e.message)
                            });
                          }}
                        >
                          Refuser
                        </Button>
                      </td>
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
