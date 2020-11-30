import React from "react";

import DownloadPdf from "dashboard/slips/slips-actions/DownloadPdf";
import Duplicate from "dashboard/slips/slips-actions/Duplicate";

import Delete from "dashboard/slips/slips-actions/Delete";
import Edit from "dashboard/slips/slips-actions/Edit";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  TransportSegment,
  Form,
  FormCompany,
  FormStatus,
} from "generated/graphql/types";
import { statusesWithDynamicActions, statusLabels } from "../constants";
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

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};
const Company = ({ company, label }: CompanyProps) => (
  <>
    <dt>{label}</dt> <dd>{company?.name}</dd>
    <dt>Siret</dt> <dd>{company?.siret}</dd>
    <dt>Adresse</dt> <dd>{company?.address}</dd>
    <dt>Tél</dt> <dd>{company?.phone}</dd>
    <dt>Mél</dt> <dd>{company?.mail}</dd>
    <dt>Contact</dt> <dd>{company?.contact}</dd>
  </>
);

type SegmentProps = {
  segment: TransportSegment;
};
const TransportSegmentDetail = ({ segment }: SegmentProps) => {
  const label = !!segment.segmentNumber
    ? `N° ${segment.segmentNumber + 1}`
    : "";
  return (
    <div className={styles.detailGrid}>
      <Company label={label} company={segment?.transporter?.company} />

      <DateRow value={segment?.takenOverAt} label="Pris en charge le" />
      <DetailRow value={segment?.takenOverBy} label="Pris en charge par" />
    </div>
  );
};

