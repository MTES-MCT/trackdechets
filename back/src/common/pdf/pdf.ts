import { Response } from "express";
import {
  pipe,
  gotenberg,
  convert,
  html,
  please,
  to,
  adjust
} from "gotenberg-js-client";

export const toPDF = pipe(
  gotenberg(process.env.GOTENBERG_URL),
  convert,
  html,
  to({
    marginTop: 0.2,
    marginBottom: 0.2,
    marginLeft: 0.2,
    marginRight: 0.2
  }),
  adjust({ headers: { "X-Auth-Token": process.env.GOTENBERG_TOKEN ?? "" } }),
  please
);

export function createPDFResponse(res: Response, filename: string) {
  res.type("pdf");
  res.attachment(`${filename}.pdf`);
  return res;
}
