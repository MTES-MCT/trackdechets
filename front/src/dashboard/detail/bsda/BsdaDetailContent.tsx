import {
  IconBSDa,
  IconDuplicateFile,
  IconPdf,
  IconRenewableEnergyEarth,
  IconWarehouseDelivery,
  IconWarehousePackage,
  IconWaterDam
} from "../../../Apps/common/Components/Icons/Icons";
import routes from "../../../Apps/routes";
import { useDownloadPdf } from "../../components/BSDList/BSDa/BSDaActions/useDownloadPdf";
import { useDuplicate } from "../../components/BSDList/BSDa/BSDaActions/useDuplicate";
import styles from "../common/BSDDetailContent.module.scss";
import {
  DateRow,
  DetailRow,
  YesNoRow,
  Transporter
} from "../common/Components";
import { getVerboseAcceptationStatus } from "../common/utils";
import {
  Bsda,
  BsdaNextDestination,
  BsdaType,
  FormCompany,
  OperationMode,
  UserPermission
} from "@td/codegen-ui";
import React, { useMemo } from "react";
import QRCodeIcon from "react-qr-code";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { InitialBsdas } from "./InitialBsdas";
import { getOperationModeLabel } from "../../../Apps/common/operationModes";
import EstimatedQuantityTooltip from "../../../common/components/EstimatedQuantityTooltip";
import { BSDA_VERBOSE_STATUSES } from "@td/constants";
import ExpandableList from "./ExpandableList";
import { usePermissions } from "../../../common/contexts/PermissionsContext";
import { getPackagingInfosSummary } from "../../../Apps/common/utils/packagingsBsddSummary";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};
export const Company = ({ company, label }: CompanyProps) => (
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

type SlipDetailContentProps = {
  form: Bsda;
  children?: React.ReactNode;
  refetch?: () => void;
};

const Emitter = ({ form }: { form: Bsda }) => {
  const { emitter, ecoOrganisme } = form;
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        {emitter?.isPrivateIndividual ? (
          <>
            <DetailRow
              value={emitter?.company?.name}
              label="Nom de l'émetteur (particulier)"
            />
            <DetailRow
              value={emitter?.company?.address}
              label="Adresse de l'émetteur (particulier)"
            />
            <DetailRow
              value={emitter?.company?.phone}
              label="Téléphone de l'émetteur (particulier)"
            />
            <DetailRow
              value={emitter?.company?.mail}
              label="Email de l'émetteur (particulier)"
            />
          </>
        ) : (
          <Company label="Émetteur" company={emitter?.company} />
        )}
        <DetailRow
          value={emitter?.pickupSite?.name}
          label="Nom du chantier/collecte"
        />
        {!!emitter?.pickupSite?.address && (
          <>
            <dt>Adresse chantier/collecte</dt>
            <dd>
              {emitter?.pickupSite?.address} {emitter?.pickupSite?.postalCode}{" "}
              {emitter?.pickupSite?.city}
            </dd>
          </>
        )}
        <DetailRow
          value={emitter?.pickupSite?.infos}
          label="Informations complémentaires"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={
            ecoOrganisme?.name && `${ecoOrganisme.name} (${ecoOrganisme.siret})`
          }
          label="Eco-organisme"
        />
        <DetailRow value={emitter?.customInfo} label="Champ libre émetteur" />
        <DateRow value={emitter?.emission?.signature?.date} label="Signé le" />
        <DetailRow
          value={emitter?.emission?.signature?.author}
          label="Signé par"
        />
      </div>
    </div>
  );
};

const Worker = ({ form }: { form: Bsda }) => {
  const { worker } = form;
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <Company label="Entreprise de travaux" company={worker?.company} />
      </div>
      {worker?.certification && (
        <div className={styles.detailGrid}>
          <YesNoRow
            value={worker.certification?.hasSubSectionFour}
            label="Travaux relevant de la sous-section 4"
          />
          <YesNoRow
            value={worker.certification?.hasSubSectionThree}
            label="Travaux relevant de la sous-section 3"
          />
          {worker.certification?.hasSubSectionThree && (
            <>
              <DetailRow
                value={worker?.certification?.certificationNumber}
                label="Numéro de certification"
              />
              <DetailRow
                value={worker?.certification?.organisation}
                label="Organisme de certification"
              />
              <DateRow
                value={worker?.certification?.validityLimit}
                label="Date de validité"
              />
            </>
          )}
        </div>
      )}
      <div className={styles.detailGrid}>
        <DateRow value={worker?.work?.signature?.date} label="Signé le" />
        <DetailRow value={worker?.work?.signature?.author} label="Signé par" />
      </div>
    </div>
  );
};

