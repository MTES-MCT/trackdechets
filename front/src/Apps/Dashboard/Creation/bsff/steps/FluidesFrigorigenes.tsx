import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { IconBSFF } from "../../../../common/Components/Icons/Icons";
import Select, { Option } from "../../../../common/Components/Select/Select";
import { ZodBsff } from "../schema";
import styles from "./FluidesFrigorigenes.module.scss";
import { adaptFluidesFrigorigenesToBsffImport } from "./fluides-frigorigenes/adapter";
import {
  filterInterventions,
  FluidesFrigorigenesDataState,
  FluidesFrigorigenesFilters,
  FluidesFrigorigenesIntervention,
  getSelectedWasteCodes,
  isInterventionSelectable
} from "./fluides-frigorigenes/model";
import { useFluidesFrigorigenes } from "./fluides-frigorigenes/useFluidesFrigorigenes";

const AVAILABILITY_URL =
  "https://faq.trackdechets.fr/aide-et-disponibilite/disponibilite-de-loutil";
const initialFilters: FluidesFrigorigenesFilters = {
  wasteCodes: [],
  equipmentHolders: []
};
const toOptions = (values: string[]): Option[] =>
  values.map(value => ({ value, label: value }));
const optionsToValues = (options: Option[]) =>
  options.map(({ value }) => value);

export default function FluidesFrigorigenesBsff() {
  const { setValue, watch } = useFormContext<ZodBsff>();
  const operatorSiret = watch("emitter.company.siret") ?? "";
  const importedInterventionIds =
    watch("fluidesFrigorigenesImport.selectedInterventionIds") ?? [];
  const state = useFluidesFrigorigenes(operatorSiret);
  const importInterventions = (
    interventions: FluidesFrigorigenesIntervention[]
  ) => {
    const imported = adaptFluidesFrigorigenesToBsffImport(interventions);
    const options = { shouldDirty: true, shouldValidate: true };

    setValue("waste.code", imported.waste.code, options);
    setValue("waste.description", imported.waste.description, options);
    setValue("waste.adr", imported.waste.adr, options);
    setValue("packagings", imported.packagings, options);
    setValue("weight.value", imported.weight.value, options);
    setValue("weight.isEstimate", imported.weight.isEstimate, options);
    setValue("ficheInterventions", imported.ficheInterventions, options);
    setValue(
      "fluidesFrigorigenesImport",
      imported.fluidesFrigorigenesImport,
      options
    );
  };

  return (
    <FluidesFrigorigenesView
      key={operatorSiret}
      operatorSiret={operatorSiret}
      state={state}
      onImport={importInterventions}
      initialSelectedIds={importedInterventionIds}
      onSelectionChange={selectedInterventionIds =>
        setValue(
          "fluidesFrigorigenesImport.selectedInterventionIds",
          selectedInterventionIds,
          { shouldDirty: true }
        )
      }
    />
  );
}

type ViewProps = {
  operatorSiret: string;
  state: FluidesFrigorigenesDataState;
  onImport?: (interventions: FluidesFrigorigenesIntervention[]) => void;
  initialSelectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
};

