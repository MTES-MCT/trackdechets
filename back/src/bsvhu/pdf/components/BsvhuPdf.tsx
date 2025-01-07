import * as React from "react";
import {
  Document,
  formatDate,
  FormCompanyFields,
  SignatureStamp,
  TRANSPORT_MODE_LABELS
} from "../../../common/pdf";
import type { Bsvhu, OperationMode } from "@td/codegen-back";
import { getOperationModeLabel } from "../../../common/operationModes";
import { dateToXMonthAtHHMM } from "../../../common/helpers";
import { Recepisse } from "../../../common/pdf/components/Recepisse";

const UNITE_IDENTIFICATION_TYPES_LABELS = {
  NUMERO_ORDRE_REGISTRE_POLICE:
    "identification par n° d'ordre tels qu'ils figurent dans le registre de police",
  NUMERO_IMMATRICULATION: "identification par numéro d’immatriculation"
};

const getIdentificationTypeLabel = (bsvhu: Bsvhu) => {
  if (bsvhu?.identification?.type === "NUMERO_ORDRE_LOTS_SORTANTS") {
    //deprecated, kept for older bsvhus
    return "N° d'ordre des lots sortants";
  }
  if (bsvhu.packaging === "LOT") {
    return "En lots (identification par numéro de lot)";
  }
  return bsvhu?.identification?.type
    ? `En unités (${
        UNITE_IDENTIFICATION_TYPES_LABELS[bsvhu.identification.type]
      })`
    : "En unités";
};

const removeSpaces = (val: string | null | undefined): string => {
  if (!val) {
    return "";
  }
  return val.replace(/\s/g, "");
};

type Props = {
  bsvhu: Bsvhu;
  qrCode: string;
  renderEmpty?: boolean;
};

