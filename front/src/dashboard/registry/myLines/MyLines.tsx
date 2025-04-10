import { useQuery } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { Query, RegistryImportType } from "@td/codegen-ui";
import React, { useEffect, useMemo, useState } from "react";
import { generatePath, useLocation, useNavigate } from "react-router-dom";
import { debounce } from "../../../common/helper";
import DropdownMenu from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";
import routes from "../../../Apps/routes";
import { RegistryCompanySwitcher } from "../RegistryCompanySwitcher";
import { GET_REGISTRY_LOOKUPS, TYPES, TYPES_ROUTES } from "../shared";
import { format } from "date-fns";
import { ActionButton } from "./ActionButton";
import Container from "../../../Apps/common/Components/Container/Container";
import RegistryTable from "../RegistryTable";
import { InlineLoader } from "../../../Apps/common/Components/Loader/Loaders";
const HEADERS = [
  "Importé le",
  "Type",
  "N° unique",
  "Déclarant",
  "Expédié / réceptionné le",
  "Code déchet",
  "Actions"
];
const DEBOUNCE_DELAY = 500;

export function MyLines() {
  const location = useLocation();
  const [siret, setSiret] = useState<string | undefined>();
  const [type, setType] = useState<RegistryImportType | undefined>();
  const [publicId, setPublicId] = useState<string>("");
  const [debouncedPublicId, setDebouncedPublicId] = useState<string>("");
  const navigate = useNavigate();

  const {
    loading: loadingRecentLookups,
    error: recentLookupsError,
    data: recentLookups
  } = useQuery<Pick<Query, "registryLookups">>(GET_REGISTRY_LOOKUPS, {
    variables: { siret, type, publicId: debouncedPublicId },
    skip: !siret
  });

  const debouncedOnApplyFilters = useMemo(() => {
    return debounce(
      (publicId: string) => setDebouncedPublicId(publicId),
      DEBOUNCE_DELAY
    );
  }, []);

  useEffect(() => {
    debouncedOnApplyFilters(publicId);
  }, [debouncedOnApplyFilters, publicId]);

  const tableData = recentLookups?.registryLookups?.map(lookup => [
    format(new Date(lookup.declaredAt), "dd/MM/yyyy HH'h'mm"),
    TYPES[lookup.type],
    lookup.publicId,
    lookup.reportAsSiret ?? lookup.siret,
    format(new Date(lookup.date), "dd/MM/yyyy"),
    lookup.wasteCode ?? "",
    <div className="tw-px-2">
      <DropdownMenu
        menuTitle={`Menu d'action de la déclaration ${lookup.publicId}`}
        ButtonElement={ActionButton}
        alignRight
        links={[
          {
            title: "Modifier",
            isButton: true,
            handleClick: () => {
              const path = generatePath(TYPES_ROUTES[lookup.type]);
              const queryString = new URLSearchParams({
                siret: lookup.siret,
                publicId: lookup.publicId
              }).toString();
              navigate(`${path}?${queryString}`, {
                state: { background: location }
              });
            }
          },
          {
            title: "Supprimer",
            isButton: true,
            handleClick: () => {
              console.log("Supprimer");
            }
          }
        ]}
        isDisabled={false}
      />
      {/* <Button
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
      /> */}
    </div>
  ]);

  return (
    <Container>
      <div className="fr-mb-4w">
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
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-4w">
        <div className="fr-col-7">
          <RegistryCompanySwitcher
            wrapperClassName={""}
            onCompanySelect={v => setSiret(v)}
          />
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-2w">
        <div className="fr-col-7">
          <Select
            label="Type de déclaration"
            nativeSelectProps={{
              onChange: e => {
                setType((e.target.value as RegistryImportType) || undefined);
              },
              value: type
            }}
          >
            <option value="">Déclarations récentes</option>
            <option value={RegistryImportType.Ssd}>
              Sortie de statut de déchet
            </option>
            <option value={RegistryImportType.IncomingWaste}>
              Déchets dangereux et non dangereux entrants
            </option>
            <option value={RegistryImportType.IncomingTexs}>
              Terres excavées et sédiments, dangereux et non dangereux entrants
            </option>
            <option value={RegistryImportType.OutgoingWaste}>
              Déchets dangereux et non dangereux sortants
            </option>
            <option value={RegistryImportType.OutgoingTexs}>
              Terres excavées et sédiments, dangereux et non dangereux sortants
            </option>
            <option value={RegistryImportType.Transported}>Transportés</option>
            <option value={RegistryImportType.Managed}>Gérés</option>
          </Select>
        </div>
        <div className="fr-col-3">
          <Input
            label="Numéro unique"
            nativeInputProps={{
              onChange: e => {
                setPublicId(e.target.value);
              },
              value: publicId
            }}
          />
        </div>
      </div>
      {loadingRecentLookups && <InlineLoader />}
      {recentLookupsError && (
        <Alert
          severity="error"
          title={"Erreur lors du chargement des déclarations récentes"}
        />
      )}
      {recentLookups && (
        <div>
          {tableData && tableData.length > 0 ? (
            <RegistryTable data={tableData} headers={HEADERS} />
          ) : (
            "Aucune déclaration récente sur cet établissement"
          )}
        </div>
      )}
    </Container>
  );
}