export function FluidesFrigorigenesView({
  operatorSiret,
  state,
  onImport = () => undefined,
  initialSelectedIds = [],
  onSelectionChange = () => undefined
}: ViewProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const interventions = state.status === "success" ? state.interventions : [];
  if (state.status === "loading")
    return <p role="status">Chargement des fiches d'intervention…</p>;
  return (
    <section aria-labelledby="ff-title">
      <h2 id="ff-title" className="fr-h5">
        Importation depuis Fluides Frigorigènes
      </h2>
      <p>
        Recherchez et sélectionnez les fiches d'interventions que vous souhaitez
        importer depuis Fluides Frigorigènes.
      </p>
      {state.status === "serviceError" && (
        <Alert
          severity="error"
          title="Erreur 500 : API down"
          description={
            <>
              Connexion à l'API impossible, merci d'attendre quelques instants.
              N'hésitez pas à vérifier la disponibilité de l'API sur la page{" "}
              <a href={AVAILABILITY_URL} target="_blank" rel="noreferrer">
                {AVAILABILITY_URL}
              </a>
            </>
          }
        />
      )}
      {state.status === "credentialsError" && (
        <Alert
          severity="info"
          title="Erreur de connexion avec les identifiants"
          description={
            <>
              Connexion à l'API impossible, merci d'attendre quelques instants.
              N'hésitez pas à vérifier la disponibilité de l'API sur la page{" "}
              <a href={AVAILABILITY_URL} target="_blank" rel="noreferrer">
                {AVAILABILITY_URL}
              </a>
            </>
          }
        />
      )}
      {state.status === "missingSiret" && (
        <Alert
          severity="error"
          title="Opérateur manquant"
          description="Sélectionnez d'abord l'opérateur dans l'onglet Bordereau pour charger ses fiches d'intervention Fluides Frigorigènes."
        />
      )}
      {state.status === "unknownSiret" && (
        <Alert
          severity="info"
          title="SIRET non reconnu"
          description="Le SIRET saisi dans l'onglet bordereau n'a pas été reconnu, vérifiez la saisie et qu'il correspond bien à celui déclaré dans l'application Fluides Frigorigènes"
        />
      )}
      {state.status === "success" && !state.interventions.length && (
        <Alert
          severity="error"
          title="Dataset vide"
          description={`Aucune donnée disponible dans l'application Fluides Frigorigènes pour le SIRET ${operatorSiret}`}
        />
      )}
      <Content
        interventions={interventions}
        filters={filters}
        setFilters={setFilters}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        expandedIds={expandedIds}
        setExpandedIds={setExpandedIds}
        onImport={onImport}
        onSelectionChange={onSelectionChange}
      />
    </section>
  );
}

