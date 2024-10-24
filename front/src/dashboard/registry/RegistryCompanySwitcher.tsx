import React, { useState, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import { Query, QueryRegistryDelegationsArgs } from "@td/codegen-ui";
import { debounce } from "../../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import useOnClickOutsideRefTarget from "../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { REGISTRY_DELEGATIONS } from "../../Apps/common/queries/registryDelegation/queries";

type Props = {
  onCompanySelect: (orgId: string) => void;
};

const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID, $search: String) {
    myCompanies(first: $first, after: $after, search: $search) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          orgId
          siret
          givenName
          securityCode
        }
      }
    }
  }
`;

export function RegistryCompanySwitcher({ onCompanySelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false)
  });

  const { data: myCompaniesData, refetch: refetchMyCompanies } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, {
    variables: { first: 10 },
    onCompleted: data => {
      if (!selectedItem) {
        const firstNode = data.myCompanies.edges.find(({ node }) => node.siret);

        if (firstNode) {
          setSelectedItem(`${firstNode.node.name} ${firstNode.node.siret}`);
          onCompanySelect(firstNode.node.orgId);
        }
      }
    }
  });

  const { data: delegationsData, refetch: refetchDelegations } = useQuery<
    Pick<Query, "registryDelegations">,
    QueryRegistryDelegationsArgs
  >(REGISTRY_DELEGATIONS, {
    variables: {
      where: {
        activeOnly: true,
        givenToMe: true
      },
      first: 10
    }
  });

  const debouncedSearch = useMemo(
    () =>
      debounce(clue => {
        refetchMyCompanies({ search: clue, first: 10 });
        refetchDelegations({
          where: {
            activeOnly: true,
            givenToMe: true,
            search: clue
          },
          first: 10
        });
      }, 1000),
    [refetchMyCompanies, refetchDelegations]
  );

  const displayedCount =
    (myCompaniesData?.myCompanies.edges.length || 0) +
    (delegationsData?.registryDelegations.edges.length || 0);
  const totalCount =
    (myCompaniesData?.myCompanies.totalCount || 0) +
    (delegationsData?.registryDelegations.totalCount || 0);

  return (
    <div
      className="tw-relative tw-w-1/2"
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      <div
        className="fr-input tw-cursor-pointer tw-flex tw-justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItem}
        <span
          className={`${
            isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
          } fr-mx-1w`}
        />
      </div>
      <div
        className={`${
          isOpen ? "tw-block" : "tw-hidden"
        } tw-absolute tw-bg-white tw-inset-x-0 tw-z-10 tw-p-2 tw-shadow-md`}
      >
        <p className="tw-text-sm tw-text-center">
          {displayedCount} sur {totalCount} établissements
        </p>
        <Input
          iconId="fr-icon-search-line"
          nativeInputProps={{
            placeholder: "Rechercher",
            onChange: e => {
              const clue = e.currentTarget.value;
              if (
                clue.length >= MIN_MY_COMPANIES_SEARCH &&
                clue.length <= MAX_MY_COMPANIES_SEARCH
              ) {
                debouncedSearch(e.currentTarget.value);
              }
            }
          }}
          label=""
        />
        {myCompaniesData?.myCompanies.edges
          .filter(edge => edge.node.siret)
          .map(({ node }) => (
            <div
              className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-cursor-pointer"
              onClick={() => {
                onCompanySelect(node.orgId);
                setSelectedItem(`${node.name} ${node.siret}`);
                setIsOpen(false);
              }}
              key={node.orgId}
            >
              {node.name} {node.siret}
            </div>
          ))}
        {delegationsData?.registryDelegations.edges
          .map(edge => edge.node.delegator)
          .map(delegator => (
            <div
              className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-flex tw-gap-4 tw-justify-between tw-items-center tw-cursor-pointer"
              onClick={() => {
                onCompanySelect(delegator.orgId);
                setSelectedItem(`${delegator.name} ${delegator.siret}`);
                setIsOpen(false);
              }}
              key={delegator.orgId}
            >
              <div>
                {delegator.name} {delegator.orgId}
              </div>
              <Badge noIcon severity="info">
                Délégation
              </Badge>
            </div>
          ))}
      </div>
    </div>
  );
}
