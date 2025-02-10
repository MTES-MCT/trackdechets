import {
  IconBSFF,
  IconPaperWrite,
  IconPdf,
  IconRenewableEnergyEarth,
  IconTrash,
  IconWarehouseDelivery,
  IconWaterDam
} from "../../../Apps/common/Components/Icons/Icons";
import {
  Bsff,
  BsffPackagingType,
  BsffStatus,
  BsffType,
  FormCompany,
  OperationMode,
  WasteAcceptationStatus,
  UserPermission
} from "@td/codegen-ui";
import React, { useState } from "react";
import QRCodeIcon from "react-qr-code";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DateRow, DetailRow, Transporter } from "../common/Components";
import { usePermissions } from "../../../common/contexts/PermissionsContext";
import styles from "../common/BSDDetailContent.module.scss";
import { generatePath, Link, useParams } from "react-router-dom";
import routes from "../../../Apps/routes";
import { WorkflowAction } from "../../components/BSDList/BSFF/WorkflowAction";
import { DeleteBsffModal } from "../../components/BSDList/BSFF/BsffActions/DeleteModal";
import { useDownloadPdf } from "../../components/BSDList/BSFF/BsffActions/useDownloadPdf";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "../../../common/components";
import { formatDate } from "../../../common/datetime";
import { PACKAGINGS_NAMES } from "../../../form/bsff/components/packagings/Packagings";
import { getOperationModeLabel } from "../../../Apps/common/operationModes";
import { BSFF_VERBOSE_STATUSES } from "@td/constants";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};

type Props = { form: Bsff };

