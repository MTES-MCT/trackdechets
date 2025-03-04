import { Table } from "@codegouvfr/react-dsfr/Table";
import { ChangeAggregate } from "@td/codegen-ui";
import { format } from "date-fns";
import React from "react";
import { TYPES, badges, formatStats, getStatusFromStats } from "../shared";

type Props = { aggregates: ChangeAggregate[]; siret: string };

const HEADERS = ["Date", "Import", "Déclarations", "Déclaré par"];

export function ChangeAggregatesTable({ aggregates, siret }: Props) {
  if (!aggregates.length) {
    return null;
  }

  const tableData = aggregates.map(aggregate => [
    <div>
      <div>{format(new Date(aggregate.createdAt), "dd/MM/yyyy HH'h'mm")}</div>
      {badges[getStatusFromStats(aggregate)]("import")}
    </div>,
    TYPES[aggregate.type],
    formatStats(aggregate),
    <div>
      <p>{aggregate.createdBy.name}</p>
      {siret !== aggregate.reportAs.siret && (
        <p>
          {aggregate.reportAs.name} {aggregate.reportAs.siret}
        </p>
      )}
    </div>
  ]);

  return (
    <div>
      <Table
        bordered
        fixed
        caption="Déclarations par API"
        data={tableData}
        headers={HEADERS}
      />
    </div>
  );
}
