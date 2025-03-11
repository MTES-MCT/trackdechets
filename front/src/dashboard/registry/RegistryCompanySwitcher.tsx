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
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";

type Props = {
  onCompanySelect: (orgId: string) => void;
  wrapperClassName?: string;
  allOption?: {
    key: string;
    name: string;
  };
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

export function RegistryCompanySwitcher({
  onCompanySelect,
  wrapperClassName,
  allOption
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedClue, setDebouncedClue] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>(
    allOption ? allOption.name : ""
  );

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false)
  });

  const setSelectedCompany = (
    key,
    {
      name,
      givenName,
      siret
    }: {
      name?: string | null;
      givenName?: string | null;
      siret?: string | null;
    }
  ) => {
    setSelectedItem(`${givenName || name || ""} ${siret || ""}`);
    onCompanySelect(key);
  };

  const { data: myCompaniesData, loading: myCompaniesLoading } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, {
    fetchPolicy: "network-only",
    variables: { search: debouncedClue, first: 10 },
    onCompleted: data => {
      if (!selectedItem && !allOption) {
        const firstNode = data.myCompanies.edges.find(({ node }) => node.siret);

        if (firstNode) {
          setSelectedCompany(firstNode.node.orgId, {
            name: firstNode.node.name,
            givenName: firstNode.node.givenName,
            siret: firstNode.node.siret
          });
        }
      }
    }
  });

  const { data: delegationsData, loading: delegationsLoading } = useQuery<
    Pick<Query, "registryDelegations">,
    QueryRegistryDelegationsArgs
  >(REGISTRY_DELEGATIONS, {
    variables: {
      where: {
        activeOnly: true,
        givenToMe: true,
        search: debouncedClue
      },
      first: 10
    }
  });

  const debouncedSearch = useMemo(
    () =>
      debounce(clue => {
        setDebouncedClue(clue);
      }, 1000),
    []
  );

  const myCompanies =
    myCompaniesData?.myCompanies.edges.filter(edge => edge.node.siret) ?? [];
  const delegationsSirets = new Set();
  const delegations =
    delegationsData?.registryDelegations.edges.filter(item => {
      return delegationsSirets.has(item.node.delegator.orgId)
        ? false
        : delegationsSirets.add(item.node.delegator.orgId);
    }) ?? [];

  const displayedCount = (myCompanies.length || 0) + (delegations.length || 0);
  const totalCount =
    (myCompaniesData?.myCompanies.totalCount || 0) +
    (delegationsData?.registryDelegations.totalCount || 0);

  return (
    <div
      className={wrapperClassName ?? "tw-relative tw-w-1/2"}
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      <span className="fr-label">Établissement concerné</span>
      <div
        className="fr-input tw-cursor-pointer tw-flex tw-justify-between"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="tw-truncate">{selectedItem}</span>
        <span
          className={`${
            isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
          } fr-icon--sm`}
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
                (clue.length >= MIN_MY_COMPANIES_SEARCH &&
                  clue.length <= MAX_MY_COMPANIES_SEARCH) ||
                clue.length === 0
              ) {
                debouncedSearch(e.currentTarget.value);
              }
            }
          }}
          label=""
        />
        {allOption ? (
          <div
            className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-cursor-pointer"
            onClick={() => {
              setSelectedCompany(allOption.key, {
                name: allOption.name,
                givenName: null,
                siret: null
              });
              setIsOpen(false);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedCompany(allOption.key, {
                  name: allOption.name,
                  givenName: null,
                  siret: null
                });
                setIsOpen(false);
              }
            }}
            key={allOption.key}
          >
            {allOption.name}
          </div>
        ) : null}
        {myCompanies.map(({ node }) => (
          <div
            className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-cursor-pointer"
            onClick={() => {
              setSelectedCompany(node.orgId, {
                name: node.name,
                givenName: node.givenName,
                siret: node.siret
              });
              setIsOpen(false);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedCompany(node.orgId, {
                  name: node.name,
                  givenName: node.givenName,
                  siret: node.siret
                });
                setIsOpen(false);
              }
            }}
            key={node.orgId}
          >
            {node.givenName || node.name} {node.siret}
          </div>
        ))}
        {myCompaniesLoading || delegationsLoading ? (
          <div
            className="tw-px-2 tw-py-2 tw-flex tw-gap-4 tw-justify-between tw-items-center"
            key={"loader"}
          >
            <InlineLoader size={40} />
          </div>
        ) : null}
        {delegations
          .map(edge => edge.node.delegator)
          .map(delegator => (
            <div
              className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-flex tw-gap-4 tw-justify-between tw-items-center tw-cursor-pointer"
              onClick={() => {
                setSelectedCompany(delegator.orgId, {
                  name: delegator.name,
                  givenName: delegator.givenName,
                  siret: delegator.orgId
                });
                setIsOpen(false);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setSelectedCompany(delegator.orgId, {
                    name: delegator.name,
                    givenName: delegator.givenName,
                    siret: delegator.orgId
                  });
                  setIsOpen(false);
                }
              }}
              key={delegator.orgId}
            >
              <div>
                {delegator.givenName || delegator.name} {delegator.orgId}
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
