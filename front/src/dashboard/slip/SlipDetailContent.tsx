import React from "react";

import { statusLabels } from "dashboard/constants";
import DownloadPdf from "dashboard/slips/slips-actions/DownloadPdf";
import Duplicate from "dashboard/slips/slips-actions/Duplicate";

import Delete from "dashboard/slips/slips-actions/Delete";
import Edit from "dashboard/slips/slips-actions/Edit";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { TransportSegment, Form } from "generated/graphql/types";
import { statusesWithDynamicActions } from "../constants";
import {
  WarehouseDeliveryIcon,
  WarehouseStorageIcon,
  WaterDamIcon,
  RenewableEnergyEarthIcon,
  WarehousePackageIcon,
} from "common/components/Icons";

import {
  getVerboseConsistence,
  getVerboseAcceptationStatus,
  getVerboseQuantityType,
} from "./utils";
import QRCodeIcon from "react-qr-code";
import { DynamicActions } from "../slips/slips-actions/SlipActions";
import styles from "./Slip.module.scss";

import { DateRow, DetailRow, YesNoRow, PackagingRow } from "./Components";
import { useParams } from "react-router-dom";

type Props = {
  segment: TransportSegment;
};
const TransportSegmentDetail = ({ segment }: Props) => {
  return (
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <dt>
          Transporteur
          {!!segment.segmentNumber && `N° ${segment.segmentNumber + 1}`}
        </dt>
        <dd>{segment?.transporter?.company?.name}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Siret</dt> <dd>{segment?.transporter?.company?.siret}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Adresse</dt> <dd>{segment?.transporter?.company?.address}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Tél</dt> <dd>{segment?.transporter?.company?.phone}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Mél</dt> <dd>{segment?.transporter?.company?.mail}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Contact</dt> <dd>{segment?.transporter?.company?.contact}</dd>
      </div>

      <DateRow value={segment?.takenOverAt} label="Pris en charge le" />
      <DetailRow value={segment?.takenOverBy} label="Pris en charge par" />
    </div>
  );
};

type SlipDetailContentProps = {
  form: Form | null | undefined;
  children?: React.ReactNode;
  refetch?: () => void;
};