export function BsvhuPdf({ bsvhu, qrCode, renderEmpty }: Props) {
  return (
    <Document title={bsvhu.id}>
      <div className="Page">
        {/* 3-parts header */}
        <div className="BoxRow">
          <div className="BoxCol TextAlignCenter">
            <p className="mb-3">
              Arrêté du 2 mai 2012 relatif aux agréments des exploitants des
              centres VHU et aux agréments des exploitants des installations de
              broyage de véhicules hors d'usage
            </p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <h1>
              Bordereau de suivi de <br />
              Véhicules hors d'usage <br />
              (VHU)
            </h1>
          </div>
          <div className="BoxCol TextAlignCenter">
            <div
              className="QrCode"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            <div>
              <b>Document édité le {renderEmpty ? "" : dateToXMonthAtHHMM()}</b>
            </div>
          </div>
        </div>
        {/* end 3-parts header */}
        {/* VHU ID */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p className="mb-3">
              <strong>N° Bordereau :</strong> {bsvhu.id}{" "}
              {bsvhu?.customId ? <span>({bsvhu.customId})</span> : ""}
            </p>
          </div>
        </div>
        {/* End VHU ID */}
        {/* Emitter/recipient */}
        <div className="BoxRow">
          {/* Emitter */}
          <div className="BoxCol">
            <p className="mb-3">
              <strong>1. Émetteur du Bordereau</strong>
            </p>

            <div>
              {bsvhu?.emitter?.irregularSituation ? (
                <p className="mb-3">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    id="e_irregularSituation"
                  />{" "}
                  <label htmlFor="e_irregularSituation">
                    Installation en situation irrégulière
                  </label>
                </p>
              ) : null}
              <p className="mb-3">
                N° Agrément : {bsvhu?.emitter?.agrementNumber}
              </p>
              <p className="mb-3">
                N° SIRET : {bsvhu?.emitter?.company?.siret}
              </p>
              <p className="mb-3">
                NOM (Raison sociale) : {bsvhu?.emitter?.company?.name}
              </p>
              <p className="mb-3">
                Adresse : {bsvhu?.emitter?.company?.address}
              </p>
              <div className="Flex">
                <p className="mb-3">Tel : {bsvhu?.emitter?.company?.phone}</p>
                <p className="mb-3 ml-12">
                  Mail : {bsvhu?.emitter?.company?.mail}
                </p>
              </div>
            </div>
            <p className="mb-3">
              Nom de la personne à contacter : {bsvhu.emitter?.company?.contact}
            </p>
            {bsvhu?.ecoOrganisme?.siret && (
              <p>
                <strong>Eco-organisme désigné :</strong>{" "}
                <p>
                  Raison sociale : {bsvhu.ecoOrganisme?.name}
                  <br />
                  SIREN : {bsvhu.ecoOrganisme?.siret?.substring(0, 9)}
                </p>
              </p>
            )}
          </div>
          {/* End Emitter */}
          {/* Recipient */}
          <div className="BoxCol">
            <p className="mb-3">
              <strong>2. Installation de destination</strong>
            </p>
            <p className="mb-3">
              <input
                type="checkbox"
                checked={bsvhu?.destination?.type === "BROYEUR"}
                readOnly
                id="d_broyeur"
              />{" "}
              <label htmlFor="d_broyeur">Broyeur agréé</label>
              <input
                type="checkbox"
                checked={bsvhu?.destination?.type === "DEMOLISSEUR"}
                readOnly
                className="ml-12"
                id="d_demolisseur"
              />{" "}
              <label htmlFor="d_demolisseur">Démolisseur agréé</label>
            </p>
            <div>
              <p className="mb-3">
                N° Agrément : {bsvhu?.destination?.agrementNumber}
              </p>
              <p className="mb-3">
                N° SIRET : {bsvhu?.destination?.company?.siret}
              </p>
              <p className="mb-3">
                NOM (Raison sociale) : {bsvhu?.destination?.company?.name}
              </p>
              <p className="mb-3">
                Adresse : {bsvhu?.destination?.company?.address}
              </p>{" "}
              <div className="Flex">
                <p className="mb-3">
                  Tel : {bsvhu?.destination?.company?.phone}
                </p>
                <p className="mb-3 ml-12">
                  Mail : {bsvhu?.destination?.company?.mail}
                </p>
              </div>
            </div>
            <p className="mb-3">
              Nom de la personne à contacter :{" "}
              {bsvhu?.emitter?.company?.contact}
            </p>
          </div>
          {/* EndRecipient */}
        </div>
        {/* End Emitter/recipient */}
        {/* Waste */}
        <div className="BoxRow">
          <div className="BoxColOneThird">
            <p className="mb-3">
              <strong>3. Le VHU sont conditionnés</strong>
            </p>
            <div className="mb-3">
              <p>
                <input
                  type="checkbox"
                  id="unites"
                  name="emetteur"
                  readOnly
                  checked={bsvhu?.packaging === "UNITE"}
                />{" "}
                <label htmlFor="unites">Unités</label>
                <input
                  type="checkbox"
                  id="lots"
                  name="emetteur"
                  readOnly
                  checked={bsvhu?.packaging === "LOT"}
                  className="ml-12"
                />{" "}
                <label htmlFor="lots">Lots</label>
              </p>
            </div>
          </div>
          <div className="BoxCol">
            <p className="mb-3">
              <strong>4. Code déchet correspondant</strong>
            </p>
            <div>
              <input
                type="checkbox"
                id="16 01 06"
                name="emetteur"
                readOnly
                checked={removeSpaces(bsvhu?.wasteCode) === "160106"}
              />{" "}
              <label htmlFor="16 01 06">
                <strong>16 01 06</strong> (Véhicules hors d’usage ne contenant
                ni liquides ni autres composants dangereux)
              </label>
            </div>
            <div>
              <input
                type="checkbox"
                id="16 01 04*"
                name="emetteur"
                readOnly
                checked={removeSpaces(bsvhu?.wasteCode) === "160104*"}
              />{" "}
              <label htmlFor="16 01 04*">
                <strong>16 01 04*</strong> (Véhicules hors d’usage non dépollués
                par un centre agréé)
              </label>
            </div>
          </div>
        </div>
        {/* End Waste */}
        {/* Waste identification */}
        <div className="BoxRow">
          <div className="BoxColTwoThird">
            <p className="mb-3">
              <strong>5. Identification du ou des VHU</strong>
            </p>
            <p className="mb-3">
              <strong> {getIdentificationTypeLabel(bsvhu)}</strong> :{" "}
              {bsvhu?.identification?.numbers?.join(", ")}
            </p>

            <p className="mb-3">
              L’exploitant conserve la liste des véhicules concernés par lot, à
              disposition des autorités. Dans tous les cas le livre de police
              doit être renseigné avec le numéro du BSD, la destination et le
              cas échéant, le numéro du lot
            </p>
          </div>
          <div className="BoxCol">
            <div className="mb-3">
              <strong>6. Quantités</strong>
              <p className="mb-3">Nombre de VHU : {bsvhu?.quantity}</p>
              <p className="mb-3">
                En tonnes (le cas échéant) : {bsvhu?.weight?.value}{" "}
                {bsvhu?.weight?.isEstimate && "(Estimation)"}
              </p>
            </div>
          </div>
        </div>
        {/* End Waste identification*/}
        {/* Emitter signature*/}
        <div className="BoxRow">
          <div className="BoxCol">
            <p className="mb-3">
              <strong>
                7. Déclaration générale de l’émetteur du bordereau
              </strong>
            </p>
            <p className="mb-3">
              Je soussigné : {bsvhu?.emitter?.emission?.signature?.author}
            </p>
            <p className="mb-3">
              Certifie que les renseignements portés dans les cadres ci-dessus
              sont exacts et de bonne foi.
            </p>
            <p className="mb-3">
              Date :{formatDate(bsvhu?.emitter?.emission?.signature?.date)}
            </p>

            {!!bsvhu?.emitter?.emission?.signature?.author && (
              <SignatureStamp />
            )}
          </div>
          <div></div>
        </div>
        {/* End Emitter signature */}
        {/* Trader informations or broker information if no trader */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>
                8.{bsvhu.trader && bsvhu.broker ? "1" : ""}{" "}
                <input
                  type="checkbox"
                  checked={Boolean(bsvhu.trader)}
                  readOnly
                />{" "}
                Négociant{" "}
                <input
                  type="checkbox"
                  checked={!bsvhu.trader && Boolean(bsvhu.broker)}
                  readOnly
                />{" "}
                Courtier
              </strong>
            </p>
            <div className="Row">
              <div className="Col">
                <FormCompanyFields
                  company={
                    bsvhu.trader ? bsvhu.trader.company : bsvhu.broker?.company
                  }
                />
              </div>
              <div className="Col">
                <Recepisse
                  recepisse={{
                    ...(bsvhu.trader?.recepisse ??
                      bsvhu.broker?.recepisse ??
                      {})
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* End Broker/Trader informations */}
        {/* Broker information */}
        {bsvhu.broker ? (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>
                  8.{bsvhu.trader ? "2" : ""}{" "}
                  <input type="checkbox" checked={false} readOnly /> Négociant{" "}
                  <input type="checkbox" checked={true} readOnly /> Courtier
                </strong>
              </p>
              <div className="Row">
                <div className="Col">
                  <FormCompanyFields company={bsvhu.broker?.company} />
                </div>
                <div className="Col">
                  <Recepisse
                    recepisse={{
                      ...(bsvhu.broker?.recepisse ?? {})
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {/* End Broker informations */}
        {/* Transporter */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p className="mb-3">
              <strong>9. Transporteur</strong>
            </p>

            <div>
              {/* <p className="mb-3">N° Agrément : {bsvhu.transporter.agrementNumber}</p> */}
              <p className="mb-3">
                N° SIRET : {bsvhu?.transporter?.company?.siret}
              </p>
              <p className="mb-3">
                N° TVA intracommunautaire (le cas échéant) :{" "}
                {bsvhu?.transporter?.company?.vatNumber}
              </p>
              <p className="mb-3">
                NOM (Raison sociale) : {bsvhu?.transporter?.company?.name}
              </p>
              <p className="mb-3">
                Adresse : {bsvhu?.transporter?.company?.address}
              </p>
              <div className="Flex">
                <p className="mb-3">
                  Tel : {bsvhu?.transporter?.company?.phone}
                </p>
                <p className="mb-3 ml-12">
                  Mail : {bsvhu?.transporter?.company?.mail}
                </p>
              </div>
            </div>
            <p className="mb-3">
              Nom de la personne à contacter :{" "}
              {bsvhu?.transporter?.company?.contact}
            </p>
          </div>

          <div className="BoxCol">
            {bsvhu?.transporter?.recepisse?.isExempted ? (
              <p>
                Le transporteur déclare être exempté de récépissé conformément
                aux dispositions de l'article R.541-50 du code de
                l'environnement.
              </p>
            ) : (
              <Recepisse recepisse={bsvhu?.transporter?.recepisse} />
            )}

            <p className="mb-3">
              Mode de transport:{" "}
              {bsvhu?.transporter?.transport?.mode
                ? TRANSPORT_MODE_LABELS[bsvhu?.transporter?.transport?.mode]
                : ""}
            </p>
            <p className="mb-3">
              Immatriculation(s) :{" "}
              {bsvhu?.transporter?.transport?.plates?.join(", ")}
            </p>
            <p className="mb-3">
              Date de prise en charge :{" "}
              {formatDate(bsvhu?.transporter?.transport?.takenOverAt)}
            </p>
            <p className="mb-3">
              Je soussigné : {bsvhu?.transporter?.transport?.signature?.author}
            </p>
            <p className="mb-3">
              Certifie que les mentions dans le cadre 8 sont exactes et que
              l’opération indiquée ci-dessus a été réalisée.
            </p>
            {!!bsvhu?.transporter?.transport?.signature?.author && (
              <SignatureStamp />
            )}
          </div>
        </div>
        {/* End Transporter */}
        {/* Destination */}
        <div className="BoxRow">
          <div className="BoxCol">
            <p className="mb-3">
              <strong>10. Installation de destination</strong>
            </p>
            <p className="mb-3">
              <input
                type="checkbox"
                checked={bsvhu?.destination?.type === "BROYEUR"}
                readOnly
                id="d2_broyeur"
              />{" "}
              <label htmlFor="d2_broyeur">Broyeur agréé</label>
              <input
                type="checkbox"
                checked={bsvhu?.destination?.type === "DEMOLISSEUR"}
                readOnly
                className="ml-12"
                id="d2_demolisseur"
              />{" "}
              <label htmlFor="d2_demolisseur">Démolisseur agréé</label>
            </p>
            <div>
              <p className="mb-3">
                N° Agrément : {bsvhu?.destination?.agrementNumber}
              </p>
              <p className="mb-3">
                N° SIRET : {bsvhu?.destination?.company?.siret}
              </p>
              <p className="mb-3">
                NOM (Raison sociale) : {bsvhu?.destination?.company?.name}
              </p>
              <p className="mb-3">
                Adresse : {bsvhu?.destination?.company?.address}
              </p>
              <div className="Flex">
                <p className="mb-3">
                  Tel : {bsvhu.destination?.company?.phone}
                </p>
                <p className="mb-3 ml-12">
                  Mail : {bsvhu.destination?.company?.mail}
                </p>
              </div>
            </div>
            <p className="mb-3">
              Lot accepté :
              <input
                type="checkbox"
                id="oui"
                name="destination"
                readOnly
                className="ml-12"
                checked={
                  bsvhu?.destination?.reception?.acceptationStatus ===
                  "ACCEPTED"
                }
              />{" "}
              <label htmlFor="oui">Oui</label>
              <input
                type="checkbox"
                id="non"
                name="destination"
                readOnly
                className="ml-12"
                checked={
                  bsvhu?.destination?.reception?.acceptationStatus === "REFUSED"
                }
              />{" "}
              <label htmlFor="non">Non</label>
              <input
                type="checkbox"
                id="partiellement"
                name="destination"
                readOnly
                className="ml-12"
                checked={
                  bsvhu?.destination?.reception?.acceptationStatus ===
                  "PARTIALLY_REFUSED"
                }
              />{" "}
              <label htmlFor="partiellement">Partiellement</label>
            </p>
            <p>
              Motif de refus : {bsvhu?.destination?.reception?.refusalReason}
            </p>
            <p>
              Quantité (en tonnes) : {bsvhu?.destination?.reception?.weight}
            </p>
            <p className="mb-3">
              N° du ou des lots entrant-s (*) :{" "}
              {bsvhu?.identification?.numbers?.join(", ")}
            </p>
          </div>
          <div className="BoxCol">
            <strong>11. Réalisation de l’opération</strong>

            <div>
              <input
                type="checkbox"
                id="R4"
                name="destination"
                readOnly
                checked={
                  removeSpaces(bsvhu?.destination?.operation?.code) === "R4"
                }
              />{" "}
              <label htmlFor="R4">
                R 4–
                <span>
                  Recyclage ou récupération des métaux et des composés
                  métalliques.
                </span>
              </label>
            </div>
            <div>
              <input
                type="checkbox"
                id="R12"
                name="destination"
                readOnly
                checked={
                  removeSpaces(bsvhu?.destination?.operation?.code) === "R12"
                }
              />{" "}
              <label htmlFor="R12">
                R12 –
                <span>
                  Regroupement préalable à R4 dans un centre VHU agréé
                </span>
              </label>
            </div>
            <br />
            <p>
              Mode de traitement :{" "}
              {getOperationModeLabel(
                bsvhu?.destination?.operation?.mode as OperationMode
              )}
            </p>
            <p>
              Date de réalisation:{" "}
              {formatDate(bsvhu?.destination?.operation?.date)}
            </p>

            <p className="mb-3">
              Je soussigné : {bsvhu?.destination?.operation?.signature?.author}
            </p>
            <p className="mb-3">
              Certifie que les mentions dans les cadres 9 et 10 sont exactes et
              que l’opération indiquée ci-dessus a été réalisée.
            </p>
            {!!bsvhu?.destination?.operation?.signature?.author && (
              <SignatureStamp />
            )}
          </div>
        </div>
        <p className="mb-3">
          (*) les VHU doivent être intégrés au livre de police de l’installation
          de destination (si démolisseur)
        </p>
        <p className="TextAlignCenter">
          <strong>
            Ce Bordereau doit accompagner tout transport de véhicules hors
            d’usage
          </strong>
        </p>
      </div>
    </Document>
  );
}
