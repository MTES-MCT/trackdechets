import {
  CompanyForVerification,
  CompanyVerificationStatus,
  CompanyVerifificationMode,
} from "generated/graphql/types";
import React from "react";
import { useTable, usePagination, useFilters } from "react-table";
import { format } from "date-fns";
import "./CompaniesVerificationTable.scss";
import CompanyVerificationActions from "./actions/CompanyVerificationActions";

type Props = {
  data: CompanyForVerification[];
  fetchData: (args: any) => any;
  loading: boolean;
  totalCount: number;
  pageSize: number;
};

export default function CompaniesVerificationTable({
  data,
  fetchData,
  loading,
  totalCount,
  pageSize,
}: Props) {
  const columns = React.useMemo(
    () => [
      {
        Header: "Date de rattachement",
        accessor: "createdAt", // accessor is the "key" in the data,
        disableFilters: true,
        Cell: props =>
          props.value && format(new Date(props.value), "yyyy-MM-dd"),
      },
      {
        Header: "SIRET",
        accessor: "siret", // accessor is the "key" in the data,
        disableFilters: true,
      },
      {
        Header: "Raison sociale",
        accessor: "name",
        disableFilters: true,
      },
      {
        Header: "Profil",
        accessor: "companyTypes",
        disableFilters: true,
        Cell: ({ value: companyTypes }) => {
          return (
            <ul>
              {companyTypes.map((ct, idx) => (
                <li key={idx}>{ct}</li>
              ))}
            </ul>
          );
        },
      },
      {
        Header: "Email admin",
        accessor: "admin.email",
        disableFilters: true,
      },
      {
        Header: "Nom admin",
        accessor: "admin.name",
        disableFilters: true,
      },
      {
        Header: "Téléphone admin",
        accessor: "admin.phone",
        disableFilters: true,
      },
      {
        Header: "Statut de vérification",
        accessor: "verificationStatus",
        Filter: SelectColumnFilter,
        filter: "includes",
        Cell: ({ row, value, ...props }) => {
          const verificationStatus = value;
          if (verificationStatus === CompanyVerificationStatus.ToBeVerified) {
            return "Non vérifié";
          } else if (
            verificationStatus === CompanyVerificationStatus.LetterSent
          ) {
            return "Courrier envoyé";
          } else {
            const verificationMode = row.original.verificationMode;
            if (verificationMode === CompanyVerifificationMode.Letter) {
              return "Vérifié par code de sécurité";
            } else {
              const comment = row.original.verificationComment;
              const hasComment = comment && comment.length > 0;
              return (
                <>
                  <span>Vérifié manuellement</span>{" "}
                  {hasComment && <span className="tw-italic">{comment}</span>}
                </>
              );
            }
          }
        },
      },
    ],
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const pageCount = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize },
      manualPagination: true,
      manualFilters: true,
      pageCount,
      defaultColumn,
    },
    useFilters,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    // Get the state from the instance
    state: { pageIndex, filters },
  } = tableInstance;

  // Listen for changes in pagination and filters and use the state to fetch our new data
  React.useEffect(() => {
    fetchData({ pageIndex, pageSize, filters });
  }, [fetchData, pageIndex, pageSize, filters]);

  return (
    // apply the table props
    <div className="companiesVerificationTable">
      <table {...getTableProps()}>
        <thead>
          {
            // Loop over the header rows
            headerGroups.map(headerGroup => (
              // Apply the header row props
              <tr {...headerGroup.getHeaderGroupProps()}>
                {
                  // Loop over the headers in each row
                  headerGroup.headers.map(column => (
                    // Apply the header cell props
                    <th {...column.getHeaderProps()}>
                      {
                        // Render the header
                        column.render("Header")
                      }
                      {/* Render the columns filter UI */}
                      <div>
                        {column.canFilter ? column.render("Filter") : null}
                      </div>
                    </th>
                  ))
                }
                <th>Actions</th>
              </tr>
            ))
          }
        </thead>

        {/* Apply the table body props */}
        <tbody {...getTableBodyProps()}>
          {
            // Loop over the table rows
            page.map(row => {
              // Prepare the row for display
              prepareRow(row);
              return (
                // Apply the row props
                <tr {...row.getRowProps()}>
                  {
                    // Loop over the rows cells
                    row.cells.map(cell => {
                      // Apply the cell props
                      return (
                        <td {...cell.getCellProps()}>
                          {
                            // Render the cell contents
                            cell.render("Cell")
                          }
                        </td>
                      );
                    })
                  }

                  <td>
                    {row.values.verificationStatus ===
                      CompanyVerificationStatus.ToBeVerified && (
                      <CompanyVerificationActions company={row.values} />
                    )}
                  </td>
                </tr>
              );
            })
          }
          <tr>
            {loading ? (
              // Use our custom loading state to show a loading indicator
              <td>Loading...</td>
            ) : (
              <td>
                Showing {page.length} of {totalCount} results
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/*
        Pagination can be built however you'd like.
        This is just a very basic UI implementation:
      */}
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
      </div>
    </div>
  );
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach(row => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option as any}>
          {option as any}
        </option>
      ))}
    </select>
  );
}

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  return (
    <input
      value={filterValue || ""}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Rechercher`}
    />
  );
}
