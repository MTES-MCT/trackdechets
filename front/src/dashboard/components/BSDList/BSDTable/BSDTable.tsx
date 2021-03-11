import * as React from "react";
import { Form } from "generated/graphql/types";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "../WorkflowAction";
import { SlipActions } from "../../SlipsActions/SlipActions";
import { useFormsTable } from "./useFormsTable";
import { SortableTableHeader } from "./SortableTableHeader";
import { Column } from "../types";

interface BSDTableProps {
  forms: Form[];
  siret: string;
  columns: Column[];
}

export function BSDTable({ forms, siret, columns }: BSDTableProps) {
  const [sortedForms, sortParams, sortBy, filter] = useFormsTable(forms);

  return (
    <div className="td-table-wrapper">
      <table className="td-table">
        <thead>
          <tr className="td-table__head-tr">
            {columns.map(column => (
              <React.Fragment key={column.id}>
                {column.sortable ? (
                  <SortableTableHeader
                    sortFunc={sortBy}
                    fieldName={column.id}
                    sortParams={sortParams}
                    caption={column.Header}
                  />
                ) : (
                  <th>{column.Header}</th>
                )}
              </React.Fragment>
            ))}

            <th></th>
            <th></th>
          </tr>
          <tr className="td-table__head-tr td-table__tr">
            {columns.map(column => (
              <React.Fragment key={column.id}>
                {column.filterable ? (
                  <th>
                    <input
                      type="text"
                      onChange={e => filter(column.id, e.target.value)}
                      className="td-input"
                      placeholder="Filtrer..."
                    />
                  </th>
                ) : (
                  <th></th>
                )}
              </React.Fragment>
            ))}

            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedForms.map(form => (
            <tr key={form.id} className="td-table__tr">
              {columns.map(column => (
                <td key={column.id}>
                  {column.Cell ? (
                    <column.Cell value={column.accessor(form)} row={form} />
                  ) : (
                    column.accessor(form)
                  )}
                </td>
              ))}

              <td>
                <ActionButtonContext.Provider value={{ size: "small" }}>
                  <WorkflowAction siret={siret} form={form} />
                </ActionButtonContext.Provider>
              </td>
              <td>
                <SlipActions form={form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
