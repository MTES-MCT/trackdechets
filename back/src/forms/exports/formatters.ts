import { Form } from "../../generated/prisma-client";
import columns from "./columns";

/**
 * Use label as key and format value
 */
export function formatForm(form: Form): { [key: string]: string } {
  return columns.reduce((acc, column) => {
    return {
      ...acc,
      ...(form[column.field]
        ? { [column.label]: column.format(form[column.field]) }
        : {})
    };
  }, {});
}
