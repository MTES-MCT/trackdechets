import { WriteError } from "mongodb";

export class WriteErrors extends Error {
  writeErrors: WriteError[];
  constructor(errors, ...params) {
    super(...params);
    this.writeErrors = errors;
  }
}
