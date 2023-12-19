import * as React from "react";
import { useTable, useFilters, useSortBy } from "react-table";
import { Bsd, BsdWhere, OrderType, QueryBsdsArgs } from "@td/codegen-ui";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableSortIcon
} from "../../../../common/components";
import { Column, COLUMNS_PARAMETERS_NAME, createColumn } from "../columns";

interface BSDTableProps {
  bsds: Bsd[];
  columns: Column[];
  refetch: (variables: QueryBsdsArgs) => void;
}

const ADDITIONAL_COLUMNS: Column[] = [
  createColumn({
    id: "workflow",
    Header: () => null,
    disableFilters: true,
    disableSortBy: true
  }),
  createColumn({
    id: "actions",
    Header: () => null,
    disableFilters: true,
    disableSortBy: true
  })
];

export function BSDTable({ bsds, refetch, ...props }: BSDTableProps) {
  const columns = React.useMemo(
    () => props.columns.concat(ADDITIONAL_COLUMNS),
    [props.columns]
  );
  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    rows,
    prepareRow,
    state: { filters, sortBy }
  } = useTable(
    {
      columns,
      data: bsds,
      manualFilters: true,
      manualSortBy: true
    },
    useFilters,
    useSortBy
  );
  const isFirstCall = React.useRef(true);

  React.useEffect(() => {
    if (isFirstCall.current) {
      // the first time this effect is called is when the component is "mounted"
      // but the query has already been made with the initial paremeters so it should not refetch
      isFirstCall.current = false;
      return;
    }

    const variables = {
      where: {},
      order: {}
    };

    filters.forEach(filter => {
      const filterFn = COLUMNS_PARAMETERS_NAME[filter.id]?.filter;

      if (filterFn == null) {
        console.error(
          `The filter "${filter.id}" doesn't have an equivalent in the API, it's ignored.`
        );
        return;
      }

      variables.where["_"] = filter.value;
    });

    variables.where = filters.reduce(
      (w, filter) => {
        const filterFn = COLUMNS_PARAMETERS_NAME[filter.id]?.filter;
        if (filterFn == null) {
          console.error(
            `The filter "${filter.id}" doesn't have an equivalent in the API, it's ignored.`
          );
        }
        if (filter.value) {
          return { _and: [...w._and!, filterFn(filter.value)] };
        }
        return w;
      },
      { _and: [] } as BsdWhere
    );

    sortBy.forEach(sort => {
      const sortName = COLUMNS_PARAMETERS_NAME[sort.id]?.order;

      if (sortName == null) {
        console.error(
          `The order "${sort.id}" doesn't have an equivalent in the API, it's ignored.`
        );
        return;
      }

      variables.order[sortName] = sort.desc ? OrderType.Desc : OrderType.Asc;
    });

    refetch(variables);
  }, [filters, sortBy, refetch]);

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <TableHeaderCell {...column.getHeaderProps()}>
                <span
                  {...(column.canSort ? column.getSortByToggleProps() : {})}
                >
                  {column.render("Header")}
                  <TableSortIcon
                    sortBy={
                      column.isSorted
                        ? column.isSortedDesc
                          ? "DESC"
                          : "ASC"
                        : null
                    }
                  />
                </span>
                {column.canFilter
                  ? column.render("Filter", {
                      placeHolder: column["filterPlaceHolder"],
                      maxLength: column["filterMaxLength"]
                    })
                  : null}
              </TableHeaderCell>
            ))}
          </TableRow>
        ))}
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
