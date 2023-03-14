import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { IconTrash } from "common/components/Icons";
import { formatDate } from "common/datetime";
import { SEARCH_COMPANIES } from "form/common/components/company/query";
import {
  CompanyPrivate,
  Mutation,
  MutationAddSignatureAutomationArgs,
  MutationRemoveSignatureAutomationArgs,
  Query,
  QuerySearchCompaniesArgs,
} from "generated/graphql/types";
import React, { useState } from "react";

type Props = {
  company: Pick<CompanyPrivate, "id" | "signatureAutomations">;
  toggleEdition: () => void;
};

const ADD_SIGNATURE_DELEGATION = gql`
  mutation AddSignatureAutomation($input: SignatureAutomationInput!) {
    addSignatureAutomation(input: $input) {
      id
      to {
        name
        siret
        vatNumber
      }
    }
  }
`;

const REMOVE_SIGNATURE_DELEGATION = gql`
  mutation RemoveSignatureAutomation($id: ID!) {
    removeSignatureAutomation(id: $id) {
      id
    }
  }
`;

export function AccountFormCompanySignatureAutomation({ company }: Props) {
  const [clue, setClue] = useState("");
  const [addSignatureAutomation, { loading: isAdding }] = useMutation<
    Pick<Mutation, "addSignatureAutomation">,
    MutationAddSignatureAutomationArgs
  >(ADD_SIGNATURE_DELEGATION, {
    update(cache, newDelegationResponse) {
      const newDelegation = newDelegationResponse.data?.addSignatureAutomation;
      if (!newDelegation) return;

      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          signatureAutomations(existingDelegationsRefs = [], { readField }) {
            const newCommentRef = cache.writeFragment({
              data: newDelegation,
              fragment: gql`
                fragment NewSignatureAutomation on SignatureAutomation {
                  id
                  to {
                    name
                    siret
                    vatNumber
                  }
                }
              `,
            });

            // Quick safety check - if the new comment is already
            // present in the cache, we don't need to add it again.
            if (
              existingDelegationsRefs.some(
                ref => readField("id", ref) === newDelegation.id
              )
            ) {
              return existingDelegationsRefs;
            }

            return [...existingDelegationsRefs, newCommentRef];
          },
        },
      });
    },
  });

  const [removeSignatureAutomation, { loading: isRemoving }] = useMutation<
    Pick<Mutation, "removeSignatureAutomation">,
    MutationRemoveSignatureAutomationArgs
  >(REMOVE_SIGNATURE_DELEGATION, {
    update(cache, _, { variables }) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          signatureAutomations(existingDelegationsRefs, { readField }) {
            return existingDelegationsRefs.filter(
              commentRef => variables?.id !== readField("id", commentRef)
            );
          },
        },
      });
    },
  });

  const [searchCompaniesQuery, { loading: isLoadingSearch, data, error }] =
    useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
      SEARCH_COMPANIES
    );

  return (
    <div>
      <p className="tw-pb-6">
        J'autorise Trackdéchets à apposer ma signature électronique au moment de
        la collecte de déchets avec une annexe 1 pour le ou le(s)
        établissement(s) que je désigne ci-après comme collecteurs autorisés,
        avec lesquels j'ai un contrat de collecte.
      </p>
      <p>
        <strong>SIRET(s) autorisé(s)</strong>
      </p>
      {company.signatureAutomations.length === 0 && (
        <p>Aucune entreprise autorisée</p>
      )}
      {company.signatureAutomations.map(delegation => {
        return (
          <div
            key={delegation.id}
            className="tw-p-2 tw-my-2 tw-rounded tw-bg-gray-300 tw-flex tw-items-center"
          >
            <span className="tw-flex-1">
              {delegation.to.name} (
              {delegation.to.siret ?? delegation.to.vatNumber})
            </span>
            <span className="tw-text-xs tw-pr-2">
              ajouté le {formatDate(delegation.createdAt)}
            </span>
            <button
              className="btn btn--primary small"
              onClick={() => {
                if (isRemoving) return;
                removeSignatureAutomation({ variables: { id: delegation.id } });
              }}
              disabled={isRemoving}
            >
              <IconTrash />
            </button>
          </div>
        );
      })}

      <div className="tw-pt-6 tw-flex tw-items-center">
        <input
          type="search"
          className="td-input"
          placeholder="SIRET"
          onChange={e => setClue(e.target.value)}
        />
        <button
          className="btn btn--primary small"
          type="submit"
          onClick={() => {
            searchCompaniesQuery({ variables: { clue } });
          }}
          disabled={isLoadingSearch}
        >
          Rechercher
        </button>
      </div>

      <div className="tw-pt-2">
        {error && (
          <span>
            Une erreur est survenue lors de la recherche. Merci de réessayer
            plus tard.
          </span>
        )}
        {Boolean(clue) &&
          data?.searchCompanies
            .filter(result => Boolean(result.trackdechetsId))
            .map(result => {
              return (
                <div
                  className="tw-p-2 tw-my-2 tw-rounded tw-bg-gray-300 tw-flex tw-items-center"
                  key={`${result.name}-${result.siret ?? result.vatNumber}`}
                >
                  <span className="tw-flex-1">
                    {result.name} - {result.siret}
                  </span>
                  <button
                    className="btn btn--primary small"
                    onClick={() => {
                      if (isAdding) return;
                      addSignatureAutomation({
                        variables: {
                          input: {
                            from: company.id,
                            to: result.trackdechetsId!,
                          },
                        },
                      });
                      setClue("");
                    }}
                    disabled={isAdding}
                  >
                    Ajouter
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
