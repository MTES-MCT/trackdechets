import React, { useState } from "react";
import { CompanyPrivateMembers } from "./CompanyMembers";
import { Query, QueryMembershipRequestsArgs } from "@td/codegen-ui";
import { MEMBERSHIP_REQUESTS } from "../common/queries";
import { useQuery } from "@apollo/client";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Button from "@codegouvfr/react-dsfr/Button";
import { generatePath, useLocation, useNavigate } from "react-router-dom";
import * as queryString from "query-string";
import CompanyMembersRequestModal from "./CompanyMembersRequestModal";
import routes from "../../routes";

interface CompanyMembersRequestsListProps {
  company: CompanyPrivateMembers;
}

const CompanyMembersRequestsList = ({
  company
}: CompanyMembersRequestsListProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queries = queryString.parse(location.search);

  const [requestToManage, setRequestToManage] = useState<string | null>(
    (queries.demande as string) ?? null
  );

  const [pageIndex, setPageIndex] = useState(0);

  const { data, loading, refetch } = useQuery<
    Pick<Query, "membershipRequests">,
    QueryMembershipRequestsArgs
  >(MEMBERSHIP_REQUESTS, {
    fetchPolicy: "network-only",
    variables: {
      where: {
        orgId: company.orgId
      }
    }
  });

  const totalCount = data?.membershipRequests.totalCount;
  const membershipRequests =
    data?.membershipRequests.edges.map(edge => edge.node) ?? [];

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
    <>
      {!!requestToManage && (
        <CompanyMembersRequestModal
          id={requestToManage}
          onClose={() => {
            navigate(
              `${generatePath(routes.companies.details, {
                siret: company.orgId
              })}#membres`
            );
            setRequestToManage(null);
          }}
        />
      )}
      <div className="company-members__list">
        <h3 className="fr-h4">Demandes de rattachement</h3>
        <div className={`fr-container--fluid`}>
          <div
            className={`fr-grid-row fr-grid-row--gutters fr-grid-row--bottom`}
          >
            <div className="fr-col-12">
              <div className="fr-table fr-table">
                <div className="fr-table__wrapper">
                  <div className="fr-table__container">
                    <div className="fr-table__content">
                      <table className="delegations-table">
                        <thead>
                          <tr>
                            <th scope="col">Nom</th>
                            <th scope="col">Courriel</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {membershipRequests.map(request => {
                            const { id, name, email } = request;

                            return (
                              <tr key={id}>
                                <td>{name}</td>
                                <td>{email}</td>
                                <td>
                                  <Button
                                    priority="primary"
                                    size="small"
                                    className="fr-my-4v"
                                    nativeButtonProps={{
                                      type: "button"
                                    }}
                                    disabled={false}
                                    onClick={() => setRequestToManage(id)}
                                  >
                                    Gérer
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}

                          {loading && <p className="fr-m-4v">Chargement...</p>}
                          {!loading && !membershipRequests.length && (
                            <p className="fr-m-4v">
                              Aucune demande de rattachement en attente.
                            </p>
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
            </div>
          </div>
        </div>
        <hr />
      </div>
    </>
  );
};

export default CompanyMembersRequestsList;