const Recipient = ({ form }: { form: Bsda }) => {
  const { destination } = form;

  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={destination?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={destination?.customInfo}
          label="Champ libre destinataire"
        />
        <DetailRow value={destination?.cap} label="CAP" />
        <DetailRow
          value={destination?.reception?.weight}
          label="Poids reçu"
          units="tonne(s)"
        />
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
        <DateRow
          value={destination?.reception?.date}
          label="Réception effectuée le"
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
          value={destination?.plannedOperationCode}
          label="Opération de traitement prévue"
        />
        <DetailRow
          value={destination?.operation?.code}
          label="Opération de traitement réalisée"
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
      <DetailRow value={broker.recepisse?.number} label="Récépissé" />
      <DetailRow value={broker.recepisse?.department} label="Départment" />
      <DateRow
        value={broker.recepisse?.validityLimit}
        label="Date de validité"
      />
    </div>
  </div>
);

const NextDestination = ({
  nextDestination,
  forwardedIn,
  groupedIn
}: {
  nextDestination: BsdaNextDestination;
  forwardedIn?: Bsda | null;
  groupedIn?: Bsda | null;
}) => (
  <div className={styles.detailColumns}>
    <div className={styles.detailGrid}>
      <dt>Exutoire final</dt>
      <dd>{nextDestination.company?.name}</dd>

      <dt>Siret</dt>
      <dd>{nextDestination.company?.siret}</dd>

      <dt>Adresse</dt>
      <dd>{nextDestination.company?.address}</dd>

      <dt>Tél</dt>
      <dd>{nextDestination.company?.phone}</dd>

      <dt>Mél</dt>
      <dd>{nextDestination.company?.mail}</dd>

      <dt>Contact</dt>
      <dd>{nextDestination.company?.contact}</dd>
    </div>

    <div className={styles.detailGrid}>
      <DetailRow value={nextDestination.cap} label="CAP" />

      <DetailRow
        value={nextDestination.plannedOperationCode}
        label="Opération de traitement prévue"
      />

      <DetailRow value={forwardedIn?.id ?? groupedIn?.id} label="Annexé dans" />
    </div>
  </div>
);

const NextBsda = ({ bsda }: { bsda: Bsda }) => {
  const [downloadPdf] = useDownloadPdf({});
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <dt>N°</dt>
        <dd>{bsda.id}</dd>

        <dt>Code déchet</dt>
        <dd>{bsda.waste?.code}</dd>

        <dt>CAP</dt>
        <dd>{bsda.destination?.cap}</dd>
        {!bsda.isDraft && (
          <>
            <dt>PDF</dt>
            <dd>
              <button
                type="button"
                className="btn btn--slim btn--small btn--outline-primary"
                onClick={() => downloadPdf({ variables: { id: bsda.id } })}
              >
                <IconPdf size="18px" color="blueLight" />
                <span>Pdf</span>
              </button>
            </dd>
          </>
        )}
      </div>
    </div>
  );
};

const Intermediaries = ({ intermediaries }) => (
  <>
    {intermediaries.map(intermediary => (
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
    ))}
  </>
);

