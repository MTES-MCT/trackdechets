import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { IconTrash } from "common/components/Icons";
import { formatDate } from "common/datetime";
import { SEARCH_COMPANIES } from "Apps/common/queries/company/query";
import {
  CompanyPrivate,
  CompanySearchResult,
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
      createdAt
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
  const [searchValue, setSearchValue] = useState("");
  const [companies, setCompanies] = useState<
    CompanySearchResult[] | undefined
  >();
  const [addSignatureAutomation, { loading: isAdding }] = useMutation<
    Pick<Mutation, "addSignatureAutomation">,
    MutationAddSignatureAutomationArgs
  >(ADD_SIGNATURE_DELEGATION, {
    update(cache, newDelegationResponse) {
      const newDelegation = newDelegationResponse.data?.addSignatureAutomation;
      if (!newDelegation) return;

      const newAutomationRef = cache.writeFragment({
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

      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          signatureAutomations(existingDelegationsRefs = [], { readField }) {
            // Quick safety check - if the new comment is already
            // present in the cache, we don't need to add it again.
            if (
              existingDelegationsRefs.some(
                ref => readField("id", ref) === newDelegation.id
              )
            ) {
              return existingDelegationsRefs;
            }

            return [...existingDelegationsRefs, newAutomationRef];
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

  const [searchCompaniesQuery, { loading: isLoadingSearch, error }] =
    useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
      SEARCH_COMPANIES,
      {
        onCompleted: data => {
          setCompanies(data.searchCompanies);
        },
      }
    );

  const handleSearchValueChange = e => {
    const { value } = e.target;
    setClue(value);
    setSearchValue(value);
  };

  const handleSiretAdd = result => {
    if (!isAdding) {
      addSignatureAutomation({
        variables: {
          input: {
            from: company.id,
            to: result.trackdechetsId!,
          },
        },
      });
      setClue("");
    }
    setSearchValue("");
    setCompanies(undefined);
  };

  const handleCompanySearch = async () => {
    await searchCompaniesQuery({ variables: { clue } });
  };

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
          value={searchValue}
          onChange={handleSearchValueChange}
        />
        <button
          className="btn btn--primary small"
          type="submit"
          onClick={handleCompanySearch}
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
          companies
            ?.filter(result => Boolean(result.trackdechetsId))
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
                    onClick={() => handleSiretAdd(result)}
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
