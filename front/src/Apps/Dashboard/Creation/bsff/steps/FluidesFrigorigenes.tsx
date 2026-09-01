import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import Select, { Option } from "../../../../common/Components/Select/Select";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import { ZodBsff } from "../schema";
import styles from "./FluidesFrigorigenes.module.scss";
import { mockFluidesFrigorigenesInterventions } from "./fluides-frigorigenes/mockData";
import { filterInterventions, FluidesFrigorigenesDataState, FluidesFrigorigenesFilters, FluidesFrigorigenesIntervention, getSelectedWasteCode, isInterventionSelectable } from "./fluides-frigorigenes/model";

const AVAILABILITY_URL = "https://faq.trackdechets.fr/aide-et-disponibilite/disponibilite-de-loutil";
const initialFilters: FluidesFrigorigenesFilters = { wasteCodes: [], equipmentHolders: [], association: ["no"] };
type Props = { dataState?: FluidesFrigorigenesDataState };
const toOptions = (values: string[]): Option[] => values.map(value => ({ value, label: value }));
const optionsToValues = (options: Option[]) => options.map(({ value }) => value);

export default function FluidesFrigorigenesBsff({ dataState }: Props) {
  const { watch } = useFormContext<ZodBsff>();
  const operatorSiret = watch("emitter.company.siret") ?? "";
  // TODO(backend FF): replace this isolated mock state with the Trackdechets GraphQL query using
  // operatorSiret. Consume the mapped backend contract (not raw FF JSON), connect loading/error/
  // empty states and verify this frontend model against the backend-returned fields.
  const state: FluidesFrigorigenesDataState = dataState ?? { status: "success", interventions: mockFluidesFrigorigenesInterventions };
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  if (state.status === "loading") return <p role="status">Chargement des fiches d'intervention…</p>;
  return <section aria-labelledby="ff-title">
    <h2 id="ff-title" className="fr-h5">Importation depuis Fluides Frigorigènes</h2>
    {state.status === "serviceError" && <Alert severity="error" title="Erreur" description={<>Connexion à l'API impossible, merci d'attendre quelques instants. N'hésitez pas à vérifier la disponibilité de l'API sur la page <a href={AVAILABILITY_URL} target="_blank" rel="noreferrer">Disponibilité de l'outil</a></>} />}
    {state.status === "unknownSiret" && <Alert severity="error" title="Erreur" description="Le SIRET saisi dans l'onglet bordereau n'a pas été reconnu, vérifiez la saisie et qu'il correspond bien à celui déclaré dans l'application Fluides Frigorigènes" />}
    {state.status === "success" && !state.interventions.length && <Alert severity="error" title="Erreur" description={`Aucune donnée disponible dans l'application Fluides Frigorigènes pour le SIRET ${operatorSiret}`} />}
    {state.status === "success" && state.interventions.length > 0 && <Content interventions={state.interventions} filters={filters} setFilters={setFilters} selectedIds={selectedIds} setSelectedIds={setSelectedIds} expandedIds={expandedIds} setExpandedIds={setExpandedIds} />}
  </section>;
}

type ContentProps = { interventions: FluidesFrigorigenesIntervention[]; filters: FluidesFrigorigenesFilters; setFilters: React.Dispatch<React.SetStateAction<FluidesFrigorigenesFilters>>; selectedIds: string[]; setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>; expandedIds: string[]; setExpandedIds: React.Dispatch<React.SetStateAction<string[]>> };
function Content({ interventions, filters, setFilters, selectedIds, setSelectedIds, expandedIds, setExpandedIds }: ContentProps) {
  const filtered = useMemo(() => filterInterventions(interventions, filters), [interventions, filters]);
  const selectedWasteCode = getSelectedWasteCode(interventions, selectedIds);
  const selected = interventions.filter(({ id }) => selectedIds.includes(id));
  const wasteOptions = toOptions([...new Set(interventions.map(({ wasteCode }) => wasteCode))]);
  const holderOptions = toOptions([...new Set(interventions.map(({ equipmentHolder }) => equipmentHolder))]);
  const associationOptions = [{ value: "no", label: "Non" }, { value: "yes", label: "Oui" }];
  const toggleSelection = (id: string) => setSelectedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
  const toggleExpanded = (id: string) => setExpandedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
  const rows = filtered.flatMap(intervention => {
    const checked = selectedIds.includes(intervention.id);
    const disabled = !checked && !isInterventionSelectable(intervention, selectedWasteCode);
    const main = [
      <SingleCheckbox key={`check-${intervention.id}`} options={[{ label: "", nativeInputProps: { checked, disabled, onChange: () => toggleSelection(intervention.id), "aria-label": `Sélectionner la fiche ${intervention.number}` } }]} />,
      <button key={`expand-${intervention.id}`} type="button" className={styles.expandButton} aria-expanded={expandedIds.includes(intervention.id)} aria-label={`${expandedIds.includes(intervention.id) ? "Replier" : "Déplier"} la fiche ${intervention.number}`} onClick={() => toggleExpanded(intervention.id)}>{expandedIds.includes(intervention.id) ? "−" : "+"}</button>,
      intervention.number, intervention.wasteCode, intervention.equipmentHolder, `${intervention.weightKg} kg`, intervention.interventionDate ?? "—"
    ];
    return expandedIds.includes(intervention.id) ? [main, ...intervention.containers.map(container => ["", "↳", `Bouteille ${container.number}`, intervention.wasteCode, intervention.equipmentHolder, `${container.weightKg} kg`, container.volumeLiters ? `${container.volumeLiters} L` : "—"])] : [main];
  });
  const removeFilter = (key: keyof FluidesFrigorigenesFilters, value: string) => setFilters(current => ({ ...current, [key]: current[key].filter(item => item !== value) }));
  const displayValue = (value: string) => value === "yes" ? "Oui" : value === "no" ? "Non" : value;
  return <>
    <p>Recherchez et sélectionnez les fiches d'interventions que vous souhaitez importer depuis Fluides Frigorigènes.</p>
    <div className={styles.filters}>
      <Select label="Code déchet" placeholder="Code déchet" options={wasteOptions} isMultiple selected={wasteOptions.filter(option => filters.wasteCodes.includes(option.value))} onChange={options => setFilters(current => ({ ...current, wasteCodes: optionsToValues(options as unknown as Option[]) }))} />
      <Select label="Détenteur de l'équipement" placeholder="Détenteur de l'équipement" options={holderOptions} isMultiple selected={holderOptions.filter(option => filters.equipmentHolders.includes(option.value))} onChange={options => setFilters(current => ({ ...current, equipmentHolders: optionsToValues(options as unknown as Option[]) }))} />
      <Select label="Associé à un bordereau" placeholder="Associé à un bordereau" options={associationOptions} isMultiple selected={associationOptions.filter(option => filters.association.includes(option.value as "yes" | "no"))} onChange={options => setFilters(current => ({ ...current, association: optionsToValues(options as unknown as Option[]) as Array<"yes" | "no"> }))} />
    </div>
    <div className={styles.tags} aria-label="Filtres actifs">{(["wasteCodes", "equipmentHolders", "association"] as const).flatMap(key => filters[key].map(value => <Tag key={`${key}-${value}`} dismissible nativeButtonProps={{ onClick: () => removeFilter(key, value), "aria-label": `Supprimer le filtre ${displayValue(value)}` }}>{displayValue(value)}</Tag>))}</div>
    <Table noCaption caption="Fiches d'intervention disponibles" headers={["", "", "Fiche intervention", "Code déchet", "Détenteur de l'équipement", "Poids", "Date intervention"]} data={rows} />
    <h3 className="fr-h6 fr-mt-3w">Fiches d'interventions sélectionnées</h3>
    <p>Vous vous apprêtez à importer ces fiches d'interventions avec leurs relations contenants / détenteurs.</p>
    <Table noCaption caption="Fiches d'intervention sélectionnées" headers={["N° contenant", "N° Fiche d'intervention", "Détenteur", "Code déchet", "Poids"]} data={selected.flatMap(intervention => intervention.containers.map(container => [container.number, intervention.number, intervention.equipmentHolder, intervention.wasteCode, `${container.weightKg} kg`]))} />
    {!selected.length && <p>Aucune fiche sélectionnée</p>}
    <div className={styles.actions}><Button disabled={!selected.length} onClick={() => undefined}>Importer les fiches d'interventions</Button></div>
    {/* TODO(TRA-18633): fill the Déchet and Détenteur tabs while retaining source interventions. */}
  </>;
}
