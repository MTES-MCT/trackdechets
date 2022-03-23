import React, { useState } from "react";
import { generatePath, Link, useHistory, useParams } from "react-router-dom";

import { useDownloadPdf } from "dashboard/components/BSDList/BSDD/BSDDActions/useDownloadPdf";
import { useDuplicate } from "dashboard/components/BSDList/BSDD/BSDDActions/useDuplicate";

import { DeleteModal } from "dashboard/components/BSDList/BSDD/BSDDActions/DeleteModal";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  TransportSegment,
  Form,
  FormCompany,
  FormStatus,
  Appendix2Form,
  EmitterType,
} from "generated/graphql/types";
import {
  emitterTypeLabels,
  getTransportModeLabel,
  statusLabels,
} from "../../constants";
import {
  IconWarehouseDelivery,
  IconWarehouseStorage,
  IconWaterDam,
  IconRenewableEnergyEarth,
  IconWarehousePackage,
  IconPdf,
  IconPaperWrite,
  IconDuplicateFile,
  IconTrash,
  IconBSDD,
} from "common/components/Icons";
import routes from "common/routes";

import {
  getVerboseConsistence,
  getVerboseAcceptationStatus,
  getVerboseQuantityType,
} from "dashboard/detail/common/utils";
import QRCodeIcon from "react-qr-code";

import styles from "dashboard/detail/common/BSDDetailContent.module.scss";

import {
  DateRow,
  DetailRow,
  YesNoRow,
  PackagingRow,
} from "dashboard/detail/common/Components";
import { WorkflowAction } from "dashboard/components/BSDList";
import EditSegment from "./EditSegment";
import { Loader } from "common/components";
import { isDangerous } from "generated/constants";
import { format } from "date-fns";

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
  siret: string;
};
const TransportSegmentDetail = ({ segment, siret }: SegmentProps) => {
  const label = !!segment.segmentNumber
    ? `N° ${segment.segmentNumber + 1}`
    : "";
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label={label} company={segment?.transporter?.company} />

        <DateRow value={segment?.takenOverAt} label="Pris en charge le" />
        <DetailRow value={segment?.takenOverBy} label="Pris en charge par" />
        <DetailRow
          value={getTransportModeLabel(segment?.mode)}
          label="Mode de transport"
        />
      </div>
      {!segment.readyToTakeOver &&
        [
          segment.transporter?.company?.siret,
          segment.previousTransporterCompanySiret,
        ].includes(siret) && <EditSegment segment={segment} siret={siret} />}
    </>
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

          <PackagingRow packagingInfos={form.stateSummary?.packagingInfos} />
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
            <DetailRow
              value={getTransportModeLabel(
                temporaryStorageDetail?.transporter?.mode
              )}
              label="Mode de transport"
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
        <dd>{trader.company?.contact}</dd>
      </div>
      <div className={styles.detailGrid}>
        <DetailRow value={trader.receipt} label="Récépissé" />
        <DetailRow value={trader.department} label="Départment" />
        <DateRow value={trader.validityLimit} label="Date de validité" />
      </div>
    </div>
  </>
);
const Broker = ({ broker }) => (
  <>
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

type BSDDetailContentProps = {
  form: Form;
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
        {form.groupedIn && (
          <DetailRow
            value={form.groupedIn.readableId}
            label={`Annexé au bordereau n°`}
          />
        )}
      </div>
    </>
  );
};

