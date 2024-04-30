import * as React from "react";
import {
  Document,
  formatDateTime,
  TRANSPORT_MODE_LABELS,
  buildPdfAddress
} from "../../../common/pdf";
import { Bspaoh, BspaohRecepisse } from "../../../generated/graphql/types";
import { FormCompanyFields } from "./FormCompanyFields";
import { PackagingInfosTable } from "./PackagingInfosTable";
import { Recepisse } from "./Recepisse";
import { Signature } from "./Signature";
import { Quantity } from "./WasteDetails";

type Props = { readonly bspaoh: Bspaoh; readonly qrCode: string };

export function BspaohPdf({ bspaoh, qrCode }: Props) {
  const pickupSiteAdress = buildPdfAddress([
    bspaoh.emitter?.pickupSite?.address,
    bspaoh.emitter?.pickupSite?.postalCode,
    bspaoh.emitter?.pickupSite?.city
  ]);

  return (
    <Document title={bspaoh.id}>
      <div className="Page">
        <div className="BoxRow">
          <div className="BoxCol">
            <p className="TextAlignCenter">
              Code de la Santé publique art. R 1335-10.
            </p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <p>Ministère en charge de la Santé</p>
            <h1 style={{ fontSize: "1rem" }}>Bordereau de suivi de déchets</h1>
            <h1 style={{ fontSize: "1rem" }}>
              Pièces Anatomiques d’Origine Humaine
            </h1>
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
              Document utilisé pour les PAOH, pour toutes prises en charge de
              déchets anatomiques et organes, y compris sacs de sang et réserves
              de sang. Les déchets présentant un risque d’infection (18 01 03*)
              doivent être tracés avec un BSDASRI via Trackdéchets.
            </p>
          </div>
        </div>
        {/* Paoh ID */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>N° Bordereau :</strong> {bspaoh.id}
            </p>
          </div>
        </div>
        {/* End Paoh ID */}
        {/* PRED */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>1. Établissement Producteur des déchets</strong>
            </p>
            <FormCompanyFields
              company={bspaoh.emitter?.company}
              displayCountryInfo={false}
            />
            {(Boolean(bspaoh.emitter?.pickupSite?.name) ||
              pickupSiteAdress !== "") && (
              <>
                <p>
                  <strong>Adresse de collecte</strong>
                </p>
                <p>
                  Nom/raison sociale : {bspaoh.emitter?.pickupSite?.name}
                  <br />
                  Adresse : {pickupSiteAdress}
                  <br />{" "}
                </p>
              </>
            )}
            <p>Info libre : {bspaoh.emitter?.pickupSite?.infos}</p>

            <p>
              <strong>
                Date de remise au collecteur :{" "}
                {formatDateTime(bspaoh.transporter?.transport?.takenOverAt)}
              </strong>
            </p>
          </div>
          <div className="BoxCol">
            <p>
              <strong>1.1 Déchets</strong>
            </p>
            <p>
              <strong>Code nomenclature :</strong> 18 01 02 déchets anatomiques
              et organes, y compris sacs de sang et réserves de sang
              <br />
              <strong>Mention ADR : </strong> {bspaoh?.waste?.adr}
              <br />
              <strong>Désignation : </strong>
              {bspaoh?.waste?.type}
            </p>

            <Quantity
              label="Quantité remise"
              weight={bspaoh?.emitter?.emission?.detail?.weight}
            />
            <hr />
            <p>
              <strong>Nom et signature du responsable :</strong>
            </p>
            <Signature signature={bspaoh?.emitter?.emission?.signature} />
          </div>
        </div>
        {/* End Producteur */}
        {/* Packagings */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>2. Tableau des conditionnements</strong>
            </p>
            <PackagingInfosTable
              packagingInfos={bspaoh?.waste?.packagings ?? []}
              showAcceptation={true}
            />
          </div>
        </div>
        {/* End Packagings */}
        {/* Transporter */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>3. Collecteur/transporteur</strong>
            </p>
            <FormCompanyFields
              company={bspaoh?.transporter?.company}
              displayCountryInfo={false}
            />
            <p>
              {bspaoh?.transporter?.recepisse?.isExempted ? (
                <p>
                  Le transporteur déclare être exempté de récépissé conformément
                  aux dispositions de l'article R.541-50 du code de
                  l'environnement.
                </p>
              ) : (
                <Recepisse
                  recepisse={bspaoh?.transporter?.recepisse as BspaohRecepisse}
                />
              )}
            </p>
            <p>
              Mode de transport:{" "}
              {bspaoh?.transporter?.transport?.mode
                ? TRANSPORT_MODE_LABELS[bspaoh?.transporter?.transport?.mode]
                : ""}
            </p>
            <p>
              Immatriculation(s) :{" "}
              {bspaoh?.transporter?.transport?.plates?.join(", ")}
            </p>
          </div>
          <div className="BoxCol">
            <p>
              <strong>3.1 Transport</strong>
            </p>

            <hr />
            <section style={{ position: "relative" }}>
              <p>
                <strong>3.2 Prise en charge</strong>
              </p>
              <p>
                <strong>Date et heure : </strong>
                {formatDateTime(bspaoh?.transporter?.transport?.takenOverAt)}
              </p>
              <p>
                <strong>Signature </strong>
                <Signature
                  signature={bspaoh?.transporter?.transport?.signature}
                />
              </p>
            </section>
            <hr />
            <p>
              <strong>3.3 Remise à l’installation de destination</strong>
            </p>
            <p>
              <strong>Date et heure : </strong>
              {formatDateTime(
                bspaoh?.destination?.handedOverToDestination?.signature?.date
              )}
            </p>
            <p>
              <strong>Signature</strong>
              <Signature
                signature={
                  bspaoh?.destination?.handedOverToDestination?.signature
                }
              />
            </p>
          </div>
        </div>
        {/* End Transporter */}
        {/* Destination */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>4. Crématorium destinataire</strong>
            </p>
            <FormCompanyFields
              company={bspaoh.destination?.company}
              displayCountryInfo={false}
            />
          </div>
          <div className="BoxCol">
            <p>
              <strong>4.1 Réception</strong>
            </p>
            <p>
              <strong>Lot accepté : </strong>
              <input
                type="checkbox"
                checked={
                  bspaoh?.destination?.reception?.acceptation?.status ===
                  "ACCEPTED"
                }
                readOnly
              />{" "}
              Oui{" "}
              <input
                type="checkbox"
                checked={
                  bspaoh?.destination?.reception?.acceptation?.status ===
                  "REFUSED"
                }
                readOnly
              />{" "}
              Non (Refus){" "}
              <input
                type="checkbox"
                checked={
                  bspaoh?.destination?.reception?.acceptation?.status ===
                  "PARTIALLY_REFUSED"
                }
                readOnly
              />{" "}
              Partiellement (cf. tableau §2)
              <br />
              {bspaoh?.destination?.reception?.acceptation?.status ===
                "PARTIALLY_REFUSED" ||
                (bspaoh?.destination?.reception?.acceptation?.status ===
                  "REFUSED" && (
                  <p>
                    Motif de refus:{" "}
                    {bspaoh?.destination?.reception?.acceptation?.refusalReason}
                  </p>
                ))}
              <Quantity
                label="Quantité réceptionnée"
                weight={bspaoh?.destination?.reception?.detail?.receivedWeight}
              />
              <Quantity
                label="Quantité refusée"
                weight={bspaoh?.destination?.reception?.detail?.refusedWeight}
              />
              <Quantity
                label="Quantité acceptée"
                weight={bspaoh?.destination?.reception?.detail?.acceptedWeight}
              />
              <p>
                Date et heure de réception/acceptation/refus:{" "}
                {formatDateTime(bspaoh?.destination?.reception?.date)}
              </p>
              <p>
                <strong>Signature du responsable de l'exploitation :</strong>
              </p>
              <Signature
                signature={bspaoh?.destination?.reception?.signature}
              />
            </p>
          </div>
        </div>
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              Je soussigné.e, certifie que l’opération indiquée ci-contre a bien
              été réalisée pour la quantité de déchets renseignée.
            </p>
            <p>
              <strong>
                Nom et signature du responsable de l'exploitation :
              </strong>
            </p>
            <Signature signature={bspaoh?.destination?.operation?.signature} />
          </div>
          <div className="BoxCol">
            <p>
              <strong>4.2 Opération réalisée</strong>
            </p>

            <p>
              <input
                type="checkbox"
                checked={bspaoh?.destination?.operation?.code === "R 1"}
                readOnly
              />{" "}
              Incinération + valorisation énergétique (R 1)
            </p>
            <p>
              <input
                type="checkbox"
                checked={bspaoh?.destination?.operation?.code === "D 10"}
                readOnly
              />{" "}
              Incinération (D 10)
            </p>
            <p>
              Date de l'opération:{" "}
              {formatDateTime(bspaoh?.destination?.operation?.date)}
            </p>
            <p>Mode de traitement : Élimination</p>
          </div>
        </div>
        {/* end Destination */}
      </div>
    </Document>
  );
}
