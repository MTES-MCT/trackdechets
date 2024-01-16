import {
  CompanyForVerification,
  CompanyVerificationStatus,
  CompanyVerificationMode
} from "@td/codegen-ui";
import React, { useMemo, useEffect } from "react";
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
  pageSize
}: Props) {
  const columns = useMemo(
    () => [
      {
        Header: "Date de création",
        accessor: "createdAt" as const,
        disableFilters: true,
        Cell: ({ value: createdAt }) =>
          createdAt && format(new Date(createdAt), "yyyy-MM-dd")
      },
      {
        Header: "Établissement",
        accessor: row => ({ orgId: row.orgId, name: row.name }),
        disableFilters: true,
        Cell: ({ value }) => (
          <>
            <div>{value.orgId}</div>
            <div>{value.name}</div>
          </>
        )
      },
      {
        Header: "Profil",
        accessor: "companyTypes" as const,
        disableFilters: true,
        Cell: ({ value: companyTypes }) => {
          return (
            <ul>
              {companyTypes.map((ct, idx) => (
                <li key={idx}>{ct}</li>
              ))}
            </ul>
          );
        }
      },
      {
        Header: "Admin",
        accessor: "admin" as const,
        disableFilters: true,
        Cell: ({ value: admin }) =>
          admin && (
            <>
              <div>{admin.email}</div>
              {admin?.name && <div>{admin?.name}</div>}
              {admin?.phone && <div>{admin?.phone}</div>}
            </>
          )
      },
      {
        Header: "Statut de vérification",
        accessor: "verificationStatus" as const,
        Filter: VerificationStatusFilter,
        filter: "includes",
        Cell: ({ row, value }) => {
          const verificationStatus = value;
          if (verificationStatus === CompanyVerificationStatus.ToBeVerified) {
            return <>À vérifier</>;
          } else if (
            verificationStatus === CompanyVerificationStatus.LetterSent
          ) {
            return <>Courrier envoyé</>;
          } else {
            const verificationMode = row.original.verificationMode;
            if (verificationMode === CompanyVerificationMode.Letter) {
              return <>Vérifié par code de sécurité"</>;
            } else {
              const comment = row.original.verificationComment;
              const hasComment = comment && comment.length > 0;
              return (
                <>
                  <div>Vérifié manuellement</div>
                  {hasComment && <div className="tw-italic">{comment}</div>}
                </>
              );
            }
          }
        }
      }
    ],
    []
  );

  const defaultColumn = useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter
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
      defaultColumn
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
    state: { pageIndex, filters }
  } = tableInstance;

  // Listen for changes in pagination and filters and use the state to fetch our new data
  useEffect(() => {
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
                      <CompanyVerificationActions company={row.original} />
                    )}
                  </td>
                </tr>
              );
            })
          }
          <tr>
            {loading ? (
              // Use our custom loading state to show a loading indicator
              <td>Chargement...</td>
            ) : (
              <td>
                Affichage de {page.length} établissements sur {totalCount}
              </td>
            )}
          </tr>
        </tbody>
      </table>

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
            {pageIndex + 1} sur {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Aller à la page:{" "}
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

function VerificationStatusFilter({ column: { filterValue, setFilter } }) {
  const options = [
    {
      value: CompanyVerificationStatus.Verified,
      label: "Vérifié"
    },
    { value: CompanyVerificationStatus.ToBeVerified, label: "À vérifier" },
    { value: CompanyVerificationStatus.LetterSent, label: "Courrier envoyé" }
  ];

  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">Tous</option>
      {options.map((option, i) => (
        <option key={i} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Define a default UI for filtering
function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
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
