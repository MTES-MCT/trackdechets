import { useLazyQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Query } from "@td/codegen-ui";
import CompanyResults, {
  CompanyResultBase
} from "../../form/common/components/company/CompanyResults";
import CompanyMembers, {
  CompanyPrivateMembers
} from "../../Apps/Companies/CompanyMembers/CompanyMembers";
import { COMPANY_ADMIN_PRIVATE_INFOS } from "../../Apps/Companies/common/queries";
import React, { useEffect, useState } from "react";

type CompanyPrivateMembersAndResults = CompanyPrivateMembers &
  CompanyResultBase;

export function MembersAdmin() {
  const [selectedCompany, selectCompany] =
    useState<CompanyPrivateMembersAndResults | null>(null);
  const [search, { loading, error, data }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_ADMIN_PRIVATE_INFOS);

  const searchResults = data?.companyPrivateInfos
    ? [data.companyPrivateInfos]
    : [];
  useEffect(() => {
    if (data?.companyPrivateInfos) {
      selectCompany(data.companyPrivateInfos);
    }
  }, [data]);
  return (
    <div>
      <div>
        <h3 className="fr-h3 fr-mt-4w">Recherche une entreprise</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);

            search({ variables: { clue: formData.get("clue") } });
          }}
        >
          <div className="fr-grid-row fr-grid-row--bottom">
            <div className="fr-col-8">
              <Input
                label="SIRET ou Numéro TVA"
                nativeInputProps={{
                  required: true,
                  name: "clue"
                }}
              />
            </div>
            <div className="fr-col-4">
              <Button size="medium">Rechercher</Button>
            </div>
          </div>
        </form>
      </div>
      {loading && <div>Chargement...</div>}
      {error && <div>Erreur</div>}
      {searchResults && (
        <CompanyResults<CompanyPrivateMembersAndResults>
          onSelect={company => selectCompany(company)}
          onUnselect={() => selectCompany(null)}
          results={searchResults}
          selectedItem={selectedCompany}
        />
      )}
      {selectedCompany && (
        <div>
          <CompanyMembers company={selectedCompany} isTDAdmin={true} />
        </div>
      )}
    </div>
  );
}
