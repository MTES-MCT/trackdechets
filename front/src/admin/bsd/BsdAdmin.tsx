import { gql, useLazyQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Table from "@codegouvfr/react-dsfr/Table";
import {
  Bsda,
  Bsdasri,
  Bsff,
  Bspaoh,
  Bsvhu,
  Form,
  Query,
  UserPermission
} from "@td/codegen-ui";
import React, { useState } from "react";
import BsdCard from "../../Apps/Dashboard/Components/BsdCard/BsdCard";
import {
  dashboardBsdaFragment,
  dashboardBsffFragment,
  dashboardBspaohFragment,
  dashboardDasriFragment,
  dashboardFormFragment,
  dashboardVhuFragment
} from "../../Apps/common/queries/fragments";
import { BsdDisplay } from "../../Apps/common/types/bsdTypes";
import { Modal } from "../../common/components";
import { PermissionsContext } from "../../common/contexts/PermissionsContext";
import { PreviewModal } from "./PreviewModal";

const FIND_BSD = gql`
  query FindBsd($id: String!) {
    findBsd(id: $id) {
      ... on Form {
        ...DashboardFormFragment
      }
      ... on Bsdasri {
        ...DashboardDasriFragment
      }
      ... on Bsvhu {
        ...DashboardVhuFragment
      }
      ... on Bsff {
        ...DashboardBsffFragment
      }
      ... on Bsda {
        ...DashboardBsdaFragment
      }
      ... on Bspaoh {
        ...DashboardBspaohFragment
      }
    }
  }
  ${dashboardFormFragment}
  ${dashboardDasriFragment}
  ${dashboardBsffFragment}
  ${dashboardVhuFragment}
  ${dashboardBsdaFragment}
  ${dashboardBspaohFragment}
`;

const COMPANY_ACCOUNT_ADD_PRIVATE_INFOS = gql`
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

const { VITE_API_ENDPOINT } = import.meta.env;

export function BsdAdmin() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [findBsd, { loading, error, data }] =
    useLazyQuery<Pick<Query, "findBsd">>(FIND_BSD);

  const [
    search,
    {
      loading: loadingImpersonate,
      error: errorImpersonate,
      data: dataImpersonate
    }
  ] = useLazyQuery<Pick<Query, "companyPrivateInfos">>(
    COMPANY_ACCOUNT_ADD_PRIVATE_INFOS
  );

  const possibleImpersonations = [
    [
      data?.findBsd?.emitter?.company?.siret,
      data?.findBsd?.emitter?.company?.name,
      "Emetteur"
    ],
    [
      data?.findBsd?.transporter?.company?.siret,
      data?.findBsd?.transporter?.company?.name,
      "Transporteur"
    ],
    [
      (data?.findBsd as Form)?.recipient?.company?.siret,
      (data?.findBsd as Form)?.recipient?.company?.name,
      "Destination"
    ],
    [
      (data?.findBsd as Bsda | Bsdasri | Bsff | Bsvhu | Bspaoh)?.destination
        ?.company?.siret,
      (data?.findBsd as Bsda | Bsdasri | Bsff | Bsvhu | Bspaoh)?.destination
        ?.company?.name,
      "Destination"
    ]
  ].filter(v => Boolean(v[0]));

  const possibleImpersonationHeaders = ["Nom", "Siret", "Rôle", "Action"];
  const possibleImpersonationData =
    possibleImpersonations.map(infos => [
      infos[1],
      infos[0],
      infos[2],
      <form
        onSubmit={e => {
          e.preventDefault();
          search({ variables: { clue: infos[0] } });
        }}
      >
        <Button priority="primary" size="small">
          Rechercher
        </Button>
      </form>
    ]) ?? [];

  const resultsHeaders = ["Email", "Rôle", "Action"];
  const resultsData =
    dataImpersonate?.companyPrivateInfos.users?.map(infos => [
      infos.email,
      infos.role,
      <form action={`${VITE_API_ENDPOINT}/impersonate`} method="post">
        <input type="text" hidden value={infos.email} name="email" readOnly />
        <Button priority="primary" size="small">
          Impersonner
        </Button>
      </form>
    ]) ?? [];

  const onBsdOverview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <div>
      <h3 className="fr-h3 fr-mt-4w">Recherche par numéro de bordereau</h3>
      <form
        onSubmit={e => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          findBsd({ variables: { id: formData.get("id") } });
        }}
      >
        <div className="fr-grid-row fr-grid-row--bottom">
          <div className="fr-col-8">
            <Input
              label="Identifiant du bordereau"
              nativeInputProps={{
                required: true,
                name: "id"
              }}
            />
          </div>
          <div className="fr-col-4">
            <Button size="medium">Rechercher</Button>
          </div>
        </div>
      </form>

      {loading && <div>Chargement...</div>}
      {error && <div>Une erreur s'est produite...</div>}
      {data && (
        <div>
          <h4 className="fr-h4 fr-mt-4w">Carte comme dans le dashboard</h4>
          <div>
            {/* Override permissions context to hide the card's actions except PDF & aperçu */}
            <PermissionsContext.Provider
              value={{
                permissions: [UserPermission.BsdCanRead],
                updatePermissions: () => {}
              }}
            >
              <BsdCard
                bsd={data.findBsd}
                currentSiret={"unset"}
                bsdCurrentTab={"followTab"}
                onValidate={() => {}}
                secondaryActions={{
                  onOverview: onBsdOverview
                }}
                hasAutomaticSignature={false}
              />
            </PermissionsContext.Provider>
          </div>

          <Modal
            ariaLabel="Aperçu du bordereau"
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          >
            <PreviewModal bsd={data.findBsd} />
          </Modal>

          <h4 className="fr-h4 fr-mt-4w">Impersonation</h4>
          <p>
            La liste des entreprises du bordereau est présentée ci-dessous. Pour
            impersonner un membre de ces entreprises, appuyez sur rechercher
            puis consultez le tableau qui apparaitra en dessous
          </p>
          <div>
            <Table
              data={possibleImpersonationData}
              headers={possibleImpersonationHeaders}
            />
          </div>

          {errorImpersonate && (
            <p>Erreur lors du chargement des impersonations possibles</p>
          )}
          {loadingImpersonate && <p>Chargement des impersonations...</p>}
          {!loadingImpersonate && dataImpersonate && (
            <div>
              <p>
                Membres de {dataImpersonate?.companyPrivateInfos.name} (
                {dataImpersonate?.companyPrivateInfos.siret}) :
              </p>
              <div>
                <Table data={resultsData} headers={resultsHeaders} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