export default function BsdaDetailContent({ form }: SlipDetailContentProps) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  const [duplicate] = useDuplicate({
    variables: { id: form.id },
    onCompleted: () => {
      navigate(
        generatePath(routes.dashboard.bsds.drafts, {
          siret
        })
      );
    }
  });
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });
  const initialBsdas = form.forwarding ? [form.forwarding] : form.grouping;
  const isMultiModal = form?.transporters.length > 1;

  const conditionnement = useMemo(
    () => (form.packagings ? getPackagingInfosSummary(form.packagings) : ""),
    [form.packagings]
  );

  return (
    <div className={styles.detail}>
      <div className={styles.detailSummary}>
        <h4 className={styles.detailTitle}>
          <IconBSDa className="tw-mr-2" />
          <span className={styles.detailStatus}>
            [{form.isDraft ? "Brouillon" : BSDA_VERBOSE_STATUSES[form.status]}]
          </span>
          <span>
            {form.id} {form.isDraft && " (Brouillon)"}
          </span>
          {!!form?.grouping?.length && <span> - Bordereau de groupement</span>}
          {form?.type === BsdaType.Reshipment && (
            <span> - Bordereau de réexpédition</span>
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
            <dt>Code déchet</dt>
            <dd>{form.waste?.code}</dd>
            <dt>Description du déchet</dt>
            <dd>{form.waste?.materialName}</dd>
            <dt>Code famille</dt>
            <dd>{form.waste?.familyCode}</dd>
            <dt>
              Poids {form.destination?.reception?.weight ? "reçu" : "envoyé"}
            </dt>
            <dd>
              {form.destination?.reception?.weight ? (
                <>{form.destination?.reception?.weight} tonne(s)</>
              ) : (
                <>
                  {form?.weight?.value} tonne(s) (
                  {form?.weight?.isEstimate ? (
                    <>
                      estimé
                      <EstimatedQuantityTooltip />
                    </>
                  ) : (
                    "réel"
                  )}
                  )
                </>
              )}
            </dd>
          </div>

          <div className={styles.detailGrid}>
            <dt>Mention ADR</dt>
            <dd>{form?.waste?.adr}</dd>

            <dt>Mention RID, ADNR, IMDG</dt>
            <dd>{form?.waste?.nonRoadRegulationMention}</dd>

            <dt>Conditionnement</dt>
            <dd>{conditionnement}</dd>

            <dt>Scellés</dt>
            <dd>
              <ExpandableList elements={form?.waste?.sealNumbers} />
            </dd>

            <dt>Présence de POP</dt>
            <dd>{form?.waste?.pop ? "Oui" : "Non"}</dd>
          </div>

          <div className={styles.detailGrid}>
            {Boolean(form?.grouping?.length) && (
              <>
                <dt>Bordereaux groupés</dt>
                <dd>
                  <ExpandableList elements={form?.grouping?.map(g => g.id)} />
                </dd>
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

          {!!form?.worker?.company?.name && (
            <Tab className={styles.detailTab}>
              <IconWaterDam size="25px" />
              <span className={styles.detailTabCaption}>
                Entreprise de travaux
              </span>
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

          <Tab className={styles.detailTab}>
            <IconRenewableEnergyEarth size="25px" />
            <span className={styles.detailTabCaption}>Destinataire</span>
          </Tab>

          {!!form?.destination?.operation?.nextDestination?.company?.name && (
            <Tab className={styles.detailTab}>
              <IconRenewableEnergyEarth size="25px" />
              <span className={styles.detailTabCaption}>
                <span>Exutoire final</span>
              </span>
            </Tab>
          )}

          {(form?.forwardedIn?.id || form?.groupedIn?.id) && (
            <Tab className={styles.detailTab}>
              <IconBSDa style={{ fontSize: "25px" }} />
              <span className={styles.detailTabCaption}>
                <span>BSDA suite</span>
              </span>
            </Tab>
          )}

          {!!initialBsdas?.length && (
            <Tab className={styles.detailTab}>
              <IconBSDa style={{ fontSize: "25px" }} />
              <span className={styles.detailTabCaption}>
                <span>Bsdas associés</span>
              </span>
            </Tab>
          )}

          {Boolean(form?.intermediaries?.length) && (
            <Tab className={styles.detailTab}>
              <IconWarehousePackage size="25px" />
              <span className={styles.detailTabCaption}>Intermédiaires</span>
            </Tab>
          )}
        </TabList>
        {/* Tabs content */}
        <div className={styles.detailTabPanels}>
          {/* Emitter tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <Emitter form={form} />
          </TabPanel>

          {/* Worker tab panel */}
          {!!form?.worker?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <Worker form={form} />
            </TabPanel>
          )}

          {/* Broker tab panel */}
          {!!form?.broker?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <Broker broker={form.broker} />
            </TabPanel>
          )}

          {/* Transporters tab panels */}

          {form.transporters?.map((transporter, idx) => (
            <TabPanel className={styles.detailTabPanel}>
              <Transporter
                transporter={transporter}
                numero={idx + 1}
                isMultiModal={isMultiModal}
              />
            </TabPanel>
          ))}

          {/* Recipient  tab panel */}
          <TabPanel className={styles.detailTabPanel}>
            <div className={styles.detailColumns}>
              <Recipient form={form} />
            </div>
          </TabPanel>

          {/* Next destination tab panel */}
          {!!form?.destination?.operation?.nextDestination?.company?.name && (
            <TabPanel className={styles.detailTabPanel}>
              <NextDestination
                nextDestination={form?.destination?.operation?.nextDestination}
                forwardedIn={form.forwardedIn}
                groupedIn={form.groupedIn}
              />
            </TabPanel>
          )}

          {(form?.forwardedIn?.id || form?.groupedIn?.id) && (
            <TabPanel className={styles.detailTabPanel}>
              <NextBsda bsda={form.forwardedIn ?? form.groupedIn!} />
            </TabPanel>
          )}

          {!!initialBsdas?.length && (
            <TabPanel className={styles.detailTabPanel}>
              <InitialBsdas bsdas={initialBsdas} />
            </TabPanel>
          )}

          {/* Intermdiaries tab panel */}
          {Boolean(form?.intermediaries?.length) && (
            <TabPanel className={styles.detailTabPanel}>
              <Intermediaries intermediaries={form?.intermediaries} />
            </TabPanel>
          )}
        </div>
      </Tabs>
      <div className={styles.detailActions}>
        {!form.isDraft && (
          <button
            type="button"
            className="btn btn--outline-primary"
            onClick={() => downloadPdf()}
          >
            <IconPdf size="24px" color="blueLight" />
            <span>Pdf</span>
          </button>
        )}
        {permissions.includes(UserPermission.BsdCanCreate) && (
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
