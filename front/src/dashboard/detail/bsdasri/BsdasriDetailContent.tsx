import React from "react";
import { useBsdasriDuplicate } from "dashboard/components/BSDList/BSDasri/BSDasriActions/useDuplicate";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { transportModeLabels, statusLabels } from "dashboard/constants";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  Bsdasri,
  FormCompany,
  BsdasriPackagingInfo,
} from "generated/graphql/types";
import routes from "common/routes";

import {
  IconWarehouseDelivery,
  IconWaterDam,
  IconRenewableEnergyEarth,
  IconBSDasri,
  IconDuplicateFile,
} from "common/components/Icons";

import QRCodeIcon from "react-qr-code";

import styles from "dashboard/detail/common/BSDDetailContent.module.scss";

import {
  getVerboseQuantityType,
  getVerboseAcceptationStatus,
} from "dashboard/detail/common/utils";
import { DateRow, DetailRow } from "dashboard/detail/common/Components";

import classNames from "classnames";
const getVerboseWasteName = (code: string): string => {
  const desc = {
    "18 01 03*": "DASRI origine humaine ",
    "18 01 02*": "DASRI origine animale",
  }[code];
  return !!desc ? desc : "";
};
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

type SlipDetailContentProps = {
  form: Bsdasri;
  children?: React.ReactNode;
  refetch?: () => void;
};

const Emitter = ({ form }: { form: Bsdasri }) => {
  const { emitter, emission } = form;
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        {emitter?.onBehalfOfEcoorganisme ? (
          <span className={classNames(styles.spanWidth, "tw-font-bold")}>
            L'éco-organisme DASTRI est identifié pour assurer la prise en charge
            et la traçabilité
          </span>
        ) : null}
        <Company label="Émetteur" company={emitter?.company} />
        <DetailRow value={emitter?.workSite?.name} label="Adresse collecte" />
        <DetailRow value={emitter?.workSite?.name} label="Informations" />
        {!!emitter?.workSite?.address && (
          <>
            <dt>Adresse</dt>
            <dd>
              {emitter?.workSite?.address} {emitter?.workSite?.postalCode}{" "}
              {emitter?.workSite?.city}
            </dd>
          </>
        )}
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={emission?.wasteDetails?.quantity?.value}
          label="Quantité"
          units="kg"
        />
        <DetailRow
          value={getVerboseQuantityType(emission?.wasteDetails?.quantity?.type)}
          label="Quantité"
        />
        <DetailRow
          value={emission?.wasteDetails?.volume}
          label="Volume"
          units="l"
        />

        <Dasripackaging
          packagingInfos={emission?.wasteDetails?.packagingInfos}
        />
      </div>
      <div className={styles.detailGrid}>
        <DateRow value={emission?.handedOverAt} label="Envoyé le" />

        {emission?.isTakenOverWithoutEmitterSignature && (
          <>
            <dt>Enlevé sans signature PRED</dt>
            <dd>Oui</dd>
          </>
        )}
        {emission?.isTakenOverWithSecretCode && (
          <>
            <dt>Signature avec code secret PRED</dt>
            <dd>Oui</dd>
          </>
        )}
        <DateRow value={emission?.signature?.date} label="Signé le" />
        <DetailRow value={emission?.signature?.author} label="Signé par" />
        <DetailRow value={emitter?.customInfo} label="Informations PRED" />
      </div>
    </div>
  );
};
const Transporter = ({ form }: { form: Bsdasri }) => {
  const { transporter, transport } = form;
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Transporteur" company={transporter?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow value={transporter?.receipt} label="Numéro de récépissé" />
        <DetailRow value={transporter?.receiptDepartment} label="Département" />
        <DateRow
          value={transporter?.receiptValidityLimit}
          label="Date de validité"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={transport?.mode ? transportModeLabels[transport?.mode] : null}
          label="Mode de transport"
        />
        <DetailRow
          value={transport?.wasteDetails?.quantity?.value}
          label="Quantité"
          units="kg"
        />
        <DetailRow
          value={getVerboseQuantityType(
            transport?.wasteDetails?.quantity?.type
          )}
          label="Quantité"
        />
        <DetailRow
          value={transport?.wasteDetails?.volume}
          label="Volume"
          units="l"
        />

        <Dasripackaging
          packagingInfos={transport?.wasteDetails?.packagingInfos}
        />
        <AcceptationStatusRow value={transport?.wasteAcceptation?.status} />
        <DetailRow
          value={transport?.wasteAcceptation?.refusalReason}
          label="Motif de refus"
        />
        <DetailRow
          value={transport?.wasteAcceptation?.refusedQuantity}
          label="Quantité refusée"
          units="kg"
        />
      </div>
      <div className={`${styles.detailGrid} `}>
        <DateRow value={transport?.takenOverAt} label="Emporté le" />
        <DateRow
          value={transport?.handedOverAt}
          label="Remise à l'inst. destinataire"
        />

        <DateRow value={transport?.signature?.date} label="Signé le" />
        <DetailRow value={transport?.signature?.author} label="Signé par" />
        <DetailRow
          value={transporter?.customInfo}
          label="Informations tranporteur"
        />
      </div>
    </>
  );
};

