import { useQuery } from "@apollo/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../../common/components";
import { Loader } from "../../../../Apps/common/Components";
import { GET_BSDAS } from "../../../../Apps/common/queries/bsda/queries";
import { FieldArray, useFormikContext } from "formik";
import {
  Bsda,
  BsdaInput,
  BsdaStatus,
  PageInfo,
  Query,
  QueryBsdasArgs
} from "@td/codegen-ui";
import React from "react";
import { useParams } from "react-router-dom";
import { getInitialState } from "../../stepper/initial-state";
import { getInitialCompany } from "../../../../Apps/common/data/initialState";
import { mergePackagings } from "../../../../common/packagings";

type Props = { name: string; bsdaId: string };

export function BsdaPicker({ name, bsdaId }: Props) {
  const { siret } = useParams<{ siret: string }>();

  const codeFilter =
    name === "grouping" ? { _in: ["D 15", "R 13"] } : { _eq: "D 15" };
  const { data, fetchMore } = useQuery<Pick<Query, "bsdas">, QueryBsdasArgs>(
    GET_BSDAS,
    {
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
    }
  );
  const {
    values: { forwarding, grouping },
    setFieldValue
  } = useFormikContext<BsdaInput>();

  const isForwardingPicker = name === "forwarding";

  const initialState = getInitialState();

  function onGroupingChange(groupedBsdas: Bsda[]) {
    setFieldValue("waste.code", groupedBsdas?.[0]?.waste?.code ?? "");
    setFieldValue(
      "weight.value",
      groupedBsdas?.reduce(
        (prev, cur) => prev + (cur.destination?.reception?.weight ?? 0),
        0
      ) ?? 0
    );
    setFieldValue(
      "waste.sealNumbers",
      groupedBsdas?.reduce(
        (prev, cur) => prev.concat(cur.waste?.sealNumbers ?? []),
        [] as string[]
      ) ?? initialState!.waste!.sealNumbers
    );

    setFieldValue(
      "packagings",
      groupedBsdas.length
        ? mergePackagings(groupedBsdas.flatMap(bsda => bsda.packagings ?? []))
        : initialState.packagings
    );

    const emitterCompany =
      groupedBsdas?.[0]?.destination?.company ??
      initialState!.destination!.company;
    setFieldValue("emitter.company", emitterCompany);

    const { country: _, ...nextDestinationCompany } =
      groupedBsdas?.[0]?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setFieldValue("destination.company", nextDestinationCompany);
  }

  function onForwardingChange(bsda: Bsda) {
    setFieldValue("weight.value", bsda?.destination?.reception?.weight ?? 0);
    setFieldValue(
      "waste.sealNumbers",
      bsda?.waste?.sealNumbers ?? initialState!.waste!.sealNumbers
    );
    setFieldValue(
      "waste.materialName",
      bsda?.waste?.materialName ?? initialState!.waste!.materialName
    );
    setFieldValue("waste.code", bsda?.waste?.code ?? initialState!.waste!.code);
    setFieldValue("waste.adr", bsda?.waste?.adr ?? initialState!.waste!.adr);
    setFieldValue(
      "waste.familyCode",
      bsda?.waste?.familyCode ?? initialState!.waste!.familyCode
    );
    setFieldValue("packagings", bsda?.packagings ?? initialState.packagings);

    const emitterCcompany =
      bsda?.destination?.company ?? initialState!.destination!.company;
    setFieldValue("emitter.company", emitterCcompany);

    const { country: _, ...nextDestinationCompany } =
      bsda?.destination?.operation?.nextDestination?.company ??
      getInitialCompany();
    setFieldValue("destination.company", nextDestinationCompany);
  }

  if (data == null) {
    return <Loader />;
  }

  const bsdas = data.bsdas.edges.map(e => e.node);
  if (bsdas.length === 0) {
    return <div className="notification">Aucun BSDA disponible à associer</div>;
  }

  if (isForwardingPicker) {
    return (
      <PickerTable
        onClick={bsda => {
          setFieldValue("forwarding", bsda.id);
          onForwardingChange(bsda);
        }}
        isSelected={bsda => forwarding === bsda.id}
        bsdas={bsdas}
        pickerType="forwarding"
        selected={forwarding}
        fetchMore={fetchMore}
        pageInfo={data.bsdas.pageInfo}
      />
    );
  }

  return (
    <FieldArray
      name="grouping"
      render={({ push, remove }) => (
        <PickerTable
          onClick={bsda => {
            const clickedBsdaIndex = grouping!.findIndex(id => id === bsda.id);
            const isSelected = clickedBsdaIndex >= 0;

            if (isSelected) {
              remove(clickedBsdaIndex);
              onGroupingChange(
                bsdas.filter(b => grouping?.includes(b.id) && b.id !== bsda.id)
              );
            } else {
              push(bsda.id);
              onGroupingChange([
                ...bsdas.filter(b => grouping?.includes(b.id)),
                bsda
              ]);
            }
          }}
          isSelected={bsda => grouping!.findIndex(id => id === bsda.id) >= 0}
          bsdas={bsdas}
          pickerType="grouping"
          selected={grouping}
          fetchMore={fetchMore}
          pageInfo={data.bsdas.pageInfo}
        />
      )}
    />
  );
}

