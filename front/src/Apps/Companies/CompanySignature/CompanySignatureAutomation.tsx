import React, { useState } from "react";
import { useMutation, useLazyQuery, gql } from "@apollo/client";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  Query,
  QuerySearchCompaniesArgs,
  MutationRemoveSignatureAutomationArgs,
  MutationAddSignatureAutomationArgs,
  MutationUpdateCompanyArgs
} from "@td/codegen-ui";
import CompanySelector from "../../common/Components/CompanySelector/CompanySelector";
import {
  REMOVE_SIGNATURE_DELEGATION,
  ADD_SIGNATURE_DELEGATION,
  UPDATE_ALLOW_APPENDIX_SIGNATURE_AUTOMATION
} from "../common/queries";
import { SEARCH_COMPANIES } from "../../common/queries/company/query";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";
import { formatDate } from "../../../common/datetime";

import "./companySignature.scss";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";

interface CompanySignatureAutomationProps {
  company: CompanyPrivate;
}
const CompanySignatureAutomation = ({
  company
}: CompanySignatureAutomationProps) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [allowSignatureAutomation, setAllowSignatureAutomation] = useState(
    company.allowAppendix1SignatureAutomation
  );

  const [updateAllowSignatureAutomation] = useMutation<
    Pick<Mutation, "updateCompany">,
    MutationUpdateCompanyArgs
  >(UPDATE_ALLOW_APPENDIX_SIGNATURE_AUTOMATION, {
    onCompleted: () => {
      toast.success("Paramètre enregistré", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "Une erreur s'est produite. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
      setAllowSignatureAutomation(allowDirectTakeOver => !allowDirectTakeOver);
    }
  });

  function onChangeSwitch(checked) {
    setAllowSignatureAutomation(checked);
    updateAllowSignatureAutomation({
      variables: {
        id: company.id,
        allowAppendix1SignatureAutomation: checked
      }
    });
  }

  const [
    searchCompaniesFromTextSearch,
    { loading: isLoadingSearch, data: searchCompaniesData }
  ] = useLazyQuery<Pick<Query, "searchCompanies">, QuerySearchCompaniesArgs>(
    SEARCH_COMPANIES
  );

  const searchResults = searchCompaniesData?.searchCompanies
    .filter(result => Boolean(result.trackdechetsId))
    .slice(0, 6);

  const [addSignatureAutomation] = useMutation<
    Pick<Mutation, "addSignatureAutomation">,
    MutationAddSignatureAutomationArgs
  >(ADD_SIGNATURE_DELEGATION, {
    onCompleted: () => {
      toast.success("Délégation enregistrée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "Une erreur s'est produite. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
    },
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
        `
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
          }
        }
      });
    }
  });

  const [removeSignatureAutomation] = useMutation<
    Pick<Mutation, "removeSignatureAutomation">,
    MutationRemoveSignatureAutomationArgs
  >(REMOVE_SIGNATURE_DELEGATION, {
    onCompleted: () => {
      toast.success("Délégation supprimée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "Une erreur s'est produite. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
    },
    update(cache, _, { variables }) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          signatureAutomations(existingDelegationsRefs, { readField }) {
            return existingDelegationsRefs.filter(
              commentRef => variables?.id !== readField("id", commentRef)
            );
          }
        }
      });
    }
  });

  const onSearchCompany = (searchClue: string, postalCodeClue: string) => {
    if (searchClue.length >= 3) {
      searchCompaniesFromTextSearch({
        variables: {
          clue: searchClue,
          ...(postalCodeClue &&
            postalCodeClue.length >= 2 && { department: postalCodeClue })
        }
      });
    }
  };

  const onSelectCompany = delegationCompany => {
    addSignatureAutomation({
      variables: {
        input: {
          from: company.id,
          to: delegationCompany.trackdechetsId
        }
      }
    });
  };

  const onClickRevokeAutomation = delegationId => {
    removeSignatureAutomation({ variables: { id: delegationId } });
  };

  return (
    <div className="company-signature__automation">
      <h4 className="fr-h4">Signature automatique (annexe 1)</h4>
      {isAdmin ? (
        <ToggleSwitch
          label="J'autorise Trackdéchets à apposer ma signature électronique au moment de la collecte de déchets avec une annexe 1 pour le ou les établissement(s) que je désigne ci-après comme collecteurs autorisés, et avec lesquels j'ai un contrat de collecte."
          checked={allowSignatureAutomation}
          onChange={checked => onChangeSwitch(checked)}
        />
      ) : (
        <p className="fr-text">
          {company.allowAppendix1SignatureAutomation
            ? "Autorisé"
            : "Non autorisé"}
        </p>
      )}

      {isAdmin && (
        <CompanySelector
          disabled={!allowSignatureAutomation}
          loading={isLoadingSearch}
          onSelect={onSelectCompany}
          onSearch={onSearchCompany}
          companies={searchResults}
        />
      )}

      {company.signatureAutomations.length > 0 ? (
        <div className="fr-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Établissement</th>
                <th scope="col">Ajouté le</th>
                {isAdmin && <th scope="col">Révoquer</th>}
              </tr>
            </thead>
            <tbody>
              {company.signatureAutomations.map(delegation => (
                <tr key={delegation.id}>
                  <td>
                    {delegation.to.name} (
                    {delegation.to.siret ?? delegation.to.vatNumber})
                  </td>
                  <td>{formatDate(delegation.createdAt)}</td>
                  {isAdmin && (
                    <td>
                      <button
                        disabled={!allowSignatureAutomation}
                        className="fr-btn fr-btn--icon-left fr-icon-delete-line"
                        onClick={() => onClickRevokeAutomation(delegation.id)}
                      >
                        Révoquer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        isAdmin && (
          <div className="fr-alert fr-alert--info fr-alert--sm fr-mt-2w">
            <p>
              Recherchez un premier établissement ci-dessus afin de l’ajouter à
              la liste des collecteurs autorisés
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default CompanySignatureAutomation;
