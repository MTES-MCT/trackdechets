import React, { useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import toast from "react-hot-toast";
import {
  MFA_RESET_REQUESTS_ADMIN,
  MFA_RESET_REQUEST_SUMMARY,
  CREATE_MFA_RESET_REQUEST,
  CANCEL_MFA_RESET_REQUEST
} from "../../Apps/common/queries/mfaResetRequest/mfaResetRequest";
import { formatDateViewDisplay } from "../../Apps/Companies/common/utils";

// ─── Status helpers (même pattern que CompanyAdminRequestsTable) ──────────────

type MfaResetStatus = "PENDING" | "DONE" | "CANCELLED" | "FAILED";

const STATUS_LABELS: Record<MfaResetStatus, string> = {
  PENDING: "En attente",
  DONE: "Réalisée",
  CANCELLED: "Annulée",
  FAILED: "Échouée"
};

const STATUS_SEVERITY: Record<MfaResetStatus, AlertProps.Severity> = {
  PENDING: "info",
  DONE: "success",
  CANCELLED: "warning",
  FAILED: "error"
};

const getStatusBadge = (status: MfaResetStatus) => (
  <Badge severity={STATUS_SEVERITY[status]} small>
    {STATUS_LABELS[status]}
  </Badge>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export function MfaResetAdmin() {
  // ── Création ──
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);

  // ── Pagination ──
  const [pageIndex, setPageIndex] = useState(0);

  // ── Query : résumé pré-validation (lazy) ──
  const [
    fetchSummary,
    { data: summaryData, loading: summaryLoading, error: summaryError }
  ] = useLazyQuery(MFA_RESET_REQUEST_SUMMARY, { fetchPolicy: "network-only" });

  // ── Query : liste paginée ──
  const {
    data: listData,
    loading: listLoading,
    refetch: refetchList
  } = useQuery(MFA_RESET_REQUESTS_ADMIN, {
    fetchPolicy: "network-only",
    variables: { skip: 0, first: PAGE_SIZE }
  });

  // ── Mutation : création ──
  const [createRequest, { loading: createLoading }] = useMutation(
    CREATE_MFA_RESET_REQUEST,
    {
      onCompleted: () => {
        toast.success("Demande de réinitialisation MFA créée.");
        resetCreateForm();
        refetchList({ skip: 0, first: PAGE_SIZE });
      },
      onError: e => toast.error(e.message)
    }
  );

  // ── Mutation : annulation ──
  const [cancelRequest, { loading: cancelLoading }] = useMutation(
    CANCEL_MFA_RESET_REQUEST,
    {
      onCompleted: () => {
        toast.success("Demande annulée. La suspension du compte est levée.");
        refetchList({ skip: 0, first: PAGE_SIZE });
      },
      onError: e => toast.error(e.message)
    }
  );

  // ── Données dérivées ──
  const summary = summaryData?.mfaResetRequestSummary;
  const requests =
    listData?.mfaResetRequestsAdmin?.edges?.map(
      (e: { node: unknown }) => e.node
    ) ?? [];
  const totalCount = listData?.mfaResetRequestsAdmin?.totalCount ?? 0;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const canCreate =
    !!summary && !!summary.user && summary.hasMfa && !summary.hasPendingRequest;

  // ── Handlers ──

  function resetCreateForm() {
    setEmail("");
    setNote("");
    setSearchedEmail(null);
    setShowCreateForm(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSearchedEmail(trimmed);
    fetchSummary({ variables: { email: trimmed } });
  }

  function handleCreate() {
    if (!searchedEmail) return;
    createRequest({
      variables: { input: { email: searchedEmail, note: note.trim() || null } }
    });
  }

  function handleCancel(id: string) {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir annuler cette demande de réinitialisation MFA ? La suspension du compte sera levée immédiatement et la MFA restera active."
      )
    ) {
      return;
    }
    cancelRequest({ variables: { mfaResetRequestId: id } });
  }

  function gotoPage(page: number) {
    setPageIndex(page);
    refetchList({ skip: page * PAGE_SIZE, first: PAGE_SIZE });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <h3 className="fr-sr-only">Réinitialisation MFA</h3>

      {/* ── Bouton d'ouverture du formulaire ──────────────────────────────── */}
      {!showCreateForm && (
        <div className="fr-mb-4w">
          <Button priority="primary" onClick={() => setShowCreateForm(true)}>
            Créer une demande de réinitialisation MFA
          </Button>
        </div>
      )}

      {/* ── Formulaire de création ────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="fr-mb-4w">
          <h4 className="fr-h6 fr-mb-2w">
            Créer une demande de réinitialisation MFA
          </h4>

          {/* Recherche de l'email */}
          <form onSubmit={handleSearch}>
            <div className="fr-grid-row fr-grid-row--bottom">
              <div className="fr-col-sm-6 fr-col-lg-4 fr-col-xl-3 fr-pr-2w">
                <Input
                  label="Email du compte concerné"
                  nativeInputProps={{
                    type: "email",
                    value: email,
                    required: true,
                    placeholder: "utilisateur@exemple.fr",
                    onChange: e => {
                      setEmail(e.target.value);
                      if (
                        searchedEmail &&
                        e.target.value.trim() !== searchedEmail
                      ) {
                        setSearchedEmail(null);
                      }
                    }
                  }}
                />
              </div>
              <div className="fr-col-sm-6 fr-col-lg-2">
                <Button
                  priority="secondary"
                  type="submit"
                  disabled={summaryLoading}
                >
                  {summaryLoading ? "Recherche…" : "Rechercher"}
                </Button>
              </div>
            </div>
          </form>

          {/* Erreur de recherche */}
          {summaryError && (
            <Alert
              className="fr-mb-2w"
              small
              severity="error"
              description={summaryError.message}
            />
          )}

          {/* Récapitulatif pré-validation */}
          {summary && searchedEmail && (
            <div className="fr-mb-2w">
              {!summary.user ? (
                <Alert
                  className="fr-mb-2w"
                  small
                  severity="error"
                  description="Aucun compte trouvé pour cet email."
                />
              ) : (
                <>
                  <p className="fr-mb-1w">
                    <strong>Compte :</strong> {summary.user.name} (
                    {summary.user.email})
                  </p>
                  <p className="fr-mb-1w">
                    <strong>Établissements rattachés :</strong>{" "}
                    {summary.companiesCount}
                  </p>
                  <p className="fr-mb-1w">
                    <strong>Administrateurs qui seront notifiés :</strong>{" "}
                    {summary.adminNotifiedCount}
                  </p>

                  {!summary.hasMfa && (
                    <Alert
                      className="fr-mb-2w"
                      small
                      severity="warning"
                      description="Ce compte n'a pas de MFA active. La réinitialisation n'est pas applicable."
                    />
                  )}
                  {summary.hasPendingRequest && (
                    <Alert
                      className="fr-mb-2w"
                      small
                      severity="warning"
                      description="Une demande de réinitialisation MFA est déjà en cours pour ce compte."
                    />
                  )}
                  {summary.noAdminWarning && summary.hasMfa && (
                    <Alert
                      className="fr-mb-2w"
                      small
                      severity="warning"
                      description="Aucun administrateur d'établissement ne sera notifié pour ce compte."
                    />
                  )}

                  {canCreate && (
                    <div className="fr-mb-2w">
                      <Input
                        label="Note interne (optionnelle)"
                        nativeInputProps={{
                          type: "text",
                          value: note,
                          placeholder: "N° ticket support, motif…",
                          onChange: e => setNote(e.target.value)
                        }}
                      />
                      <Button
                        priority="primary"
                        onClick={handleCreate}
                        disabled={createLoading}
                        className="fr-mr-2w"
                      >
                        {createLoading
                          ? "Création en cours…"
                          : "Valider la demande"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Button priority="secondary" onClick={resetCreateForm} type="button">
            Annuler
          </Button>
        </div>
      )}

      {/* ── Liste des demandes ────────────────────────────────────────────── */}
      <div className="fr-table--sm fr-table fr-table" id="mfa-reset-table">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Compte concerné</th>
                    <th scope="col">Date de la demande</th>
                    <th scope="col">Réinitialisation prévue le</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Note interne</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req: any) => (
                    <tr key={req.id}>
                      <td>{req.user?.email}</td>
                      <td>{formatDateViewDisplay(req.createdAt)}</td>
                      <td>{formatDateViewDisplay(req.dueAt)}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>{req.note ?? "—"}</td>
                      <td>
                        {req.status === "PENDING" && (
                          <Button
                            priority="secondary"
                            size="small"
                            disabled={cancelLoading}
                            onClick={() => handleCancel(req.id)}
                            type="button"
                          >
                            Annuler
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {listLoading && <p className="fr-m-4v">Chargement...</p>}
                  {!listLoading && requests.length === 0 && (
                    <p className="fr-m-4v">Aucune demande</p>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <Pagination
            style={{ margin: "0 auto" }}
            showFirstLast
            count={pageCount}
            defaultPage={pageIndex + 1}
            getPageLinkProps={pageNumber => ({
              onClick: event => {
                event.preventDefault();
                gotoPage(pageNumber - 1);
              },
              href: "#",
              key: `pagination-link-${pageNumber}`
            })}
            className={"fr-mt-1w"}
          />
        </div>
      </div>
    </div>
  );
}
