import React, { useState, useMemo, useRef } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { CompanyPublic, Query, UserRole } from "@td/codegen-ui";
import { debounce } from "../../common/helper";
import {
  MIN_MY_COMPANIES_SEARCH,
  MAX_MY_COMPANIES_SEARCH
} from "@td/constants";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ComboBox } from "../../Apps/common/Components/Combobox/Combobox";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_COMPANIES } from "./shared";
import FocusTrap from "focus-trap-react";
import styles from "./RegistryCompanySwitcher.module.scss";
type Props = {
  onCompanySelect: (
    orgId: string,
    isDelegation: boolean,
    company?: RegistryCompanyInfos
  ) => void;
  setIsDelegation?: (isDelegation: boolean) => void;
  wrapperClassName?: string;
  allOption?: {
    key: string;
    name: string;
  };
  label?: string;
  defaultSiret?: string;
  excludeDelegations?: boolean;
  disabled?: boolean;
};

export type RegistryCompanyInfos = Pick<
  CompanyPublic,
  | "orgId"
  | "siret"
  | "name"
  | "givenName"
  | "companyTypes"
  | "transporterReceipt"
>;

export function RegistryCompanySwitcher({
  onCompanySelect,
  setIsDelegation,
  wrapperClassName,
  allOption,
  label,
  defaultSiret,
  excludeDelegations = false,
  disabled = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedClue, setDebouncedClue] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>(
    allOption ? allOption.name : ""
  );
  const comboboxTriggerRef = useRef<HTMLDivElement | null>(null);

  const [getCompanyBySiret] = useLazyQuery<Pick<Query, "registryCompanies">>(
    GET_REGISTRY_COMPANIES,
    {
      fetchPolicy: "network-only"
    }
  );

  const setSelectedCompany = (
    orgId: string,
    isDelegation: boolean,
    selected:
      | {
          company: RegistryCompanyInfos;
        }
      | {
          all: true;
        }
  ) => {
    if ("company" in selected) {
      const { name, givenName, siret } = selected.company;
      setSelectedItem(`${givenName || name || ""} ${siret || ""}`);
      setIsDelegation?.(!!isDelegation);
      onCompanySelect(orgId, !!isDelegation, selected?.company);
    } else if (selected.all) {
      setSelectedItem(allOption?.name ?? "");
      setIsDelegation?.(!!isDelegation);
      onCompanySelect(orgId, !!isDelegation);
    }
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
        let firstNodeIsDelegation = false;
        let firstNode: RegistryCompanyInfos | undefined =
          data.registryCompanies.myCompanies.find(node =>
            defaultSiret ? node.siret === defaultSiret : node.siret
          );
        if (!firstNode && data.registryCompanies.delegators.length) {
          firstNode = data.registryCompanies.delegators.find(node =>
            defaultSiret ? node.siret === defaultSiret : node.siret
          );
          firstNodeIsDelegation = true;
        }
        if (firstNode) {
          if (!defaultSiret) {
            onCompanySelect(firstNode.orgId, firstNodeIsDelegation);
          }
          setIsDelegation?.(!!firstNodeIsDelegation);
          setSelectedItem(
            `${firstNode.givenName || firstNode.name || ""} ${
              firstNode.siret || ""
            }`
          );
        } else if (defaultSiret) {
          getCompanyBySiret({
            variables: {
              search: defaultSiret,
              firstCompanies: 1,
              firstDelegators: 1,
              userRoles: [UserRole.Admin, UserRole.Member, UserRole.Reader]
            }
          }).then(result => {
            let isDelegation = false;
            let company: RegistryCompanyInfos | undefined =
              result.data?.registryCompanies.myCompanies[0];
            if (!company) {
              company = result.data?.registryCompanies.delegators[0];
              isDelegation = true;
            }
            if (company) {
              setIsDelegation?.(!!isDelegation);
              setSelectedItem(
                `${company.givenName || company.name || ""} ${
                  company.siret || ""
                }`
              );
            }
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

  const setComboboxOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setDebouncedClue("");
    }
  };

  const myCompanies = companiesData?.registryCompanies.myCompanies ?? [];
  const delegators = companiesData?.registryCompanies.delegators ?? [];
  const totalCount = companiesData?.registryCompanies.totalCount ?? 0;
  const displayedCount = (myCompanies.length || 0) + (delegators.length || 0);

  return (
    <div className={wrapperClassName ?? "tw-w-1/2"}>
      <span id="registry-company-label" className="fr-label">
        {label || "Établissement concerné"}
      </span>
      <div
        id="registry-company-combobox"
        ref={comboboxTriggerRef}
        className={`fr-input tw-flex tw-justify-between ${
          disabled ? styles.disabledSelect : styles.enabledSelect
        }`}
        tabIndex={0}
        role="button"
        aria-labelledby="registry-company-label selected-registry-company"
        onClick={() => {
          if (!disabled) {
            setComboboxOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        onKeyDown={e => {
          if (e.key === "Enter" && !disabled) {
            setComboboxOpen(!isOpen);
          }
        }}
      >
        <span id="selected-registry-company" className="tw-truncate">
          {selectedItem}
        </span>
        <span
          className={`${
            isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
          } fr-icon--sm`}
        />
      </div>
      <ComboBox
        parentRef={comboboxTriggerRef}
        isOpen={isOpen}
        onOpenChange={setComboboxOpen}
      >
        {({ close }) => (
          <FocusTrap
            active={isOpen}
            focusTrapOptions={{
              allowOutsideClick: true
            }}
          >
            <div
              className="tw-bg-white tw-inset-x-0 tw-z-10 tw-px-2 tw-h-full tw-flex tw-flex-col"
              tabIndex={0}
              role="button"
              aria-expanded={isOpen}
              aria-controls="registry-company-content"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setComboboxOpen(!isOpen);
                }
              }}
            >
              <div
                id="registry-company-content"
                className="tw-sticky tw-top-0 tw-bg-white tw-z-10 tw-py-2"
                aria-labelledby="company-count-label"
              >
                <p
                  id="company-count-label"
                  className="tw-text-sm tw-text-center"
                >
                  {displayedCount} sur {totalCount} établissements
                </p>
                <Input
                  iconId="fr-icon-search-line"
                  nativeInputProps={{
                    placeholder: "Rechercher",
                    type: "search",
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
              </div>
              <div className="tw-flex-1 tw-overflow-y-auto">
                <div>
                  {allOption ? (
                    <div
                      className="tw-px-2 tw-py-4 hover:tw-bg-gray-100 tw-cursor-pointer"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedCompany(allOption.key, false, {
                          all: true
                        });
                        close();
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          setSelectedCompany(allOption.key, false, {
                            all: true
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
                      tabIndex={0}
                      onClick={() => {
                        setSelectedCompany(node.orgId, false, {
                          company: node
                        });
                        close();
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          setSelectedCompany(node.orgId, false, {
                            company: node
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
                        tabIndex={0}
                        onClick={() => {
                          setSelectedCompany(delegator.orgId, true, {
                            company: delegator
                          });
                          close();
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            setSelectedCompany(delegator.orgId, true, {
                              company: delegator
                            });
                            close();
                          }
                        }}
                        key={delegator.orgId}
                      >
                        <div>
                          {delegator.givenName || delegator.name}{" "}
                          {delegator.orgId}
                        </div>
                        <Badge noIcon severity="info">
                          Délégation
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FocusTrap>
        )}
      </ComboBox>
    </div>
  );
}
