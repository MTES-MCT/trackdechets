import { gql, useLazyQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Query } from "@td/codegen-ui";
import React from "react";
import { SIRET_STORAGE_KEY } from "../../Apps/common/Components/CompanySwitcher/CompanySwitcher";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { envConfig } from "../../common/envConfig";

const COMPANY_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      orgId
      siret
      vatNumber
      name
      users {
        id
        orgId
        name
        email
        role
      }
    }
  }
`;

const { VITE_API_ENDPOINT } = envConfig;

export function Impersonate() {
  const [search, { loading, error, data }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_PRIVATE_INFOS);

  const tableHeaders = ["Courriel", "Rôle", "Action"];
  const tableData =
    data?.companyPrivateInfos.users?.map(infos => [
      infos.email,
      infos.role,
      <form action={`${VITE_API_ENDPOINT}/impersonate`} method="post">
        <input type="text" hidden value={infos.email} name="email" />

        <Button
          priority="primary"
          size="small"
          onClick={() =>
            // set local storage siret for companyselector
            !!data?.companyPrivateInfos?.siret &&
            window.localStorage.setItem(
              SIRET_STORAGE_KEY,
              JSON.stringify(data.companyPrivateInfos.siret)
            )
          }
        >
          Impersonner
        </Button>
      </form>
    ]) ?? [];

  return (
    <div>
      <div>
        <h3 className="fr-sr-only">Impersonation par courriel</h3>
        <form action={`${VITE_API_ENDPOINT}/impersonate`} method="post">
          <div className="fr-grid-row fr-grid-row--bottom">
            <div className="fr-col-8">
              <Input
                label="Impersonation par courriel"
                nativeInputProps={{
                  required: true,
                  name: "email"
                }}
              />
            </div>
            <div className="fr-col-4">
              <Button priority="primary">Impersonner</Button>
            </div>
          </div>
        </form>
        <h3 className="fr-sr-only">Recherche par entreprise</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);

            search({ variables: { clue: formData.get("clue") } });
          }}
        >
          <div className="fr-grid-row fr-grid-row--bottom fr-mt-4w fr-mb-4v">
            <div className="fr-col-8">
              <Input
                label="Recherche par SIRET ou n° de TVA"
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

          <div className="fr-grid-row">
            {loading && <div>Chargement...</div>}
            {error && (
              <Alert
                className="fr-mb-3w"
                small
                description={error.message}
                severity="error"
              />
            )}
          </div>
        </form>
      </div>
      {data && (
        <div>
          <Table data={tableData} headers={tableHeaders} />
        </div>
      )}
    </div>
  );
}