const TempStorage = ({ form }) => {
  const { temporaryStorageDetail } = form;
  return (
    <>
      <div className={styles.detailColumns}>
        <div className={styles.detailGrid}>
          <DetailRow value={form?.recipient?.company.name} label="Nom" />
          <DetailRow value={form?.recipient?.company.siret} label="Siret" />
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
            packagingInfos={
              temporaryStorageDetail?.wasteDetails?.packagingInfos
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
      </div>
      <div className={styles.detailColumns}>
        <div className={styles.detailGrid}>
          <dt>Destination suivante</dt>
          <dd>{temporaryStorageDetail?.destination?.company?.name}</dd>

          <dt>Siret</dt>
          <dd>{temporaryStorageDetail?.destination?.company?.siret}</dd>

          <dt>Adresse</dt>
          <dd>{temporaryStorageDetail?.destination?.company?.address}</dd>

          <DetailRow
            value={temporaryStorageDetail?.destination?.cap}
            label="Numéro de CAP"
          />

          <DetailRow
            value={temporaryStorageDetail?.destination?.processingOperation}
            label="Opération de traitement prévue"
          />
        </div>
        <div className={styles.detailColumns}>
          <div className={styles.detailGrid}>
            <DetailRow
              value={temporaryStorageDetail?.transporter?.company?.name}
              label="Transporteur"
            />

            <DetailRow
              value={temporaryStorageDetail?.transporter?.company?.siret}
              label="Siret"
            />

            <DetailRow
              value={temporaryStorageDetail?.transporter?.company?.address}
              label="Adresse"
            />
            <DetailRow
              value={temporaryStorageDetail?.transporter?.receipt}
              label="Récépissé"
            />
            <DateRow
              value={temporaryStorageDetail?.transporter?.validityLimit}
              label="Date de validité"
            />
          </div>
        </div>
      </div>
    </>
  );
};
const Trader = ({ trader }) => (
  <>
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
      </div>
      <div className={styles.detailGrid}>
        <DetailRow value={trader.receipt} label="Récépissé" />
        <DetailRow value={trader.department} label="Départment" />
        <DateRow value={trader.validityLimit} label="Date de validité" />
      </div>
    </div>
  </>
);
const EcoOrganisme = ({ ecoOrganisme }) => (
  <div className={styles.detailGrid}>
    <dt>EcoOrganisme</dt>
    <dd>{ecoOrganisme?.name}</dd>

    <dt>Siret</dt>
    <dd>{ecoOrganisme?.siret}</dd>
  </div>
);

type SlipDetailContentProps = {
  form: Form | null | undefined;
  children?: React.ReactNode;
  refetch?: () => void;
};

/**
 * Handle recipient or destination in case of temp storage
 */
const Recipient = ({
  form,
  hasTempStorage,
}: {
  form: Form;
  hasTempStorage: boolean;
}) => {
  const recipient = hasTempStorage
    ? form.temporaryStorageDetail?.destination
    : form.recipient;

  return (
    <>
      {" "}
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={recipient?.company} />
      </div>
      <div className={styles.detailGrid}>
        <dt>Numéro de CAP</dt> <dd>{recipient?.cap}</dd>
        <DateRow value={form.receivedAt} label="Reçu le" />
        <DetailRow value={form.receivedBy} label="Reçu par" />
        <DetailRow
          value={getVerboseAcceptationStatus(form?.wasteAcceptationStatus)}
          label="Lot accepté"
        />
        <DetailRow
          value={form?.quantityReceived && `${form?.quantityReceived} tonnes`}
          label="Quantité reçue"
        />
        <DetailRow value={form.wasteRefusalReason} label="Motif de refus" />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={recipient?.processingOperation}
          label="Opération de traitement prévue"
        />
        <DetailRow
          value={form.processingOperationDone}
          label="Traitement réalisé (code D/R)"
        />
        <DetailRow
          value={form.processingOperationDescription}
          label="Description de l'opération"
        />
        <DateRow value={form.processedAt} label="Traitement effectué le" />
        <DetailRow value={form.processedBy} label="Traitement effectué par" />
      </div>
    </>
  );
};

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
          <div className={`${styles.detailQRCodeIcon}`}>
            {form.status !== "DRAFT" && (
              <div className={styles.detailQRCode}>
                <QRCodeIcon value={form.readableId} size={96} />
                <span>Ce QR code contient le numéro du bordereau </span>
              </div>
            )}
          </div>
          <div className={styles.detailGrid}>
            <DateRow
              value={form.stateSummary?.lastActionOn}
              label="Dernière action sur le BSD"
            />
            <dt>Code déchet</dt>
            <dd>{form.wasteDetails?.code}</dd>
            <DetailRow value={form.wasteDetails?.name} label="Nom usuel" />
            <dt>Quantité</dt>
            <dd>{form.stateSummary?.quantity ?? "?"} tonnes</dd>
            <PackagingRow packagingInfos={form.wasteDetails?.packagingInfos} />
            <dt>Consistance</dt>{" "}
            <dd>{getVerboseConsistence(form.wasteDetails?.consistence)}</dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Code onu</dt>
            <dd>{form?.wasteDetails?.onuCode}</dd>
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
            <div className={styles.detailColumns}>
              <div className={styles.detailGrid}>
                <Company label="Émetteur" company={form.emitter?.company} />

                <DetailRow
                  value={form.emitter?.workSite?.name}
                  label="Chantier"
                />
                {!!form.emitter?.workSite?.address && (
                  <>
                    <dt>Adresse Chantier</dt>
                    <dd>
                      {form.emitter?.workSite?.address}{" "}
                      {form.emitter?.workSite?.postalCode}{" "}
                      {form.emitter?.workSite?.city}
                    </dd>
                  </>
                )}
              </div>
              <div className={styles.detailGrid}>
                <dt>Quantité</dt> <dd>{form.wasteDetails?.quantity} tonnes</dd>
                <DetailRow
                  value={getVerboseQuantityType(
                    form.wasteDetails?.quantityType
                  )}
                  label="Quantité"
                />
                <DateRow value={form.sentAt} label="Envoyé le" />
                <DetailRow value={form.sentBy} label="Envoyé par" />
                <YesNoRow value={!!form.sentAt} label="Signature producteur" />
              </div>
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
            <div className={`${styles.detailGrid} `}>
              <Company
                label={`Transporteur ${isMultiModal ? "N°1" : ""}`}
                company={form.transporter?.company}
              />
            </div>
            <div className={styles.detailGrid}>
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
              <DateRow value={form.sentAt} label="Date de prise en charge" />
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
              <TempStorage form={form} />
            </TabPanel>
          )}

          {/* Recipient  tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailColumns}>
              <Recipient form={form} hasTempStorage={hasTempStorage} />
            </div>
          </TabPanel>
        </div>
      </Tabs>
      <div className={styles.detailActions}>
        <Duplicate formId={form.id} small={false} redirectToDashboard={true} />
        {[FormStatus.Draft, FormStatus.Sealed].includes(form.status) ? (
          <>
            <Delete formId={form.id} small={false} />
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
