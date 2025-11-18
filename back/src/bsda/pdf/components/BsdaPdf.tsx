import * as React from "react";
import { Document, formatDate, FormCompanyFields } from "../../../common/pdf";
import type { Bsda } from "@td/codegen-back";
import { PickupSite } from "./PickupSite";
import { TraceabilityTable } from "./TraceabilityTable";
import { WasteDescription } from "./WasteDescription";
import { WasteDetails } from "./WasteDetails";
import { BsdaStatus, OperationMode } from "@td/prisma";
import { CancelationStamp } from "../../../common/pdf/components/CancelationStamp";
import { getOperationModeLabel } from "../../../common/operationModes";
import { dateToXMonthAtHHMM, isDefined } from "../../../common/helpers";
import { Signature } from "../../../bspaoh/pdf/components/Signature";
import {
  CompanyContact,
  CompanyDescription
} from "../../../common/pdf/components/Company";
import Transporter from "../../../common/pdf/components/Transporter";
import { getBsdaWasteADRMention, pluralize } from "@td/constants";
import PackagingsTable from "../../../common/pdf/components/PackagingsTable";
import { bsdaWasteQuantities } from "../../utils";
import { displayWasteQuantity } from "../../../common/pdf/utils";

type Props = {
  bsda: Bsda;
  qrCode: string;
  previousBsdas: Bsda[];
  renderEmpty?: boolean;
};

