import csv from "csv-parser";
import fs from "fs";
import { CompanyRow, RoleRow } from "./types";

const separator = ";";

/**
 *
 * @param csvpath path of the csv file
 * @param transform optional transform function to transform row
 */
export function readCsv<Row>(
  csvpath: string,
  transform?: (row: any) => Row
): Promise<Row[]> {
  const rows: Row[] = [];
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

const splitRow = (row, field: string) =>
  row[field] ? row[field].split(",") : [];
/**
 * load companies from csv
 * companyTypes entry like "PRODUCER,WASTE_PROCESSOR" is transformed
 * into an array like ["PRODUCER", "WASTE_PROCESSOR"]
 */
export function loadCompanies(
  csvDir = `${__dirname}/csv`
): Promise<CompanyRow[]> {
  const csvPath = `${csvDir}/etablissements.csv`;
  return readCsv<CompanyRow>(csvPath, row => {
    return {
      ...row,
      companyTypes: splitRow(row, "companyTypes"),
      collectorTypes: splitRow(row, "collectorTypes"),
      wasteProcessorTypes: splitRow(row, "wasteProcessorTypes"),
      wasteVehiclesTypes: splitRow(row, "wasteVehiclesTypes")
    };
  });
}

/**
 * load roles from csv
 */
export function loadRoles(csvDir = `${__dirname}/csv`): Promise<RoleRow[]> {
  const csvPath = `${csvDir}/roles.csv`;
  return readCsv<RoleRow>(csvPath);
}
