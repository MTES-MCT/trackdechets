import {
  IconBSVhu,
  IconRenewableEnergyEarth,
  IconWarehouseDelivery,
  IconWarehousePackage,
  IconWaterDam
} from "../../../Apps/common/Components/Icons/Icons";
import { Bsvhu, FormCompany, OperationMode } from "@td/codegen-ui";
import React from "react";
import QRCodeIcon from "react-qr-code";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { getTransportModeLabel } from "../../constants";

import {
  DateRow,
  DetailRow,
  TransporterReceiptDetails
} from "../common/Components";

import styles from "../common/BSDDetailContent.module.scss";
import { getVerboseAcceptationStatus } from "../common/utils";
import { getOperationModeLabel } from "../../../Apps/common/operationModes";
import { VHU_VERBOSE_STATUSES } from "@td/constants";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
  isIrregularSituation?: boolean;
};

type Props = { form: Bsvhu };

const PACKAGING_LABELS = {
  UNITE: "En unités",
  LOT: "En lots"
};

export function BsvhuDetailContent({ form }: Props) {
  const Trader = ({ trader }) => (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <dt>Négociant</dt>
        <dd>{trader.company?.name}</dd>

        <dt>Siret</dt>
        <dd>{trader.company?.siret}</dd>

        <dt>Adresse</dt>
        <dd>{trader.company?.address}</dd>

        <dt>Tél</dt>
        <dd>{trader.company?.phone}</dd>

        <dt>Mél</dt>
        <dd>{trader.company?.mail}</dd>

        <dt>Contact</dt>
        <dd>{trader.company?.contact}</dd>
      </div>
      <div className={styles.detailGrid}>
        <DetailRow value={trader.receipt} label="Récépissé" />
        <DetailRow value={trader.department} label="Départment" />
        <DateRow value={trader.validityLimit} label="Date de validité" />
      </div>
    </div>
  );
  const Broker = ({ broker }) => (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <dt>Courtier</dt>
        <dd>{broker.company?.name}</dd>

        <dt>Siret</dt>
        <dd>{broker.company?.siret}</dd>

        <dt>Adresse</dt>
        <dd>{broker.company?.address}</dd>

        <dt>Tél</dt>
        <dd>{broker.company?.phone}</dd>

        <dt>Mél</dt>
        <dd>{broker.company?.mail}</dd>

        <dt>Contact</dt>
        <dd>{broker.company?.contact}</dd>
      </div>
      <div className={styles.detailGrid}>
        <DetailRow value={broker.receipt} label="Récépissé" />
        <DetailRow value={broker.department} label="Départment" />
        <DateRow value={broker.validityLimit} label="Date de validité" />
      </div>
    </div>
  );

  const Intermediary = ({ intermediary }) => (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <dt>Établissement intermédiaire</dt>
        <dd>{intermediary?.name}</dd>

        <dt>Siret</dt>
        <dd>{intermediary?.siret}</dd>

        <dt>Numéro de TVA</dt>
        <dd>{intermediary?.vatNumber}</dd>

        <dt>Adresse</dt>
        <dd>{intermediary?.address}</dd>

        <dt>Tél</dt>
        <dd>{intermediary?.phone}</dd>

        <dt>Mél</dt>
        <dd>{intermediary?.mail}</dd>

        <dt>Contact</dt>
        <dd>{intermediary?.contact}</dd>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSVhu className="tw-mr-2" />
          <span className={styles.detailStatus}>
            [{form.isDraft ? "Brouillon" : VHU_VERBOSE_STATUSES[form.status]}]
          </span>
          {!form.isDraft && <span>{form.id}</span>}

          {!!form.customId && (
            <span className="fr-ml-auto">Numéro libre: {form.customId}</span>
          )}
        </h4>

        <div className={styles.detailContent}>
          <div className={`${styles.detailQRCodeIcon}`}>
            {!form.isDraft && (
              <div className={styles.detailQRCode}>
                <QRCodeIcon value={form.id} size={96} />
                <span>Ce QR code contient le numéro du bordereau </span>
              </div>
            )}
          </div>
          <div className={styles.detailGrid}>
            <DateRow
              value={form.updatedAt}
              label="Dernière action sur le BSD"
            />
            <DetailRow value={form.quantity} label="Quantité" />
            <dt>Code déchet</dt>
            <dd>{form.wasteCode}</dd>
          </div>

          {form?.ecoOrganisme && (
            <div className={styles.detailGrid}>
              <dt>EcoOrganisme ou système individuel</dt>
              <dd>{form.ecoOrganisme?.name}</dd>

              <dt>Siret</dt>
              <dd>{form.ecoOrganisme?.siret}</dd>
            </div>
          )}
        </div>
      </div>

      <Tabs selectedTabClassName={styles.detailTabSelected}>
        {/* Tabs menu */}
        <TabList className={styles.detailTabs}>
          <Tab className={styles.detailTab}>
            <IconWaterDam size="25px" />
            <span className={styles.detailTabCaption}>Producteur</span>
          </Tab>
          {!!form?.trader?.company?.name && (
            <Tab className={styles.detailTab}>
              <IconWarehousePackage size="25px" />
              <span className={styles.detailTabCaption}>Négociant</span>
            </Tab>
          )}
          {!!form?.broker?.company?.name && (
            <Tab className={styles.detailTab}>
              <IconWarehousePackage size="25px" />
              <span className={styles.detailTabCaption}>Courtier</span>
            </Tab>
          )}
          <Tab className={styles.detailTab}>
            <IconWarehouseDelivery size="25px" />
            <span className={styles.detailTabCaption}>
              <span> Transporteur</span>
            </span>
          </Tab>

          <Tab className={styles.detailTab}>
            <IconRenewableEnergyEarth size="25px" />
            <span className={styles.detailTabCaption}>Destinataire</span>
          </Tab>

          {!!form?.intermediaries?.length && (
            <Tab className={styles.detailTab}>
              <IconWarehousePackage size="25px" />
              <span className={styles.detailTabCaption}>
                Intermédiaire
                {form?.intermediaries?.length > 1 ? "s" : ""}
              </span>
            </Tab>
          )}
        </TabList>
        {/* Tabs content */}
        <div className={styles.detailTabPanels}>
          {/* Emitter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <Emitter form={form} />
          </TabPanel>

          {/* Trader tab panel */}
          {!!form?.trader?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <Trader trader={form.trader} />
            </TabPanel>
          )}

          {/* Broker tab panel */}
          {!!form?.broker?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <Broker broker={form.broker} />
            </TabPanel>
          )}

          {/* Transporter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <Transporter form={form} />
          </TabPanel>

          {/* Recipient  tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailColumns}>
              <Destination form={form} />
            </div>
          </TabPanel>

          {/* Intermediaries tab panel */}
          {Boolean(form?.intermediaries?.length) && (
            <TabPanel className={styles.detailTabPanel}>
              {form?.intermediaries?.map(intermediary => (
                <Intermediary intermediary={intermediary} />
              ))}
            </TabPanel>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function Company({ company, label, isIrregularSituation }: CompanyProps) {
  return (
    <>
      {isIrregularSituation && (
        <>
          <dt></dt>
          <dd>Installation en situation irrégulière</dd>
        </>
      )}
      <DetailRow label={label} value={company?.name} />
      <DetailRow label="Siret" value={company?.siret} />
      <DetailRow label="Numéro de TVA" value={company?.vatNumber} />
      <DetailRow label="Adresse" value={company?.address} />
      <DetailRow label="Tél" value={company?.phone} />
      <dt>Mél</dt>
      <dd data-testid="mel" style={{ width: "110px" }}>
        {company?.mail}
      </dd>
      <DetailRow label="Contact" value={company?.contact} />
    </>
  );
}

const UNITE_IDENTIFICATION_TYPES_LABELS = {
  NUMERO_ORDRE_REGISTRE_POLICE:
    "identification par n° d'ordre tels qu'ils figurent dans le registre de police",
  NUMERO_IMMATRICULATION: "identification par numéro d’immatriculation",
  NUMERO_FICHE_DROMCOM: "Identification par numéro de fiche VHU DROMCOM",
  NUMERO_ORDRE_LOTS_SORTANTS:
    "identification par numéro d'ordre des lots sortants"
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

function Emitter({ form }: { form: Bsvhu }) {
  const { emitter, quantity, identification, weight } = form;
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <Company
          label="Émetteur"
          company={emitter?.company}
          isIrregularSituation={emitter?.irregularSituation}
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={getIdentificationTypeLabel(form)}
          label="Critères d'identification"
        />
        <DetailRow
          value={identification?.numbers?.join(", ")}
          label="Identifications"
        />
        <DetailRow value={quantity} label="Quantité" />
        <DetailRow value={weight?.value} label="Poids" units="tonnes" />
      </div>
      <div className={styles.detailGrid}>
        <DateRow value={emitter?.emission?.signature?.date} label="Signé le" />
        <DetailRow
          value={emitter?.emission?.signature?.author}
          label="Signé par"
        />
      </div>
    </div>
  );
}

function Transporter({ form }: { form: Bsvhu }) {
  const { transporter, identification, packaging, quantity, weight } = form;
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Transporteur" company={transporter?.company} />
      </div>
      <TransporterReceiptDetails transporter={transporter} />
      <div className={styles.detailGrid}>
        <DetailRow
          value={getTransportModeLabel(transporter?.transport?.mode)}
          label="Mode de transport"
        />
        <DetailRow
          value={
            transporter?.transport?.plates
              ? transporter.transport.plates.join(", ")
              : null
          }
          label="Immatriculations"
        />

        <DetailRow
          value={identification?.numbers?.join(", ")}
          label="Numéros"
        />
        <DetailRow
          value={packaging ? PACKAGING_LABELS[packaging] : null}
          label="Conditionnement"
        />

        <DetailRow value={quantity} label="Quantité" />
        <DetailRow value={weight?.value} label="Poids" units="tonnes" />
      </div>
      <div className={styles.detailGrid}>
        <DateRow
          value={transporter?.transport?.takenOverAt}
          label="Emporté le"
        />

        <DateRow
          value={transporter?.transport?.signature?.date}
          label="Signé le"
        />
        <DetailRow
          value={transporter?.transport?.signature?.author}
          label="Signé par"
        />
      </div>
    </>
  );
}

function Destination({ form }: { form: Bsvhu }) {
  const { destination, quantity, identification, packaging, weight } = form;

  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={destination?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={
            identification?.type
              ? UNITE_IDENTIFICATION_TYPES_LABELS[identification.type]
              : null
          }
          label="Type d'identifiant"
        />
        <DetailRow
          value={identification?.numbers?.join(", ")}
          label="Numéros"
        />
        <DetailRow
          value={packaging ? PACKAGING_LABELS[packaging] : null}
          label="Conditionnement"
        />

        <DetailRow value={quantity} label="Quantité" />
        <DetailRow value={weight?.value} label="Poids" units="tonnes" />
        <DetailRow value={destination?.agrementNumber} label="Agrément" />
        <DetailRow
          value={destination?.plannedOperationCode}
          label="Opération prévue"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={getVerboseAcceptationStatus(
            destination?.reception?.acceptationStatus
          )}
          label="Lot accepté"
        />
        <DetailRow
          value={destination?.reception?.refusalReason}
          label="Motif de refus"
        />
        <DetailRow
          value={destination?.reception?.quantity}
          label="Quantité réelle reçue"
        />
        <DetailRow
          value={destination?.reception?.weight}
          label="Poids réel reçu"
          units="tonnes"
        />
        <DateRow
          value={destination?.reception?.date}
          label="Réception signée le"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={destination?.operation?.code}
          label="Opération de traitement"
        />
        <DetailRow
          value={getOperationModeLabel(
            destination?.operation?.mode as OperationMode
          )}
          label={"Mode de traitement"}
        />
        <DateRow
          value={destination?.operation?.date}
          label="Traitement effectué le"
        />

        <DetailRow
          value={destination?.operation?.signature?.author}
          label="Traitement signé par"
        />
        <DateRow
          value={destination?.operation?.signature?.date}
          label="Traitement signé le"
        />
      </div>
    </>
  );
}