export function BsdaPdf({
  bsda,
  qrCode,
  previousBsdas,
  renderEmpty = false
}: Props) {
  const intermediaryCount = bsda?.intermediaries?.length ?? 0;

  const wasteQuantities = bsdaWasteQuantities({
    destinationReceptionAcceptationStatus:
      bsda.destination?.reception?.acceptationStatus,
    destinationReceptionRefusedWeight:
      bsda.destination?.reception?.refusedWeight,
    destinationReceptionWeight: bsda.destination?.reception?.weight
  });

  return (
    <Document title={bsda.id}>
      <div className="Page">
        <div className="BoxRow">
          <div className="BoxCol TextAlignCenter">
            <p>Art. R. 541-45 du code de l’environnement.</p>
            <p>Arrêté du 29 juillet 2005</p>
          </div>
          <div className="BoxCol TextAlignCenter">
            <p>Ministère de la Transition Ecologique</p>
            <h1>
              Bordereau de suivi de déchets dangereux contenant de l’amiante
            </h1>
            <p>Récépissé Trackdéchets</p>
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

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              J'émets un BSDA pour :{" "}
              <input
                type="checkbox"
                checked={bsda.type === "OTHER_COLLECTIONS"}
                readOnly
              />{" "}
              la collecte d'amiante sur un chantier{" "}
              <input
                type="checkbox"
                checked={bsda.type === "COLLECTION_2710"}
                readOnly
              />{" "}
              la collecte en déchèterie relevant de la rubrique 2710-1{" "}
              <input
                type="checkbox"
                checked={bsda.type === "GATHERING"}
                readOnly
              />{" "}
              le groupement de déchets en transit sur un site relevant de la
              rubrique 2718 (ou 2710-1){" "}
              <input
                type="checkbox"
                checked={bsda.type === "RESHIPMENT"}
                readOnly
              />{" "}
              la réexpédition après entreposage provisoire
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>N° Bordereau :</strong> {bsda.id}
              {bsda.status === BsdaStatus.CANCELED && <CancelationStamp />}
            </p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>1. Producteur ou détenteur du déchet</strong>
            </p>
            <p>
              <input
                type="checkbox"
                checked={Boolean(bsda?.emitter?.isPrivateIndividual)}
                readOnly
              />{" "}
              Le MO ou le détenteur est un particulier
            </p>
            <CompanyDescription company={bsda?.emitter?.company} />
          </div>

          <div className="BoxCol">
            <CompanyContact company={bsda?.emitter?.company} />
            <PickupSite pickupSite={bsda?.emitter?.pickupSite} />

            {bsda?.ecoOrganisme?.siret && (
              <p>
                <strong>Eco-organisme désigné :</strong>{" "}
                {bsda.ecoOrganisme?.name} ({bsda.ecoOrganisme.siret})
              </p>
            )}
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>2. Déchets</strong>
            </p>
            <WasteDescription waste={bsda?.waste} />
          </div>

          <div className="BoxCol">
            <p>
              <strong>1.1 Signature</strong>
            </p>
            <Signature signature={bsda?.emitter?.emission?.signature} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <WasteDetails
              waste={bsda?.waste}
              packagings={bsda?.packagings}
              weight={bsda?.weight}
            />
            <p>
              Mention au titre du règlement ADR (le cas échéant) :{" "}
              {getBsdaWasteADRMention(bsda?.waste)}
            </p>
            <p>
              Mentions au titre des règlements RID, ADNR, IMDG (le cas échéant)
              : {bsda?.waste?.nonRoadRegulationMention}
            </p>
          </div>
          <div className="BoxCol">
            <PackagingsTable packagings={bsda?.packagings ?? []} />
          </div>
          <div className="BoxCol">
            <p>
              <strong>2.2 Numéros de scellés :</strong>
            </p>
            <p>{bsda?.waste?.sealNumbers?.join(", ")}</p>
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>3. Courtier</strong>
            </p>
            <CompanyDescription company={bsda?.broker?.company} />
          </div>
        </div>

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>4. Installation de destination</strong>
            </p>
            <CompanyDescription company={bsda?.destination?.company} />
          </div>
          <div className="BoxCol">
            <CompanyContact company={bsda?.destination?.company} />
            <br />
            N° CAP : {bsda?.destination?.cap}
            <br />
            Code D/R prévu : {bsda?.destination?.plannedOperationCode}
          </div>
        </div>

        {bsda?.destination?.operation?.nextDestination?.company?.siret ? (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>4.1 Installation de destination finale</strong>
              </p>
              <p>
                SIRET :{" "}
                {bsda?.destination?.operation?.nextDestination?.company?.siret}
                {" / "}
                Nom (raison sociale) :{" "}
                {bsda?.destination?.operation?.nextDestination?.company?.name}
                {" / "}
                Code prévu :{" "}
                {
                  bsda?.destination?.operation?.nextDestination
                    ?.plannedOperationCode
                }
                {" / "}
                CAP : {bsda?.destination?.operation?.nextDestination?.cap}
              </p>
            </div>
          </div>
        ) : (
          ""
        )}

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>5. Entreprise de travaux</strong>
            </p>
            <CompanyDescription company={bsda?.worker?.company} />
            <CompanyContact company={bsda?.worker?.company} />
          </div>
          <div className="BoxCol">
            {bsda.worker?.certification && (
              <>
                <strong>Certifications</strong>
                <p>
                  <input
                    type="checkbox"
                    checked={bsda?.worker?.certification?.hasSubSectionFour}
                    readOnly
                  />{" "}
                  Travaux relevant de la sous-section 4
                </p>
                <p>
                  <input
                    type="checkbox"
                    checked={bsda?.worker?.certification?.hasSubSectionThree}
                    readOnly
                  />{" "}
                  Travaux relevant de la sous-section 3
                </p>
                {bsda?.worker?.certification?.hasSubSectionThree && (
                  <>
                    <p>
                      Numéro de certification :{" "}
                      {bsda.worker.certification.certificationNumber}
                    </p>
                    <p>
                      Limite de validité :{" "}
                      {formatDate(bsda.worker.certification.validityLimit)}
                    </p>
                    <p>Organisme : {bsda.worker.certification.organisation}</p>
                  </>
                )}
              </>
            )}
            <p>
              <strong>5.1 Version papier</strong>
              <p>
                <input
                  type="checkbox"
                  checked={Boolean(
                    bsda?.worker?.work?.hasEmitterPaperSignature
                  )}
                  readOnly
                />{" "}
                je certifie disposer d’une version papier, signée du MOA et de
                moi-même, que je dois conserver 5 ans (copie MOA)
              </p>
            </p>
          </div>
          <div className="BoxCol">
            <p>
              <strong>5.2 Signature</strong>
              <Signature signature={bsda?.worker?.work?.signature} />
            </p>
          </div>
        </div>

        {bsda.intermediaries && bsda.intermediaries.length > 0 && (
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>
                  {pluralize("Autre", intermediaryCount)}{" "}
                  {pluralize("intermédiaire", intermediaryCount)}
                </strong>
              </p>
              {bsda.intermediaries.map(intermediary => (
                <div className="Row">
                  <div className="Col">
                    <FormCompanyFields company={intermediary} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bsda?.transporter && (
          <Transporter transporter={bsda.transporter} frameNumber={6} />
        )}

        <div className="BoxRow">
          <div className="BoxCol">
            <p>
              <strong>7. Installation de destination</strong>
            </p>
            <p>
              Date de présentation et d’acceptation sur site :{" "}
              {formatDate(bsda?.destination?.reception?.date)}
              <br />
              Lot accepté :{" "}
              <input
                type="checkbox"
                checked={
                  bsda?.destination?.reception?.acceptationStatus === "ACCEPTED"
                }
                readOnly
              />{" "}
              oui{" "}
              <input
                type="checkbox"
                checked={
                  bsda?.destination?.reception?.acceptationStatus === "REFUSED"
                }
                readOnly
              />{" "}
              non{" "}
              <input
                type="checkbox"
                checked={
                  bsda?.destination?.reception?.acceptationStatus ===
                  "PARTIALLY_REFUSED"
                }
                readOnly
              />{" "}
              partiellement
              <br />
              Type de quantité :{" "}
              <input
                type="checkbox"
                checked={!bsda?.destination?.reception?.weightIsEstimate}
                readOnly
              />{" "}
              Réelle{" "}
              <input
                type="checkbox"
                checked={Boolean(
                  bsda?.destination?.reception?.weightIsEstimate
                )}
                readOnly
              />{" "}
              Estimée
              <br />
              Quantité présentée nette :{" "}
              {isDefined(bsda?.destination?.reception?.weight)
                ? `${bsda?.destination?.reception?.weight} tonne(s)`
                : ""}
              <br />
              Quantité acceptée nette :{" "}
              {displayWasteQuantity(wasteQuantities?.quantityAccepted)}
              <br />
              Quantité refusée nette :{" "}
              {displayWasteQuantity(wasteQuantities?.quantityRefused)}
              <br />
              Motif de refus (le cas échéant) :{" "}
              {bsda?.destination?.reception?.refusalReason}
            </p>
          </div>
          <div className="BoxCol">
            <p>
              <strong>8. Réalisation de l'opération</strong>
              <p>
                Code de traitement : {bsda?.destination?.operation?.code}
                <br />
                Mode de traitement :{" "}
                {getOperationModeLabel(
                  bsda?.destination?.operation?.mode as OperationMode
                )}
                <br />
                Date de réalisation :{" "}
                {formatDate(bsda?.destination?.operation?.date)}
              </p>
              <Signature signature={bsda?.destination?.operation?.signature} />
            </p>
          </div>
        </div>
      </div>
      {bsda?.transporters?.length > 1 && (
        <div className="Page">
          <div className="BoxRow">
            <div className="BoxCol">
              <p>
                <strong>A REMPLIR EN CAS DE TRANSPORT MULTIMODAL</strong>
              </p>
            </div>
          </div>
          {bsda.transporters
            .filter((_, idx) => idx > 0)
            .map((t, idx) => (
              <Transporter transporter={t} key={t.id} frameNumber={9 + idx} />
            ))}
        </div>
      )}
      {previousBsdas?.length > 0 ? (
        <div className="Page">
          <h3 className="TextAlignCenter">
            Traçabilité associée au BSD n° {bsda?.id}
          </h3>
          <p>
            Cas lié au mouvement de contenant(s) :
            <br />
            <input
              type="checkbox"
              checked={bsda.type === "GATHERING"}
              readOnly
            />{" "}
            groupement de déchets (synthèse des bsda liés)
            {"  "}
            <input
              type="checkbox"
              checked={bsda.type === "RESHIPMENT"}
              readOnly
            />{" "}
            entreposage provisoire (réexpédition, avec maintien de traçabilité)
          </p>
          <p>
            <strong>Code déchet : {bsda?.waste?.code}</strong>
            <strong>Nom du matériau : {bsda?.waste?.materialName}</strong>
          </p>
          <p className="TextAlignCenter">
            <strong>
              Bordereau(x) associé(s) constituant l’historique de la traçabilité
            </strong>
          </p>
          <TraceabilityTable previousBsdas={previousBsdas} />
        </div>
      ) : (
        ""
      )}
    </Document>
  );
}
