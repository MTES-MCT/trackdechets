import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import {
  Form as PrismaForm,
  Consistence,
  QuantityType,
  WasteAcceptationStatus,
  EmitterType,
  Status,
  OperationMode
} from "@prisma/client";
import * as QRCode from "qrcode";
import concatStream from "concat-stream";
import {
  generatePdf,
  formatDate,
  Document,
  SignatureStamp,
  FormCompanyFields,
  TRANSPORT_MODE_LABELS
} from "../../common/pdf";
import {
  Form as GraphQLForm,
  FormCompany,
  InitialFormFraction,
  PackagingInfo,
  Transporter,
  TransportSegment
} from "../../generated/graphql/types";
import { expandFormFromDb, expandableFormIncludes } from "../converter";
import { prisma } from "@td/prisma";
import { buildAddress } from "../../companies/sirene/utils";
import { isDangerous, packagingsEqual } from "@td/constants";
import { CancelationStamp } from "../../common/pdf/components/CancelationStamp";
import { getOperationModeLabel } from "../../common/operationModes";
import { FormCompanyDetails } from "../../common/pdf/components/FormCompanyDetails";
import { isFrenchCompany } from "../../companies/validation";
import { bsddWasteQuantities } from "../helpers/bsddWasteQuantities";

type ReceiptFieldsProps = Partial<
  Pick<
    NonNullable<GraphQLForm["transporter"]>,
    "department" | "receipt" | "validityLimit"
  >
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
  quantity?: number | null;
  quantityType?: QuantityType | null;
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
      <br />
      "QUANTITÉE ESTIMÉE CONFORMÉMENT AU 5.4.1.1.3.2" de l'ADR 2023
    </p>
  );
}

type AcceptationFieldsProps = {
  wasteAcceptationStatus?: WasteAcceptationStatus | null;
  wasteRefusalReason?: string | null;
  signedAt?: Date | null;
  quantityReceived?: number | null;
  quantityRefused?: number | null;
};

function AcceptationFields({
  wasteAcceptationStatus,
  wasteRefusalReason,
  signedAt,
  quantityReceived,
  quantityRefused
}: AcceptationFieldsProps) {
  const wasteQuantities = bsddWasteQuantities({
    wasteAcceptationStatus,
    quantityReceived,
    quantityRefused
  });

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
      <br />
      {wasteQuantities && (
        <>
          Quantité de déchets refusée :{" "}
          {wasteQuantities.quantityRefused.toNumber()} tonne(s)
          <br />
          Quantité de déchets acceptée :{" "}
          {wasteQuantities.quantityAccepted.toNumber()} tonne(s)
          <br />
          <br />
        </>
      )}
      Date de signature : {formatDate(signedAt)}
      <br />
    </p>
  );
}

