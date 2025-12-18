import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  Query,
  BsdaType,
  QueryBsdasArgs,
  BsdaStatus,
  BsdaWhere,
  BsdaPackaging
} from "@td/codegen-ui";
import { InlineLoader } from "../../../../common/Components";
import { mergePackagings } from "../../../../../common/packagings";
import { isDefined, isDefinedStrict } from "../../../../../common/helper";
import Alert from "@codegouvfr/react-dsfr/Alert";
import SelectableWasteTable from "./SelectableWasteTable";
import { getInitialCompany } from "../../../../../Apps/common/data/initialState";
import { GET_BSDAS } from "../../../../../Apps/common/queries/bsda/queries";
import { useFormContext, useFieldArray } from "react-hook-form";
import initialState from "../utils/initial-state";
import { debounce } from "../../../../../common/helper";

import { MAX_BSDA_COUNT_TABLE_DISPLAY } from "./SelectableWasteTable";
import { ZodBsdaGroupingOrForwarding } from "../schema";

type SelectableWasteTableWrapperProps = {
  type: BsdaType;
  bsdaId: string;
};

function SelectableWasteTableWrapper({
  type,
  bsdaId
}: SelectableWasteTableWrapperProps) {
  const { siret } = useParams<{ siret: string }>();
  const [idFilter, setIdFilter] = useState("");
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const [finalDestinationSiretFilter, setFinalDestinationSiretFilter] =
    useState("");
  const [debouncing, setDebouncing] = useState(false);
  const codeFilter = useMemo(() => {
    return type === BsdaType.Gathering
      ? { _in: ["D 15", "R 13"] }
      : { _eq: "D 15" };
  }, [type]);

  const { watch, setValue, control } = useFormContext();

  const { append, remove } = useFieldArray({
    control,
    name: `grouping`
  });

  const forwarding: ZodBsdaGroupingOrForwarding | null = watch(
    "forwarding",
    null
  );
  const grouping: ZodBsdaGroupingOrForwarding[] = watch("grouping", []);

  const baseWhere: BsdaWhere = useMemo(() => {
    return {
      status: { _eq: BsdaStatus.AwaitingChild },
      _or: [{ groupedIn: { _eq: null } }, { groupedIn: { _eq: bsdaId } }],
      forwardedIn: { _eq: null },
      destination: {
        operation: {
          code: codeFilter
        },
        company: { siret: { _eq: siret } }
      }
    };
  }, [bsdaId, codeFilter, siret]);

  const where: BsdaWhere = useMemo(() => {
    return {
      ...baseWhere,
      ...(idFilter.length > 0 ? { id: { _eq: idFilter } } : {}),
      ...(wasteCodeFilter.length > 0
        ? { waste: { code: { _contains: wasteCodeFilter } } }
        : {}),
      ...(finalDestinationSiretFilter.length > 0
        ? {
            destination: {
              operation: {
                ...(baseWhere.destination?.operation ?? {}),
                nextDestination: {
                  company: { siret: { _eq: finalDestinationSiretFilter } }
                }
              }
            }
          }
        : {})
    };
  }, [baseWhere, idFilter, wasteCodeFilter, finalDestinationSiretFilter]);

  const { data, loading, error, refetch } = useQuery<
    Pick<Query, "bsdas">,
    QueryBsdasArgs
  >(GET_BSDAS, {
    variables: {
      where: baseWhere,
      first: MAX_BSDA_COUNT_TABLE_DISPLAY
    },
    fetchPolicy: "network-only"
  });

  const debouncedRefetch = React.useMemo(() => {
    return debounce((where: BsdaWhere) => {
      try {
        refetch({
          where
        });
      } catch (err: any) {
        console.error(err);
        return;
      }
      setDebouncing(false);
    }, 500);
  }, [refetch]);

  React.useEffect(() => {
    setDebouncing(true);
    debouncedRefetch(where);
  }, [where, debouncedRefetch]);

  const isForwardingPicker = type === BsdaType.Reshipment;

  function onGroupingChange(grouping: ZodBsdaGroupingOrForwarding[]) {
    const firstGroupedBsda = grouping?.[0];
    setValue("waste.code", firstGroupedBsda?.waste?.code ?? "");
    setValue(
      "weight.value",
      grouping?.reduce((prev, cur) => {
        const weight =
          cur.destination?.reception?.acceptedWeight ??
          cur.destination?.reception?.weight;
        return prev + (weight ?? 0);
      }, 0) ?? 0
    );
    setValue(
      "waste.sealNumbers",
      grouping?.reduce(
        (prev, cur) => prev.concat(cur.waste?.sealNumbers ?? []),
        [] as string[]
      ) ?? initialState!.waste!.sealNumbers
    );

    setValue(
      "packagings",
      grouping.length
        ? mergePackagings(
            grouping.flatMap(bsda => (bsda.packagings as BsdaPackaging[]) ?? [])
          )
        : initialState.packagings
    );

    const emitterCompany =
      firstGroupedBsda?.destination?.company ??
      initialState!.destination!.company;
    setValue("emitter.company", emitterCompany);

    const { ...nextDestinationCompany } =
      firstGroupedBsda?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setValue("destination.company", nextDestinationCompany);
  }

  function onForwardingChange(forwarding: ZodBsdaGroupingOrForwarding | null) {
    const forwardingBsda = forwarding;
    setValue(
      "weight.value",
      forwardingBsda?.destination?.reception?.acceptedWeight ??
        forwardingBsda?.destination?.reception?.weight ??
        0
    );
    setValue(
      "waste.sealNumbers",
      forwardingBsda?.waste?.sealNumbers ?? initialState!.waste!.sealNumbers
    );
    setValue(
      "waste.materialName",
      forwardingBsda?.waste?.materialName ?? initialState!.waste!.materialName
    );
    setValue(
      "waste.code",
      forwardingBsda?.waste?.code ?? initialState!.waste!.code
    );
    setValue(
      "waste.adr",
      forwardingBsda?.waste?.adr ?? initialState!.waste!.adr
    );

    // Attention avec les bordereaux qui réexpédient un BSDA legacy où isSubjectToADR = null
    let isSubjectToADR: boolean | null =
      forwardingBsda?.waste?.isSubjectToADR ??
      initialState!.waste!.isSubjectToADR;
    if (!isDefined(forwardingBsda?.waste?.isSubjectToADR)) {
      if (!isDefinedStrict(forwardingBsda?.waste?.adr)) {
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
      forwardingBsda?.waste?.nonRoadRegulationMention ??
        initialState!.waste!.nonRoadRegulationMention
    );
    setValue(
      "waste.familyCode",
      forwardingBsda?.waste?.familyCode ?? initialState!.waste!.familyCode
    );
    setValue(
      "packagings",
      forwardingBsda?.packagings ?? initialState.packagings
    );

    const emitterCcompany =
      forwardingBsda?.destination?.company ??
      initialState!.destination!.company;
    setValue("emitter.company", emitterCcompany);

    const { ...nextDestinationCompany } =
      forwardingBsda?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setValue("destination.company", nextDestinationCompany);
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

  if (
    !loading &&
    !data?.bsdas.edges.length &&
    !debouncing &&
    !idFilter.length &&
    !wasteCodeFilter.length &&
    !finalDestinationSiretFilter.length
  ) {
    return (
      <Alert
        severity="warning"
        title="Aucun bordereau éligible au regroupement"
        description="Vérifiez que vous avez bien sélectionné le bon émetteur"
        small
      />
    );
  }

  const bsdas = data?.bsdas.edges.map(e => e.node) ?? [];
  const total = data?.bsdas.totalCount ?? 0;
  if (isForwardingPicker) {
    return (
      <>
        <SelectableWasteTable
          onClick={bsda => {
            const isSelected = forwarding?.id === bsda.id;
            if (isSelected) {
              setValue("forwarding", null);
              onForwardingChange(null);
            } else {
              setValue("forwarding", bsda as ZodBsdaGroupingOrForwarding);
              onForwardingChange(bsda);
            }
          }}
          bsdas={bsdas}
          pickerType={BsdaType.Reshipment}
          selected={forwarding ? [forwarding] : []}
          idFilter={idFilter}
          wasteCodeFilter={wasteCodeFilter}
          finalDestinationSiretFilter={finalDestinationSiretFilter}
          setIdFilter={setIdFilter}
          setWasteCodeFilter={setWasteCodeFilter}
          setFinalDestinationSiretFilter={setFinalDestinationSiretFilter}
          total={total}
        />
        {loading && <InlineLoader />}
      </>
    );
  }

  return (
    <>
      <SelectableWasteTable
        onClick={bsda => {
          const clickedBsdaIndex = grouping!.findIndex(
            ({ id }) => id === bsda.id
          );
          const isSelected = clickedBsdaIndex >= 0;

          if (isSelected) {
            remove(clickedBsdaIndex);
            onGroupingChange([...grouping.filter(g => g.id !== bsda.id)]);
          } else {
            append(bsda as ZodBsdaGroupingOrForwarding);
            onGroupingChange([
              ...grouping,
              bsda as ZodBsdaGroupingOrForwarding
            ]);
          }
        }}
        bsdas={bsdas}
        pickerType={BsdaType.Gathering}
        selected={grouping}
        idFilter={idFilter}
        wasteCodeFilter={wasteCodeFilter}
        finalDestinationSiretFilter={finalDestinationSiretFilter}
        setIdFilter={setIdFilter}
        setWasteCodeFilter={setWasteCodeFilter}
        setFinalDestinationSiretFilter={setFinalDestinationSiretFilter}
        total={total}
      />
      {loading && <InlineLoader />}
    </>
  );
}

export default SelectableWasteTableWrapper;