const Recipient = ({ form }: { form: Bsdasri }) => {
  const { recipient, reception, operation } = form;

  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={recipient?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={reception?.wasteDetails?.volume}
          label="Volume"
          units="l"
        />
        <Dasripackaging
          packagingInfos={reception?.wasteDetails?.packagingInfos}
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={getVerboseAcceptationStatus(
            form?.reception?.wasteAcceptation?.status
          )}
          label="Lot accepté"
        />
        <DetailRow
          value={form?.reception?.wasteAcceptation?.refusalReason}
          label="Motif de refus"
        />
        <DetailRow
          value={form?.reception?.wasteAcceptation?.refusedQuantity}
          label="Quantité refusée"
          units="kg"
        />
        <DetailRow
          value={form.reception?.signature?.author}
          label="Réception signée par"
        />
        <DateRow
          value={form.reception?.signature?.date}
          label="Réception signée le"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={operation?.quantity?.value}
          label="Quantité"
          units="kg"
        />

        <DetailRow
          value={operation?.processingOperation}
          label="Opération de traitement"
        />
        <DateRow
          value={operation?.processedAt}
          label="Traitement effectué le"
        />

        <DetailRow
          value={operation?.signature?.author}
          label="Traitement signé par"
        />
        <DateRow
          value={operation?.signature?.date}
          label="Traitement signé le"
        />
        <DetailRow
          value={recipient?.customInfo}
          label="Informations destinataire"
        />
      </div>
    </>
  );
};

export default function BsdasriDetailContent({
  form,
  children = null,
  refetch,
}: SlipDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const [duplicate] = useBsdasriDuplicate({
    variables: { id: form.id },
    onCompleted: () => {
      history.push(
        generatePath(routes.dashboard.bsds.drafts, {
          siret,
        })
      );
    },
  });
  return (
    <div className={styles.detail}>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSDasri className="tw-mr-2" />
          <span className={styles.detailStatus}>
            [{form.isDraft ? "Brouillon" : statusLabels[form["bsdasriStatus"]]}]
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
            <dd>{form.emission?.wasteCode}</dd>
            <dt>Nom Usuel</dt>
            <dd>
              {!!form.emission?.wasteCode &&
                getVerboseWasteName(form.emission?.wasteCode)}
            </dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Code onu</dt>
            <dd>{form?.emission?.wasteDetails?.onuCode}</dd>
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
              <Recipient form={form} />
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
const Dasripackaging = ({
  packagingInfos,
}: {
  packagingInfos: BsdasriPackagingInfo[] | null | undefined;
}) => {
  if (!packagingInfos) {
    return null;
  }
  return (
    <>
      <div className={classNames(styles.spanWidth)}>
        <table className={classNames(styles.WastePackaging)}>
          <caption>Conditionnement</caption>
          <thead>
            <tr className="td-table__head-trs">
              <th>Type</th>
              <th>Qté.</th>
              <th>Vol.</th>
            </tr>
          </thead>
          {packagingInfos.map(row => (
            <tr className="td-table__tr">
              <td>
                {`${getVerbosePackagingType(row.type)
                  .substring(0, 20)
                  .trim()}…`}
                {row.other}
              </td>

              <td>{row.quantity}</td>
              <td>{row.volume} l</td>
            </tr>
          ))}
        </table>
      </div>
    </>
  );
};

const verbosePackagings = {
  BOITE_CARTON: "Caisse en carton avec sac en plastique",
  FUT: "Fûts ou jerrican à usage unique",
  BOITE_PERFORANTS: "Boîtes et Mini-collecteurs pour déchets perforants",
  GRAND_EMBALLAGE: "Grand emballage",
  GRV: "Grand récipient pour vrac",
  AUTRE: "Autre",
};
const getVerbosePackagingType = (type: string) => verbosePackagings[type];

const AcceptationStatusRow = ({
  value = null,
}: {
  value?: string | undefined | null;
}) => {
  return (
    <>
      <dt>Lot accepté :</dt>
      <dd>{value ? getVerboseAcceptationStatus(value) : ""}</dd>
    </>
  );
};
