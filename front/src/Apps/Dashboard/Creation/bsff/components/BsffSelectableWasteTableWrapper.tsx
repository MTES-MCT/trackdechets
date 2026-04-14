import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  Query,
  BsffType,
  QueryBsffsArgs,
  BsffWhere,
  BsffPackaging,
  BsffPackagingWhere,
  BsffOperationCode
} from "@td/codegen-ui";
import { InlineLoader } from "../../../../common/Components";

import Alert from "@codegouvfr/react-dsfr/Alert";
import BsffSelectableWasteTable from "./BsffSelectableWasteTable";
import { getInitialCompany } from "../../../../common/data/initialState";
import { GET_PREVIOUS_PACKAGINGS } from "../../../../common/queries/bsff/queries";
import { useFormContext, useFieldArray } from "react-hook-form";
import initialState from "../utils/initial-state";
import { debounce } from "../../../../../common/helper";

import { MAX_BSFF_COUNT_TABLE_DISPLAY } from "./BsffSelectableWasteTable";
import { ZodBsffGroupingOrForwarding } from "../schema";
import { OPERATION } from "../utils/constants";
import { mergeBsffPackagings } from "../../../../../common/bsffPackagings";

type SelectableWasteTableWrapperProps = {
  type: BsffType;
  bsffId: string;
  emitterCompany: any;
};