type PickerTableProps = {
  bsdas: Bsda[];
  onClick: (bsda: Bsda) => void;
  isSelected: (bsda: Bsda) => boolean;
  pickerType: "grouping" | "forwarding";
  selected: string | string[] | undefined | null;
  fetchMore: (params: any) => Promise<any>;
  pageInfo: PageInfo;
};
function PickerTable({
  bsdas,
  onClick,
  isSelected,
  pickerType,
  selected,
  fetchMore,
  pageInfo
}: PickerTableProps) {
  return (
    <div>
      <Table isSelectable>
        <TableHead>
          <TableRow>
            <TableHeaderCell />
            <TableHeaderCell>Numéro</TableHeaderCell>
            <TableHeaderCell>Code déchet</TableHeaderCell>
            <TableHeaderCell>Nom du matériau</TableHeaderCell>
            <TableHeaderCell>Poids reçu (tonnes)</TableHeaderCell>
            <TableHeaderCell>Émetteur</TableHeaderCell>
            <TableHeaderCell>CAP final</TableHeaderCell>
            <TableHeaderCell>Exutoire</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bsdas.map(bsda => {
            const firstSelectedBsda =
              Array.isArray(selected) &&
              selected.length > 0 &&
              bsdas.find(b => b.id === selected[0]);
            const getNextDestinationSiret = b =>
              b?.destination?.operation?.nextDestination?.company?.siret;

            const isDisabled =
              firstSelectedBsda &&
              (getNextDestinationSiret(firstSelectedBsda) !==
                getNextDestinationSiret(bsda) ||
                bsda.waste?.code !== firstSelectedBsda?.waste?.code);

            return (
              <TableRow
                key={bsda.id}
                onClick={() => !isDisabled && onClick(bsda)}
              >
                <TableCell>
                  <input
                    type={pickerType === "grouping" ? "checkbox" : "radio"}
                    className="td-input"
                    checked={isSelected(bsda)}
                    disabled={isDisabled}
                    readOnly
                  />
                </TableCell>
                <TableCell>{bsda.id}</TableCell>
                <TableCell>{bsda.waste?.code}</TableCell>
                <TableCell>{bsda.waste?.materialName ?? "inconnu"}</TableCell>
                <TableCell>{bsda.destination?.reception?.weight}</TableCell>
                <TableCell>{bsda.emitter?.company?.name}</TableCell>
                <TableCell>
                  {bsda.destination?.operation?.nextDestination?.cap ??
                    bsda.destination?.cap}
                </TableCell>
                <TableCell>
                  {(bsda.destination?.operation?.nextDestination?.company
                    ? [
                        bsda.destination?.operation?.nextDestination?.company
                          ?.name,
                        bsda.destination?.operation?.nextDestination?.company
                          ?.siret
                      ]
                    : [
                        bsda.destination?.company?.name,
                        bsda.destination?.company?.siret
                      ]
                  )
                    .filter(Boolean)
                    .join(" - ")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <LoadMoreButton fetchMore={fetchMore} pageInfo={pageInfo} />
    </div>
  );
}

function LoadMoreButton({ pageInfo, fetchMore }) {
  if (!pageInfo?.hasNextPage) return null;

  return (
    <div style={{ textAlign: "center" }}>
      <button
        type="button"
        className="center btn btn--primary small"
        onClick={() =>
          fetchMore({
            variables: {
              after: pageInfo.endCursor
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (fetchMoreResult == null) {
                return prev;
              }

              return {
                ...prev,
                bsdas: {
                  ...prev.bsdas,
                  ...fetchMoreResult.bsdas,
                  edges: prev.bsdas.edges.concat(fetchMoreResult.bsdas.edges)
                }
              };
            }
          })
        }
      >
        Charger plus de bordereaux
      </button>
    </div>
  );
}
