import React from "react";
import { useBsdasriDuplicate } from "dashboard/components/BSDList/BSDasri/BSDasriActions/useDuplicate";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { transportModeLabels, statusLabels } from "dashboard/constants";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  Bsdasri,
  FormCompany,
  BsdasriPackaging,
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
  getVerboseWeightType,
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
  const { emitter } = form;
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        {form?.ecoOrganisme?.siret ? (
          <span className={classNames(styles.spanWidth, "tw-font-bold")}>
            L'éco-organisme DASTRI est identifié pour assurer la prise en charge
            et la traçabilité
          </span>
        ) : null}
        <Company label="Émetteur" company={emitter?.company} />
        <DetailRow value={emitter?.pickupSite?.name} label="Adresse collecte" />
        <DetailRow value={emitter?.pickupSite?.name} label="Informations" />
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
          value={emitter?.emission?.weight?.value}
          label="Poids"
          units="kg"
        />
        <DetailRow
          value={getVerboseWeightType(emitter?.emission?.weight?.isEstimate)}
          label="Poids"
        />
        <DetailRow value={emitter?.emission?.volume} label="Volume" units="l" />

        <Dasripackaging packagings={emitter?.emission?.packagings} />
      </div>
      <div className={styles.detailGrid}>
        {emitter?.emission?.isTakenOverWithoutEmitterSignature && (
          <>
            <dt>Enlevé sans signature PRED</dt>
            <dd>Oui</dd>
          </>
        )}
        {emitter?.emission?.isTakenOverWithSecretCode && (
          <>
            <dt>Signature avec code secret PRED</dt>
            <dd>Oui</dd>
          </>
        )}
        <DateRow value={emitter?.emission?.signature?.date} label="Signé le" />
        <DetailRow
          value={emitter?.emission?.signature?.author}
          label="Signé par"
        />
        <DetailRow value={emitter?.customInfo} label="Informations PRED" />
      </div>
    </div>
  );
};
const Transporter = ({ form }: { form: Bsdasri }) => {
  const { transporter } = form;
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Transporteur" company={transporter?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={transporter?.recepisse?.number}
          label="Numéro de récépissé"
        />
        <DetailRow
          value={transporter?.recepisse?.department}
          label="Département"
        />
        <DateRow
          value={transporter?.recepisse?.validityLimit}
          label="Date de validité"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={
            transporter?.transport?.mode
              ? transportModeLabels[transporter?.transport?.mode]
              : null
          }
          label="Mode de transport"
        />
        <DetailRow
          value={transporter?.transport?.weight?.value}
          label="Poids"
          units="kg"
        />
        <DetailRow
          value={getVerboseWeightType(
            transporter?.transport?.weight?.isEstimate
          )}
          label="Poids"
        />
        <DetailRow
          value={transporter?.transport?.volume}
          label="Volume"
          units="l"
        />

        <Dasripackaging packagings={transporter?.transport?.packagings} />
        <AcceptationStatusRow
          value={transporter?.transport?.acceptation?.status}
        />
        <DetailRow
          value={transporter?.transport?.acceptation?.refusalReason}
          label="Motif de refus"
        />
        <DetailRow
          value={transporter?.transport?.acceptation?.refusedWeight}
          label="Poids refusée"
          units="kg"
        />
      </div>
      <div className={`${styles.detailGrid} `}>
        <DateRow
          value={transporter?.transport?.takenOverAt}
          label="Emporté le"
        />
        <DateRow
          value={transporter?.transport?.handedOverAt}
          label="Remise à l'inst. destinataire"
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

const Recipient = ({ form }: { form: Bsdasri }) => {
  const { destination } = form;

  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={destination?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={destination?.reception?.volume}
          label="Volume"
          units="l"
        />
        <Dasripackaging packagings={destination?.reception?.packagings} />
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
          value={destination?.reception?.acceptation?.refusedWeight}
          label="Poids refusée"
          units="kg"
        />
        <DetailRow
          value={destination?.reception?.signature?.author}
          label="Réception signée par"
        />
        <DateRow
          value={destination?.reception?.signature?.date}
          label="Réception signée le"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={destination?.operation?.weight?.value}
          label="Poids"
          units="kg"
        />

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
          {!!form?.grouping?.length && <span>Bordereau de groupement</span>}
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
            <dt>Nom Usuel</dt>
            <dd>
              {!!form.waste?.code && getVerboseWasteName(form?.waste?.code)}
            </dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Code onu</dt>
            <dd>{form?.waste?.adr}</dd>
          </div>

          <div className={styles.detailGrid}>
            {form?.grouping?.length && (
              <>
                <dt>Bordereau groupés:</dt>
                <dd> {form?.grouping?.join(", ")}</dd>
              </>
            )}
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
  packagings,
}: {
  packagings: BsdasriPackaging[] | null | undefined;
}) => {
  if (!packagings) {
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
          <tbody>
            {packagings.map((row, idx) => (
              <tr className="td-table__tr" key={idx}>
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
          </tbody>
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
