import * as React from "react";
import {
  Document,
  formatDate,
  TRANSPORT_MODE_LABELS,
  SignatureStamp,
  buildPdfAddress
} from "../../../common/pdf";
import type {
  Bsdasri,
  InitialBsdasri,
  BsdasriSignature,
  BsdaRecepisse
} from "@td/codegen-back";
import { TraceabilityTable } from "./TraceabilityTable";
import { PackagingInfosTable } from "./PackagingInfosTable";
import { FormCompanyFields } from "./FormCompanyFields";
import { BsdasriType, OperationMode } from "@prisma/client";
import { getOperationModeLabel } from "../../../common/operationModes";
import { dateToXMonthAtHHMM } from "../../../common/helpers";
import { Recepisse } from "../../../common/pdf/components/Recepisse";
import { pluralize } from "@td/constants";

type Props = {
  bsdasri: Bsdasri;
  qrCode: string;
  associatedBsdasris: InitialBsdasri[] | null;
};

export function BsdasriPdf({ bsdasri, qrCode, associatedBsdasris }: Props) {
  const pickupSiteAdress = buildPdfAddress([
    bsdasri.emitter?.pickupSite?.address,
    bsdasri.emitter?.pickupSite?.postalCode,
    bsdasri.emitter?.pickupSite?.city
  ]);
  const intermediaryCount = bsdasri?.intermediaries?.length ?? 0;

  return (
    <Document title={bsdasri.id}>
      <div className="Page">
        {/* 3-parts header */}
        <div className="BoxRow">
          <div className="BoxCol TextAlignCenter">
            <p>Textes règlementaires</p>
            <p>Art. R. 541-45 du code de l’environnement.</p>
            <p>Assimilé au CERFA 11351*4</p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <p>Ministère en charge de la Santé</p>
            <h1>Bordereau de suivi de déchets de soins à risques infectieux</h1>
            <p>
              Document utilisé pour les DASRI, pour toutes les prises en charge
              quel qu'en soit le poids
            </p>
            <p>Récépissé Trackdéchets</p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <div
              className="QrCode"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            <div>
              <b>Document édité le {dateToXMonthAtHHMM()}</b>
            </div>
          </div>
        </div>
        {/* end 3-parts header */}

        {/* Dasri type */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              J'édite un BSDASRI pour :{" "}
              <input
                type="checkbox"
                checked={bsdasri.type === BsdasriType.SIMPLE}
                readOnly
              />{" "}
              la prise en charge initiale de DASRI{" "}
              <input
                type="checkbox"
                checked={bsdasri.type === BsdasriType.GROUPING}
                readOnly
              />{" "}
              le groupement de DASRI sur un site relevant de la rubrique 2718{" "}
              <input
                type="checkbox"
                checked={bsdasri.type === BsdasriType.SYNTHESIS}
                readOnly
              />{" "}
              la synthèse des BSDASRI dans un véhicule sur un seul BSDASRI{" "}
            </p>
          </div>
        </div>
        {/* End Dasri type */}
        {/* Dasri ID */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>N° Bordereau :</strong> {bsdasri.id}
            </p>
          </div>
        </div>
        {/* End Dasri ID */}
        {/* Eco-org */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              L'éco-organisme DASTRI est identifié pour assurer la prise en
              charge et/ou la traçabilité des DASRI{" "}
              <input
                type="checkbox"
                checked={!!bsdasri?.ecoOrganisme?.siret}
                readOnly
              />
            </p>
          </div>
        </div>
        {/* End Eco-org */}
        {/* PRED */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>1. Producteur ou détenteur des déchets</strong>
            </p>
            <FormCompanyFields company={bsdasri.emitter?.company} />
            {(Boolean(bsdasri.emitter?.pickupSite?.name) ||
              pickupSiteAdress !== "") && (
              <>
                <p>
                  <strong>Adresse de collecte</strong>
                </p>
                <p>
                  Nom/raison sociale : {bsdasri.emitter?.pickupSite?.name}
                  <br />
                  Adresse : {pickupSiteAdress}
                  <br />{" "}
                </p>
              </>
            )}
            <p>Info libre : {bsdasri.emitter?.pickupSite?.infos}</p>
            {bsdasri.emitter?.emission?.isTakenOverWithoutEmitterSignature && (
              <p>
                <strong>Enlevé sans signature PRED :</strong> Oui
              </p>
            )}
            {bsdasri.emitter?.emission?.isTakenOverWithSecretCode && (
              <p>
                <strong>
                  Signature avec code secret{" "}
                  {!!bsdasri?.ecoOrganisme?.emittedByEcoOrganisme
                    ? "Éco-Organisme"
                    : "PRED"}{" "}
                  :
                </strong>{" "}
                Oui
              </p>
            )}
            <p>
              <strong>Date de remise au collecteur :</strong>{" "}
            </p>
            <hr />
            <p>
              <strong>Nom et signature du responsable :</strong>
            </p>
            <Signature signature={bsdasri?.emitter?.emission?.signature} />
          </div>
          <div className="BoxCol">
            <p>
              <strong>1.1 Déchets</strong>
            </p>
            <p>
              Code nomenclature
              <br />
              <input
                type="checkbox"
                checked={bsdasri?.waste?.code === "18 01 03*"}
                readOnly
              />{" "}
              18 01 03*: DASRI origine humaine
              <br />
              <input
                type="checkbox"
                checked={bsdasri?.waste?.code === "18 02 02*"}
                readOnly
              />{" "}
              18 02 02* DASRI origine animale
              <br />
              <strong>Mention ADR : </strong> {bsdasri?.waste?.adr}
            </p>
            <hr />
            <p>
              <strong>Conditionnement / Quantité initiale </strong>
            </p>
            <PackagingInfosTable
              packagingInfos={bsdasri?.emitter?.emission?.packagings}
            />
            <p>
              <strong>
                Quantité remise: {bsdasri?.emitter?.emission?.weight?.value} kg{" "}
              </strong>
            </p>
            <input
              type="checkbox"
              checked={bsdasri?.emitter?.emission?.weight?.isEstimate === false}
              readOnly
            />{" "}
            réelle
            <br />
            <input
              type="checkbox"
              checked={bsdasri?.emitter?.emission?.weight?.isEstimate === true}
              readOnly
            />{" "}
            Estimée
            <br />
            "QUANTITÉ ESTIMÉE CONFORMÉMENT AU 5.4.1.1.3.2" de l'ADR
          </div>
        </div>
        {/* End PRED */}
        {/* Transporter */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>2. Collecteur/transporteur</strong>
            </p>
            <FormCompanyFields company={bsdasri.transporter?.company} />
            <p>
              {bsdasri?.transporter?.recepisse?.isExempted ? (
                <p>
                  Le transporteur déclare être exempté de récépissé conformément
                  aux dispositions de l'article R.541-50 du code de
                  l'environnement.
                </p>
              ) : (
                <Recepisse
                  recepisse={bsdasri?.transporter?.recepisse as BsdaRecepisse}
                />
              )}
            </p>
            <p>
              Mode de transport:{" "}
              {bsdasri?.transporter?.transport?.mode
                ? TRANSPORT_MODE_LABELS[bsdasri?.transporter?.transport?.mode]
                : ""}
            </p>
            <p>
              Immatriculation(s) :{" "}
              {bsdasri?.transporter?.transport?.plates?.join(", ")}
            </p>
            <p>
              <strong>Date de remise à l'installation de destination :</strong>
              {formatDate(
                bsdasri?.transporter?.transport?.handedOverAt ??
                  bsdasri?.destination?.reception?.date
              )}
            </p>
            <hr />
            <p>
              <strong>Nom et signature du responsable :</strong>
            </p>
            <Signature signature={bsdasri?.transporter?.transport?.signature} />
          </div>
          <div className="BoxCol">
            <p>
              <strong>2.1 Déchets</strong>
            </p>
            <p>
              Lot accepté
              <br />
              <input
                type="checkbox"
                checked={
                  bsdasri?.transporter?.transport?.acceptation?.status ===
                  "ACCEPTED"
                }
                readOnly
              />{" "}
              Oui
              <span> </span>
              <input
                type="checkbox"
                checked={
                  bsdasri?.transporter?.transport?.acceptation?.status ===
                  "REFUSED"
                }
                readOnly
              />{" "}
              Non
              <span> </span>
              <input
                type="checkbox"
                checked={
                  bsdasri?.transporter?.transport?.acceptation?.status ===
                  "PARTIALLY_REFUSED"
                }
                readOnly
              />{" "}
              Partiellement
              <br />
              {bsdasri?.transporter?.transport?.acceptation?.status ===
                "PARTIALLY_REFUSED" && (
                <>
                  <p>
                    Quantité refusée de refus:{" "}
                    {
                      bsdasri?.transporter?.transport?.acceptation
                        ?.refusedWeight
                    }
                  </p>
                  <p>
                    Motif de refus:{" "}
                    {
                      bsdasri?.transporter?.transport?.acceptation
                        ?.refusalReason
                    }
                  </p>
                </>
              )}
            </p>
            <p>
              Date: {formatDate(bsdasri?.transporter?.transport?.takenOverAt)}
            </p>
            <hr />
            <p>
              <strong>Conditionnement / Quantité prise en charge </strong>
            </p>
            <PackagingInfosTable
              packagingInfos={bsdasri?.transporter?.transport?.packagings}
            />
            <p>
              <strong>
                Quantité prise en charge:{" "}
                {bsdasri?.transporter?.transport?.weight?.value} kg{" "}
              </strong>
            </p>
            <input
              type="checkbox"
              checked={
                bsdasri?.transporter?.transport?.weight?.isEstimate === false
              }
              readOnly
            />{" "}
            réelle <span> - </span>
            <input
              type="checkbox"
              checked={
                bsdasri?.transporter?.transport?.weight?.isEstimate === true
              }
              readOnly
            />{" "}
            Estimée
            <br />
            "QUANTITÉ ESTIMÉE CONFORMÉMENT AU 5.4.1.1.3.2" de l'ADR
          </div>
        </div>
        {/* End Transporter */}
        {/* Destination */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>3. Installation de destination</strong>
            </p>
            <FormCompanyFields
              company={bsdasri.destination?.company}
              cap={bsdasri.destination?.cap}
            />
          </div>
          <div className="BoxCol">
            <p>
              <strong>3.1 Déchets</strong>
            </p>
            <p>
              Lot accepté
              <br />
              <input
                type="checkbox"
                checked={
                  bsdasri?.destination?.reception?.acceptation?.status ===
                  "ACCEPTED"
                }
                readOnly
              />{" "}
              Oui
              <input
                type="checkbox"
                checked={
                  bsdasri?.destination?.reception?.acceptation?.status ===
                  "REFUSED"
                }
                readOnly
              />{" "}
              Non
              <span> </span>
              <input
                type="checkbox"
                checked={
                  bsdasri?.destination?.reception?.acceptation?.status ===
                  "PARTIALLY_REFUSED"
                }
                readOnly
              />{" "}
              Partiellement
              <br />
              {bsdasri?.destination?.reception?.acceptation?.status ===
                "PARTIALLY_REFUSED" && (
                <>
                  <p>
                    Quantité refusée de refus:{" "}
                    {
                      bsdasri?.destination?.reception?.acceptation
                        ?.refusedWeight
                    }
                  </p>
                  <p>
                    Motif de refus:{" "}
                    {
                      bsdasri?.destination?.reception?.acceptation
                        ?.refusalReason
                    }
                  </p>
                </>
              )}
              <p>Date: {formatDate(bsdasri?.destination?.reception?.date)}</p>
            </p>
            <hr />
            <p>
              <strong>Conditionnement / Quantité récéptionée </strong>
            </p>
            <PackagingInfosTable
              packagingInfos={bsdasri?.destination?.reception?.packagings}
            />
          </div>
        </div>
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              Je soussigné.e, certifie que l’opération indiquée ci- contre a
              bien été réalisée pour la quantité de déchets renseignée.
            </p>
            <p>Nom et Signature du responsable de l'exploitation :</p>
            <Signature signature={bsdasri?.destination?.operation?.signature} />
          </div>
          <div className="BoxCol">
            <p>
              <strong>3.2 Opération réalisée</strong>
            </p>
            <p>
              Date de l'opération:{" "}
              {formatDate(bsdasri?.destination?.operation?.date)}
            </p>
            <p>
              <input
                type="checkbox"
                checked={bsdasri?.destination?.operation?.code === "R12"}
                readOnly
              />{" "}
              Groupement avant R1 (R12) sur site relevant de la 2718
            </p>
            <p>
              <input
                type="checkbox"
                checked={bsdasri?.destination?.operation?.code === "R1"}
                readOnly
              />{" "}
              Incinération + valorisation énergétique (R1)
            </p>
            <p>
              <input
                type="checkbox"
                checked={bsdasri?.destination?.operation?.code === "D13"}
                readOnly
              />{" "}
              Groupement avant D9F ou D10 (D13) sur site relevant de la 2718
            </p>
            <p>
              <input
                type="checkbox"
                checked={bsdasri?.destination?.operation?.code === "D9F"}
                readOnly
              />{" "}
              Prétraitement par désinfection (D9F) - Banaliseur
            </p>
            <p>
              <input
                type="checkbox"
                checked={bsdasri?.destination?.operation?.code === "D10"}
                readOnly
              />{" "}
              Incinération (D10)
            </p>
            <p>
              Mode de traitement :{" "}
              {getOperationModeLabel(
                bsdasri?.destination?.operation?.mode as OperationMode
              )}
            </p>
            <p>
              <strong>Quantité traitée </strong> :{" "}
              {bsdasri?.destination?.operation?.weight?.value} Kg
            </p>
          </div>
        </div>
        {/* end Destination */}

        {/* Trader */}
        {bsdasri.trader && (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>4.{bsdasri.broker ? "1" : ""} Négociant</strong>
              </p>
              <div className="Row">
                <div className="Col">
                  <FormCompanyFields company={bsdasri.trader.company} />
                </div>
                <div className="Col">
                  <Recepisse recepisse={bsdasri.trader.recepisse} />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* End Trader */}
        {/* Broker */}
        {bsdasri.broker && (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>4.{bsdasri.trader ? "2" : ""} Courtier</strong>
              </p>
              <div className="Row">
                <div className="Col">
                  <FormCompanyFields company={bsdasri.broker.company} />
                </div>
                <div className="Col">
                  <Recepisse recepisse={bsdasri.broker.recepisse} />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* End Broker */}
      </div>

      {/* Intermediaries */}
      {bsdasri.intermediaries && bsdasri.intermediaries.length > 0 && (
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                {pluralize("Autre", intermediaryCount)}{" "}
                {pluralize("intermédiaire", intermediaryCount)}
              </strong>
            </p>
            {bsdasri.intermediaries.map(intermediary => (
              <div className="Row" key={intermediary.orgId}>
                <div className="Col">
                  <FormCompanyFields company={intermediary} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* End intermediaries */}

      {!!associatedBsdasris?.length && (
        <>
          <h1 className="TextAlignCenter">
            Traçabilité associée au BSD n° {bsdasri.id}
          </h1>
          <p>
            <strong className="TextUnderline">
              Cas lié au mouvement de contenant(s)
            </strong>
          </p>
          <p>
            <input
              type="checkbox"
              checked={bsdasri?.type === BsdasriType.GROUPING}
              readOnly
            />{" "}
            Groupement de DASRI sur un site relevant de la rubrique 2718
          </p>
          <p>
            <input
              type="checkbox"
              checked={bsdasri?.type === BsdasriType.SYNTHESIS}
              readOnly
            />{" "}
            Synthèse de bordereaux de DASRI simples, pris en charge par le
            collecteur et au statut "collecté"
          </p>
          <h3 className="TextAlignCenter">
            Bordereau(x) associé(s) constituant l’historique de la traçabilité
          </h3>
          <TraceabilityTable previousBsdasris={associatedBsdasris} />
        </>
      )}
    </Document>
  );
}

type SignatureProps = {
  signature: BsdasriSignature | null | undefined;
};
export function Signature({ signature }: SignatureProps) {
  return (
    <>
      <p>
        <span className="Row">
          <span className="Col">Nom : {signature?.author}</span>
          <span className="Col">Date : {formatDate(signature?.date)}</span>
        </span>
      </p>
      {signature?.date && <SignatureStamp />}
    </>
  );
}
