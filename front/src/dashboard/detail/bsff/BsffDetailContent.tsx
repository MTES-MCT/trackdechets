import {
  IconBSFF,
  IconPaperWrite,
  IconPdf,
  IconRenewableEnergyEarth,
  IconTrash,
  IconWarehouseDelivery,
  IconWaterDam,
} from "common/components/Icons";
import {
  Bsff,
  BsffStatus,
  BsffType,
  FormCompany,
  WasteAcceptationStatus,
} from "generated/graphql/types";
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
import { transportModeLabels } from "dashboard/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { formatDate } from "common/datetime";
import { PACKAGINGS_NAMES } from "form/bsff/components/packagings/Packagings";

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
              {[
                BsffType.Groupement,
                BsffType.Reconditionnement,
                BsffType.Reexpedition,
              ].includes(form.type) && (
                <DetailRow
                  value={
                    form.type === BsffType.Groupement
                      ? "Groupement"
                      : form.type === BsffType.Reconditionnement
                      ? "Reconditionnement"
                      : form.type === BsffType.Reexpedition
                      ? "Réexpédition"
                      : ""
                  }
                  label="Type"
                />
              )}
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
              <IconBSFF />
              <span className={styles.detailTabCaption}>Contenants</span>
            </Tab>
            {form.ficheInterventions?.length > 0 && (
              <Tab className={styles.detailTab}>
                <IconRenewableEnergyEarth size="25px" />
                <span className={styles.detailTabCaption}>FIs</span>
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

            {/* Recipient  tab panel */}
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <Destination form={form} />
              </div>
            </TabPanel>

            {/* Packagings tab panel */}
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <Packagings form={form} />
              </div>
            </TabPanel>

            {/* Fiche d'interventions */}
            {form.ficheInterventions?.length > 0 && (
              <TabPanel className={styles.detailTabPanel}>
                <div className={styles.detailColumns}>
                  <FicheInterventions form={form} />
                </div>
              </TabPanel>
            )}
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
        {form.packagings?.length === 1 && (
          <DetailRow
            value={`${form.packagings[0].name} ${form.packagings[0].numero} (${form.packagings[0].weight}kg)`}
            label="Conditionnement"
          />
        )}

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
        <DetailRow
          value={
            form.transporter?.transport?.mode
              ? transportModeLabels[form.transporter.transport.mode]
              : ""
          }
          label="Mode de transport"
        />
        <DetailRow
          value={form.transporter?.transport?.plates?.join(", ")}
          label="Plaques d'immatriculation"
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
        <DetailRow value={form.destination?.cap} label="CAP" />
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
        <DetailRow
          value={form.destination?.reception?.signature?.author}
          label="Réception signée par"
        />
        {form.packagings?.length === 1 &&
          !!form.packagings[0].acceptation?.signature?.date && (
            <>
              {form.packagings[0].acceptation?.status ===
              WasteAcceptationStatus.Accepted ? (
                <>
                  <DateRow
                    value={form.packagings[0].acceptation?.date}
                    label="Accepté le"
                  />
                  <DetailRow
                    value={form.packagings[0].acceptation?.signature?.author}
                    label="Accepté par"
                  />
                  <DetailRow
                    value={form.packagings[0].acceptation?.weight}
                    label="Quantité acceptée"
                    units="kg"
                  />
                </>
              ) : (
                <>
                  <DateRow
                    value={form.packagings[0].acceptation?.date}
                    label="Refusé le"
                  />
                  <DetailRow
                    value={form.packagings[0].acceptation?.signature?.author}
                    label="Refusé par"
                  />
                  <DetailRow
                    value={form.packagings[0].acceptation?.refusalReason}
                    label="Raison du refus"
                  />
                </>
              )}
              <DetailRow
                value={form.packagings[0].acceptation?.wasteCode}
                label="Code déchet"
              />
              <DetailRow
                value={form.packagings[0].acceptation?.wasteDescription}
                label="Description du déchet"
              />
            </>
          )}
      </div>
      {form.packagings?.length === 1 &&
        !!form.packagings[0].operation?.signature?.date && (
          <div className={styles.detailGrid}>
            <DetailRow
              value={`${form.packagings[0].operation?.code}${
                form.packagings[0].operation?.noTraceability
                  ? " (rupture de traçabilité)"
                  : ""
              }`}
              label="Opération de traitement"
            />
            <DateRow
              value={form.packagings[0].operation?.signature?.date}
              label="Traitement signé le"
            />
            <DetailRow
              value={form.packagings[0].operation?.signature?.author}
              label="Traitement signé par"
            />
            {!!form.packagings[0].operation?.nextDestination && (
              <>
                <DetailRow
                  value={
                    form.packagings[0].operation?.nextDestination
                      ?.plannedOperationCode
                  }
                  label="Opération ultérieure prévue"
                />
                <Company
                  label="Destination ultérieure prévue"
                  company={
                    form.packagings[0].operation?.nextDestination?.company
                  }
                />
              </>
            )}
          </div>
        )}
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

function Packagings({ form }: { form: Bsff }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Nom</TableHeaderCell>
          <TableHeaderCell>Numéro</TableHeaderCell>
          <TableHeaderCell>Quantité (kg)</TableHeaderCell>
          <TableHeaderCell>Volume (litres)</TableHeaderCell>
          <TableHeaderCell>Acceptation</TableHeaderCell>
          <TableHeaderCell>Opération</TableHeaderCell>
          <TableHeaderCell>Destination ultérieure</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {form.packagings.map(p => {
          return (
            <TableRow key={p.id}>
              <TableCell>
                {p.type === "OTHER" ? p.other : PACKAGINGS_NAMES[p.type]}
              </TableCell>
              <TableCell>{p.numero}</TableCell>
              <TableCell>{p.weight}</TableCell>
              <TableCell>{p.volume}</TableCell>
              {!!p.acceptation?.signature?.date ? (
                <TableCell>
                  {p.acceptation?.status === WasteAcceptationStatus.Accepted ? (
                    <>
                      <div>
                        Accepté le {formatDate(p.acceptation?.date ?? "")} par{" "}
                        {p.acceptation?.signature?.author}
                      </div>
                      <div>{`${p.acceptation?.weight} kg - ${p.acceptation?.wasteCode} (${p.acceptation?.wasteDescription})`}</div>
                    </>
                  ) : (
                    <>
                      <div>
                        Refusé le {formatDate(p.acceptation?.date ?? "")} par{" "}
                        {p.acceptation?.signature?.author}
                      </div>
                      <div>{p.acceptation?.refusalReason}</div>
                    </>
                  )}
                </TableCell>
              ) : (
                <TableCell> </TableCell>
              )}
              {!!p.operation?.signature?.date ? (
                <TableCell>
                  <div>
                    Traité le {formatDate(p.operation?.date ?? "")} par{" "}
                    {p.operation?.signature?.author}
                  </div>
                  <div>
                    {p.operation?.code} ({p?.operation?.description})
                  </div>
                  {p.operation?.noTraceability && (
                    <div>Rupture de traçabilité</div>
                  )}
                  {p.operation?.nextDestination?.company?.siret && (
                    <div>
                      Destination ultérieure prévue:{" "}
                      {p.operation?.nextDestination?.company?.name} (
                      {p.operation?.nextDestination?.company?.siret}) -{" "}
                      {p.operation?.nextDestination?.plannedOperationCode}
                    </div>
                  )}
                </TableCell>
              ) : (
                <TableCell> </TableCell>
              )}
              <TableCell>
                {p.nextBsffs.map(bsff => {
                  return (
                    <div>
                      <div>
                        {bsff.destination?.company?.name} - (
                        {bsff.destination?.company?.siret})
                      </div>
                    </div>
                  );
                })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
