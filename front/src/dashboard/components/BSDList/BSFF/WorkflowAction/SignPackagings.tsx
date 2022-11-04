import { useQuery } from "@apollo/client";
import {
  ActionButton,
  Loader,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { IconCheckCircle1 } from "common/components/Icons";
import { GET_BSFF_FORM } from "form/bsff/utils/queries";
import {
  Bsff,
  BsffPackaging,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import React from "react";
import { Column, useFilters, useTable } from "react-table";
import { BsffWasteSummary } from "./BsffWasteSummary";
import { PackagingAction } from "./PackagingAction";

interface SignPackagingsProps {
  bsffId: string;
}

/**
 * Bouton d'action permettant de signer les acceptations
 * et opérations sur les contenants d'un BSFF
 */
export function SignPackagings({ bsffId }: SignPackagingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signature acceptation et traitement par contenant
      </ActionButton>
      {isOpen && (
        <SignPackagingsModal bsffId={bsffId} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

interface SignPackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignPackagingsModal({ bsffId, onClose }: SignPackagingsModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Signer l'opération des contentants"
      isOpen
    >
      <h2 className="td-modal-title">
        Signature acceptation et traitement par contenant
      </h2>
      <BsffWasteSummary bsff={bsff} />
      <BsffPackagingTable bsff={bsff} />
    </Modal>
  );
}

interface BsffPackagingTableProps {
  bsff: Bsff;
}

function BsffPackagingTable({ bsff }: BsffPackagingTableProps) {
  const columns: Column<BsffPackaging>[] = React.useMemo(
    () => [
      {
        id: "numero",
        Header: "Numéro de contenant",
        accessor: bsffPackaging => bsffPackaging.numero,
        filter: "text",
      },
      {
        id: "name",
        Header: "Dénomination",
        accessor: bsffPackaging => bsffPackaging.name,
        filter: "text",
      },
    ],
    []
  );

  const data = React.useMemo(() => bsff.packagings, [bsff.packagings]);

  const filterTypes = React.useMemo(
    () => ({
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  // Define a default UI for filtering
  function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
    return (
      <input
        className="td-input td-input--small"
        value={filterValue || ""}
        onChange={e => {
          setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        placeholder={`Filtrer...`}
      />
    );
  }

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );
  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        filterTypes,
        defaultColumn,
      },
      useFilters
    );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        <TableRow>
          {headers.map(column => (
            <TableHeaderCell {...column.getHeaderProps()}>
              {column.render("Header")}
              <div>{column.canFilter ? column.render("Filter") : null}</div>
            </TableHeaderCell>
          ))}
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);

          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <TableCell {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </TableCell>
                );
              })}
              <TableCell>
                <PackagingAction packaging={row.original} bsff={bsff} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
