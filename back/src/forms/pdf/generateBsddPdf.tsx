import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import {
  Form as PrismaForm,
  Consistence,
  QuantityType,
  WasteAcceptationStatus,
  TransportMode,
  EmitterType
} from "@prisma/client";
import * as QRCode from "qrcode";
import concatStream from "concat-stream";
import { isDangerous } from "../../common/constants";
import {
  generatePdf,
  formatDate,
  Document,
  SignatureStamp,
  FormCompanyFields,
  TRANSPORT_MODE_LABELS
} from "../../common/pdf";
import {
  Appendix2Form,
  Form as GraphQLForm,
  FormCompany,
  PackagingInfo,
  Transporter,
  TransportSegment
} from "../../generated/graphql/types";
import {
  expandAppendix2FormFromDb,
  expandFormFromDb,
  expandTemporaryStorageFromDb,
  expandTransportSegmentFromDb
} from "../form-converter";
import { getFullForm } from "../database";
import prisma from "../../prisma";

type ReceiptFieldsProps = Partial<
  Pick<GraphQLForm["transporter"], "department" | "receipt" | "validityLimit">
>;

function ReceiptFields({
  department,
  receipt,
  validityLimit
}: ReceiptFieldsProps) {
  return (
    <p>
      Récépissé n° : {receipt}
      <br />
      Département : {department}
      <br />
      Limite de validité : {formatDate(validityLimit)}
    </p>
  );
}

type QuantityFieldsProps = {
  quantity?: number;
  quantityType?: QuantityType;
};

function QuantityFields({ quantity, quantityType }: QuantityFieldsProps) {
  return (
    <p>
      Tonne(s) : {quantity}
      <br />
      <input
        type="checkbox"
        checked={quantityType === QuantityType.REAL}
        readOnly
      />{" "}
      Réelle
      <br />
      <input
        type="checkbox"
        checked={quantityType === QuantityType.ESTIMATED}
        readOnly
      />{" "}
      Estimée
    </p>
  );
}

type AcceptationFieldsProps = {
  wasteAcceptationStatus?: WasteAcceptationStatus;
  wasteRefusalReason?: string;
};

function AcceptationFields({
  wasteAcceptationStatus,
  wasteRefusalReason
}: AcceptationFieldsProps) {
  return (
    <p>
      Lot accepté :{" "}
      <input
        type="checkbox"
        checked={wasteAcceptationStatus === WasteAcceptationStatus.ACCEPTED}
        readOnly
      />{" "}
      oui{" "}
      <input
        type="checkbox"
        checked={wasteAcceptationStatus === WasteAcceptationStatus.REFUSED}
        readOnly
      />{" "}
      non{" "}
      <input
        type="checkbox"
        checked={
          wasteAcceptationStatus === WasteAcceptationStatus.PARTIALLY_REFUSED
        }
        readOnly
      />{" "}
      partiellement
      <br />
      Motif de refus (même partiel) :<br />
      {wasteRefusalReason}
    </p>
  );
}

type RecipientFormCompanyFieldsProps = {
  cap?: string;
  processingOperation?: string;
  company?: FormCompany;
};

function RecipientFormCompanyFields({
  cap,
  processingOperation,
  company
}: RecipientFormCompanyFieldsProps) {
  return (
    <>
      <FormCompanyFields company={company} />
      <p>
        N° de CAP (le cas échéant) : {cap}
        <br />
        Opération d'élimination/valorisation prévue (code D/R) :{" "}
        {processingOperation}
      </p>
    </>
  );
}

type PackagingInfosTableProps = {
  packagingInfos: PackagingInfo[];
};

export function getOtherPackagingLabel(packagingInfos: PackagingInfo[]) {
  const otherPackagings = packagingInfos.filter(p => p.type === "AUTRE");
  const otherPackagingsSummary =
    otherPackagings.length === 0
      ? "à préciser"
      : otherPackagings
          .map(({ quantity, other }) => `${quantity} ${other ?? "?"}`)
          .join(", ");
  return `Autre (${otherPackagingsSummary})`;
}

