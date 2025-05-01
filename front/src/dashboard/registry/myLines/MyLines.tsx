import { useMutation, useQuery } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { Mutation, Query, RegistryImportType } from "@td/codegen-ui";
import React, { useEffect, useMemo, useState } from "react";
import { generatePath, useLocation, useNavigate } from "react-router-dom";
import { debounce } from "../../../common/helper";
import DropdownMenu from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";
import routes from "../../../Apps/routes";
import { RegistryCompanySwitcher } from "../RegistryCompanySwitcher";
import {
  CANCEL_REGISTRY_V2_LINES,
  GET_REGISTRY_LOOKUPS,
  TYPES,
  TYPES_ROUTES
} from "../shared";
import { format } from "date-fns";
import { ActionButton } from "./ActionButton";
import RegistryTable from "../RegistryTable";
import { InlineLoader } from "../../../Apps/common/Components/Loader/Loaders";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import "./MyLines.scss";

const HEADERS = [
  "Importé le",
  "Type",
  "N° unique",
  "Déclarant",
  "Expédié / réceptionné le",
  "Code déchet",
  "Actions"
];

const REGISTRY_NAMES = {
  [RegistryImportType.Ssd]: "Sortie de statut de déchet",
  [RegistryImportType.IncomingWaste]:
    "Déchets dangereux et non dangereux entrants",
  [RegistryImportType.IncomingTexs]:
    "Terres excavées et sédiments, dangereux et non dangereux entrants",
  [RegistryImportType.OutgoingWaste]:
    "Déchets dangereux et non dangereux sortants",
  [RegistryImportType.OutgoingTexs]:
    "Terres excavées et sédiments, dangereux et non dangereux sortants",
  [RegistryImportType.Transported]: "Transportés",
  [RegistryImportType.Managed]: "Gérés"
};

const DEBOUNCE_DELAY = 500;

const deleteConfirmationModal = createModal({
  id: "delete-line-confirmation-modal",
  isOpenedByDefault: false
});

export function MyLines() {
  const location = useLocation();
  const [siret, setSiret] = useState<string | undefined>();
  const [type, setType] = useState<RegistryImportType | undefined>();
  const [publicId, setPublicId] = useState<string>("");
  const [debouncedPublicId, setDebouncedPublicId] = useState<string>("");
  const [publicIdToDelete, setPublicIdToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useIsModalOpen(deleteConfirmationModal, {
    onConceal: () => {
      setPublicIdToDelete(null);
    }
  });

  const {
    loading: loadingRecentLookups,
    error: recentLookupsError,
    data: recentLookups
  } = useQuery<Pick<Query, "registryLookups">>(GET_REGISTRY_LOOKUPS, {
    variables: { siret, type, publicId: debouncedPublicId },
    skip: !siret
  });

  const [cancelRegistryLine] = useMutation<
    Pick<Mutation, "cancelRegistryV2Lines">
  >(CANCEL_REGISTRY_V2_LINES, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  const debouncedOnApplyFilters = useMemo(() => {
    return debounce(
      (publicId: string) => setDebouncedPublicId(publicId),
      DEBOUNCE_DELAY
    );
  }, []);

  const cancelLine = () => {
    const line = recentLookups?.registryLookups?.find(
      lookup => lookup.publicId === publicIdToDelete
    );
    if (!line) {
      return;
    }
    cancelRegistryLine({
      variables: {
        publicIds: [line.publicId],
        siret: line.siret,
        delegateSiret: line.reportAsSiret,
        type: line.type
      }
    });
  };

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
    <div className="tw-px-2 line-actions-dropdown-container">
      <DropdownMenu
        className="line-actions-dropdown"
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
            title: "Annuler",
            isButton: true,
            handleClick: () => {
              setPublicIdToDelete(lookup.publicId);
              deleteConfirmationModal.open();
            }
          }
        ]}
        isDisabled={false}
      />
    </div>
  ]);

  return (
    <>
      <>
        <div className="fr-mb-4w">
          <DropdownMenu
            links={[
              {
                title: REGISTRY_NAMES[RegistryImportType.Ssd],
                route: generatePath(routes.registry_new.form.ssd),
                state: { background: location }
              },
              {
                title: REGISTRY_NAMES[RegistryImportType.IncomingWaste],
                route: generatePath(routes.registry_new.form.incomingWaste),
                state: { background: location }
              },
              {
                title: REGISTRY_NAMES[RegistryImportType.IncomingTexs],
                route: generatePath(routes.registry_new.form.incomingTexs),
                state: { background: location }
              },
              {
                title: REGISTRY_NAMES[RegistryImportType.OutgoingWaste],
                route: generatePath(routes.registry_new.form.outgoingWaste),
                state: { background: location }
              },
              // {
              //   title: REGISTRY_NAMES[RegistryImportType.OutgoingTexs],
              //   route: generatePath(routes.registry_new.form.outgoingTexs),
              //   state: { background: location }
              // },
              {
                title: REGISTRY_NAMES[RegistryImportType.Transported],
                route: generatePath(routes.registry_new.form.transported),
                state: { background: location }
              }
              // {
              //   title: REGISTRY_NAMES[RegistryImportType.Managed],
              //   route: generatePath(routes.registry_new.form.managed),
              //   state: { background: location }
              // }
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
                {REGISTRY_NAMES[RegistryImportType.Ssd]}
              </option>
              <option value={RegistryImportType.IncomingWaste}>
                {REGISTRY_NAMES[RegistryImportType.IncomingWaste]}
              </option>
              <option value={RegistryImportType.IncomingTexs}>
                {REGISTRY_NAMES[RegistryImportType.IncomingTexs]}
              </option>
              <option value={RegistryImportType.OutgoingWaste}>
                {REGISTRY_NAMES[RegistryImportType.OutgoingWaste]}
              </option>
              <option value={RegistryImportType.OutgoingTexs}>
                {REGISTRY_NAMES[RegistryImportType.OutgoingTexs]}
              </option>
              <option value={RegistryImportType.Transported}>
                {REGISTRY_NAMES[RegistryImportType.Transported]}
              </option>
              <option value={RegistryImportType.Managed}>
                {REGISTRY_NAMES[RegistryImportType.Managed]}
              </option>
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
      </>
      <deleteConfirmationModal.Component
        title={`Annuler la déclaration ?`}
        className="dnd-from-bsd-confirmation-modal"
        size="medium"
        buttons={[
          {
            priority: "secondary",
            doClosesModal: true,
            children: "Fermer"
          },
          {
            onClick: cancelLine,
            doClosesModal: true,
            priority: "primary",
            className: "danger-button",
            children: "Annuler la déclaration"
          }
        ]}
      >
        <div className="fr-mt-5v">
          <p>
            Vous êtes sur le point d'annuler la déclaration{" "}
            <span className="fr-text--bold">{publicIdToDelete}</span>.
          </p>
        </div>
      </deleteConfirmationModal.Component>
    </>
  );
}
