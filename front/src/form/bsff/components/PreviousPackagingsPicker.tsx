import * as React from "react";
import { useQuery } from "@apollo/client";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffPackaging,
  BsffPackagingWhere,
  BsffType,
  Query,
  QueryBsffPackagingsArgs
} from "@td/codegen-ui";
import { GET_PREVIOUS_PACKAGINGS } from "../../../Apps/common/queries/bsff/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../common/components";
import { InlineLoader } from "../../../Apps/common/Components";
import { OPERATION } from "../utils/constants";
import { useTable, Column, useFilters } from "react-table";
import { debounce } from "../../../common/helper";

interface PreviousBsffsPickerProps {
  bsff: Bsff;
  onAddOrRemove: () => void;
}

export function PreviousPackagingsPicker({
  bsff,
  onAddOrRemove
}: PreviousBsffsPickerProps) {
  const code_in = Object.values(OPERATION)
    .filter(operation => operation.successors.includes(bsff.type))
    .map(operation => operation.code);

  const columns: Column<BsffPackaging>[] = React.useMemo(
    () => [
      {
        id: "id",
        Header: "Numéro BSFF",
        accessor: bsffPackaging => bsffPackaging.bsff?.id, // TODO
        canFilter: true,
        filter: "text"
      },
      {
        id: "packagingsNumero",
        Header: "Numéro(s) de contenant(s)",
        accessor: bsffPackaging => bsffPackaging.numero,
        canFilter: true,
        filter: "text"
      },
      {
        id: "wasteCode",
        Header: "Déchet",
        accessor: bsffPackaging =>
          `${
            bsffPackaging?.acceptation?.wasteCode ??
            bsffPackaging.bsff?.waste?.code
          } - ${
            bsffPackaging?.acceptation?.wasteDescription ??
            bsffPackaging.bsff?.waste?.description
          }`,
        canFilter: true,
        filter: "text"
      },
      {
        id: "emitter",
        Header: "Émetteur initial",
        accessor: bsffPackaging =>
          `${bsffPackaging.bsff?.emitter?.company?.name} (${bsffPackaging.bsff?.emitter?.company?.siret})`,
        canFilter: true,
        filter: "text"
      }
    ],
    []
  );

  const instruction =
    bsff.type === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un groupement." +
        " Les contenants à regrouper doivent avoir le même code déchet."
      : bsff.type === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un reconditionnement."
      : bsff.type === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'une réexpédition." +
        " Les contenants à réexpédier doivent faire partie du même bordereau initial et avoir le même code déchet"
      : "";

  const [{ value: previousPackagings }] =
    useField<BsffPackaging[]>("previousPackagings");

  // Filter state managed at this level to build the where clause
  const [columnFilters, setColumnFilters] = React.useState<
    Record<string, string>
  >({});

  // En cas de regroupement ou de réexpédition, tous les contenants sélectionnés
  // doivent avoir le même code déchet
  const wasteCode = React.useMemo(() => {
    if (
      previousPackagings?.length &&
      [BsffType.Groupement, BsffType.Reexpedition].includes(bsff.type)
    ) {
      const pickedPackaging = previousPackagings[0];
      return pickedPackaging.acceptation?.wasteCode;
    }
    return null;
  }, [previousPackagings, bsff.type]);

  const baseWhere: BsffPackagingWhere = React.useMemo(
    () => ({
      ...(wasteCode ? { acceptation: { wasteCode: { _eq: wasteCode } } } : {}),
      operation: { code: { _in: code_in }, noTraceability: false },
      bsff: {
        destination: {
          company: {
            siret: { _eq: bsff.emitter?.company?.siret }
          }
        }
      },
      nextBsff: null
    }),
    [wasteCode, code_in, bsff.emitter?.company?.siret]
  );

  // Build where clause including column filters
  const where: BsffPackagingWhere = React.useMemo(() => {
    let whereClause: BsffPackagingWhere = {
      ...baseWhere
    };
    // Add column filters to where clause
    if (columnFilters.id) {
      whereClause = {
        ...whereClause,
        bsff: {
          ...whereClause.bsff,
          id: { _eq: columnFilters.id }
        }
      };
    }

    if (columnFilters.packagingsNumero) {
      whereClause = {
        ...whereClause,
        numero: { _contains: columnFilters.packagingsNumero }
      };
    }

    if (columnFilters.wasteCode && !wasteCode) {
      // Only apply wasteCode filter if not already constrained by selection
      whereClause = {
        ...whereClause,
        acceptation: {
          ...whereClause.acceptation,
          wasteCode: { _contains: columnFilters.wasteCode }
        }
      };
    }

    if (columnFilters.emitter) {
      whereClause = {
        ...whereClause,
        bsff: {
          ...whereClause.bsff,
          emitter: {
            company: {
              siret: { _contains: columnFilters.emitter }
            }
          }
        }
      };
    }

    // On autorise uniquement les réexpéditions de contenants présents sur le même BSFF
    if (bsff.type === BsffType.Reexpedition && previousPackagings?.length > 0) {
      whereClause = {
        ...whereClause,
        bsff: {
          ...whereClause.bsff,
          id: { _eq: previousPackagings[0].bsffId }
        }
      };
    }

    if (bsff.id) {
      // En cas d'update, on autorise les contenants qui ont déjà été ajouté à ce BSFF
      whereClause = {
        _or: [
          whereClause,
          { ...whereClause, nextBsff: { id: { _eq: bsff.id } } }
        ]
      };
    }

    return whereClause;
  }, [
    baseWhere,
    wasteCode,
    bsff.type,
    previousPackagings,
    bsff.id,
    columnFilters
  ]);

  const { data, loading, refetch } = useQuery<
    Pick<Query, "bsffPackagings">,
    QueryBsffPackagingsArgs
  >(GET_PREVIOUS_PACKAGINGS, {
    variables: {
      // pagination does not play well with bsff picking
      first: 100,
      where: baseWhere
    },
    // make sure we have fresh data here
    fetchPolicy: "cache-and-network",
    skip: !bsff.emitter?.company?.siret?.length
  });

  const debouncedRefetch = React.useMemo(() => {
    return debounce((where: BsffPackagingWhere) => {
      try {
        refetch({
          where
        });
      } catch (err: any) {
        console.error(err);
        return;
      }
    }, 500);
  }, [refetch]);

  React.useEffect(() => {
    debouncedRefetch(where);
  }, [where, debouncedRefetch]);

  // Handler to update column filters
  const handleFilterChange = React.useCallback(
    (columnId: string, value: string | undefined) => {
      setColumnFilters(prev => {
        const updated = { ...prev };
        if (value) {
          updated[columnId] = value;
        } else {
          delete updated[columnId];
        }
        return updated;
      });
    },
    []
  );
  if (!bsff.emitter?.company?.siret?.length) {
    return <div>Aucun établissement émetteur sélectionné</div>;
  }

  const pickablePackagings =
    data?.bsffPackagings.edges.map(({ node: packaging }) => packaging) ?? [];

  if (
    !loading &&
    !pickablePackagings?.length &&
    Object.keys(columnFilters).length === 0
  ) {
    return (
      <div>
        {`Aucun contenant éligible pour ${
          bsff.type === BsffType.Groupement
            ? "un regroupement"
            : bsff.type === BsffType.Reconditionnement
            ? "un reconditionnement"
            : bsff.type === BsffType.Reexpedition
            ? "une réexpédition"
            : ""
        }
          `}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <p style={{ marginBottom: "0.25rem" }}>{instruction}</p>
      <FieldArray
        name="previousPackagings"
        render={({ push, remove }) => (
          <BsffPackagingTable
            columns={columns}
            data={pickablePackagings}
            selected={previousPackagings}
            onFilterChange={handleFilterChange}
            push={bsffPackaging => {
              push(bsffPackaging);
              onAddOrRemove();
            }}
            remove={idx => {
              remove(idx);
              onAddOrRemove();
            }}
          />
        )}
      />
      {loading && <InlineLoader />}
    </div>
  );
}

type BsffPackagingTableProps = {
  columns: Column<BsffPackaging>[];
  data: BsffPackaging[];
  selected: BsffPackaging[];
  onFilterChange: (columnId: string, value: string | undefined) => void;
  push: (bsffPackaging: BsffPackaging) => void;
  remove: (idx: number) => void;
};

function BsffPackagingTable({
  columns,
  data,
  selected,
  onFilterChange,
  push,
  remove
}: BsffPackagingTableProps) {
  // Create columns with Filter component that has access to onFilterChange
  const columnsWithFilter = React.useMemo(() => {
    return columns.map(column => ({
      ...column,
      Filter: (props: {
        column: {
          id: string;
          filterValue: string;
          setFilter: (value: string) => void;
        };
      }) => {
        return (
          <input
            className="td-input td-input--small"
            value={props.column.filterValue || ""}
            onChange={e => {
              onFilterChange(props.column.id, e.target.value || undefined);
              props.column.setFilter(e.target.value || "");
            }}
            placeholder={`Filtrer...`}
          />
        );
      }
    }));
  }, [columns, onFilterChange]);

  const { getTableProps, headerGroups, getTableBodyProps, rows, prepareRow } =
    useTable<BsffPackaging>(
      {
        columns: columnsWithFilter,
        data,
        manualFilters: true // We're doing server-side filtering
      },
      useFilters
    );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            <TableHeaderCell />
            {headerGroup.headers.map(column => (
              <TableHeaderCell {...column.getHeaderProps()}>
                {column.render("Header")}
                <div>{column.canFilter ? column.render("Filter") : null}</div>
              </TableHeaderCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          const previousPackagingIndex = selected.findIndex(
            previousPackaging => previousPackaging.id === row.original.id
          );
          const isSelected = previousPackagingIndex >= 0;
          return (
            <TableRow
              {...row.getRowProps()}
              onClick={() => {
                if (isSelected) {
                  remove(previousPackagingIndex);
                } else {
                  const bsffPackaging = data.find(
                    bsffPackaging => bsffPackaging.id === row.original.id
                  )!;
                  push(bsffPackaging);
                }
              }}
            >
              <TableCell>
                <input
                  type="checkbox"
                  className="td-input"
                  checked={isSelected}
                  readOnly
                />
              </TableCell>
              {row.cells.map(cell => {
                return (
                  <TableCell {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
