import {
  IconBSFF,
  IconPaperWrite,
  IconPdf,
  IconRenewableEnergyEarth,
  IconTrash,
  IconWarehouseDelivery,
  IconWaterDam,
} from "common/components/Icons";
import { Bsff, BsffStatus, FormCompany } from "generated/graphql/types";
import React, { useState } from "react";
import QRCodeIcon from "react-qr-code";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

import { bsffVerboseStatuses } from "form/bsff/utils/constants";
import { DateRow, DetailRow } from "../common/Components";

import styles from "../common/BSDDetailContent.module.scss";
import { generatePath, Link, useParams } from "react-router-dom";
import routes from "common/routes";
import { WorkflowAction } from "dashboard/components/BSDList/BSFF/WorkflowAction";
import { DeleteBsffModal } from "dashboard/components/BSDList/BSFF/BsffActions/DeleteModal";
import { useDownloadPdf } from "dashboard/components/BSDList/BSFF/BsffActions/useDownloadPdf";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};

type Props = { form: Bsff };

export function BsffDetailContent({ form }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  return (
    <>
      <div>
        <div className={styles.detailSummary}>
          <h4 className={styles.detailTitle}>
            <IconBSFF className="tw-mr-2" />
            <span className={styles.detailStatus}>
              [{form.isDraft ? "Brouillon" : bsffVerboseStatuses[form.status]}]
            </span>
            <span>{form.id}</span>
          </h4>

          <div className={styles.detailContent}>
            <div className={`${styles.detailQRCodeIcon}`}>
              <div className={styles.detailQRCode}>
                <QRCodeIcon value={form.id} size={96} />
                <span>Ce QR code contient le numéro du bordereau </span>
              </div>
            </div>
            <div className={styles.detailGrid}>
              {/* <DateRow
              value={form.updatedAt}
              label="Dernière action sur le BSD"
            /> */}
              <DetailRow
                value={form.weight?.value}
                label="Poids total"
                units="kg"
              />
              <dt>Déchet</dt>
              <dd>
                {form.waste?.code} {form.waste?.description}
              </dd>
            </div>
          </div>
        </div>

        <Tabs selectedTabClassName={styles.detailTabSelected}>
          {/* Tabs menu */}
          <TabList className={styles.detailTabs}>
            <Tab className={styles.detailTab}>
              <IconWaterDam size="25px" />
              <span className={styles.detailTabCaption}>Émetteur</span>
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

            <Tab className={styles.detailTab}>
              <IconRenewableEnergyEarth size="25px" />
              <span className={styles.detailTabCaption}>FIs</span>
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

            {/* Fiche d'interventions */}
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <FicheInterventions form={form} />
              </div>
            </TabPanel>
          </div>
        </Tabs>
        <div className={styles.detailActions}>
          <button
            type="button"
            className="btn btn--outline-primary"
            onClick={() => downloadPdf()}
          >
            <IconPdf size="24px" color="blueLight" />
            <span>Pdf</span>
          </button>
          {[BsffStatus.Initial].includes(form.status) && (
            <>
              <button
                className="btn btn--outline-primary"
                onClick={() => setIsDeleting(true)}
              >
                <IconTrash color="blueLight" size="24px" />
                <span>Supprimer</span>
              </button>

              <Link
                to={generatePath(routes.dashboard.bsffs.edit, {
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
          <WorkflowAction
            siret={siret}
            form={{
              ...form,
              id: form.id,
              bsffStatus: form.status,
              bsffDestination: {
                company: {
                  siret: form.destination?.company?.siret ?? undefined,
                  name: form.destination?.company?.name ?? undefined,
                },
              },
              bsffEmitter: {
                company: {
                  siret: form.emitter?.company?.siret ?? undefined,
                  name: form.emitter?.company?.name ?? undefined,
                },
              },
              bsffTransporter: {
                company: {
                  siret: form.transporter?.company?.siret ?? undefined,
                  name: form.transporter?.company?.name ?? undefined,
                },
              },
              waste: {
                code: form.waste?.code,
                description: form.waste?.description ?? undefined,
              },
            }}
          />
        </div>
      </div>
      {isDeleting && (
        <DeleteBsffModal
          formId={form.id}
          isOpen
          onClose={() => setIsDeleting(false)}
        />
      )}
    </>
  );
}

function Company({ company, label }: CompanyProps) {
  return (
    <>
      <dt>{label}</dt> <dd>{company?.name}</dd>
      <dt>Siret</dt> <dd>{company?.siret}</dd>
      <dt>Adresse</dt> <dd>{company?.address}</dd>
      <dt>Tél</dt> <dd>{company?.phone}</dd>
      <dt>Mél</dt> <dd>{company?.mail}</dd>
      <dt>Contact</dt> <dd>{company?.contact}</dd>
    </>
  );
}

function Emitter({ form }: { form: Bsff }) {
  return (
    <div className={styles.detailColumns}>
      <div className={styles.detailGrid}>
        <Company label="Émetteur" company={form.emitter?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={(form.packagings ?? [])
            .map(
              packaging =>
                `${packaging.name} ${packaging.numero} (${packaging.weight}kg)`
            )
            .join(", ")}
          label="Conditionnement"
        />

        <DetailRow value={form.weight?.value} label="Poids total" units="kg" />
      </div>
      <div className={styles.detailGrid}>
        <DateRow
          value={form.emitter?.emission?.signature?.date}
          label="Signé le"
        />
        <DetailRow
          value={form.emitter?.emission?.signature?.author}
          label="Signé par"
        />
      </div>
    </div>
  );
}

function Transporter({ form }: { form: Bsff }) {
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Transporteur" company={form.transporter?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={form.transporter?.recepisse?.number}
          label="Numéro de récépissé"
        />
        <DetailRow
          value={form.transporter?.recepisse?.department}
          label="Département"
        />
        <DateRow
          value={form.transporter?.recepisse?.validityLimit}
          label="Date de validité"
        />
      </div>
      <div className={`${styles.detailGrid} `}>
        <DateRow
          value={form.transporter?.transport?.signature?.date}
          label="Signé le"
        />
        <DetailRow
          value={form.transporter?.transport?.signature?.author}
          label="Signé par"
        />
      </div>
    </>
  );
}

function Destination({ form }: { form: Bsff }) {
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Destinataire" company={form.destination?.company} />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={form.destination?.plannedOperationCode}
          label="Opération prévue"
        />
      </div>
      <div className={styles.detailGrid}>
        <DateRow value={form.destination?.reception?.date} label="Reçu le" />
        <DateRow
          value={form.destination?.reception?.signature?.date}
          label="Réception signée le"
        />
        <DateRow
          value={form.destination?.reception?.signature?.author}
          label="Réception signée par"
        />
      </div>
      <div className={styles.detailGrid}>
        <DetailRow
          value={form.destination?.operation?.code}
          label="Opération de traitement"
        />

        <DetailRow
          value={form.destination?.operation?.signature?.author}
          label="Traitement signé par"
        />
        <DateRow
          value={form.destination?.operation?.signature?.date}
          label="Traitement signé le"
        />
      </div>
    </>
  );
}

function FicheInterventions({ form }: { form: Bsff }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {form.ficheInterventions.map(ficheIntervention => (
        <div
          key={ficheIntervention.id}
          className={styles.detailGrid}
          style={{ flex: "0 0 50%", padding: "0 0 2rem 0", margin: "0" }}
        >
          <DetailRow
            label="Numéro fiche d'intervention"
            value={ficheIntervention.numero}
          />
          <DetailRow
            label="Quantité fluides en kilo(s)"
            value={ficheIntervention.weight}
          />
          <DetailRow
            label="Code postal lieu de collecte"
            value={ficheIntervention.postalCode}
          />
        </div>
      ))}
    </div>
  );
}
