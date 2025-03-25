import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@apollo/client";
import { Query, UserRole } from "@td/codegen-ui";
import { debounce } from "../../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import useOnClickOutsideRefTarget from "../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ComboBox } from "../../Apps/common/Components/Combobox/Combobox";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_COMPANIES } from "./shared";

type Props = {
  onCompanySelect: (orgId: string, isDelegation: boolean) => void;
  wrapperClassName?: string;
  allOption?: {
    key: string;
    name: string;
  };
  label?: string;
  defaultSiret?: string;
  excludeDelegations?: boolean;
};

export function RegistryCompanySwitcher({
  onCompanySelect,
  wrapperClassName,
  allOption,
  label,
  defaultSiret,
  excludeDelegations = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedClue, setDebouncedClue] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>(
    allOption ? allOption.name : ""
  );

  const comboboxTriggerRef = useRef<HTMLDivElement | null>(null);

  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false)
  });

  const setSelectedCompany = (
    key,
    {
      name,
      givenName,
      siret,
      isDelegation
    }: {
      name?: string | null;
      givenName?: string | null;
      siret?: string | null;
      isDelegation?: boolean;
    }
  ) => {
    setSelectedItem(`${givenName || name || ""} ${siret || ""}`);
    onCompanySelect(key, !!isDelegation);
  };

  const { data: companiesData, loading: companiesLoading } = useQuery<
    Pick<Query, "registryCompanies">
  >(GET_REGISTRY_COMPANIES, {
    fetchPolicy: "network-only",
    variables: {
      search: debouncedClue,
      firstCompanies: 10,
      firstDelegators: excludeDelegations ? 0 : 10,
      userRoles: [UserRole.Admin, UserRole.Member, UserRole.Reader]
    },
    onCompleted: data => {
      if (!selectedItem && !allOption) {
        const firstNode = data.registryCompanies.myCompanies.find(node =>
          defaultSiret ? node.siret === defaultSiret : node.siret
        );

        if (firstNode) {
          setSelectedCompany(firstNode.orgId, {
            name: firstNode.name,
            givenName: firstNode.givenName,
            siret: firstNode.siret
          });
        }
      }
    }
  });

  const debouncedSearch = useMemo(
    () =>
      debounce(clue => {
        setDebouncedClue(clue);
      }, 1000),
    []
  );

  const myCompanies = companiesData?.registryCompanies.myCompanies ?? [];
  const delegators = companiesData?.registryCompanies.delegators ?? [];
  const totalCount = companiesData?.registryCompanies.totalCount ?? 0;
  const displayedCount = (myCompanies.length || 0) + (delegators.length || 0);

  return (
    <div
      className={wrapperClassName ?? "tw-w-1/2"}
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      <span className="fr-label">{label || "Établissement concerné"}</span>
      <div
        ref={comboboxTriggerRef}
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

      <ComboBox parentRef={comboboxTriggerRef}>
        {({ close }) => (
          <>
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
                  close();
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setSelectedCompany(allOption.key, {
                      name: allOption.name,
                      givenName: null,
                      siret: null
                    });
                    close();
                  }
                }}
                key={allOption.key}
              >
                {allOption.name}
              </div>
            ) : null}
            {myCompanies.map(node => (
              <div
                className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-cursor-pointer"
                onClick={() => {
                  setSelectedCompany(node.orgId, {
                    name: node.name,
                    givenName: node.givenName,
                    siret: node.siret
                  });
                  close();
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setSelectedCompany(node.orgId, {
                      name: node.name,
                      givenName: node.givenName,
                      siret: node.siret
                    });
                    close();
                  }
                }}
                key={node.orgId}
              >
                {node.givenName || node.name} {node.siret}
              </div>
            ))}
            {companiesLoading ? (
              <div
                className="tw-px-2 tw-py-2 tw-flex tw-gap-4 tw-justify-between tw-items-center"
                key={"loader"}
              >
                <InlineLoader size={40} />
              </div>
            ) : null}
            {delegators.map(delegator => {
              return (
                <div
                  className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-flex tw-gap-4 tw-justify-between tw-items-center tw-cursor-pointer"
                  onClick={() => {
                    setSelectedCompany(delegator.orgId, {
                      name: delegator.name,
                      givenName: delegator.givenName,
                      siret: delegator.orgId,
                      isDelegation: true
                    });
                    close();
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setSelectedCompany(delegator.orgId, {
                        name: delegator.name,
                        givenName: delegator.givenName,
                        siret: delegator.orgId,
                        isDelegation: true
                      });
                      close();
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
              );
            })}
          </>
        )}
      </ComboBox>
    </div>
  );
}