const TempStorage = ({ temporaryStorageDetail }) => (
  <>
    <div className={styles.detailBlock}>
      <DetailRow
        value={temporaryStorageDetail?.wasteDetails?.code}
        label="Code déchet"
      />
      <DetailRow
        value={temporaryStorageDetail?.wasteDetails?.name}
        label="Description déchet"
      />
      <DetailRow
        value={temporaryStorageDetail?.wasteDetails?.onuCode}
        label="Code Onu"
      />

      <PackagingRow
        packagings={temporaryStorageDetail?.wasteDetails?.packagings}
        numberOfPackages={
          temporaryStorageDetail?.wasteDetails?.numberOfPackages
        }
      />
      <DetailRow
        value={temporaryStorageDetail?.temporaryStorer?.quantityReceived}
        label="Quantité reçue"
      />
      <DetailRow
        value={getVerboseQuantityType(
          temporaryStorageDetail?.temporaryStorer?.quantityType
        )}
        label="Quantité"
      />
      <DateRow
        value={temporaryStorageDetail?.temporaryStorer?.receivedAt}
        label="Reçu le"
      />
      <DetailRow
        value={temporaryStorageDetail?.temporaryStorer?.receivedBy}
        label="Reçu par"
      />
      <DetailRow
        value={getVerboseAcceptationStatus(
          temporaryStorageDetail?.temporaryStorer?.wasteAcceptationStatus
        )}
        label="Accepté"
      />
    </div>

    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <dt>Destination suivante</dt>
        <dd>{temporaryStorageDetail?.destination?.company?.name}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Siret</dt>
        <dd>{temporaryStorageDetail?.destination?.company?.siret}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Adresse</dt>
        <dd>{temporaryStorageDetail?.destination?.company?.address}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Numéro de CAP</dt>
        <dd>{temporaryStorageDetail?.destination?.cap}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Opération de traitement prévue</dt>
        <dd>{temporaryStorageDetail?.destination?.processingOperation}</dd>
      </div>
    </div>
  </>
);
const Trader = ({ trader }) => (
  <>
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <dt>Négociant</dt>
        <dd>{trader.company?.name}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Siret</dt>
        <dd>{trader.company?.siret}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Adresse</dt>
        <dd>{trader.company?.address}</dd>
      </div>

      <div className={styles.detailRow}>
        <dt>Tél</dt>
        <dd>{trader.company?.phone}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Mél</dt>
        <dd>{trader.company?.mail}</dd>
      </div>
      <div className={styles.detailRow}>
        <dt>Contact</dt>
        <dd>{trader.company?.contact}</dd>
      </div>
    </div>
    <div className={styles.detailBlock}>
      <DetailRow value={trader.receipt} label="Récipissé" />
      <DateRow value={trader.validityLimit} label="Date de validité" />
    </div>
  </>
);
const EcoOrganisme = ({ ecoOrganisme }) => (
  <div className={styles.detailBlock}>
    <div className={styles.detailRow}>
      <dt>EcoOrganisme</dt>
      <dd>{ecoOrganisme?.name}</dd>
    </div>
    <div className={styles.detailRow}>
      <dt>Siret</dt>
      <dd>{ecoOrganisme?.siret}</dd>
    </div>
  </div>
);
export default function SlipDetailContent({
  form,
  children = null,
  refetch,
}: SlipDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();

  const isMultiModal: boolean = !!form?.transportSegments?.length;
  const hasTempStorage: boolean = !!form?.temporaryStorageDetail;
  if (!form) {
    return <div></div>;
  }

  return (
    <div className={styles.detail}>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <span className={styles.detailStatus}>
            [{statusLabels[form.status]}]
          </span>
          {form.status !== "DRAFT" && <span>{form.readableId}</span>}

          {!!form.customId && (
            <span className="tw-ml-auto">Numéro libre: {form.customId}</span>
          )}
        </h4>

        <div className={styles.detailContent}>
          <div className={`${styles.detailBlock} ${styles.detailQRCodeIcon}`}>
            {form.status !== "DRAFT" && (
              <QRCodeIcon value={form.readableId} size={96} />
            )}
          </div>
          <div className={styles.detailBlock}>
            <DateRow
              value={form.stateSummary?.lastActionOn}
              label="Mis à jour"
            />
            <div className={styles.detailRow}>
              <dt>Code déchet</dt>
              <dd>
                {form.wasteDetails?.code} {form.wasteDetails?.name}
              </dd>
            </div>

            <div className={styles.detailRow}>
              <dt>Quantité</dt> <dd>{form.wasteDetails?.quantity} tonnes</dd>
            </div>
            <DetailRow
              value={getVerboseQuantityType(form.wasteDetails?.quantityType)}
              label="Quantité"
            />
            <PackagingRow
              packagings={form.wasteDetails?.packagings}
              numberOfPackages={form.wasteDetails?.numberOfPackages}
            />

            <div className={styles.detailRow}>
              <dt>Consistance</dt>{" "}
              <dd>{getVerboseConsistence(form.wasteDetails?.consistence)}</dd>
            </div>
          </div>
          <div className={styles.detailBlock}>
            <div className={styles.detailRow}>
              <dt>Code onu</dt>
              <dd>{form?.wasteDetails?.onuCode}</dd>
            </div>
          </div>

          {form.ecoOrganisme && (
            <EcoOrganisme ecoOrganisme={form.ecoOrganisme} />
          )}
        </div>
      </div>

      <Tabs selectedTabClassName={styles.detailTabSelected}>
        {/* Tabs menu */}
        <TabList className={styles.detailTabs}>
          <Tab className={styles.detailTab}>
            <WaterDamIcon color="#000" size={25} />
            <span className={styles.detailTabCaption}>Producteur</span>
          </Tab>
          {!!form?.trader?.company?.name && (
            <Tab className={styles.detailTab}>
              <WarehousePackageIcon color="#000" size={25} />
              <span className={styles.detailTabCaption}>Négociant</span>
            </Tab>
          )}
          <Tab className={styles.detailTab}>
            <WarehouseDeliveryIcon color="#000" size={25} />
            <span className={styles.detailTabCaption}>
              <span> {isMultiModal ? "Transp. n°1" : "Transporteur"}</span>
            </span>
          </Tab>
          {form.transportSegments?.map((segment, idx) => (
            <Tab className={styles.detailTab} key={idx}>
              <WarehouseDeliveryIcon color="#000" size={25} />
              <span className={styles.detailTabCaption}>
                Transp.
                {!!segment.segmentNumber && `N° ${segment.segmentNumber + 1}`}
              </span>
            </Tab>
          ))}
          {hasTempStorage && (
            <Tab className={styles.detailTab}>
              <WarehouseStorageIcon color="#000" size={25} />
              <span className={styles.detailTabCaption}>Entr. Prov.</span>
            </Tab>
          )}

          <Tab className={styles.detailTab}>
            <RenewableEnergyEarthIcon color="#000" size={25} />
            <span className={styles.detailTabCaption}>Destinataire</span>
          </Tab>
        </TabList>
        {/* Tabs content */}
        <div className={styles.detailTabPanels}>
          {/* Emitter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailBlock}>
              <div className={styles.detailRow}>
                <dt>Émetteur</dt> <dd>{form.emitter?.company?.name}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Siret</dt> <dd>{form.emitter?.company?.siret}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Adresse</dt> <dd>{form.emitter?.company?.address}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Tél</dt> <dd>{form.emitter?.company?.phone}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Mél</dt> <dd>{form.emitter?.company?.mail}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Contact</dt> <dd>{form.emitter?.company?.contact}</dd>
              </div>

              <DetailRow
                value={form.emitter?.workSite?.name}
                label="Chantier"
              />
              {!!form.emitter?.workSite?.address && (
                <div className={styles.detailRow}>
                  <dt>Adresse Chantier</dt>{" "}
                  <dd>
                    {form.emitter?.workSite?.address}
                    {form.emitter?.workSite?.postalCode}
                    {form.emitter?.workSite?.city}
                  </dd>
                </div>
              )}
            </div>
            <div className={styles.detailBlock}>
              <DateRow value={form.sentAt} label="Envoyé le" />
              <DateRow value={form.sentBy} label="Envoyé par" />
            </div>
          </TabPanel>
          {/* Trader tab panel */}
          {!!form?.trader?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <Trader trader={form.trader} />
            </TabPanel>
          )}
          {/* Transporter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={`${styles.detailBlock} `}>
              <div className={styles.detailRow}>
                <dt>Transporteur {isMultiModal && <span>N°1</span>}</dt>{" "}
                <dd>{form.transporter?.company?.name}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Siret</dt> <dd>{form.transporter?.company?.siret}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Adresse</dt> <dd>{form.transporter?.company?.address}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Tél</dt> <dd>{form.transporter?.company?.phone}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Mél</dt> <dd>{form.transporter?.company?.mail}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Contact</dt> <dd>{form.transporter?.company?.contact}</dd>
              </div>
            </div>
            <div className={styles.detailBlock}>
              <YesNoRow
                value={form?.transporter?.isExemptedOfReceipt}
                label="Exemption de récépissé"
              />
              <DetailRow
                value={form?.transporter?.receipt}
                label="Numéro de récépissé"
              />
              <DetailRow
                value={form?.transporter?.department}
                label="Département"
              />
              <DateRow
                value={form?.transporter?.validityLimit}
                label="Date de validité"
              />
              <DetailRow
                value={form?.transporter?.numberPlate}
                label="Immatriculation"
              />
              <YesNoRow
                value={form.signedByTransporter}
                label="Signé par le transporteur"
              />
            </div>
          </TabPanel>
          {/* Multimodal transporters tab panels */}
          {form.transportSegments?.map((segment, idx) => (
            <TabPanel className={styles.detailTabPanel} key={idx}>
              <TransportSegmentDetail segment={segment} key={segment.id} />
            </TabPanel>
          ))}
          {/* Temp storage tab panel */}
          {hasTempStorage && (
            <TabPanel className={styles.detailTabPanel}>
              <TempStorage
                temporaryStorageDetail={form.temporaryStorageDetail}
              />
            </TabPanel>
          )}

          {/* Recipient tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailBlock}>
              <div className={styles.detailRow}>
                <dt>Destinataire</dt> <dd>{form.recipient?.company?.name}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Siret</dt> <dd>{form.recipient?.company?.siret}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Adresse</dt> <dd>{form.recipient?.company?.address}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Tél</dt> <dd>{form.recipient?.company?.phone}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Mél</dt> <dd>{form.recipient?.company?.mail}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Contact</dt> <dd>{form.recipient?.company?.contact}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Contact</dt> <dd>{form.recipient?.company?.contact}</dd>
              </div>
            </div>
            <div className={styles.detailBlock}>
              <div className={styles.detailRow}>
                <dt>Numéro de CAP</dt> <dd>{form.recipient?.cap}</dd>
              </div>
              <DetailRow
                value={form.recipient?.processingOperation}
                label="Opération de traitement effectué"
              />

              <DateRow value={form.receivedAt} label="Reçu le" />
              <DetailRow value={form.receivedBy} label="Reçu par" />
              <DetailRow
                value={form.wasteAcceptationStatus}
                label="Lot accepté"
              />
              <DetailRow
                value={form.wasteRefusalReason}
                label="Motif de refus"
              />
              <DetailRow
                value={form.processingOperationDone}
                label="Code D/R"
              />
              <DetailRow
                value={form.processingOperationDescription}
                label="Opération de traitement"
              />
              <DetailRow
                value={form.processedBy}
                label="Traitement effectué par"
              />
              <DateRow
                value={form.processedAt}
                label="Traitement effectué le"
              />
            </div>
          </TabPanel>
        </div>
      </Tabs>
      <div className={styles.detailActions}>
        <Duplicate formId={form.id} small={false} redirectToDashboard={true} />
        {form.status === "DRAFT" ? (
          <>
            <Delete formId={form.id} small={false} redirectToDashboard={true} />
            <Edit formId={form.id} small={false} />
          </>
        ) : (
          <DownloadPdf formId={form.id} small={false} />
        )}
        {statusesWithDynamicActions.includes(form.status) && (
          <DynamicActions siret={siret} form={form} refetch={refetch} />
        )}
        {children}
      </div>
    </div>
  );
}