export function BsffDetailContent({ form: bsff }: Props) {
  const { siret = "" } = useParams<{ siret: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: bsff.id } });
  const { permissions } = usePermissions();

  const emitterLabel =
    bsff.type === BsffType.CollectePetitesQuantites
      ? "Opérateur"
      : bsff.type === BsffType.TracerFluide
      ? "Autre détenteur"
      : "Installation de tri, transit, regroupement";

  const contributors = [
    bsff.emitter?.company?.siret,
    bsff?.destination?.company?.siret,
    ...(bsff.transporters ?? []).map(t => t.company?.orgId)
  ];

  const isBsffContributor = siret
    ? contributors.filter(Boolean).includes(siret)
    : false;

  const totalWeight = bsff.packagings.reduce((w, p) => {
    if (p.acceptation?.weight) {
      return w + p.acceptation?.weight;
    }
    return w + p.weight;
  }, 0);

  const isMultiModal = bsff?.transporters.length > 1;

  let wasteCode = bsff.waste?.code;
  let wasteDescription = bsff.waste?.description;
  if (bsff.packagings.length === 1) {
    // TRA-11553 - Lorsqu'on a un BSFF avec un seul contenant, on veut que les informations
    // de l'acceptation de ce contenant s'affiche en lieu et place des informations
    // qui ont été renseignés sur le BSFF.
    wasteCode = bsff.packagings[0].acceptation?.wasteCode ?? bsff.waste?.code;
    wasteDescription =
      bsff.packagings[0].acceptation?.wasteDescription ??
      bsff.waste?.description;
  }

  return (
    <>
      <div>
        <div className={styles.detailSummary}>
          <h4 className={styles.detailTitle}>
            <IconBSFF className="tw-mr-2" />
            <span className={styles.detailStatus}>
              [{bsff.isDraft ? "Brouillon" : BSFF_VERBOSE_STATUSES[bsff.status]}
              ]
            </span>
            <span>{bsff.id}</span>
          </h4>

          <div className={styles.detailContent}>
            <div className={`${styles.detailQRCodeIcon}`}>
              <div className={styles.detailQRCode}>
                <QRCodeIcon value={bsff.id} size={96} />
                <span>Ce QR code contient le numéro du bordereau </span>
              </div>
            </div>
            <div className={styles.detailGrid}>
              {[
                BsffType.Groupement,
                BsffType.Reconditionnement,
                BsffType.Reexpedition
              ].includes(bsff.type) && (
                <DetailRow
                  value={
                    bsff.type === BsffType.Groupement
                      ? "Groupement"
                      : bsff.type === BsffType.Reconditionnement
                      ? "Reconditionnement"
                      : bsff.type === BsffType.Reexpedition
                      ? "Réexpédition"
                      : ""
                  }
                  label="Type"
                />
              )}
              <DetailRow value={totalWeight} label="Poids total" units="kg" />
              <DetailRow
                value={`${wasteCode} ${wasteDescription}`}
                label="Déchet"
              />
            </div>
          </div>
        </div>

        <Tabs selectedTabClassName={styles.detailTabSelected}>
          {/* Tabs menu */}
          <TabList className={styles.detailTabs}>
            {bsff.ficheInterventions?.length > 0 && (
              <Tab className={styles.detailTab}>
                <IconRenewableEnergyEarth size="25px" />
                <span className={styles.detailTabCaption}>Détenteur(s)</span>
              </Tab>
            )}
            <Tab className={styles.detailTab}>
              <IconWaterDam size="25px" />
              <span className={styles.detailTabCaption}>{emitterLabel}</span>
            </Tab>

            {bsff.transporters?.map((t, idx) => (
              <Tab className={styles.detailTab} key={t.id}>
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
            <Tab className={styles.detailTab}>
              <IconBSFF />
              <span className={styles.detailTabCaption}>Contenant(s)</span>
            </Tab>
          </TabList>
          {/* Tabs content */}
          <div className={styles.detailTabPanels}>
            {/* Fiche d'interventions */}
            {bsff.ficheInterventions?.length > 0 && (
              <TabPanel className={styles.detailTabPanel}>
                <div className={styles.detailColumns}>
                  <FicheInterventions form={bsff} />
                </div>
              </TabPanel>
            )}
            {/* Emitter tab panel */}
            <TabPanel className={styles.detailTabPanel}>
              <Emitter form={bsff} />
            </TabPanel>

            {/* Transporters tab panels */}

            {bsff.transporters?.map((transporter, idx) => (
              <TabPanel className={styles.detailTabPanel} key={transporter.id}>
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
                <Destination form={bsff} />
              </div>
            </TabPanel>

            {/* Packagings tab panel */}
            <TabPanel className={styles.detailTabPanel}>
              <div className={styles.detailColumns}>
                <Packagings form={bsff} />
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
          {[BsffStatus.Initial].includes(bsff.status) && isBsffContributor && (
            <>
              {permissions.includes(UserPermission.BsdCanDelete) && (
                <button
                  className="btn btn--outline-primary"
                  onClick={() => setIsDeleting(true)}
                >
                  <IconTrash color="blueLight" size="24px" />
                  <span>Supprimer</span>
                </button>
              )}

              {permissions.includes(UserPermission.BsdCanUpdate) && (
                <Link
                  to={generatePath(routes.dashboard.bsffs.edit, {
                    siret,
                    id: bsff.id
                  })}
                  className="btn btn--outline-primary"
                >
                  <IconPaperWrite size="24px" color="blueLight" />
                  <span>Modifier</span>
                </Link>
              )}
            </>
          )}
          <WorkflowAction
            form={{
              ...bsff,
              id: bsff.id,
              bsffStatus: bsff.status,
              bsffDestination: {
                company: {
                  siret: bsff.destination?.company?.siret ?? undefined,
                  name: bsff.destination?.company?.name ?? undefined
                }
              },
              bsffEmitter: {
                company: {
                  siret: bsff.emitter?.company?.siret ?? undefined,
                  name: bsff.emitter?.company?.name ?? undefined
                }
              },
              bsffTransporter: {
                company: {
                  orgId: bsff.transporter?.company?.orgId!,
                  siret: bsff.transporter?.company?.orgId ?? undefined,
                  name: bsff.transporter?.company?.name ?? undefined
                }
              },
              waste: {
                code: bsff.waste?.code,
                description: bsff.waste?.description ?? undefined
              }
            }}
          />
        </div>
      </div>
      {isDeleting && (
        <DeleteBsffModal
          formId={bsff.id}
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
      <dt>Numéro de TVA</dt> <dd>{company?.vatNumber}</dd>
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
        <Company label="Raison sociale" company={form.emitter?.company} />
      </div>

      <div className={styles.detailGrid}>
        {form.packagings?.length === 1 && (
          <DetailRow
            value={`${
              form.packagings[0].type === BsffPackagingType.Autre
                ? form.packagings[0].other
                : form.packagings[0].type
            } ${form.packagings[0].numero} (${form.packagings[0].weight}kg)`}
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

function Destination({ form }: { form: Bsff }) {
  return (
    <>
      <div className={styles.detailGrid}>
        <Company label="Raison sociale" company={form.destination?.company} />
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
                    label="Acceptation signée par"
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
                    label="Refus signé par"
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
              value={form.packagings[0].operation?.date}
              label="Traitement réalisé le"
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
            label={
              ficheIntervention.detenteur?.isPrivateIndividual
                ? "Nom (particulier)"
                : "Raison sociale"
            }
            value={ficheIntervention.detenteur?.company?.name}
          />
          <DetailRow
            label="N°SIRET"
            value={ficheIntervention.detenteur?.company?.siret}
          />
          <DetailRow
            label="Numéro fiche d'intervention"
            value={ficheIntervention.numero}
          />
          <DetailRow
            label="Quantité fluides en kg"
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
                {p.type === "AUTRE" ? p.other : PACKAGINGS_NAMES[p.type]}
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
                    <br />
                    {getOperationModeLabel(p?.operation?.mode as OperationMode)}
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
