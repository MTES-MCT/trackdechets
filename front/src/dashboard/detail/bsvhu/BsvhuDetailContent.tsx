import {
  IconBSVhu,
  IconRenewableEnergyEarth,
  IconWarehouseDelivery,
  IconWaterDam
} from "../../../Apps/common/Components/Icons/Icons";
import { Bsvhu, FormCompany, OperationMode } from "@td/codegen-ui";
import React from "react";
import QRCodeIcon from "react-qr-code";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

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

const IDENTIFICATION_TYPES_LABELS = {
  NUMERO_ORDRE_REGISTRE_POLICE:
    "N° d'ordre tels qu'ils figurent dans le registre de police",
  NUMERO_ORDRE_LOTS_SORTANTS: "N° d'ordre des lots sortants"
};
const PACKAGING_LABELS = {
  UNITE: "En unités",
  LOT: "En lots"
};

export function BsvhuDetailContent({ form }: Props) {
  return (
    <div>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSVhu className="tw-mr-2" />
          <span className={styles.detailStatus}>
            [{form.isDraft ? "Brouillon" : VHU_VERBOSE_STATUSES[form.status]}]
          </span>
          {!form.isDraft && <span>{form.id}</span>}
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
        </div>
      </div>

      <Tabs selectedTabClassName={styles.detailTabSelected}>
        {/* Tabs menu */}
        <TabList className={styles.detailTabs}>
          <Tab className={styles.detailTab}>
            <IconWaterDam size="25px" />
            <span className={styles.detailTabCaption}>Producteur</span>
          </Tab>

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
        </TabList>
        {/* Tabs content */}
        <div className={styles.detailTabPanels}>
          {/* Emitter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <Emitter form={form} />
          </TabPanel>

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

function Emitter({ form }: { form: Bsvhu }) {
  const { emitter, quantity, packaging, identification, weight } = form;
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
          value={
            identification?.type
              ? IDENTIFICATION_TYPES_LABELS[identification.type]
              : null
          }
          label="Type d'identifiant"
        />
        <DetailRow
          value={identification?.numbers?.join(", ")}
          label="Identifications"
        />
        <DetailRow
          value={packaging ? PACKAGING_LABELS[packaging] : null}
          label="Conditionnement"
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
          value={
            identification?.type
              ? IDENTIFICATION_TYPES_LABELS[identification.type]
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
      </div>
      <div className={`${styles.detailGrid} `}>
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
              ? IDENTIFICATION_TYPES_LABELS[identification.type]
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
          label="Réception signée par"
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
