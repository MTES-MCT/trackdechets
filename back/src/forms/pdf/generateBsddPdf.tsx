import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Form as PrismaForm } from "@prisma/client";
import * as QRCode from "qrcode";
import concatStream from "concat-stream";
import { generatePdf } from "../../common/pdf";

import { BsddPdf } from "./components/BsddPdf";

import { expandFormFromDb, expandableFormIncludes } from "../converter";
import { prisma } from "@td/prisma";

import { emptyValues } from "../../common/pdf/emptypdf";

export async function generateBsddPdf(id: PrismaForm["id"]) {
  const fullPrismaForm = await prisma.form.findUniqueOrThrow({
    where: { id },
    include: {
      ...expandableFormIncludes,
      intermediaries: true,
      grouping: { include: { initialForm: true } }
    }
  });

  const groupedIn = (
    await prisma.formGroupement.findMany({
      where: { initialFormId: fullPrismaForm.id },
      include: { nextForm: true }
    })
  ).map(g => ({ readableId: g.nextForm.readableId }));

  const form = expandFormFromDb(fullPrismaForm);

  const qrCode = await QRCode.toString(form.readableId, { type: "svg" });

  const html = ReactDOMServer.renderToStaticMarkup(
    <BsddPdf form={form} qrCode={qrCode} groupedIn={groupedIn} />
  );
  const stream = await generatePdf(html);

  return { filename: form.readableId, stream };
}

export async function generateEmptyBsddPdf(prismaForm) {
  let form = expandFormFromDb(prismaForm);

  form = emptyValues(form);

  const qrCode = "";
  const groupedIn = [{ readableId: "" }];
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsddPdf
      form={form}
      qrCode={qrCode}
      groupedIn={groupedIn}
      renderEmpty={true}
    />
  );
  const stream = await generatePdf(html);

  return { filename: form.readableId, stream };
}

export async function generateBsddPdfToBase64(
  prismaForm: PrismaForm
): Promise<{ filename: string; data: string }> {
  const { filename, stream: readableStream } = await generateBsddPdf(
    prismaForm.id
  );

  return new Promise((resolve, reject) => {
    const convertToBase64 = concatStream(buffer =>
      resolve({ filename, data: buffer.toString("base64") })
    );

    readableStream.on("error", reject);
    readableStream.pipe(convertToBase64);
  });
}
