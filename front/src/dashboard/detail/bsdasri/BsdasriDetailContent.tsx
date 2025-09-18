import React from "react";
import { useBsdasriDuplicate } from "../../components/BSDList/BSDasri/BSDasriActions/useDuplicate";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { getTransportModeLabel } from "../../constants";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  Bsdasri,
  FormCompany,
  BsdasriPackaging,
  BsdasriType,
  OperationMode,
  UserPermission
} from "@td/codegen-ui";
import routes from "../../../Apps/routes";
import { useDownloadPdf } from "../../components/BSDList/BSDasri/BSDasriActions/useDownloadPdf";

import {
  IconWarehouseDelivery,
  IconWaterDam,
  IconRenewableEnergyEarth,
  IconBSDasri,
  IconDuplicateFile,
  IconPdf,
  IconWarehousePackage
} from "../../../Apps/common/Components/Icons/Icons";
import { InitialDasris } from "./InitialDasris";
import QRCodeIcon from "react-qr-code";

import styles from "../common/BSDDetailContent.module.scss";

import {
  getVerboseWeightType,
  getVerboseAcceptationStatus
} from "../common/utils";
import {
  DateRow,
  DetailRow,
  TransporterReceiptDetails
} from "../common/Components";

import classNames from "classnames";
import { getOperationModeLabel } from "../../../Apps/common/operationModes";
import { DASRI_VERBOSE_STATUSES } from "@td/constants";
import { usePermissions } from "../../../common/contexts/PermissionsContext";

const getVerboseWasteName = (code: string): string => {
  const desc = {
    "18 01 03*": "DASRI origine humaine ",
    "18 02 02*": "DASRI origine animale"
  }[code];
  return !!desc ? desc : "";
};
type CompanyProps = {
  company?: FormCompany | null;
  cap?: string | null;
  label: string;
};
const Company = ({ company, cap, label }: CompanyProps) => (
  <>
    <dt>{label}</dt> <dd>{company?.name}</dd>
    <dt>SIRET</dt> <dd>{company?.siret}</dd>
    <dt>Numéro de TVA</dt> <dd>{company?.vatNumber}</dd>
    <dt>Adresse</dt> <dd>{company?.address}</dd>
    <dt>Tél</dt> <dd>{company?.phone}</dd>
    <dt>Mél</dt> <dd>{company?.mail}</dd>
    <dt>Contact</dt> <dd>{company?.contact}</dd>
    {cap && (
      <>
        <dt>CAP</dt> <dd>{cap}</dd>
      </>
    )}
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
            L'éco-organisme {form?.ecoOrganisme?.name} (
            {form?.ecoOrganisme?.siret}) est identifié pour assurer la prise en
            charge et la traçabilité
          </span>
        ) : null}
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
          value={emitter?.emission?.weight?.value}
          label="Poids"
          units="kg"
        />
        <DetailRow
          value={getVerboseWeightType(emitter?.emission?.weight?.isEstimate)}
          label="Poids"
        />
        <DetailRow value={emitter?.emission?.volume} label="Volume" units="l" />

        {form.type !== BsdasriType.Synthesis && (
          <Dasripackaging packagings={emitter?.emission?.packagings} />
        )}
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
            <dt>
              Signature avec code secret{" "}
              {form?.ecoOrganisme?.emittedByEcoOrganisme
                ? "Éco-organisme"
                : "PRED"}{" "}
            </dt>
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
        <Company
          label="Destinataire"
          company={destination?.company}
          cap={destination?.cap}
        />
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
        <DetailRow
          value={destination?.customInfo}
          label="Informations destinataire"
        />
      </div>
    </>
  );
};
const Trader = ({ trader }) => (
  <div className={styles.detailColumns}>
    <div className={styles.detailGrid}>
      <dt>Négociant</dt>
      <dd>{trader.company?.name}</dd>

      <dt>SIRET</dt>
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
      <DetailRow value={trader.recepisse.number} label="Récépissé" />
      <DetailRow value={trader.recepisse.department} label="Départment" />
      <DateRow
        value={trader.recepisse.validityLimit}
        label="Date de validité"
      />
    </div>
  </div>
);
const Broker = ({ broker }) => (
  <div className={styles.detailColumns}>
    <div className={styles.detailGrid}>
      <dt>Courtier</dt>
      <dd>{broker.company?.name}</dd>

      <dt>SIRET</dt>
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
      <DetailRow value={broker.recepisse.number} label="Récépissé" />
      <DetailRow value={broker.recepisse.department} label="Départment" />
      <DateRow
        value={broker.recepisse.validityLimit}
        label="Date de validité"
      />
    </div>
  </div>
);