type RecipientFormCompanyFieldsProps = {
  cap?: string | null;
  processingOperation?: string | null;
  company?: FormCompany | null;
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

const colisPackagings = ["GRV", "FUT", "AUTRE"];
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
          { label: "Conditionnné pour Pipeline", value: "PIPELINE" },
          { label: "GRV", value: "GRV" },
          { label: "Fûts", value: "FUT" },
          { label: getOtherPackagingLabel(packagingInfos), value: "AUTRE" }
        ].map((packagingType, index) => (
          <tr
            key={index}
            style={
              packagingType.value === "PIPELINE"
                ? { borderBottom: "2px solid black" }
                : {}
            }
          >
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

            <td>
              {colisPackagings.includes(packagingType.value) ? (
                packagingType.label
              ) : (
                <b>{packagingType.label}</b>
              )}
            </td>
          </tr>
        ))}
        <tr>
          <td>
            <strong>
              {packagingInfos.reduce((total, packaging) => {
                return colisPackagings.includes(packaging.type)
                  ? total + (packaging.quantity ?? 0)
                  : total;
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
  transporter?: Omit<Transporter, "id"> | null;
  takenOverAt?: Date | null;
  takenOverBy?: string | null;
};

function TransporterFormCompanyFields({
  transporter,
  takenOverAt,
  takenOverBy
}: TransporterFormCompanyFieldsProps) {
  return (
    <div className="Row">
      <div className="Col">
        <FormCompanyFields company={transporter?.company} />
      </div>
      <div className="Col">
        {transporter?.isExemptedOfReceipt ? (
          <p>
            <input type="checkbox" checked readOnly /> Je déclare être exempté
            de récépissé au titre de l'article R.541-50 du code de
            l'environnement
          </p>
        ) : (
          <ReceiptFields {...(transporter ?? {})} />
        )}
        <p>
          Mode de transport :{" "}
          {transporter?.mode ? TRANSPORT_MODE_LABELS[transporter.mode] : null}
          <br />
          Immatriculation(s) : {transporter?.numberPlate}
          <br />
          Date de prise en charge : {formatDate(takenOverAt)}
          <br />
          Nom et signature : {takenOverBy}
        </p>
        {takenOverAt && <SignatureStamp />}
      </div>
    </div>
  );
}

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

  const appendix1ProducerPlaceholder = `En cas de contrôle, les informations relatives à ce cadre sont celle du BSD de tournée dédié associé n° ${groupedIn.map(
    bsd => bsd.readableId
  )}`;

  const form = expandFormFromDb(fullPrismaForm);
  const isRepackging =
    form.recipient?.isTempStorage &&
    !!form.temporaryStorageDetail?.wasteDetails?.packagingInfos &&
    !packagingsEqual(
      form.temporaryStorageDetail?.wasteDetails?.packagingInfos,
      form.wasteDetails?.packagingInfos
    );
  const qrCode = await QRCode.toString(form.readableId, { type: "svg" });

  const wasteIsDangerous =
    Boolean(form.wasteDetails?.isDangerous) ||
    isDangerous(form.wasteDetails?.code) ||
    Boolean(form.wasteDetails?.pop);

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
            <h1>Bordereau de suivi de déchets</h1>
            <p>
              <input type="checkbox" checked={wasteIsDangerous} readOnly />{" "}
              dangereux{" "}
              <input type="checkbox" checked={!wasteIsDangerous} readOnly /> non
              dangereux{" "}
            </p>
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
              un bordereau de tournée dédiée{" "}
              <input
                type="checkbox"
                checked={form.emitter?.type === EmitterType.APPENDIX1_PRODUCER}
                readOnly
              />{" "}
              un bordereau d'annexe 1{" "}
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
              {!!form.customId && <>({form.customId})</>}
              {!!groupedIn?.length && (
                <>
                  <strong>
                    Annexé au bordereau{" "}
                    {form.emitter?.type === EmitterType.APPENDIX1_PRODUCER &&
                      "de tournée dédiée"}{" "}
                    n° :
                  </strong>{" "}
                  {groupedIn.map(bsd => bsd.readableId)}
                </>
              )}
              {form.status === Status.CANCELED && <CancelationStamp />}
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>1.1 Producteur ou détenteur du déchet</strong>
            </p>
            <p>
              <input
                type="checkbox"
                checked={isFrenchCompany({
                  company: form.emitter?.company,
                  isForeignShip: Boolean(form.emitter?.isForeignShip),
                  isPrivateIndividual: Boolean(
                    form.emitter?.isPrivateIndividual
                  )
                })}
                readOnly
              />{" "}
              L'émetteur est un établissement français
            </p>
            <p>
              <input
                type="checkbox"
                checked={Boolean(form.emitter?.isPrivateIndividual)}
                readOnly
              />{" "}
              L'émetteur est un particulier
            </p>
            <p>
              <input
                type="checkbox"
                checked={Boolean(form.emitter?.isForeignShip)}
                readOnly
              />{" "}
              L'émetteur est un navire étranger
            </p>
            <FormCompanyDetails
              company={form.emitter?.company}
              isPrivateIndividual={Boolean(form.emitter?.isPrivateIndividual)}
              isForeignShip={Boolean(form.emitter?.isForeignShip)}
            />

            <p>
              <strong>1.2 Point de collecte/chantier</strong> (si adresse
              différente de 1.1)
            </p>
            <p>
              Nom/raison sociale : {form.emitter?.workSite?.name}
              <br />
              Adresse :{" "}
              {form.emitter?.workSite &&
                buildAddress([
                  form.emitter?.workSite?.address,
                  form.emitter?.workSite?.postalCode,
                  form.emitter?.workSite?.city
                ])}
              <br />
              Info libre : {form.emitter?.workSite?.infos}
            </p>

            <p>
              <strong>1.3 Terres et sédiments</strong>
            </p>
            <p>
              Parcelle(s) :{" "}
              {form.wasteDetails?.parcelNumbers
                ?.map(
                  pn =>
                    `${pn.city} - ${pn.postalCode} - ${[
                      pn.prefix,
                      pn.section,
                      pn.number
                    ]
                      .filter(Boolean)
                      .join("/")}`
                )
                .join(", ")}
              <br />
              Coordonnée(s) GPS :{" "}
              {form.wasteDetails?.parcelNumbers
                ?.filter(pn => pn.x && pn.y)
                .map(pn => [`lat ${pn.x}°`, `lon ${pn.y}°`].join(" / "))
                .join(", ")}
              <br />
              Référence(s) laboratoire(s) :{" "}
              {form.wasteDetails?.analysisReferences?.join(", ")}
              <br />
              Identifiant(s) terrain (le cas échéant) :{" "}
              {form.wasteDetails?.landIdentifiers?.join(", ")}
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
                reconditionnement prévue
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
                checked={Boolean(form.wasteDetails?.isDangerous)}
                readOnly
              />{" "}
              oui{" "}
              <input
                type="checkbox"
                checked={form.wasteDetails?.isDangerous === false}
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
            {form.wasteDetails?.sampleNumber && (
              <p>
                Numéro d'échantillon :<br />
                {form.wasteDetails.sampleNumber}
              </p>
            )}
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
            {form.emitter?.type === EmitterType.APPENDIX1_PRODUCER ? (
              appendix1ProducerPlaceholder
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        {form.intermediaries?.length ? (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>
                  Autre{form?.intermediaries?.length > 1 ? "s" : ""}{" "}
                  Intermédiaire{form?.intermediaries?.length > 1 ? "s" : ""}
                </strong>
              </p>
              {form?.intermediaries?.map(intermediary => (
                <div className="Row">
                  <div className="Col">
                    <FormCompanyFields company={intermediary} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          ""
        )}
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
              cadres ci-dessus sont exacts et de bonne foi.
            </p>
            <p>
              <span className="Row">
                <span className="Col">Nom : {form.emittedBy}</span>
                <span className="Col">Date : {formatDate(form.emittedAt)}</span>
                <span className="Col">Signature :</span>
              </span>
            </p>
            {form.emittedAt && <SignatureStamp />}
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
            {form.emitter?.type === EmitterType.APPENDIX1_PRODUCER ? (
              appendix1ProducerPlaceholder
            ) : (
              <>
                <p>
                  Quantité de déchets réceptionnée : {form.quantityReceived}{" "}
                  tonne(s)
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
              </>
            )}
          </div>
          <div className="BoxCol">
            <p>
              <strong>11. Réalisation de l’opération</strong>
            </p>
            {form.emitter?.type === EmitterType.APPENDIX1_PRODUCER ? (
              appendix1ProducerPlaceholder
            ) : (
              <>
                <p>
                  Code D/R de l’opération : {form.processingOperationDone}
                  <br />
                  Mode de traitement :{" "}
                  {getOperationModeLabel(
                    form?.destinationOperationMode as OperationMode
                  )}
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
                  Autorisation par arrêté préfectoral, à une rupture de
                  traçabilité pour ce déchet.
                </p>
                <p>
                  Je soussigné certifie que l’opération ci-dessus a été
                  effectuée.
                  <br />
                  Nom : {form.processedBy}
                  <br />
                  Signature :
                </p>
                {form.processedAt && <SignatureStamp />}
              </>
            )}
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>12. Destination prévue</strong>
            </p>
            {form.emitter?.type === EmitterType.APPENDIX1_PRODUCER ? (
              appendix1ProducerPlaceholder
            ) : (
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
                    prévue à l'annexe I-B du règlement N°1013/2006 (si connu) :{" "}
                    {form.nextDestination?.notificationNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {form.recipient?.isTempStorage && (
          <>
            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>
                    A REMPLIR EN CAS D’ENTREPOSAGE PROVISOIRE OU DE
                    RECONDITIONNEMENT (cadres 13 à 19)
                  </strong>
                </p>
              </div>
            </div>

            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>
                    13. Réception par l’installation d’entreposage prévue au
                    cadre 2
                  </strong>
                </p>
                <p>Quantité présentée :</p>
                <QuantityFields
                  quantity={
                    form.temporaryStorageDetail?.temporaryStorer
                      ?.quantityReceived
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
                  signedAt={fullPrismaForm.signedAt}
                />
                <p>
                  Nom :{" "}
                  {form.temporaryStorageDetail?.temporaryStorer?.receivedBy}
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
                    isRepackging
                      ? form.temporaryStorageDetail?.wasteDetails
                          ?.packagingInfos ?? []
                      : []
                  }
                />
              </div>
              <div className="BoxCol">
                <p>
                  <strong>
                    16. Quantité (à remplir en cas de reconditionnement
                    uniquement)
                  </strong>
                </p>
                <QuantityFields
                  {...(isRepackging
                    ? form.temporaryStorageDetail?.wasteDetails
                    : { quantity: null, quantityType: null })}
                />
              </div>
            </div>

            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>
                    17. Mentions au titre des règlements ADR, RID, ADNR, IMDG (à
                    remplir en cas de reconditionnement uniquement) (le cas
                    échéant) :
                  </strong>
                </p>
                {isRepackging ? (
                  <p>{form.temporaryStorageDetail?.wasteDetails?.onuCode}</p>
                ) : null}
              </div>
            </div>

            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>18. Collecteur-Transporteur</strong>
                </p>
                <TransporterFormCompanyFields
                  transporter={form.temporaryStorageDetail?.transporter}
                  takenOverAt={form.temporaryStorageDetail?.takenOverAt}
                  takenOverBy={form.temporaryStorageDetail?.takenOverBy}
                />
              </div>
            </div>

            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>
                    19. Déclaration générale de la personne mentionnée au cadre
                    2
                  </strong>
                </p>
                <p>
                  Je soussigné, certifie que les renseignements portés dans les
                  cadres ci-dessus sont exacts et de bonne foi.
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
          </>
        )}
      </div>

      {form.transportSegments && form.transportSegments.length > 0 && (
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
                  transporter={{
                    ...transportSegment?.transporter,
                    mode: transportSegment?.mode
                  }}
                  takenOverAt={transportSegment?.takenOverAt}
                  takenOverBy={transportSegment?.takenOverBy}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {form.grouping && form.grouping.length > 0 && (
        <div className="Page">
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>BORDEREAUX ANNEXÉS</strong>
              </p>
            </div>
          </div>

          {form.emitter?.type === EmitterType.APPENDIX1 ? (
            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  <strong>
                    Bordereaux associés, constituant la tournée de collecte
                  </strong>
                </p>
                <p>
                  La tournée de collecte est constituée de toutes les annexes 1
                  prévues dans la tournée, tant que le bordereau est vivant. Dès
                  que la prise en charge est effective à l'installation de
                  destination, la liste des annexes 1 est constituée des
                  collectes effectives. (celles prévues et non réalisées sont
                  supprimées)
                </p>
              </div>
            </div>
          ) : (
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
          )}
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
                    {form?.emitter?.type !== EmitterType.APPENDIX1 && (
                      <th>Fraction regroupée (tonne)</th>
                    )}
                    <th>Date de prise en charge initiale</th>
                    <th>Code postal lieu de collecte</th>
                    {form?.emitter?.type === EmitterType.APPENDIX1 && (
                      <th>N° d'échantillon</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ...form.grouping,
                      ...Array.from({
                        length: 10 - form.grouping.length
                      }).fill({ form: null, quantity: null })
                    ] as Array<InitialFormFraction>
                  ).map(({ form: groupedForm, quantity }, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{groupedForm?.readableId}</td>
                      <td>{groupedForm?.wasteDetails?.code}</td>
                      <td>{groupedForm?.wasteDetails?.name}</td>
                      <td>
                        {groupedForm?.quantityAccepted ??
                          groupedForm?.quantityReceived ??
                          groupedForm?.wasteDetails?.quantity}
                      </td>
                      <td>
                        {groupedForm?.quantityReceived
                          ? "R"
                          : groupedForm?.wasteDetails?.quantityType?.charAt(0)}
                      </td>
                      {form?.emitter?.type !== EmitterType.APPENDIX1 && (
                        <td>{quantity}</td>
                      )}
                      <td>{formatDate(groupedForm?.takenOverAt)}</td>
                      <td>{groupedForm?.emitterPostalCode}</td>
                      {form?.emitter?.type === EmitterType.APPENDIX1 && (
                        <td>{groupedForm?.wasteDetails?.sampleNumber}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {form.emitter?.type === EmitterType.APPENDIX1 && (
            <div className="BoxRow">
              <div className="BoxCol">
                <p>
                  Les informations suivantes doivent figurer sur le document de
                  transport conformément au 5.4.1.1 de l'ADR :
                </p>
                <ul>
                  <li>N° UN + Désignation officielle de transport</li>
                  <li>Coordonnées de l'expéditeur</li>
                  <li>Coordonnées du destinataire</li>
                </ul>
                <p>
                  Le présent bordereau de tournée dédiée cumule automatiquement
                  les informations des collectes effectuées pour un déchet
                  identifié. Pour des raisons de confidentialité, les
                  coordonnées des producteurs n'apparaissent pas dans le tableau
                  ci-dessus. Aussi, en cas de contrôle des dispositions 5.4.1.1
                  de l'ADR par les autorités, les annexes 1 listées ci-dessus
                  pourront être présentées séparément par le transporteur, de
                  façon à disposer des coordonnées des producteurs. Chaque
                  annexe 1 est identifiable par son numéro et doit comporter les
                  coordonnées du producteur initial.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Document>
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
