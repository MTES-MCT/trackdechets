import React, { useState } from "react";
import {
  generatePath,
  Link,
  useNavigate,
  useLocation,
  useParams
} from "react-router-dom";

import { useDownloadPdf } from "../../components/BSDList/BSDD/BSDDActions/useDownloadPdf";
import { useDuplicate } from "../../components/BSDList/BSDD/BSDDActions/useDuplicate";

import { DeleteModal } from "../../components/BSDList/BSDD/BSDDActions/DeleteModal";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  Form,
  FormCompany,
  FormStatus,
  EmitterType,
  InitialFormFraction,
  Query,
  QueryCompanyPrivateInfosArgs,
  OperationMode,
  QuerySearchCompaniesArgs,
  CompanyType,
  UserPermission
} from "@td/codegen-ui";
import { emitterTypeLabels, getTransportModeLabel } from "../../constants";
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
  IconBSDD
} from "../../../Apps/common/Components/Icons/Icons";
import routes from "../../../Apps/routes";

import {
  getVerboseConsistence,
  getVerboseAcceptationStatus,
  getVerboseQuantityType
} from "../common/utils";
import QRCodeIcon from "react-qr-code";

import styles from "../common/BSDDetailContent.module.scss";

import {
  DateRow,
  DetailRow,
  YesNoRow,
  PackagingRow,
  QuantityRow
} from "../common/Components";
import { WorkflowAction } from "../../components/BSDList";
import { Modal } from "../../../common/components";
import { Loader } from "../../../Apps/common/Components";
import { format } from "date-fns";
import {
  isForeignVat,
  isSiret,
  isDangerous,
  STATUS_LABELS
} from "@td/constants";
import { Appendix1ProducerForm } from "../../../form/bsdd/appendix1Producer/form";
import { useQuery } from "@apollo/client";
import {
  COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS,
  SEARCH_COMPANIES
} from "../../../Apps/common/queries/company/query";
import { formTransportIsPipeline } from "../../../Apps/common/utils/packagingsBsddSummary";
import { getOperationModeLabel } from "../../../Apps/common/operationModes";
import { mapBsdd } from "../../../Apps/Dashboard/bsdMapper";
import { canAddAppendix1 } from "../../../Apps/Dashboard/dashboardServices";
import { usePermissions } from "../../../common/contexts/PermissionsContext";
import { BSD_DETAILS_QTY_TOOLTIP } from "../../../Apps/common/wordings/dashboard/wordingsDashboard";
import { isDefined } from "../../../common/helper";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};
const Company = ({ company, label }: CompanyProps) => (
  <>
    <dt>{label}</dt> <dd>{company?.name}</dd>
    <dt>Siret</dt> <dd>{company?.siret}</dd>
    <dt>Numéro de TVA</dt> <dd>{company?.vatNumber}</dd>
    {company?.omiNumber && (
      <>
        <dt>
          Numéro OMI <br />
          (Organisation maritime internationale)
        </dt>{" "}
        <dd>{company?.omiNumber}</dd>
      </>
    )}
    {company?.extraEuropeanId && (
      <>
        <dt>
          Identifiant si hors Union Européenne <br />
          (en l'absence de numéro de TVA)
        </dt>{" "}
        <dd>{company?.extraEuropeanId}</dd>
      </>
    )}
    <dt>Adresse</dt> <dd>{company?.address}</dd>
    <dt>Tél</dt> <dd>{company?.phone}</dd>
    <dt>Mél</dt> <dd>{company?.mail}</dd>
    <dt>Contact</dt> <dd>{company?.contact}</dd>
  </>
);

const TempStorage = ({ form }) => {
  const { temporaryStorageDetail } = form;

  const hasBeenReceived = isDefined(
    temporaryStorageDetail?.temporaryStorer?.quantityReceived
  );

  return (
    <>
      <div className={styles.detailColumns}>
        <div className={styles.detailGrid}>
          <DetailRow value={form?.recipient?.company?.name} label="Nom" />
          <DetailRow value={form?.recipient?.company?.siret} label="Siret" />
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
            showEmpty={hasBeenReceived}
          />
          <QuantityRow
            value={temporaryStorageDetail?.temporaryStorer?.quantityRefused}
            label="Quantité refusée"
            tooltip={BSD_DETAILS_QTY_TOOLTIP}
            showEmpty={hasBeenReceived}
          />
          <QuantityRow
            value={temporaryStorageDetail?.temporaryStorer?.quantityAccepted}
            label="Quantité traitée"
            tooltip={BSD_DETAILS_QTY_TOOLTIP}
            showEmpty={hasBeenReceived}
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

          <DetailRow value={form?.recipient?.cap} label="Numéro de CAP" />

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
              value={temporaryStorageDetail?.transporter?.company?.orgId}
              label={
                isSiret(
                  temporaryStorageDetail?.transporter?.company?.orgId,
                  import.meta.env.VITE_ALLOW_TEST_COMPANY
                )
                  ? "Siret"
                  : "Numéro de TVA"
              }
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
};

const GroupedIn = ({ form }: { form: Form }) => {
  const [downloadPdf] = useDownloadPdf({
    variables: { id: form.id }
  });
  const showPDFDownload = form.status !== FormStatus.Draft;
  return (
    <DetailRow
      value={
        <span>
          {form.readableId}
          {showPDFDownload && (
            <>
              {" ("}
              <button
                className={styles.downloadLink}
                onClick={() => downloadPdf()}
              >
                Télécharger le PDF
              </button>
              {")"}
            </>
          )}
        </span>
      }
      label={`Annexé au bordereau n°`}
    />
  );
};

/**
 * Handle recipient or destination in case of temp storage
 */
const Recipient = ({
  form,
  hasTempStorage
}: {
  form: Form;
  hasTempStorage: boolean;
}) => {
  const recipient = hasTempStorage
    ? form.temporaryStorageDetail?.destination
    : form.recipient;

  const hasBeenReceived = isDefined(form?.quantityReceived);

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
          showEmpty={hasBeenReceived}
        />
        <QuantityRow
          value={form?.quantityRefused}
          label="Quantité refusée"
          tooltip={BSD_DETAILS_QTY_TOOLTIP}
          showEmpty={hasBeenReceived}
        />
        <DetailRow value={form.wasteRefusalReason} label="Motif de refus" />
      </div>
      <div className={styles.detailGrid}>
        <QuantityRow
          value={form?.quantityAccepted}
          label="Quantité traitée"
          tooltip={BSD_DETAILS_QTY_TOOLTIP}
          showEmpty={hasBeenReceived}
        />
        <DetailRow
          value={recipient?.processingOperation}
          label="Opération de traitement prévue"
        />
        <DetailRow
          value={form.processingOperationDone}
          label="Traitement réalisé (code D/R)"
        />
        <DetailRow
          value={getOperationModeLabel(
            form?.destinationOperationMode as OperationMode
          )}
          label={"Mode de traitement"}
        />
        <DetailRow
          value={form.processingOperationDescription}
          label="Description de l'opération"
        />
        <DateRow value={form.processedAt} label="Traitement effectué le" />
        <DetailRow value={form.processedBy} label="Traitement effectué par" />
        {!!form.groupedIn?.length &&
          form.groupedIn.map(({ form }) => (
            <GroupedIn form={form} key={form.id} />
          ))}
      </div>
      {form.nextDestination?.company && (
        <div className={styles.detailGrid}>
          <DetailRow
            value={form.nextDestination?.processingOperation}
            label="Opération ultérieure prévue"
          />
          {form.nextDestination.notificationNumber && (
            <DetailRow
              value={form.nextDestination?.notificationNumber}
              label="Numéro de notification"
            />
          )}
          <Company
            label="Destination ultérieure prévue"
            company={form.nextDestination?.company}
          />
        </div>
      )}
    </>
  );
};

const Appendix2 = ({
  grouping
}: {
  grouping: InitialFormFraction[] | null | undefined;
}) => {
  if (!grouping?.length) {
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
          <th>Fraction regroupée (tonne)</th>
          <th>Date de réception</th>
          <th>Code postal lieu de collecte</th>
        </tr>
      </thead>
      <tbody>
        {grouping.map(({ form, quantity }, index) => (
          <tr key={index}>
            <td>{form?.readableId}</td>
            <td>{form?.wasteDetails?.code}</td>
            <td>{form?.wasteDetails?.name}</td>
            <td>
              {form?.quantityAccepted ??
                form?.quantityReceived ??
                form?.wasteDetails?.quantity}
            </td>
            <td>
              {form?.quantityReceived
                ? "R"
                : form?.wasteDetails?.quantityType?.charAt(0)}
            </td>
            <td>{quantity}</td>
            <td>
              {form?.signedAt
                ? format(new Date(form?.signedAt), "dd/MM/yyyy")
                : ""}
            </td>
            <td>{form?.emitterPostalCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Appendix1 = ({
  siret,
  container
}: {
  siret: string;
  container: Form;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { permissions } = usePermissions();

  const { data } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: siret }
  });
  const siretsWithAutomaticSignature = data
    ? data.companyPrivateInfos.receivedSignatureAutomations.map(
        automation => automation.from.siret
      )
    : [];

  const formToBsdDisplay = mapBsdd(container);

  const hasEcoOrganisme = Boolean(container.ecoOrganisme?.siret);
  const { data: companiesInfos } = useQuery<
    Pick<Query, "searchCompanies">,
    QuerySearchCompaniesArgs
  >(SEARCH_COMPANIES, {
    variables: {
      clue:
        container?.grouping
          ?.map(g => g.form.emitter?.company?.siret)
          .filter(Boolean)
          .join(",") ?? ""
    },
    skip: !container?.grouping?.length || !hasEcoOrganisme
  });

  const canSkipEmission =
    container?.grouping?.reduce((dic, { form }) => {
      const emitterSiret = form.emitter?.company?.siret;
      let siretIsExutoire = false;
      if (emitterSiret) {
        const emitterCompany = companiesInfos?.searchCompanies?.find(
          c => c.siret === emitterSiret
        );
        if (
          emitterCompany &&
          emitterCompany.companyTypes?.some(profile =>
            [CompanyType.Wasteprocessor, CompanyType.Collector].includes(
              profile
            )
          )
        ) {
          siretIsExutoire = true;
        }
      }

      // We can skip emission if
      // - there is an eco-organisme on the bsd && the emitter is NOT an exutoire
      // - the emitter is in the list of companies with automatic signature
      // - the emitter is a private individual
      dic[form.readableId] =
        (hasEcoOrganisme && !siretIsExutoire) ||
        siretsWithAutomaticSignature.includes(emitterSiret) ||
        Boolean(form.emitter?.isPrivateIndividual);
      return dic;
    }, {}) ?? {};

  return (
    <div className="tw-w-full">
      {container.status === FormStatus.Draft && (
        <div className="notification warning">
          Avant de pouvoir ajouter des annexes 1, vous devez valider le
          bordereau chapeau. Toutes les annexes 1 seront automatiquement
          associées à ce bordereau chapeau, avec le même code déchet.
        </div>
      )}
      {[FormStatus.Sealed, FormStatus.Sent].some(
        status => status === container.status
      ) &&
        canAddAppendix1(formToBsdDisplay) &&
        permissions.includes(UserPermission.BsdCanUpdate) && (
          <div className="tw-pb-2 tw-flex tw-justify-end">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={() => setIsOpen(true)}
            >
              <IconPdf size="16px" color="blueLight" />
              <span>Ajouter une annexe 1</span>
            </button>
          </div>
        )}
      {container?.grouping && container.grouping.length > 0 ? (
        <table className="td-table">
          <thead>
            <tr className="td-table__head-tr">
              <th>N° Bordereau</th>
              <th>Emetteur</th>
              <th>Chantier</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {container.grouping.map(({ form }, index) => (
              <tr key={index}>
                <td>{form.readableId}</td>
                <td>
                  {form.emitter?.company?.name}
                  <br />
                  {form.emitter?.company?.siret}
                </td>
                <td>
                  {form.emitter?.workSite?.name} {form.emitter?.workSite?.infos}
                </td>
                <td>
                  {form.status
                    ? form.emitter?.isPrivateIndividual &&
                      form.status === FormStatus.Sealed
                      ? STATUS_LABELS["SEALED_PRIVATE_INDIVIDUAL"]
                      : STATUS_LABELS[form.status]
                    : "-"}
                </td>
                <td>
                  <WorkflowAction
                    siret={siret}
                    form={form as any}
                    options={{
                      canSkipEmission: canSkipEmission[form.readableId]
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="tw-py-6">Aucun bordereau annexé</div>
      )}
      <Modal
        onClose={() => setIsOpen(false)}
        ariaLabel="Ajout d'une annexe 1 au chapeau"
        isOpen={isOpen}
        padding={false}
        wide={true}
      >
        <Appendix1ProducerForm
          container={container}
          close={() => setIsOpen(false)}
        />
      </Modal>
    </div>
  );
};

function useQueryString() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function BSDDetailContent({
  form,
  children = null
}: BSDDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const query = useQueryString();
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });
  const [duplicate, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id },
    onCompleted: () => {
      navigate(
        generatePath(routes.dashboard.bsds.drafts, {
          siret
        })
      );
    }
  });

  const selectedTab = query.get("selectedTab");

  const isMultiModal = form?.transporters.length > 1;
  const hasTempStorage = !!form?.temporaryStorageDetail;
  const isRegroupement: boolean = form?.emitter?.type === EmitterType.Appendix2;
  const isChapeau: boolean = form?.emitter?.type === EmitterType.Appendix1;
  const isAppendix1Producer: boolean =
    form?.emitter?.type === EmitterType.Appendix1Producer;

  const canDuplicate = permissions.includes(UserPermission.BsdCanCreate);

  const canDelete =
    ([FormStatus.Draft, FormStatus.Sealed].includes(form.status) ||
      (form.status === FormStatus.SignedByProducer &&
        siret === form.emitter?.company?.orgId)) &&
    permissions.includes(UserPermission.BsdCanDelete);

  const canUpdate =
    [
      FormStatus.Draft,
      FormStatus.Sealed,
      FormStatus.SignedByProducer,
      FormStatus.Sent
    ].includes(form.status) &&
    EmitterType.Appendix1Producer !== form.emitter?.type &&
    permissions.includes(UserPermission.BsdCanUpdate);

  return (
    <>
      <div className={styles.detail}>
        <div className={styles.detailSummary}>
          <h4 className={styles.detailTitle}>
            <IconBSDD className="tw-mr-2" />

            <span className={styles.detailStatus}>
              {isAppendix1Producer &&
              form.emitter?.isPrivateIndividual &&
              form.status === FormStatus.Sealed
                ? STATUS_LABELS["SEALED_PRIVATE_INDIVIDUAL"]
                : STATUS_LABELS[form.status]}
            </span>
            {form.status !== FormStatus.Draft && <span>{form.readableId}</span>}

            {!!form.customId && (
              <span className="tw-ml-auto">Numéro libre: {form.customId}</span>
            )}
          </h4>

          <div className={styles.detailContent}>
            <div className={`${styles.detailQRCodeIcon}`}>
              {form.status !== FormStatus.Draft && (
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
              <DetailRow
                value={form.wasteDetails?.parcelNumbers
                  ?.map(
                    pn =>
                      `${pn.city} - ${pn.postalCode} - ${[
                        pn.prefix,
                        pn.section,
                        pn.number,
                        pn.x ? `${pn.x}°` : null,
                        pn.y ? `${pn.y}°` : null
                      ]
                        .filter(Boolean)
                        .join("/")}`
                  )
                  .join(", ")}
                label="Numéro(s) de parcelle(s)"
              />
              <DetailRow
                value={form.wasteDetails?.analysisReferences?.join(", ")}
                label="Référence(s) d'analyse(s)"
              />
            </div>

            <div className={styles.detailGrid}>
              <dt>Code onu</dt>
              <dd>{form?.stateSummary?.onuCode}</dd>
              <dt>POP</dt> <dd>{form.wasteDetails?.pop ? "Oui" : "Non"}</dd>
              {form?.wasteDetails?.sampleNumber && (
                <>
                  <dt>Numéro d'échantillon</dt>
                  <dd>{form.wasteDetails.sampleNumber}</dd>
                </>
              )}
            </div>

            {form.ecoOrganisme && (
              <EcoOrganisme ecoOrganisme={form.ecoOrganisme} />
            )}
          </div>
        </div>

        <Tabs
          defaultIndex={selectedTab ? parseInt(selectedTab, 10) : 0}
          selectedTabClassName={styles.detailTabSelected}
        >
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
            {isChapeau && (
              <Tab className={styles.detailTab}>
                <div className="tw-flex tw-space-x-2">
                  <IconWaterDam size="18px" />
                  <IconWaterDam size="18px" />
                  <IconWaterDam size="18px" />
                </div>
                <span className={styles.detailTabCaption}>Annexes 1</span>
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
            {form.transporters?.map((_, idx) => (
              <Tab className={styles.detailTab} key={idx}>
                <IconWarehouseDelivery size="25px" />
                <span className={styles.detailTabCaption}>
                  {isMultiModal ? `Transp. n° ${idx + 1}` : "Transporteur"}
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
            {Boolean(form?.intermediaries?.length) && (
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
            {/* Appendix2 tab panel */}
            {isRegroupement && (
              <TabPanel className={styles.detailTabPanel}>
                <Appendix2 grouping={form.grouping} />
              </TabPanel>
            )}
            {/* Appendix 1 */}
            {isChapeau && (
              <TabPanel className={styles.detailTabPanel}>
                <Appendix1 container={form} siret={siret!} />
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
                  <Company
                    label={
                      form.emitter?.isPrivateIndividual !== true
                        ? "Émetteur"
                        : "Émetteur (Particulier)"
                    }
                    company={form.emitter?.company}
                  />
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
            {!formTransportIsPipeline(form) ? (
              (form.transporters ?? []).map((transporter, idx) => (
                <TabPanel className={styles.detailTabPanel}>
                  <div className={`${styles.detailGrid} `}>
                    <Company
                      label={
                        isMultiModal
                          ? `Transporteur n°${idx + 1}`
                          : "Transporteur"
                      }
                      company={transporter?.company}
                    />
                  </div>

                  <div className={styles.detailGrid}>
                    {!isForeignVat(transporter?.company?.vatNumber!) && (
                      <>
                        <YesNoRow
                          value={transporter?.isExemptedOfReceipt}
                          label="Exemption de récépissé"
                        />
                        {!transporter?.isExemptedOfReceipt && (
                          <>
                            <DetailRow
                              value={transporter?.receipt}
                              label="Numéro de récépissé"
                              showEmpty={true}
                            />
                            <DetailRow
                              value={transporter?.department}
                              label="Département"
                              showEmpty={true}
                            />
                            <DateRow
                              value={transporter?.validityLimit}
                              label="Date de validité"
                            />
                          </>
                        )}
                      </>
                    )}
                    <DetailRow
                      value={transporter?.numberPlate}
                      label="Immatriculation"
                    />
                    <YesNoRow
                      value={transporter.takenOverBy}
                      label="Signé par le transporteur"
                    />
                    <DateRow
                      value={transporter.takenOverAt}
                      label="Date de prise en charge"
                    />
                    <DetailRow
                      value={getTransportModeLabel(transporter?.mode)}
                      label="Mode de transport"
                    />
                  </div>
                </TabPanel>
              ))
            ) : (
              <TabPanel className={styles.detailTabPanel}>
                <div className={`${styles.detailGrid} `}>
                  <DetailRow
                    value="Conditionné pour Pipeline"
                    label="Transport"
                  />
                </div>
              </TabPanel>
            )}

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
            {/* Intermdiaries tab panel */}
            {Boolean(form?.intermediaries?.length) && (
              <TabPanel className={styles.detailTabPanel}>
                {form?.intermediaries?.map(intermediary => (
                  <Intermediary intermediary={intermediary} />
                ))}
              </TabPanel>
            )}
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
          {canDuplicate && (
            <button
              className="btn btn--outline-primary"
              onClick={() => duplicate()}
            >
              <IconDuplicateFile size="24px" color="blueLight" />
              <span>Dupliquer</span>
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn--outline-primary"
              onClick={() => setIsDeleting(true)}
            >
              <IconTrash color="blueLight" size="24px" />
              <span>Supprimer</span>
            </button>
          )}
          {canUpdate && (
            <Link
              to={generatePath(routes.dashboard.bsdds.edit, {
                siret,
                id: form.id
              })}
              className="btn btn--outline-primary"
            >
              <IconPaperWrite size="24px" color="blueLight" />
              <span>Modifier</span>
            </Link>
          )}
          <WorkflowAction siret={siret!} form={form} />
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