const Appendix2 = ({
  appendix2Forms,
}: {
  appendix2Forms: Appendix2Form[] | null | undefined;
}) => {
  if (!appendix2Forms?.length) {
    return <div>Aucun bordereau annexé</div>;
  }
  return (
    <table className="td-table">
      <thead>
        <tr className="td-table__head-tr">
          <th>N° Bordereau</th>
          <th>Code déchet</th>
          <th>Dénomination usuelle</th>
          <th>Pesée (tonne)</th>
          <th>Réelle / estimée</th>
          <th>Date de réception</th>
          <th>Code postal lieu de collecte</th>
        </tr>
      </thead>
      <tbody>
        {appendix2Forms.map((appendix2Form, index) => (
          <tr key={index}>
            <td>{appendix2Form?.readableId}</td>
            <td>{appendix2Form?.wasteDetails?.code}</td>
            <td>{appendix2Form?.wasteDetails?.name}</td>
            <td>
              {appendix2Form?.quantityReceived ??
                appendix2Form?.wasteDetails?.quantity}
            </td>
            <td>
              {appendix2Form?.quantityReceived
                ? "R"
                : appendix2Form?.wasteDetails?.quantityType?.charAt(0)}
            </td>
            <td>
              {appendix2Form?.signedAt
                ? format(new Date(appendix2Form?.signedAt), "dd/MM/yyyy")
                : ""}
            </td>
            <td>{appendix2Form?.emitterPostalCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default function BSDDetailContent({
  form,
  children = null,
  refetch,
}: BSDDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });
  const [duplicate, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id },
    onCompleted: () => {
      history.push(
        generatePath(routes.dashboard.bsds.drafts, {
          siret,
        })
      );
    },
  });

  const isMultiModal: boolean = !!form?.transportSegments?.length;
  const hasTempStorage: boolean = !!form?.temporaryStorageDetail;
  const isRegroupement: boolean = form?.emitter?.type === EmitterType.Appendix2;

  return (
    <>
      <div className={styles.detail}>
        <div className={styles.detailSummary}>
          <h4 className={styles.detailTitle}>
            <IconBSDD className="tw-mr-2" />

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
              <dd>
                {form.wasteDetails?.code}
                {!isDangerous(form.wasteDetails?.code ?? "") &&
                  form.wasteDetails?.isDangerous &&
                  " (dangereux)"}
              </dd>
              <DetailRow value={form.wasteDetails?.name} label="Nom usuel" />
              <dt>Quantité</dt>
              <dd>{form.stateSummary?.quantity ?? "?"} tonnes</dd>
              <PackagingRow
                packagingInfos={form.stateSummary?.packagingInfos}
              />
              <dt>Consistance</dt>{" "}
              <dd>{getVerboseConsistence(form.wasteDetails?.consistence)}</dd>
            </div>

            <div className={styles.detailGrid}>
              <dt>Code onu</dt>
              <dd>{form?.wasteDetails?.onuCode}</dd>
              <dt>POP</dt> <dd>{form.wasteDetails?.pop ? "Oui" : "Non"}</dd>
            </div>

            {form.ecoOrganisme && (
              <EcoOrganisme ecoOrganisme={form.ecoOrganisme} />
            )}
          </div>
        </div>

        <Tabs selectedTabClassName={styles.detailTabSelected}>
          {/* Tabs menu */}
          <TabList className={styles.detailTabs}>
            {isRegroupement && (
              <Tab className={styles.detailTab}>
                <div className="tw-flex tw-space-x-2">
                  <IconWaterDam size="18px" />
                  <IconWaterDam size="18px" />
                  <IconWaterDam size="18px" />
                </div>
                <span className={styles.detailTabCaption}>Annexes 2</span>
              </Tab>
            )}

            <Tab className={styles.detailTab}>
              <IconWaterDam size="25px" />
              <span className={styles.detailTabCaption}>Émetteur</span>
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
                <span> {isMultiModal ? "Transp. n°1" : "Transporteur"}</span>
              </span>
            </Tab>
            {form.transportSegments?.map((segment, idx) => (
              <Tab className={styles.detailTab} key={idx}>
                <IconWarehouseDelivery size="25px" />
                <span className={styles.detailTabCaption}>
                  Transp.
                  {!!segment.segmentNumber && `N° ${segment.segmentNumber + 1}`}
                </span>
              </Tab>
            ))}
            {hasTempStorage && (
              <Tab className={styles.detailTab}>
                <IconWarehouseStorage size="25px" />
                <span className={styles.detailTabCaption}>Entr. Prov.</span>
              </Tab>
            )}

            <Tab className={styles.detailTab}>
              <IconRenewableEnergyEarth size="25px" />
              <span className={styles.detailTabCaption}>Destinataire</span>
            </Tab>
          </TabList>
          {/* Tabs content */}
          <div className={styles.detailTabPanels}>
            {/* Appendix2 tab panel */}
            {isRegroupement && (
              <TabPanel className={styles.detailTabPanel}>
                <Appendix2 appendix2Forms={form.appendix2Forms} />
              </TabPanel>
            )}
            {/* Emitter tab panel */}
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <div className={styles.detailGrid}>
                  <DetailRow
                    label="Type d'émetteur"
                    value={
                      form.emitter?.type
                        ? emitterTypeLabels[form.emitter?.type]
                        : ""
                    }
                  />
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
                  <dt>Quantité</dt>{" "}
                  <dd>{form.wasteDetails?.quantity} tonnes</dd>
                  <DetailRow
                    value={getVerboseQuantityType(
                      form.wasteDetails?.quantityType
                    )}
                    label="Quantité"
                  />
                  <DateRow value={form.takenOverAt} label="Envoyé le" />
                  <DetailRow value={form.emittedBy} label="Envoyé par" />
                  <YesNoRow
                    value={!!form.emittedAt}
                    label="Signature producteur"
                  />
                </div>
              </div>
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
                <DateRow
                  value={form.takenOverAt}
                  label="Date de prise en charge"
                />
                <DetailRow
                  value={getTransportModeLabel(form.transporter?.mode)}
                  label="Mode de transport"
                />
              </div>
            </TabPanel>
            {/* Multimodal transporters tab panels */}
            {form.transportSegments?.map((segment, idx) => (
              <TabPanel className={styles.detailTabPanel} key={idx}>
                <TransportSegmentDetail
                  segment={segment}
                  siret={siret}
                  key={segment.id}
                />
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
          {form.status !== FormStatus.Draft && (
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={() => downloadPdf()}
            >
              <IconPdf size="24px" color="blueLight" />
              <span>Pdf</span>
            </button>
          )}
          <button
            className="btn btn--outline-primary"
            onClick={() => duplicate()}
          >
            <IconDuplicateFile size="24px" color="blueLight" />
            <span>Dupliquer</span>
          </button>
          {[
            FormStatus.Draft,
            FormStatus.Sealed,
            FormStatus.SignedByProducer,
          ].includes(form.status) && (
            <>
              <button
                className="btn btn--outline-primary"
                onClick={() => setIsDeleting(true)}
              >
                <IconTrash color="blueLight" size="24px" />
                <span>Supprimer</span>
              </button>

              <Link
                to={generatePath(routes.dashboard.bsdds.edit, {
                  siret,
                  id: form.id,
                })}
                className="btn btn--outline-primary"
              >
                <IconPaperWrite size="24px" color="blueLight" />
                <span>Modifier</span>
              </Link>
            </>
          )}
          <WorkflowAction siret={siret} form={form} />
          {children}
        </div>
      </div>
      {isDeleting && (
        <DeleteModal
          formId={form.id}
          isOpen
          onClose={() => setIsDeleting(false)}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
}
