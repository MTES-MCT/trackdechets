import { useLazyQuery, useQuery } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import Table from "@codegouvfr/react-dsfr/Table";
import { Query, RegistryImportType } from "@td/codegen-ui";
import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { generatePath, useLocation, useNavigate } from "react-router-dom";
import DropdownMenu from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";
import routes from "../../../Apps/routes";
import { RegistryCompanySwitcher } from "../RegistryCompanySwitcher";
import {
  GET_REGISTRY_LOOKUP,
  GET_REGISTRY_LOOKUPS,
  TYPES,
  TYPES_ROUTES
} from "../shared";
import { format } from "date-fns";

type Inputs = {
  type: RegistryImportType;
  publicId: string;
};

const HEADERS = [
  "Importé le",
  "Type",
  "N° unique",
  "Déclarant",
  "Expédié / réceptionné le",
  "Code déchet",
  "Afficher"
];

export function MyLines() {
  const location = useLocation();
  const [siret, setSiret] = useState<string | undefined>();
  const navigate = useNavigate();

  const [getLookup, { loading, error, data }] = useLazyQuery<
    Pick<Query, "registryLookup">
  >(GET_REGISTRY_LOOKUP, {
    variables: { siret }
  });

  const {
    loading: loadingRecentLookups,
    error: recentLookupsError,
    data: recentLookups
  } = useQuery<Pick<Query, "registryLookups">>(GET_REGISTRY_LOOKUPS, {
    variables: { siret },
    skip: !siret
  });

  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async formData => {
    await getLookup({
      variables: { type: formData.type, publicId: formData.publicId }
    });
  };

  const tableData = recentLookups?.registryLookups?.map(lookup => [
    format(new Date(lookup.createdAt), "dd/MM/yyyy HH'h'mm"),
    TYPES[lookup.type],
    lookup.publicId,
    lookup.reportAsSiret ?? lookup.siret,
    format(new Date(lookup.date), "dd/MM/yyyy"),
    lookup.wasteCode ?? "",
    <Button
      iconId="fr-icon-draft-line"
      onClick={() => {
        const path = generatePath(TYPES_ROUTES[lookup.type], {
          publicId: lookup.publicId
        });
        const queryString = new URLSearchParams({
          siret: lookup.siret,
          publicId: lookup.publicId
        }).toString();

        navigate(`${path}?${queryString}`, {
          state: { background: location }
        });
      }}
      priority="secondary"
      title="Afficher la déclaration"
      size="small"
    />
  ]);

  return (
    <div className="fr-mx-2w">
      <div className="fr-my-2w">
        <DropdownMenu
          links={[
            {
              title: "Sortie de statut de déchet",
              route: generatePath(routes.registry_new.form.ssd),
              state: { background: location }
            }
          ]}
          isDisabled={false}
          menuTitle={"Créer une déclaration"}
          primary
        />
      </div>
      <div className="fr-mb-4w">
        <RegistryCompanySwitcher onCompanySelect={v => setSiret(v)} />
      </div>
      <h4 className="fr-h4">Rechercher une délégation</h4>
      <form onSubmit={handleSubmit(onSubmit)} className="fr-mb-4w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-2w">
          <div className="fr-col-5">
            <Select
              label="Type de déclaration"
              nativeSelectProps={{ ...register("type", { required: true }) }}
            >
              <option disabled hidden value="">
                Selectionnez un type d'import
              </option>
              <option value="SSD">Sortie de statut de déchet</option>
              <option value="INCOMING_WASTE">
                Déchets dangereux et non dangereux entrants
              </option>
              <option value="INCOMING_TEXS">
                Terres excavées et sédiments, dangereux et non dangereux
                entrants
              </option>
              <option value="OUTGOING_WASTE">
                Déchets dangereux et non dangereux sortants
              </option>
              <option value="OUTGOING_TEXS">
                Terres excavées et sédiments, dangereux et non dangereux
                sortants
              </option>
              <option value="TRANSPORTED">Transportés</option>
              <option value="MANAGED">Gérés</option>
            </Select>
          </div>
          <div className="fr-col-3">
            <Input
              label="Numéro unique"
              nativeInputProps={{
                ...register("publicId", { required: true })
              }}
            />
          </div>
          <div className="fr-col">
            <Button priority="secondary" disabled={loading}>
              Afficher
            </Button>
          </div>
        </div>
        {data && (
          <Alert
            description={`La déclaration n° ${data.registryLookup.publicId} est bien présente dans votre registre`}
            severity="success"
            small
          />
        )}
        {error && <Alert description={error.message} severity="error" small />}
      </form>
      <h4 className="fr-h4">Déclarations récentes</h4>
      {loadingRecentLookups && <div>Chargement...</div>}
      {recentLookupsError && (
        <Alert
          severity="error"
          title={"Erreur lors du chargement des déclarations récentes"}
        />
      )}
      {recentLookups && (
        <div>
          {tableData && tableData.length > 0 ? (
            <Table bordered noCaption data={tableData} headers={HEADERS} />
          ) : (
            "Aucune déclaration récente sur cet établissement"
          )}
        </div>
      )}
    </div>
  );
}