function BsffSelectableWasteTableWrapper({
  type,
  bsffId,
  emitterCompany
}: SelectableWasteTableWrapperProps) {
  const { watch, setValue, control } = useFormContext();
  const { siret } = useParams<{ siret: string }>();
  const [idFilter, setIdFilter] = useState("");
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const [numeroFilter, setNumeroFilter] = useState("");
  const [emetteurSiretFilter, setEmetteurSiretFilter] = useState("");
  const [debouncing, setDebouncing] = useState(false);
  const destinationSiret = emitterCompany?.siret;
  /*const destinationSiret = useMemo(() => {
  return emitterCompany?.siret ?? null;
}, [emitterCompany?.siret]);*/

  const { append, remove } = useFieldArray({
    control,
    name: `grouping`
  });

  const forwarding: ZodBsffGroupingOrForwarding | null = watch(
    "forwarding",
    null
  );
  const grouping: ZodBsffGroupingOrForwarding[] = watch("grouping", []);

  const codeFilter = useMemo(() => {
    switch (type) {
      case BsffType.Groupement:
        // Groupement peut avoir D13 et R12
        return { _in: [BsffOperationCode.D13, BsffOperationCode.R12] };
      case BsffType.Reconditionnement:
        // Reconditionnement : D14
        return { _in: [BsffOperationCode.D14] };
      case BsffType.Reexpedition:
        // Réexpédition : D15 et R13
        return { _in: [BsffOperationCode.D15, BsffOperationCode.R13] };
      default:
        return {};
    }
  }, [type]);

  const baseWhere: BsffPackagingWhere = useMemo(() => {
    return {
      operation: {
        code: codeFilter,
        noTraceability: false
      },
      bsff: {
        destination: {
          company: { siret: { _eq: destinationSiret } }
        }
      },
      nextBsff: null
    };
  }, [bsffId, codeFilter, destinationSiret]);

  const where: BsffPackagingWhere = useMemo(() => {
    return {
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
            /* nextBsff: {
              emitter: {
                company: { siret: { _eq: emetteurSiretFilter } }
              }
            }*/
          }
        : {})
    };
  }, [baseWhere, idFilter, wasteCodeFilter, numeroFilter, emetteurSiretFilter]);

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

  const debouncedRefetch = React.useMemo(() => {
    return debounce((where: BsffWhere) => {
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

  const isForwardingPicker = type === BsffType.Reexpedition;

  function onGroupingChange(grouping: ZodBsffGroupingOrForwarding[]) {
    const firstGroupedBsff = grouping?.[0];
    setValue("waste.code", firstGroupedBsff?.waste?.code ?? "");
    setValue(
      "weight.value",
      grouping?.reduce((prev, cur) => {
        const weight = cur.acceptation?.weight ?? cur.weight;
        return prev + (weight ?? 0);
      }, 0) ?? 0
    );

    setValue(
      "packagings",
      grouping.length
        ? mergeBsffPackagings(
            grouping.flatMap(bsff => (bsff.packagings as BsffPackaging[]) ?? [])
          )
        : initialState.packagings
    );

    /* const emitterCompany =
      firstGroupedBsff?.bsff?.emitter?.company ?? initialState!.emitter.company;
    setValue("emitter.company", emitterCompany);*/

    const { ...nextBsffCompany } =
      firstGroupedBsff?.nextBsff?.emitter?.company ?? getInitialCompany();
    setValue("nextBsff.company", nextBsffCompany);
  }

  function onForwardingChange(forwarding: ZodBsffGroupingOrForwarding | null) {
    const forwardingBsff = forwarding;

    setValue(
      "waste.code",
      forwardingBsff?.waste?.code ?? initialState!.waste!.code
    );
    setValue(
      "waste.description",
      forwardingBsff?.waste?.description ?? initialState!.waste!.description
    );
    setValue(
      "waste.adr",
      forwardingBsff?.waste?.adr ?? initialState!.waste!.adr
    );

    setValue(
      "weight.value",
      forwardingBsff?.acceptation?.weight ?? forwardingBsff?.weight ?? 0
    );
    setValue(
      "packagings",
      forwardingBsff?.packagings ?? initialState.packagings
    );

    /*  const emitterCompany =
      forwardingBsff?.nextBsff?.emitter?.company ??
      initialState!.emitter.company;
    setValue("emitter.company", emitterCompany);*/

    const { ...nextBsffCompany } =
      forwardingBsff?.nextBsff?.emitter?.company ?? getInitialCompany();
    setValue("nextBsff.company", nextBsffCompany);
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

  const bsffPackagings =
    data?.bsffPackagings?.edges?.map(({ node: packaging }) => packaging) ?? [];
  const total = data?.bsffPackagings?.totalCount ?? 0;

  if (isForwardingPicker) {
    return (
      <>
        <BsffSelectableWasteTable
          onClick={bsbsffPackaging => {
            const isSelected = forwarding?.bsffId === bsbsffPackaging.bsffId;
            if (isSelected) {
              setValue("forwarding", null);
              onForwardingChange(null);
            } else {
              setValue(
                "forwarding",
                bsbsffPackaging as ZodBsffGroupingOrForwarding
              );
              onForwardingChange(bsbsffPackaging);
            }
          }}
          bsffPackagings={bsffPackagings}
          pickerType={BsffType.Reexpedition}
          selected={forwarding ? [forwarding] : []}
          idFilter={idFilter}
          wasteCodeFilter={wasteCodeFilter}
          numeroFilter={numeroFilter}
          emetteurSiretFilter={emetteurSiretFilter}
          setIdFilter={setIdFilter}
          setNumeroFilter={setNumeroFilter}
          setWasteCodeFilter={setWasteCodeFilter}
          setEmetteurSiretFilter={setEmetteurSiretFilter}
          total={total}
        />
        {loading && <InlineLoader />}
      </>
    );
  }

  return (
    <>
      <BsffSelectableWasteTable
        onClick={bsbsffPackaging => {
          /*const clickedBsffIndex = grouping!.findIndex(
            ({ id }) => id === bsbsffPackaging.bsffId
          );
          const isSelected = clickedBsffIndex >= 0;*/
          const clickedBsffIndex = grouping!.findIndex(
            ({ bsffId }) => bsffId === bsbsffPackaging.bsffId
          );
          const isSelected = clickedBsffIndex >= 0;
          console.log(
            "ddd",
            bsbsffPackaging.numero,
            bsbsffPackaging.weight,
            bsbsffPackaging.volume,
            bsbsffPackaging.type
          );
          if (isSelected) {
            remove(clickedBsffIndex);
            onGroupingChange([
              ...grouping.filter(g => g.bsffId !== bsbsffPackaging.bsffId)
            ]);
          } else {
            append(bsbsffPackaging as ZodBsffGroupingOrForwarding);
            onGroupingChange([
              ...grouping,
              bsbsffPackaging as ZodBsffGroupingOrForwarding
            ]);
          }
        }}
        bsffPackagings={bsffPackagings}
        pickerType={BsffType.Groupement}
        selected={grouping}
        idFilter={idFilter}
        wasteCodeFilter={wasteCodeFilter}
        numeroFilter={numeroFilter}
        emetteurSiretFilter={emetteurSiretFilter}
        setIdFilter={setIdFilter}
        setNumeroFilter={setNumeroFilter}
        setWasteCodeFilter={setWasteCodeFilter}
        setEmetteurSiretFilter={setEmetteurSiretFilter}
        total={total}
      />
      {loading && <InlineLoader />}
    </>
  );
}

export default BsffSelectableWasteTableWrapper;