const Intermediaries = ({ intermediaries }) => (
  <>
    {intermediaries.map(intermediary => (
      <div className={styles.detailColumns} key={intermediary.orgId}>
        <div className={styles.detailGrid}>
          <dt>Établissement intermédiaire</dt>
          <dd>{intermediary?.name}</dd>

          <dt>SIRET</dt>
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
    ))}
  </>
);

export default function BsdasriDetailContent({ form }: SlipDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const {
    orgPermissions: { permissions }
  } = usePermissions(siret);

  const [duplicate] = useBsdasriDuplicate({
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
          <IconBSDasri className="tw-mr-2" />

          <span className={styles.detailStatus}>
            [
            {form.isDraft
              ? "Brouillon"
              : DASRI_VERBOSE_STATUSES[form["bsdasriStatus"]]}
            ]
          </span>
          {!form.isDraft && <span>{form.id}</span>}
          {form?.type === BsdasriType.Grouping && (
            <span className="tw-ml-2">Bordereau de groupement</span>
          )}
          {form?.type === BsdasriType.Synthesis && (
            <span className="tw-ml-2">Bordereau de synthèse</span>
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
            {!!form?.synthesizedIn?.id && (
              <AssociatedTo
                formId={form?.synthesizedIn?.id}
                label="Associé au"
              />
            )}
            {!!form?.groupedIn && (
              <AssociatedTo
                formId={form?.groupedIn?.id}
                label="Regroupé dans"
              />
            )}
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
          </Tab>{" "}
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
          {Boolean(form?.intermediaries?.length) && (
            <Tab className={styles.detailTab}>
              <IconWarehousePackage size="25px" />
              <span className={styles.detailTabCaption}>Intermédiaires</span>
            </Tab>
          )}
          {[BsdasriType.Synthesis, BsdasriType.Grouping].includes(
            form?.type
          ) && (
            <Tab className={styles.detailTab}>
              <IconBSDasri style={{ fontSize: "24px" }} />
              <span className={styles.detailTabCaption}>
                {form?.type === BsdasriType.Grouping
                  ? "Bsd groupés"
                  : "Bsds associés"}
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
          {/* Other actors tab panel */}
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

          {/* Intermdiaries tab panel */}
          {Boolean(form?.intermediaries?.length) && (
            <TabPanel className={styles.detailTabPanel}>
              <Intermediaries intermediaries={form?.intermediaries} />
            </TabPanel>
          )}

          {form?.type === BsdasriType.Grouping && (
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <InitialDasris initialBsdasris={form?.grouping} />
              </div>
            </TabPanel>
          )}
          {form?.type === BsdasriType.Synthesis && (
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <InitialDasris initialBsdasris={form?.synthesizing} />
              </div>
            </TabPanel>
          )}
        </div>
      </Tabs>
      <DasriIdentificationNumbers
        identificationNumbers={form?.identification?.numbers}
      />
      <div className={styles.detailActions}>
        {form.type === BsdasriType.Simple &&
          permissions.includes(UserPermission.BsdCanCreate) && (
            <button
              className="btn btn--outline-primary"
              onClick={() => duplicate()}
            >
              <IconDuplicateFile size="24px" color="blueLight" />
              <span>Dupliquer</span>
            </button>
          )}
      </div>
    </div>
  );
}

const DasriIdentificationNumbers = ({ identificationNumbers }) =>
  !!identificationNumbers ? (
    <div className={styles.BsdasriIdentificationNumbersRow}>
      <dt>Identifiants de containers : </dt>
      <dd>{identificationNumbers ? identificationNumbers.join(", ") : null}</dd>
    </div>
  ) : null;

const Dasripackaging = ({
  packagings
}: {
  packagings: BsdasriPackaging[] | null | undefined;
}) => {
  if (!packagings) {
    return null;
  }
  return (
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
              <td className="tw-whitespace-no-wrap">{row.volume} l</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const verbosePackagings = {
  BOITE_CARTON: "Caisse en carton avec sac en plastique",
  FUT: "Fûts ou jerrican à usage unique",
  BOITE_PERFORANTS: "Boîtes et Mini-collecteurs pour déchets perforants",
  GRAND_EMBALLAGE: "Grand emballage",
  GRV: "Grand récipient pour vrac",
  AUTRE: "Autre"
};
const getVerbosePackagingType = (type: string) => verbosePackagings[type];

const AcceptationStatusRow = ({
  value = null
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

const AssociatedTo = ({ formId, label }: { formId: string; label: string }) => {
  const [downloadPdf] = useDownloadPdf({
    variables: { id: formId }
  });

  return (
    <DetailRow
      value={
        <span>
          {formId}
          <button className="link tw-flex" onClick={() => downloadPdf()}>
            <IconPdf size="18px" color="blueLight" />
            <span className={classNames(styles.downloadLink, "tw-ml-1")}>
              Pdf
            </span>
          </button>
        </span>
      }
      label={`${label} bordereau n°`}
    />
  );
};
