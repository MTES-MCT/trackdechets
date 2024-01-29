import React from "react";
import { useBspaohDuplicate } from "../../components/BSDList/BSPaoh/BSPaohActions/useDuplicate";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { getTransportModeLabel } from "../../constants";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  Bspaoh,
  FormCompany,
  BspaohPackaging,
  BspaohConsistence,
  BspaohPackagingAcceptationStatus
} from "@td/codegen-ui";
import routes from "../../../Apps/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../common/components";
import {
  IconWarehouseDelivery,
  IconWaterDam,
  IconRenewableEnergyEarth,
  IconBSPaohThin,
  IconDuplicateFile
} from "../../../Apps/common/Components/Icons/Icons";
import { getVerboseAcceptationStatus } from "../common/utils";
import QRCodeIcon from "react-qr-code";

import styles from "../common/BSDDetailContent.module.scss";

import { getVerboseWeightType } from "../common/utils";
import {
  DateRow,
  DetailRow,
  TransporterReceiptDetails
} from "../common/Components";

import classNames from "classnames";

import { BSPAOH_VERBOSE_STATUSES } from "@td/constants";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};
const Company = ({ company, label }: CompanyProps) => (
  <>
    <dt>{label}</dt> <dd>{company?.name}</dd>
    <dt>Siret</dt> <dd>{company?.siret}</dd>
    <dt>Numéro de TVA</dt> <dd>{company?.vatNumber}</dd>
    <dt>Adresse</dt> <dd>{company?.address}</dd>
    <dt>Tél</dt> <dd>{company?.phone}</dd>
    <dt>Mél</dt> <dd>{company?.mail}</dd>
    <dt>Contact</dt> <dd>{company?.contact}</dd>
  </>
);

type BspaohDetailContentProps = {
  form: Bspaoh;
  children?: React.ReactNode;
  refetch?: () => void;
};

const Emitter = ({ form }: { form: Bspaoh }) => {
  const { emitter } = form;

  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <Company label="Émetteur" company={emitter?.company} />
        <DetailRow value={emitter?.pickupSite?.name} label="Adresse collecte" />
        <DetailRow value={emitter?.pickupSite?.infos} label="Informations" />
        {!!emitter?.pickupSite?.address && (
          <>
            <dt>Adresse</dt>
            <dd>
              {emitter?.pickupSite?.address} {emitter?.pickupSite?.postalCode}{" "}
              {emitter?.pickupSite?.city}
            </dd>
          </>
        )}
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={emitter?.emission?.detail?.weight?.value}
          label="Poids"
          units="kg"
        />
        <DetailRow
          value={getVerboseWeightType(
            emitter?.emission?.detail?.weight?.isEstimate
          )}
          label="Poids"
        />
        <DetailRow
          value={emitter?.emission?.detail?.quantity}
          label="Quantité"
        />
      </div>
      <div className={styles.detailGrid}>
        <DateRow value={emitter?.emission?.signature?.date} label="Signé le" />
        <DetailRow
          value={emitter?.emission?.signature?.author}
          label="Signé par"
        />
        <DetailRow value={emitter?.customInfo} label="Informations" />
      </div>
    </div>
  );
};
const Transporter = ({ form }: { form: Bspaoh }) => {
  const { transporter } = form;
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
          label="Immatriculation"
        />
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
        <DetailRow
          value={transporter?.customInfo}
          label="Informations tranporteur"
        />
      </div>
    </>
  );
};

const Recipient = ({ form }: { form: Bspaoh }) => {
  const { destination } = form;

  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={destination?.company} />
        <DetailRow value={destination?.cap} label="CAP" />
      </div>

      <div className={styles.detailGrid}>
        <DetailRow
          value={getVerboseAcceptationStatus(
            destination?.reception?.acceptation?.status
          )}
          label="Lot accepté"
        />
        <DetailRow
          value={destination?.reception?.acceptation?.refusalReason}
          label="Motif de refus"
        />

        <DetailRow
          value={destination?.reception?.signature?.author}
          label="Réception signée par"
        />
        <DateRow
          value={destination?.reception?.signature?.date}
          label="Réception signée le"
        />
        <DetailRow
          value={destination?.reception?.detail?.weight?.value}
          label="Poids"
          units="kg"
        />
        <DetailRow
          value={getVerboseWeightType(
            destination?.reception?.detail?.weight?.isEstimate
          )}
          label="Poids"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={destination?.operation?.code}
          label="Opération de traitement"
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
        <DetailRow
          value={destination?.customInfo}
          label="Informations destinataire"
        />
      </div>
    </>
  );
};

