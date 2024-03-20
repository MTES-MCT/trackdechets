import { gql, useLazyQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Query } from "@td/codegen-ui";
import React from "react";

const COMPANY_ACCOUNT_ADD_PRIVATE_INFOS = gql`
  query CompanyPrivateInfos($clue: String!) {
    companyPrivateInfos(clue: $clue) {
      orgId
      siret
      vatNumber
      name
      users {
        id
        name
        email
        role
      }
    }
  }
`;

const { VITE_API_ENDPOINT } = import.meta.env;

export function Impersonate() {
  const [search, { loading, error, data }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_ACCOUNT_ADD_PRIVATE_INFOS);

  const tableHeaders = ["Email", "Rôle", "Action"];
  const tableData =
    data?.companyPrivateInfos.users?.map(infos => [
      infos.email,
      infos.role,
      <form action={`${VITE_API_ENDPOINT}/impersonate`} method="post">
        <input type="text" hidden value={infos.email} name="email" />
        <Button priority="primary" size="small">
          Impersonner
        </Button>
      </form>
    ]) ?? [];

  return (
    <div>
      <div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);

            search({ variables: { clue: formData.get("clue") } });
          }}
        >
          <h3 className="fr-h3">Impersonation par email</h3>
          <form action={`${VITE_API_ENDPOINT}/impersonate`} method="post">
            <div className="fr-grid-row fr-grid-row--bottom">
              <div className="fr-col-8">
                <Input
                  label="Email"
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
          <h3 className="fr-h3">Recherche par entreprise</h3>
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
      {data && (
        <div>
          <Table data={tableData} headers={tableHeaders} />
        </div>
      )}
    </div>
  );
}
