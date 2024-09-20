import React from "react";
import { RndtsDeclarationDelegation } from "../../../../../libs/front/codegen-ui/src";
import { isDefined, isDefinedStrict } from "../../../common/helper";

interface Props {
  delegations: RndtsDeclarationDelegation[];
  loading: boolean;
}

export const RndtsDeclarationDelegationsTable = ({
  delegations = [],
  loading = true
}: Props) => {
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
                  <th scope="col">Révoquer</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map(delegation => (
                  <tr key={delegation.id}>
                    <td className="fr-py-4v">
                      {delegation.delegator?.name ?? delegation.delegate.name}
                    </td>
                    <td>
                      {delegation.delegator?.orgId ?? delegation.delegate.orgId}
                    </td>
                    <td>
                      {isDefinedStrict(delegation.comment)
                        ? delegation.comment
                        : "-"}
                    </td>
                    <td>{delegation.startDate}</td>
                    <td>{delegation.endDate ? "date" : "-"}</td>
                    <td>[X]</td>
                  </tr>
                ))}

                {loading && <p className="fr-m-4v">Chargement...</p>}
                {!loading && !delegations.length && (
                  <p className="fr-m-4v">Aucune délégation</p>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