export default function BspaohDetailContent({
  form
}: BspaohDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();

  const [duplicate] = useBspaohDuplicate({
    variables: { id: form.id },
    onCompleted: () => {
      navigate(
        generatePath(routes.dashboard.bsds.drafts, {
          siret
        })
      );
    }
  });

  return (
    <div className={styles.detail}>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSPaohThin className="tw-mr-2" />

          <span className={styles.detailStatus}>
            [
            {form.isDraft
              ? "Brouillon"
              : BSPAOH_VERBOSE_STATUSES[form["bspaohStatus"]]}
            ]
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
            <dt>Code déchet</dt>
            <dd>{form.waste?.code}</dd>
            <dt>Type déchet</dt>
            <dd>{form.waste?.type}</dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Code onu</dt>
            <dd>{form?.waste?.adr}</dd>
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
            <span className={styles.detailTabCaption}>Crématorium</span>
          </Tab>

          <Tab className={styles.detailTab}>
            <IconBSPaohThin />
            <span className={styles.detailTabCaption}>Déchet</span>
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

          {/* Recipient tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailColumns}>
              <Recipient form={form} />
            </div>
          </TabPanel>

          {/* Packagings tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailColumns}>
              <Waste form={form} />
            </div>
          </TabPanel>
        </div>
      </Tabs>

      <div className={styles.detailActions}>
        <button
          className="btn btn--outline-primary"
          onClick={() => duplicate()}
        >
          <IconDuplicateFile size="24px" color="blueLight" />
          <span>Dupliquer</span>
        </button>
      </div>
    </div>
  );
}

const Waste = ({ form }: { form: Bspaoh }) => {
  const { waste } = form;
  // console.log(waste)
  return (
    <div>
      <Packagings packagings={waste?.packagings} />
    </div>
  );
};

const Packagings = ({
  packagings
}: {
  packagings: BspaohPackaging[] | null | undefined;
}) => {
  if (!packagings) {
    return null;
  }
  return (
    <div className={classNames(styles.spanWidth)}>
      <Table>
        <TableHead>
          <TableRow className="TableCell-table__head-trs">
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Vol.</TableHeaderCell>
            <TableHeaderCell>Numérotation</TableHeaderCell>
            <TableHeaderCell>Codes d'identification</TableHeaderCell>
            <TableHeaderCell>Consistance</TableHeaderCell>
            <TableHeaderCell>Accepté</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packagings.map((row, idx) => (
            <TableRow className="TableCell-table__tr" key={idx}>
              <TableCell>{getVerbosePackagingType(row.type)}</TableCell>
              <TableCell>{row.volume}</TableCell>
              <TableCell>{row.containerNumber}</TableCell>
              <TableCell>{row.identificationCodes}</TableCell>
              <TableCell>{getVerboseConsistence(row.consistence)}</TableCell>
              <TableCell>
                {getVerbosePaohPackagingsAcceptationStatus(row.acceptation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Verbose Utils

const verbosePackagings = {
  RELIQUAIRE: "Reliquaire",
  LITTLE_BOX: "Petite boîte",
  BIG_BOX: "Grosse boîte"
};
const getVerbosePackagingType = (type: string) => verbosePackagings[type];

const getVerboseConsistence = (
  consistence: BspaohConsistence | null | undefined
) => {
  if (!consistence) {
    return "";
  }
  return consistence === "SOLIDE" ? "Solide" : "Siquide";
};

export const getVerbosePaohPackagingsAcceptationStatus = (
  acceptationStatus:
    | BspaohPackagingAcceptationStatus
    | null
    | undefined
    | string
): string => {
  if (!acceptationStatus) {
    return "";
  }
  const verbose = {
    ACCEPTED: "Accepté",
    REFUSED: "Refusé",
    PENDING: "En attente"
  };
  return verbose[acceptationStatus];
};
