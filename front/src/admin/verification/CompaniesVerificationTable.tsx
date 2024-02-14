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
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";

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
          createdAt && format(new Date(createdAt), "yyyy-MM-dd à HH:mm")
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
              return <>Vérifié par code de sécurité</>;
            } else if (verificationMode === CompanyVerificationMode.Auto) {
              return <>Vérifié automatiquement</>;
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
      initialState: {
        pageIndex: 0,
        pageSize,
        filters: [
          {
            id: "verificationStatus",
            value: CompanyVerificationStatus.ToBeVerified
          }
        ]
      },
      manualPagination: true,
      manualFilters: true,
      pageCount,
      defaultColumn
    },
    useFilters,
    usePagination
  );

  const {
    headerGroups,
    prepareRow,
    page,
    gotoPage,
    // Get the state from the instance
    state: { pageIndex, filters }
  } = tableInstance;

  // Listen for changes in pagination and filters and use the state to fetch our new data
  useEffect(() => {
    fetchData({ pageIndex, pageSize, filters });
  }, [fetchData, pageIndex, pageSize, filters]);

  const tableHeaders = [
    ...headerGroups[0].headers.map(column => (
      <>
        {column.render("Header")}
        <div>{column.canFilter ? column.render("Filter") : null}</div>
      </>
    )),
    "Actions"
  ];

  const tableData = page.map(row => {
    prepareRow(row);
    return [
      ...row.cells.map(cell => cell.render("Cell")),
      row.values.verificationStatus ===
        CompanyVerificationStatus.ToBeVerified && (
        <CompanyVerificationActions company={row.original} />
      )
    ];
  });

  return (
    <>
      <Table
        caption={`Établissements (${page.length} sur ${totalCount})`}
        data={tableData}
        headers={tableHeaders}
        fixed
      />

      <Pagination
        showFirstLast
        count={pageCount}
        defaultPage={pageIndex + 1}
        getPageLinkProps={pageNumber => ({
          onClick: event => {
            event.preventDefault();
            gotoPage(pageNumber - 1);
          },
          href: "#",
          key: `pagination-link-${pageNumber}`
        })}
        className={"fr-mt-1w"}
      />
    </>
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
