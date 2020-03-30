import * as csv from "csv-parser";
import * as fs from "fs";
import { CompanyRow, RoleRow } from "./types";

const { CSV_DIR } = process.env;

const csvDir = CSV_DIR || `${__dirname}/../../../csv`;

const separator = ";";
const companiesPath = `${csvDir}/etablissements.csv`;
const rolesPath = `${csvDir}/roles.csv`;

/**
 *
 * @param csvpath path of the csv file
 * @param transform optional transform function to transform row
 */
function readCsv<Row>(
  csvpath: string,
  transform?: (row: any) => Row
): Promise<Row[]> {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvpath)
      .pipe(csv({ separator }))
      .on("data", async data => {
        const row = (transform ? transform(data) : data) as Row;
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", err => reject(err));
  });
}

/**
 * load companies from csv
 * companyTypes entry like "PRODUCER,WASTE_PROCESSOR" is transformed
 * into an array like ["PRODUCER", "WASTE_PROCESSOR"]
 */
export function loadCompanies(): Promise<CompanyRow[]> {
  return readCsv<CompanyRow>(companiesPath, row => {
    return { ...row, companyTypes: row.companyTypes.split(",") };
  });
}

/**
 * load roles from csv
 */
export function loadRoles(): Promise<RoleRow[]> {
  return readCsv<RoleRow>(rolesPath);
}
