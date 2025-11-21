import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  Query,
  BsdaType,
  QueryBsdasArgs,
  BsdaStatus,
  Bsda
} from "@td/codegen-ui";
import { Loader } from "../../../../common/Components";
import { mergePackagings } from "../../../../../common/packagings";
import { isDefined, isDefinedStrict } from "../../../../../common/helper";
import Alert from "@codegouvfr/react-dsfr/Alert";
import SelectableWasteTable from "./SelectableWasteTable";
import { getInitialCompany } from "../../../../../Apps/common/data/initialState";
import { GET_BSDAS } from "../../../../../Apps/common/queries/bsda/queries";
import { useFormContext, useFieldArray } from "react-hook-form";
import initialState from "../utils/initial-state";

type SelectableWasteTableWrapperProps = {
  type: BsdaType;
  bsdaId: string;
};

function SelectableWasteTableWrapper({
  type,
  bsdaId
}: SelectableWasteTableWrapperProps) {
  const { siret } = useParams<{ siret: string }>();

  const codeFilter =
    type === BsdaType.Gathering ? { _in: ["D 15", "R 13"] } : { _eq: "D 15" };

  const { data, loading, error } = useQuery<
    Pick<Query, "bsdas">,
    QueryBsdasArgs
  >(GET_BSDAS, {
    variables: {
      where: {
        status: { _eq: BsdaStatus.AwaitingChild },
        _or: [{ groupedIn: { _eq: null } }, { groupedIn: { _eq: bsdaId } }],
        forwardedIn: { _eq: null },
        destination: {
          operation: { code: codeFilter },
          company: { siret: { _eq: siret } }
        }
      }
    },
    fetchPolicy: "network-only"
  });

  const { watch, setValue, control } = useFormContext();

  const { append, remove } = useFieldArray({
    control,
    name: `grouping`
  });

  const forwarding = watch("forwarding", {});
  const grouping = watch("grouping", {});

  const isForwardingPicker = type === BsdaType.Reshipment;

  function onGroupingChange(groupedBsdas: Bsda[]) {
    setValue("waste.code", groupedBsdas?.[0]?.waste?.code ?? "");
    setValue(
      "weight.value",
      groupedBsdas?.reduce((prev, cur) => {
        const weight =
          cur.destination?.reception?.acceptedWeight ??
          cur.destination?.reception?.weight;
        return prev + (weight ?? 0);
      }, 0) ?? 0
    );
    setValue(
      "waste.sealNumbers",
      groupedBsdas?.reduce(
        (prev, cur) => prev.concat(cur.waste?.sealNumbers ?? []),
        [] as string[]
      ) ?? initialState!.waste!.sealNumbers
    );

    setValue(
      "packagings",
      groupedBsdas.length
        ? mergePackagings(groupedBsdas.flatMap(bsda => bsda.packagings ?? []))
        : initialState.packagings
    );

    const emitterCompany =
      groupedBsdas?.[0]?.destination?.company ??
      initialState!.destination!.company;
    setValue("emitter.company", emitterCompany);

    const { country: _, ...nextDestinationCompany } =
      groupedBsdas?.[0]?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setValue("destination.company", nextDestinationCompany);
  }

  function onForwardingChange(bsda: Bsda) {
    setValue(
      "weight.value",
      bsda?.destination?.reception?.acceptedWeight ??
        bsda?.destination?.reception?.weight ??
        0
    );
    setValue(
      "waste.sealNumbers",
      bsda?.waste?.sealNumbers ?? initialState!.waste!.sealNumbers
    );
    setValue(
      "waste.materialName",
      bsda?.waste?.materialName ?? initialState!.waste!.materialName
    );
    setValue("waste.code", bsda?.waste?.code ?? initialState!.waste!.code);
    setValue("waste.adr", bsda?.waste?.adr ?? initialState!.waste!.adr);

    // Attention avec les bordereaux qui réexpédient un BSDA legacy où isSubjectToADR = null
    let isSubjectToADR: boolean | null =
      bsda?.waste?.isSubjectToADR ?? initialState!.waste!.isSubjectToADR;
    if (!isDefined(bsda?.waste?.isSubjectToADR)) {
      if (!isDefinedStrict(bsda?.waste?.adr)) {
        // Si rien dans la mention ADR, on peut supposer que le déchet n'est pas soumis à l'ADR
        isSubjectToADR = false;
      } else {
        // Si la mention ADR n'est pas vide, on ne peut pas deviner la valeur de isSubjectToADR,
        // parce que le champ adr peut être égal à "Non soumis" ou équivalent
        isSubjectToADR = null;
      }
    }
    setValue("waste.isSubjectToADR", isSubjectToADR);

    setValue(
      "waste.nonRoadRegulationMention",
      bsda?.waste?.nonRoadRegulationMention ??
        initialState!.waste!.nonRoadRegulationMention
    );
    setValue(
      "waste.familyCode",
      bsda?.waste?.familyCode ?? initialState!.waste!.familyCode
    );
    setValue("packagings", bsda?.packagings ?? initialState.packagings);

    const emitterCcompany =
      bsda?.destination?.company ?? initialState!.destination!.company;
    setValue("emitter.company", emitterCcompany);

    const { country: _, ...nextDestinationCompany } =
      bsda?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setValue("destination.company", nextDestinationCompany);
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        description={error.message}
        title="Erreur"
        small
      />
    );
  }

  if (data) {
    const bsdas = data.bsdas.edges.map(e => e.node);

    if (isForwardingPicker) {
      return (
        <SelectableWasteTable
          onClick={bsda => {
            setValue("forwarding", bsda.id);
            onForwardingChange(bsda);
          }}
          isSelected={bsda => forwarding === bsda.id}
          bsdas={bsdas}
          pickerType={BsdaType.Reshipment}
          selected={forwarding}
        />
      );
    }

    return (
      <SelectableWasteTable
        onClick={bsda => {
          const clickedBsdaIndex = grouping!.findIndex(id => id === bsda.id);
          const isSelected = clickedBsdaIndex >= 0;

          if (isSelected) {
            remove(clickedBsdaIndex);
            onGroupingChange(
              bsdas.filter(b => grouping?.includes(b.id) && b.id !== bsda.id)
            );
          } else {
            append(bsda.id);
            onGroupingChange([
              ...bsdas.filter(b => grouping?.includes(b.id)),
              bsda
            ]);
          }
        }}
        isSelected={bsda => grouping!.findIndex(id => id === bsda.id) >= 0}
        bsdas={bsdas}
        pickerType={BsdaType.Gathering}
        selected={grouping}
      />
    );
  }
}

export default SelectableWasteTableWrapper;