type ContentProps = {
  interventions: FluidesFrigorigenesIntervention[];
  filters: FluidesFrigorigenesFilters;
  setFilters: React.Dispatch<React.SetStateAction<FluidesFrigorigenesFilters>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  expandedIds: string[];
  setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onImport: (interventions: FluidesFrigorigenesIntervention[]) => void;
  onSelectionChange: (selectedIds: string[]) => void;
};
function Content({
  interventions,
  filters,
  setFilters,
  selectedIds,
  setSelectedIds,
  expandedIds,
  setExpandedIds,
  onImport,
  onSelectionChange
}: ContentProps) {
  const filtered = useMemo(
    () => filterInterventions(interventions, filters),
    [interventions, filters]
  );
  const selectedWasteCodes = getSelectedWasteCodes(interventions, selectedIds);
  const selected = interventions.filter(({ id }) => selectedIds.includes(id));
  const wasteOptions = toOptions([
    ...new Set(interventions.flatMap(({ wasteCodes }) => wasteCodes))
  ]);
  const holderOptions = toOptions([
    ...new Set(interventions.map(({ equipmentHolder }) => equipmentHolder))
  ]);
  const toggleSelection = (id: string) => {
    const selected = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    setSelectedIds(selected);
    onSelectionChange(selected);
  };
  const toggleExpanded = (id: string) =>
    setExpandedIds(ids =>
      ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]
    );
  const rows = filtered.flatMap(intervention => {
    const checked = selectedIds.includes(intervention.id);
    const disabled =
      !checked && !isInterventionSelectable(intervention, selectedWasteCodes);
    const main = [
      <button
        key={`expand-${intervention.id}`}
        type="button"
        className={styles.expandButton}
        aria-expanded={expandedIds.includes(intervention.id)}
        aria-label={`${
          expandedIds.includes(intervention.id) ? "Replier" : "Déplier"
        } la fiche ${intervention.number}`}
        onClick={() => toggleExpanded(intervention.id)}
      >
        <span
          aria-hidden="true"
          className={
            expandedIds.includes(intervention.id)
              ? "ri-arrow-up-s-line"
              : "ri-arrow-down-s-line"
          }
        />
      </button>,
      <span className={styles.numberCell}>
        <span
          aria-hidden="true"
          className={`ri-file-line ${styles.numberIcon}`}
        />
        {intervention.number}
      </span>,
      intervention.wasteCodes.join(", ") || "—",
      intervention.equipmentHolder,
      `${intervention.weightKg} kg`,
      intervention.interventionDate ?? "—",
      checked ? (
        <span key={`selected-${intervention.id}`}>Ajouté</span>
      ) : (
        <Button
          key={`select-${intervention.id}`}
          type="button"
          priority="secondary"
          size="small"
          disabled={disabled}
          nativeButtonProps={{
            "aria-label": `Ajouter la fiche ${intervention.number}`
          }}
          onClick={() => toggleSelection(intervention.id)}
        >
          Ajouter
        </Button>
      )
    ];
    return expandedIds.includes(intervention.id)
      ? [
          main,
          ...intervention.containers.map(container => [
            "",
            <span className={styles.numberCell}>
              <IconBSFF aria-hidden="true" width="24" height="24" />
              {container.number}
            </span>,
            container.wasteCode,
            intervention.equipmentHolder,
            `${container.weightKg} kg`,
            container.volumeLiters ? `${container.volumeLiters} L` : "—",
            ""
          ])
        ]
      : [main];
  });
  const removeFilter = (key: keyof FluidesFrigorigenesFilters, value: string) =>
    setFilters(current => ({
      ...current,
      [key]: current[key].filter(item => item !== value)
    }));
  return (
    <>
      <div className={styles.filters}>
        <Select
          label="Code déchet"
          placeholder="Code déchet"
          options={wasteOptions}
          isMultiple
          selected={wasteOptions.filter(option =>
            filters.wasteCodes.includes(option.value)
          )}
          onChange={options =>
            setFilters(current => ({
              ...current,
              wasteCodes: optionsToValues(options as unknown as Option[])
            }))
          }
        />
        <Select
          label="Détenteur de l'équipement"
          placeholder="Détenteur de l'équipement"
          options={holderOptions}
          isMultiple
          selected={holderOptions.filter(option =>
            filters.equipmentHolders.includes(option.value)
          )}
          onChange={options =>
            setFilters(current => ({
              ...current,
              equipmentHolders: optionsToValues(options as unknown as Option[])
            }))
          }
        />
      </div>
      <div className={styles.tags} aria-label="Filtres actifs">
        {(["wasteCodes", "equipmentHolders"] as const).flatMap(key =>
          filters[key].map(value => (
            <Tag
              key={`${key}-${value}`}
              dismissible
              nativeButtonProps={{
                onClick: () => removeFilter(key, value),
                "aria-label": `Supprimer le filtre ${value}`
              }}
            >
              {value}
            </Tag>
          ))
        )}
      </div>
      <Table
        noCaption
        caption="Fiches d'intervention disponibles"
        headers={[
          "",
          "Fiche intervention",
          "Code déchet",
          "Détenteur de l'équipement",
          "Poids",
          "Date intervention",
          ""
        ]}
        data={rows}
      />
      <h3 className="fr-h6 fr-mt-3w">Fiches d'interventions sélectionnées</h3>
      <p>
        Vous vous apprêtez à importer ces fiches d'interventions avec leurs
        relations contenants / détenteurs.
      </p>
      <Table
        noCaption
        caption="Fiches d'intervention sélectionnées"
        headers={[
          "Fiche intervention",
          "Code déchet",
          "Détenteur de l'équipement",
          "Poids",
          "Date intervention",
          ""
        ]}
        data={selected.map(intervention => [
          <span className={styles.numberCell}>
            <span
              aria-hidden="true"
              className={`ri-file-line ${styles.numberIcon}`}
            />
            {intervention.number}
          </span>,
          intervention.wasteCodes.join(", ") || "—",
          intervention.equipmentHolder,
          `${intervention.weightKg} kg`,
          intervention.interventionDate ?? "—",
          <Button
            key={`remove-${intervention.id}`}
            type="button"
            priority="secondary"
            size="small"
            nativeButtonProps={{
              "aria-label": `Retirer la fiche ${intervention.number}`
            }}
            onClick={() => toggleSelection(intervention.id)}
          >
            Retirer
          </Button>
        ])}
      />
      {!selected.length && <p>Aucune fiche sélectionnée</p>}
      <div className={styles.actions}>
        <Button disabled={!selected.length} onClick={() => onImport(selected)}>
          Importer les fiches d'interventions
        </Button>
      </div>
    </>
  );
}