function PackagingInfosTable({ packagingInfos }: PackagingInfosTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Conditionnement</th>
        </tr>
      </thead>
      <tbody>
        {[
          { label: "Benne", value: "BENNE" },
          { label: "Citerne", value: "CITERNE" },
          { label: "GRV", value: "GRV" },
          { label: "Fûts", value: "FUT" },
          { label: getOtherPackagingLabel(packagingInfos), value: "AUTRE" }
        ].map((packagingType, index) => (
          <tr key={index}>
            <td>
              {packagingInfos.reduce(
                (total, packaging) =>
                  packaging.type === packagingType.value
                    ? total + (packaging.quantity ?? 0)
                    : total,
                0
              ) ||
                // leave the box empty if it's 0
                null}
            </td>

            <td>{packagingType.label}</td>
          </tr>
        ))}
        <tr>
          <td>
            <strong>
              {packagingInfos.reduce((total, packaging) => {
                return total + (packaging.quantity ?? 0);
              }, 0) ||
                // leave the box empty if it's 0
                null}
            </strong>
          </td>
          <td>
            <strong>COLIS (totaux)</strong>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

type TransporterFormCompanyFieldsProps = {
  transporter?: Transporter;
  transportMode?: TransportMode;
  sentAt?: Date;
};

function TransporterFormCompanyFields({
  transporter,
  transportMode = TransportMode.ROAD,
  sentAt
}: TransporterFormCompanyFieldsProps) {
  return (
    <div className="Row">
      <div className="Col">
        <FormCompanyFields company={transporter?.company} />
      </div>
      <div className="Col">
        <p>
          <input type="checkbox" readOnly /> Je déclare être exempté de
          récépissé au titre de l’article R.541-50 du code de l’environnement
        </p>
        <ReceiptFields {...(transporter ?? {})} />
        <p>
          Mode de transport : {TRANSPORT_MODE_LABELS[transportMode]}
          <br />
          Immatriculation(s) : {transporter?.numberPlate}
          <br />
          Date de prise en charge : {formatDate(sentAt)}
          <br />
          Nom et signature :
        </p>
        {sentAt && <SignatureStamp />}
      </div>
    </div>
  );
}

export async function generateBsddPdf(prismaForm: PrismaForm) {
  const fullPrismaForm = await getFullForm(prismaForm);
  const appendix2Forms = await prisma.form.findMany({
    where: { appendix2RootFormId: fullPrismaForm.id }
  });
  const form: GraphQLForm = {
    ...expandFormFromDb(fullPrismaForm),
    temporaryStorageDetail: fullPrismaForm.temporaryStorageDetail
      ? expandTemporaryStorageFromDb(fullPrismaForm.temporaryStorageDetail)
      : null,
    transportSegments: fullPrismaForm.transportSegments.map(
      expandTransportSegmentFromDb
    ),
    appendix2Forms: appendix2Forms.map(expandAppendix2FormFromDb)
  };
  const qrCode = await QRCode.toString(form.readableId, { type: "svg" });
  const html = ReactDOMServer.renderToStaticMarkup(
    <Document title={form.readableId}>
      <div className="Page">
        <div className="BoxRow">
          <div className="BoxCol TextAlignCenter">
            <p>Art. R. 541-45 du code de l’environnement.</p>
            <p>Textes règlementaires</p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <p>Ministère de la Transition Ecologique</p>
            <h1>Bordereau de suivi de déchets dangereux</h1>
            <p>Récépissé Trackdéchets</p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <div
              className="QrCode"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              J'émets un BSDD pour :{" "}
              <input
                type="checkbox"
                checked={form.emitter?.type === EmitterType.PRODUCER}
                readOnly
              />{" "}
              la prise en charge des déchets du producteur{" "}
              <input
                type="checkbox"
                checked={form.emitter?.type === EmitterType.OTHER}
                readOnly
              />{" "}
              un autre détenteur{" "}
              <input
                type="checkbox"
                checked={form.emitter?.type === EmitterType.APPENDIX1}
                readOnly
              />{" "}
              la collecte de petites quantité de déchets relevant de la même
              rubrique (annexe 1 doit être conservée){" "}
              <input
                type="checkbox"
                checked={form.emitter?.type === EmitterType.APPENDIX2}
                readOnly
              />{" "}
              créer un bordereau de regroupement, pour la personne ayant
              transformé ou réalisé un traitement dont la provenance des déchets
              reste identifiable (l’annexe 2 sera jointe automatiquement)
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>N° Bordereau :</strong> {form.readableId}{" "}
              {form.customId && <>({form.customId})</>}
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>1.1 Producteur ou détenteur du déchet</strong>
            </p>
            <FormCompanyFields company={form.emitter?.company} />

            <p>
              <strong>1.2 Point de collecte/chantier</strong> (si adresse
              différente de 1.1)
            </p>
            <p>
              Nom/raison sociale : {form.emitter?.workSite?.name}
              <br />
              Adresse : {form.emitter?.workSite?.address}
              <br />
              Info libre : {form.emitter?.workSite?.infos}
            </p>

            <p>
              <input
                type="checkbox"
                checked={Boolean(form.ecoOrganisme)}
                readOnly
              />{" "}
              <strong>Un éco-organisme est responsable</strong> du déchet, de la
              collecte et/ou du traitement
            </p>
            <p>
              Raison sociale : {form.ecoOrganisme?.name}
              <br />
              SIREN : {form.ecoOrganisme?.siret?.substr(0, 9)}
            </p>
          </div>
          <div className="BoxCol">
            <p>
              <strong>
                2. Installation de destination ou d’entreposage ou de
                reconditionnement prévu
              </strong>
            </p>
            <p>
              Entreposage provisoire ou reconditionnement
              <br />
              <input
                type="checkbox"
                checked={Boolean(form.temporaryStorageDetail)}
                readOnly
              />{" "}
              oui (cadres 13 à 19 à remplir)
              <br />
              <input
                type="checkbox"
                checked={!form.temporaryStorageDetail}
                readOnly
              />{" "}
              non
            </p>
            <RecipientFormCompanyFields {...form.recipient} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>3. Dénomination du déchet</strong>
            </p>
            <p>
              Code déchet : {form.wasteDetails?.code}
              <br />
              Dénomination usuelle : {form.wasteDetails?.name}
              <br />
              Déchet dangereux :{" "}
              <input
                type="checkbox"
                checked={
                  form.wasteDetails?.code
                    ? isDangerous(form.wasteDetails?.code)
                    : false
                }
                readOnly
              />{" "}
              oui{" "}
              <input
                type="checkbox"
                checked={
                  form.wasteDetails?.code
                    ? !isDangerous(form.wasteDetails?.code)
                    : false
                }
                readOnly
              />{" "}
              non
              <br />
              Déchet contenant des POP{" "}
              <input
                type="checkbox"
                checked={Boolean(form.wasteDetails?.pop)}
                readOnly
              />{" "}
              oui{" "}
              <input
                type="checkbox"
                checked={!form.wasteDetails?.pop}
                readOnly
              />{" "}
              non
            </p>
            <p>
              Consistance du déchet :<br />
              {[
                { label: "solide", value: Consistence.SOLID },
                { label: "pâteux", value: Consistence.DOUGHY },
                { label: "liquide", value: Consistence.LIQUID },
                { label: "gazeux", value: Consistence.GASEOUS }
              ].map((consistenceType, index) => (
                <React.Fragment key={index}>
                  <input
                    type="checkbox"
                    checked={
                      form.wasteDetails?.consistence === consistenceType.value
                    }
                    readOnly
                  />{" "}
                  {consistenceType.label}{" "}
                </React.Fragment>
              ))}
            </p>
          </div>

          <div className="BoxCol">
            <p>
              <strong>4. Conditionnement</strong>
            </p>
            <PackagingInfosTable
              packagingInfos={form.wasteDetails?.packagingInfos ?? []}
            />
          </div>

          <div className="BoxCol">
            <p>
              <strong>5. Quantité</strong>
            </p>
            <QuantityFields {...form.wasteDetails} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                6. Mentions au titre des règlements ADR, RID, ADNR, IMDG (le cas
                échéant) :
              </strong>
            </p>
            <p>{form.wasteDetails?.onuCode}</p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                7.{" "}
                <input
                  type="checkbox"
                  checked={Boolean(form.trader)}
                  readOnly
                />{" "}
                Négociant{" "}
                <input
                  type="checkbox"
                  checked={Boolean(form.broker)}
                  readOnly
                />{" "}
                Courtier
              </strong>
            </p>
            <div className="Row">
              <div className="Col">
                <FormCompanyFields
                  company={form.trader?.company ?? form.broker?.company}
                />
              </div>
              <div className="Col">
                <ReceiptFields {...(form.trader ?? form.broker ?? {})} />
              </div>
            </div>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>8. Collecteur-Transporteur</strong>
            </p>
            <TransporterFormCompanyFields {...form} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                A REMPLIR PAR LA PERSONNE MORALE MENTIONNEE AU CADRE 1.1
              </strong>
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                9. Déclaration générale de la personne mentionnée au cadre 1.1
              </strong>
            </p>
            <p>
              Je soussigné, certifie que les renseignements portés dans les
              cades ci-dessus sont exacts et de bonne foi.
            </p>
            <p>
              <span className="Row">
                <span className="Col">Nom : {form.sentBy}</span>
                <span className="Col">Date : {formatDate(form.sentAt)}</span>
                <span className="Col">Signature :</span>
              </span>
            </p>
            {form.sentAt && <SignatureStamp />}
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>A REMPLIR PAR L’INSTALLATION DE DESTINATION</strong>
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                10. Réception par l’installation visée au cadre 2 (ou 14)
              </strong>
            </p>
            <p>
              Quantité réelle présentées : {form.quantityReceived} tonne(s)
              <br />
              Date de présentation : {formatDate(form.receivedAt)}
            </p>
            <AcceptationFields {...form} />

            <p>
              Nom : {form.receivedBy}
              <br />
              Signature :
            </p>
            {form.receivedAt && <SignatureStamp />}
          </div>
          <div className="BoxCol">
            <p>
              <strong>11. Réalisation de l’opération</strong>
            </p>
            <p>
              Code D/R de l’opération : {form.processingOperationDone}
              <br />
              Description : {form.processingOperationDescription}
              <br />
              Date de l’opération : {formatDate(form.processedAt)}
              <br />
              <input
                type="checkbox"
                checked={Boolean(form.noTraceability)}
                readOnly
              />{" "}
              Autorisation par arrêté préfectoral, à une rupture de traçabilité
              pour ce déchet.
            </p>
            <p>
              Je soussigné certifie que l’opération ci-dessus a été effectuée.
              <br />
              Nom : {form.processedBy}
              <br />
              Signature :
            </p>
            {form.processedAt && <SignatureStamp />}
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>12. Destination prévue</strong>
            </p>
            <div className="Row">
              <div className="Col">
                <FormCompanyFields company={form.nextDestination?.company} />
              </div>
              <div className="Col">
                <p>
                  CODE D/R de traitement prévu :{" "}
                  {form.nextDestination?.processingOperation}
                </p>
                <p>
                  N° du document prévu à l'annexe I-B du règlement n°1013/2006
                  ou le numéro de notification et numéro de saisie du document
                  prévue à l'annexe I-B du règlement N°1013/2006 (si connu) :
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                A REMPLIR EN CAS D’ENTREPOSAGE PROVISOIRE OU DE
                RECONDITIONNEMENT (cadres 14 à 19)
              </strong>
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                13. Réception par l’installation d’entreposage prévue au cadre 2
              </strong>
            </p>
            <p>Quantité présentée :</p>
            <QuantityFields
              quantity={
                form.temporaryStorageDetail?.temporaryStorer?.quantityReceived
              }
              quantityType={
                form.temporaryStorageDetail?.temporaryStorer?.quantityType
              }
            />
            <p>
              Date de présentation :{" "}
              {formatDate(
                form.temporaryStorageDetail?.temporaryStorer?.receivedAt
              )}
            </p>
            <AcceptationFields
              {...form.temporaryStorageDetail?.temporaryStorer}
            />
            <p>
              Nom : {form.temporaryStorageDetail?.temporaryStorer?.receivedBy}
              <br />
              Signature :
            </p>
            {form.temporaryStorageDetail?.temporaryStorer?.receivedAt && (
              <SignatureStamp />
            )}
          </div>
          <div className="BoxCol">
            <p>
              <strong>14. Installation de destination prévue</strong>
            </p>
            <RecipientFormCompanyFields
              {...form.temporaryStorageDetail?.destination}
            />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                15. Conditionnement (à remplir en cas de reconditionnement
                uniquement)
              </strong>
            </p>
            <PackagingInfosTable
              packagingInfos={
                form.temporaryStorageDetail?.wasteDetails?.packagingInfos ?? []
              }
            />
          </div>
          <div className="BoxCol">
            <p>
              <strong>
                16. Quantité (à remplir en cas de reconditionnement uniquement)
              </strong>
            </p>
            <QuantityFields {...form.temporaryStorageDetail?.wasteDetails} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                17. Mentions au titre des règlements ADR, RID, ADNR, IMDG (à
                remplir en cas de reconditionnement uniquement) (le cas échéant)
                :
              </strong>
            </p>
            <p>{form.temporaryStorageDetail?.wasteDetails?.onuCode}</p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>18. Collecteur-Transporteur</strong>
            </p>
            <TransporterFormCompanyFields
              transporter={form.temporaryStorageDetail?.transporter}
              sentAt={form.temporaryStorageDetail?.signedAt}
            />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                19. Déclaration générale de la personne mentionnée au cadre 2
              </strong>
            </p>
            <p>
              Je soussigné, certifie que les renseignements portés dans les
              cades ci-dessus sont exacts et de bonne foi.
            </p>
            <p>
              <span className="Row">
                <span className="Col">
                  Nom : {form.temporaryStorageDetail?.signedBy}
                </span>
                <span className="Col">
                  Date : {formatDate(form.temporaryStorageDetail?.signedAt)}
                </span>
                <span className="Col">Signature :</span>
              </span>
            </p>
            {form.temporaryStorageDetail?.signedAt && <SignatureStamp />}
          </div>
        </div>
      </div>

      {form.transportSegments.length > 0 && (
        <div className="Page">
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>A REMPLIR EN CAS DE TRANSPORT MULTIMODAL</strong>
              </p>
            </div>
          </div>

          {(
            [
              ...form.transportSegments,
              ...Array.from({
                length: 2 - form.transportSegments.length
              }).fill(undefined)
            ] as Array<TransportSegment | undefined>
          ).map((transportSegment, index) => (
            <div className="BoxRow" key={index}>
              <div className="BoxCol">
                <p>
                  <strong>18. Collecteur-Transporteur</strong>
                </p>
                <TransporterFormCompanyFields
                  transporter={transportSegment?.transporter}
                  transportMode={transportSegment?.mode}
                  sentAt={transportSegment?.takenOverAt}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {form.appendix2Forms.length > 0 && (
        <div className="Page">
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>ANNEXE 2</strong>
              </p>
            </div>
          </div>

          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>
                  Bordereaux associés, constituant l’historique de la
                  traçabilité
                </strong>
              </p>
              <p>
                (Sur Trackdéchets, l’annexe 2 sera intégrée à un bordereau de
                regroupement, lors d’une réexpédition après transformation ou
                traitement aboutissant à des déchets dont la provenance reste
                identifiable / le nombre de ligne s’ajustera automatiquement)
              </p>
            </div>
          </div>
          <div className="BoxRow">
            <div className="BoxCol">
              <table>
                <thead>
                  <tr>
                    <th />
                    <th>N° Bordereaux</th>
                    <th>Code déchets</th>
                    <th>Dénomination usuelle</th>
                    <th>Pesée (tonne)</th>
                    <th>Réelle / estimée</th>
                    <th>Date de prise en charge initiale</th>
                    <th>Code postal lieu de collecte</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ...form.appendix2Forms,
                      ...Array.from({
                        length: 10 - form.appendix2Forms.length
                      }).fill(undefined)
                    ] as Array<Appendix2Form | undefined>
                  ).map((appendix2Form, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{appendix2Form?.readableId}</td>
                      <td>{appendix2Form?.wasteDetails?.code}</td>
                      <td>{appendix2Form?.wasteDetails?.name}</td>
                      <td>{appendix2Form?.wasteDetails?.quantity}</td>
                      <td>
                        {appendix2Form?.wasteDetails?.quantityType?.charAt(0)}
                      </td>
                      <td>{formatDate(appendix2Form?.signedAt)}</td>
                      <td>{appendix2Form?.emitterPostalCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Document>
  );

  return generatePdf(html);
}

export function generateBsddPdfToBase64(
  prismaForm: PrismaForm
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const convertToBase64 = concatStream(buffer =>
      resolve(buffer.toString("base64"))
    );
    const readableStream = await generateBsddPdf(prismaForm);

    readableStream.on("error", reject);
    readableStream.pipe(convertToBase64);
  });
}
