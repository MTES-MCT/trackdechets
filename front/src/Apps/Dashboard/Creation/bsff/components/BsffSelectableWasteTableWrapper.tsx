import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Query,
  BsffType,
  QueryBsffsArgs,
  BsffPackagingWhere,
  BsffOperationCode
} from "@td/codegen-ui";
import { InlineLoader } from "../../../../common/Components";
import Alert from "@codegouvfr/react-dsfr/Alert";
import BsffSelectableWasteTable, {
  MAX_BSFF_COUNT_TABLE_DISPLAY
} from "./BsffSelectableWasteTable";
import { getInitialCompany } from "../../../../common/data/initialState";
import { GET_PREVIOUS_PACKAGINGS } from "../../../../common/queries/bsff/queries";
import { useFormContext, useFieldArray } from "react-hook-form";
import initialState from "../utils/initial-state";
import { debounce } from "../../../../../common/helper";

import { ZodBsffGroupingOrForwarding } from "../schema";

type Props = {
  type: BsffType;
  bsffId: string;
  emitterCompany: any;
};

function BsffSelectableWasteTableWrapper({
  type,
  bsffId,
  emitterCompany
}: Props) {
  const { watch, setValue, control } = useFormContext();

  const [idFilter, setIdFilter] = useState("");
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const [numeroFilter, setNumeroFilter] = useState("");
  const [emetteurSiretFilter, setEmetteurSiretFilter] = useState("");
  const [debouncing, setDebouncing] = useState(false);

  const destinationSiret = emitterCompany?.siret;

  const { append, remove } = useFieldArray({
    control,
    name: "grouping"
  });

  const forwarding = watch("forwarding", null);
  const grouping = watch("grouping", []);
  const repackaging = watch("repackaging", []);

  // FILTER OPERATION
  const codeFilter = useMemo(() => {
    switch (type) {
      case BsffType.Groupement:
        return { _in: [BsffOperationCode.D13, BsffOperationCode.R12] };
      case BsffType.Reconditionnement:
        return { _in: [BsffOperationCode.D14] };
      case BsffType.Reexpedition:
        return { _in: [BsffOperationCode.D15, BsffOperationCode.R13] };
      default:
        return {};
    }
  }, [type]);

  const baseWhere: BsffPackagingWhere = useMemo(
    () => ({
      operation: {
        code: codeFilter,
        noTraceability: false
      },
      bsff: {
        destination: {
          company: { siret: { _eq: destinationSiret } }
        }
      },
      nextBsff: bsffId
        ? {} // en édition, on accepte ceux liés au BSFF courant
        : null // en création, on veut ceux sans nextBsff
    }),
    [bsffId, codeFilter, destinationSiret]
  );

  const where = useMemo(
    () => ({
      ...baseWhere,
      ...(idFilter.length > 0 ? { id: { _eq: idFilter } } : {}),
      ...(wasteCodeFilter.length > 0
        ? { acceptation: { wasteCode: { _contains: wasteCodeFilter } } }
        : {}),
      ...(numeroFilter.length > 0
        ? { numero: { _contains: numeroFilter } }
        : {}),
      ...(emetteurSiretFilter.length > 0
        ? {
            bsff: {
              emitter: {
                company: { siret: { _eq: emetteurSiretFilter } }
              }
            }
          }
        : {})
    }),
    [baseWhere, idFilter, wasteCodeFilter, numeroFilter, emetteurSiretFilter]
  );

  const { data, loading, error, refetch } = useQuery<
    Pick<Query, "bsffPackagings">,
    QueryBsffsArgs
  >(GET_PREVIOUS_PACKAGINGS, {
    variables: {
      where: baseWhere,
      first: MAX_BSFF_COUNT_TABLE_DISPLAY
    },
    fetchPolicy: "network-only"
  });

  const debouncedRefetch = useMemo(
    () =>
      debounce(where => {
        refetch({ where });
        setDebouncing(false);
      }, 500),
    [refetch]
  );

  React.useEffect(() => {
    setDebouncing(true);
    debouncedRefetch(where);
  }, [where]);

  const bsffPackagings = data?.bsffPackagings?.edges?.map(e => e.node) ?? [];
  const total = data?.bsffPackagings?.totalCount ?? 0;

  React.useEffect(() => {
    if (!bsffPackagings.length) return;

    if (type === BsffType.Groupement && grouping.length > 0) {
      const matched = bsffPackagings.filter(p =>
        grouping.some(g => g.id === p.id)
      );
      if (matched.length > 0) {
        setValue("grouping", matched);
      }
    }

    if (type === BsffType.Reconditionnement && repackaging.length > 0) {
      const matched = bsffPackagings.filter(p =>
        repackaging.some(r => r.id === p.id)
      );
      if (matched.length > 0) {
        setValue("repackaging", matched);
      }
    }

    if (type === BsffType.Reexpedition && forwarding) {
      const matched = bsffPackagings.find(p => p.id === forwarding.id);
      if (matched) {
        setValue("forwarding", matched);
      }
    }
  }, [bsffPackagings.length, type]);

  const isForwardingPicker = type === BsffType.Reexpedition;

  function onGroupingChange(grouping: ZodBsffGroupingOrForwarding[]) {
    const first = grouping?.[0];

    setValue("waste.code", first?.acceptation?.wasteCode ?? first?.waste?.code);

    setValue(
      "weight.value",
      grouping.reduce(
        (sum, g) => sum + (g.acceptation?.weight ?? g.weight ?? 0),
        0
      )
    );

    const allPackagings = grouping.flatMap(g => {
      if (g.packagings?.length) {
        return g.packagings;
      }

      return [
        {
          type: g.type ?? null,
          volume: g.volume ?? null,
          numero: g.numero ?? "",
          weight: g.acceptation?.weight ?? g.weight ?? null,
          other: g.other ?? null
        }
      ];
    });

    setValue("packagings", allPackagings);

    const nextCompany =
      first?.nextBsff?.emitter?.company ?? getInitialCompany();

    setValue("nextBsff.company", nextCompany);
  }
  function mapPackaging(p: ZodBsffGroupingOrForwarding) {
    if (p.packagings?.length) {
      return p.packagings;
    }
    return [
      {
        id: p.id ?? null,
        type: p.type ?? null,
        volume: p.volume ?? null,
        numero: p.numero ?? "",
        weight: p.acceptation?.weight ?? p.weight ?? null,
        other: p.other ?? null
      }
    ];
  }

  function onForwardingChange(fwd: ZodBsffGroupingOrForwarding | null) {
    setValue("waste.code", fwd?.acceptation?.wasteCode ?? fwd?.waste?.code);

    setValue("weight.value", fwd?.acceptation?.weight ?? fwd?.weight ?? 0);

    const packagings = fwd?.packagings?.length
      ? fwd.packagings
      : fwd
      ? [
          {
            type: fwd.type ?? null,
            volume: fwd.volume ?? null,
            numero: fwd.numero ?? "",
            weight: fwd.acceptation?.weight ?? fwd.weight ?? null,
            other: fwd.other ?? null
          }
        ]
      : initialState.packagings;

    setValue("packagings", packagings);

    const nextCompany = fwd?.nextBsff?.emitter?.company ?? getInitialCompany();

    setValue("nextBsff.company", nextCompany);
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
    !data?.bsffPackagings.edges.length &&
    !debouncing &&
    !idFilter.length &&
    !numeroFilter.length &&
    !wasteCodeFilter.length &&
    !emetteurSiretFilter.length
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

  //  FORWARDING
  if (isForwardingPicker) {
    return (
      <>
        <BsffSelectableWasteTable
          onClick={item => {
            const isSelected = forwarding?.id === item.id;

            if (isSelected) {
              setValue("forwarding", null);
              onForwardingChange(null);
            } else {
              setValue("forwarding", item);
              onForwardingChange(item);
            }
          }}
          bsffPackagings={bsffPackagings}
          pickerType={BsffType.Reexpedition}
          selected={forwarding ? [forwarding] : []}
          {...{
            idFilter,
            wasteCodeFilter,
            numeroFilter,
            emetteurSiretFilter,
            setIdFilter,
            setWasteCodeFilter,
            setNumeroFilter,
            setEmetteurSiretFilter,
            total
          }}
        />
        {loading && <InlineLoader />}
      </>
    );
  }

  // RECONDITIONNEMENT
  if (type === BsffType.Reconditionnement) {
    return (
      <>
        <BsffSelectableWasteTable
          onClick={item => {
            const isSelected = repackaging.find(r => r.id === item.id);

            let updated: typeof repackaging;

            if (isSelected) {
              updated = repackaging.filter(r => r.id !== item.id);
            } else if (!item.id) {
              const withoutManual = repackaging.filter(r => r.id);
              updated = [...withoutManual, item];
            } else {
              updated = [...repackaging, item];
            }

            setValue("repackaging", updated);
            setValue("packagings", updated.flatMap(mapPackaging));

            // ✅ Recalcul du poids total
            setValue(
              "weight.value",
              updated.reduce(
                (sum, r) => sum + (r.acceptation?.weight ?? r.weight ?? 0),
                0
              )
            );
          }}
          bsffPackagings={bsffPackagings}
          pickerType={BsffType.Reconditionnement}
          selected={repackaging}
          {...{
            idFilter,
            wasteCodeFilter,
            numeroFilter,
            emetteurSiretFilter,
            setIdFilter,
            setWasteCodeFilter,
            setNumeroFilter,
            setEmetteurSiretFilter,
            total
          }}
        />
        {loading && <InlineLoader />}
      </>
    );
  }

  //  GROUPING
  return (
    <>
      <BsffSelectableWasteTable
        onClick={item => {
          const index = grouping.findIndex(g => g.id === item.id); // ← id
          const isSelected = index >= 0;

          if (isSelected) {
            remove(index);
            onGroupingChange(grouping.filter(g => g.id !== item.id)); // ← id
          } else {
            append(item);
            onGroupingChange([...grouping, item]);
          }
        }}
        bsffPackagings={bsffPackagings}
        pickerType={BsffType.Groupement}
        selected={grouping}
        {...{
          idFilter,
          wasteCodeFilter,
          numeroFilter,
          emetteurSiretFilter,
          setIdFilter,
          setWasteCodeFilter,
          setNumeroFilter,
          setEmetteurSiretFilter,
          total
        }}
      />
      {loading && <InlineLoader />}
    </>
  );
}

export default BsffSelectableWasteTableWrapper;
