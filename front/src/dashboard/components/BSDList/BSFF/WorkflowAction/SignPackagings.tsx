import { useQuery } from "@apollo/client";
import {
  ActionButton,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { IconCheckCircle1 } from "../../../../../Apps/common/Components/Icons/Icons";
import { PACKAGINGS_NAMES } from "../../../../../form/bsff/components/packagings/Packagings";
import { GET_BSFF_FORM } from "../../../../../Apps/common/queries/bsff/queries";
import {
  Bsff,
  BsffPackaging,
  Query,
  QueryBsffArgs,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import React from "react";
import { Column, useFilters, useTable } from "react-table";
import { BsffWasteSummary } from "./BsffWasteSummary";
import { PackagingAction } from "./PackagingAction";

interface SignPackagingsProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

/**
 * Bouton d'action permettant de signer les acceptations
 * et opérations sur les contenants d'un BSFF
 */
export function SignPackagings({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true
}: SignPackagingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {displayActionButton && (
        <>
          <ActionButton
            icon={<IconCheckCircle1 size="24px" />}
            onClick={() => setIsOpen(true)}
          >
            Signature acceptation et traitement par contenant
          </ActionButton>
          {isOpen && (
            <SignPackagingsModal
              bsffId={bsffId}
              onClose={() => setIsOpen(false)}
            />
          )}
        </>
      )}

      {isModalOpenFromParent && (
        <SignPackagingsModal
          bsffId={bsffId}
          onClose={onModalCloseFromParent!}
        />
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
      id: bsffId
    }
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Signer l'opération des contentants"
      wide={true}
      isOpen
    >
      <h2 className="td-modal-title">
        Signature acceptation et traitement par contenant
      </h2>
      <BsffWasteSummary bsff={bsff} />
      <div className="tw-overflow-x-scroll">
        <BsffPackagingTable bsff={bsff} />
      </div>
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
        id: "name",
        Header: "Type de contenant",
        accessor: bsffPackaging =>
          bsffPackaging.type === "AUTRE"
            ? bsffPackaging.other
            : PACKAGINGS_NAMES[bsffPackaging.type],
        filter: "text"
      },
      {
        id: "numero",
        Header: "Numéro",
        accessor: bsffPackaging => bsffPackaging.numero,
        filter: "text"
      },
      {
        id: "weight",
        Header: "Masse du contenu (kg)",
        accessor: bsffPackaging => bsffPackaging.weight
      },
      {
        id: "wasteCode",
        Header: "Code déchet",
        accessor: bsffPackaging =>
          bsffPackaging.acceptation?.wasteCode ?? bsff.waste?.code
      },
      {
        id: "wasteDescription",
        Header: "Dénomination usuelle",
        accessor: bsffPackaging =>
          bsffPackaging.acceptation?.wasteDescription ?? bsff.waste?.description
      },
      {
        id: "acceptation",
        Header: "Quantité acceptée (kg)",
        accessor: bsffPackaging =>
          bsffPackaging?.acceptation?.signature?.date
            ? bsffPackaging?.acceptation?.status ===
              WasteAcceptationStatus.Accepted
              ? bsffPackaging?.acceptation?.weight
              : `Refusé (${bsffPackaging?.acceptation?.refusalReason})`
            : ""
      },
      {
        id: "operation",
        Header: "Opération",
        accessor: bsffPackaging =>
          bsffPackaging?.operation?.signature?.date
            ? `${bsffPackaging?.operation.code} ${
                bsffPackaging?.operation?.noTraceability
                  ? " (rupture de traçabilité)"
                  : ""
              }`
            : ""
      }
    ],
    [bsff.waste]
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
      }
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
      Filter: DefaultColumnFilter
    }),
    []
  );
  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable<BsffPackaging>(
      {
        columns,
        data,
        filterTypes,
        defaultColumn
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
