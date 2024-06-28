import { CompanyExhaustive } from "@td/codegen-ui";
import React, { useMemo } from "react";
import { useTable } from "react-table";
import { Table } from "@codegouvfr/react-dsfr/Table";

const rearrangeData = (data: CompanyExhaustive) => {
  const keys = new Set([
    ...Object.keys(data.anonymousCompany),
    ...Object.keys(data.dbCompany),
    ...Object.keys(data.esCompany),
    ...Object.keys(data.sireneCompany)
  ]);

  const keysSorted = Array.from(keys)
    .filter(key => key !== "__typename")
    .sort((a, b) => a.localeCompare(b));

  return keysSorted.map(key => ({
    field: key,
    anonymous: data?.anonymousCompany[key] ?? "",
    db: data?.dbCompany[key] ?? "",
    es: data?.esCompany[key] ?? "",
    sirene: data?.sireneCompany[key] ?? ""
  }));
};

type Props = {
  data?: CompanyExhaustive;
};

export default function CompaniesTable({ data }: Props) {
  if (!data) return null;

  // Swap lines & columns for clarity
  const rearrangedData = rearrangeData(data);

  const columns = useMemo(
    () => [
      {
        Header: "",
        accessor: "field" as const
      },
      {
        Header: "Anonymous",
        accessor: "anonymous" as const
      },
      {
        Header: "Base de données",
        accessor: "db" as const
      },
      {
        Header: "Elastic Search",
        accessor: "es" as const
      },
      {
        Header: "SIRENE",
        accessor: "sirene" as const
      }
    ],
    []
  );

  const tableInstance = useTable({
    columns,
    data: rearrangedData
  });

  const { rows, prepareRow, headerGroups } = tableInstance;

  const tableHeaders = [
    ...headerGroups[0].headers.map(column => column.render("Header"))
  ].map(c => <div className="textCenter fr-text--lg">{c}</div>);

  const tableData = rows.map(row => {
    prepareRow(row);
    return [...row.cells.map(cell => cell.render("Cell"))];
  });

  return (
    <>
      <Table headers={tableHeaders} data={tableData} fixed />
    </>
  );
}
