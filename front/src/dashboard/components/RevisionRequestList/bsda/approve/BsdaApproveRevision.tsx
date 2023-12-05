import React from "react";
import * as yup from "yup";
import {
  BsdaBroker,
  BsdaPackaging,
  BsdaRevisionRequest,
  Mutation,
  MutationSubmitBsdaRevisionRequestApprovalArgs,
  PickupSite
} from "codegen-ui";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import {
  ActionButton,
  Modal,
  RedErrorMessage
} from "../../../../../common/components";
import { IconCogApproved } from "../../../../../Apps/common/Components/Icons/Icons";
import { useMutation } from "@apollo/client";
import {
  GET_BSDA_REVISION_REQUESTS,
  SUBMIT_BSDA_REVISION_REQUEST_APPROVAL
} from "../../../../../Apps/common/queries/reviews/BsdaReviewQuery";
import { Field, Form, Formik } from "formik";
import { RadioButton } from "../../../../../form/common/components/custom-inputs/RadioButton";
import { formatDate } from "../../../../../common/datetime";
import { RevisionField } from "../../bsdd/approve/RevisionField";
import { useParams, useMatch } from "react-router-dom";
import { PACKAGINGS_NAMES } from "../../../../../form/bsda/components/packagings/Packagings";
import { getOperationModeLabel } from "../../../../../common/operationModes";

type Props = {
  review: BsdaRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

const validationSchema = yup.object({
  isApproved: yup.string().required()
});

export function BsdaApproveRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  const { siret } = useParams<{ siret: string }>();
  const isV2Routes = !!useMatch("/v2/dashboard/*");

  const [submitBsdaRevisionRequestApproval, { loading }] = useMutation<
    Pick<Mutation, "submitBsdaRevisionRequestApproval">,
    MutationSubmitBsdaRevisionRequestApprovalArgs
  >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
    refetchQueries: [
      { query: GET_BSDA_REVISION_REQUESTS, variables: { siret } }
    ]
  });

  const title = "Acceptation d'une révision";
  if (isV2Routes && isModalOpenFromParent) {
    const formatRevisionAdapter = {
      ...review["review"],
      bsda: { ...review }
    };
    return (
      <Modal onClose={onModalCloseFromParent!} ariaLabel={title} isOpen>
        <DisplayModalContent
          review={formatRevisionAdapter}
          close={onModalCloseFromParent}
          submitBsdaRevisionRequestApproval={submitBsdaRevisionRequestApproval}
          loading={loading}
        />
      </Modal>
    );
  }

  return !isV2Routes ? (
    <TdModalTrigger
      ariaLabel={title}
      trigger={open => (
        <ActionButton icon={<IconCogApproved size="24px" />} onClick={open}>
          Approuver / Refuser
        </ActionButton>
      )}
      modalContent={close => (
        <DisplayModalContent
          review={review}
          close={close}
          submitBsdaRevisionRequestApproval={submitBsdaRevisionRequestApproval}
          loading={loading}
        />
      )}
    />
  ) : null;
}

function DisplayModalContent({
  review,
  close,
  submitBsdaRevisionRequestApproval,
  loading
}) {
  return (
    <div>
      <DisplayRevision review={review} />

      <Formik
        initialValues={{
          isApproved: ""
        }}
        onSubmit={async ({ isApproved }) => {
          await submitBsdaRevisionRequestApproval({
            variables: { id: review.id, isApproved: isApproved === "TRUE" }
          });
          close();
        }}
        validationSchema={validationSchema}
      >
        {() => (
          <Form>
            <div>
              <fieldset className="form__row">
                <Field
                  name="isApproved"
                  id="TRUE"
                  label="J'accepte la révision"
                  component={RadioButton}
                />
                <Field
                  name="isApproved"
                  id="FALSE"
                  label="Je refuse la révision"
                  component={RadioButton}
                />
              </fieldset>
              <RedErrorMessage name="isApproved" />
            </div>
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={close}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                Valider
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export function DisplayRevision({ review }: Props) {
  if (review.content.isCanceled) {
    return (
      <>
        <div>
          <p className="tw-pb-6">
            L'entreprise <strong>{review.authoringCompany.name}</strong> a
            demandé l'annulation du bordereau <strong>#{review.bsda.id}</strong>
          </p>
        </div>

        <div className="tw-flex tw-py-2">
          <p className="tw-w-1/4 tw-font-bold">Commentaire</p>
          <p className="tw-w-3/4">{review.comment}</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <p className="tw-pb-6">
        L'entreprise <strong>{review.authoringCompany.name}</strong> a proposé
        les révisions suivantes pour le bordereau{" "}
        <strong>#{review.bsda.id}</strong>
      </p>

      <div className="tw-flex tw-py-2">
        <p className="tw-w-1/4 tw-font-bold">Commentaire</p>
        <p className="tw-w-3/4">{review.comment}</p>
      </div>

      <RevisionField
        label="Adresse de collecte"
        bsddValue={review.bsda.emitter?.pickupSite}
        reviewValue={review.content.emitter?.pickupSite}
        formatter={pickupSiteFormatter}
      />

      <RevisionField
        label="Code déchet"
        bsddValue={review.bsda.waste?.code}
        reviewValue={review.content.waste?.code}
      />

      <RevisionField
        label="Pop"
        bsddValue={review.bsda.waste?.pop}
        reviewValue={review.content.waste?.pop}
        formatter={booleanFormatter}
      />

      <RevisionField
        label="Description déchet"
        bsddValue={review.bsda.waste?.materialName}
        reviewValue={review.content.waste?.materialName}
      />

      <RevisionField
        label="Numéros de scellés"
        bsddValue={review.bsda.waste?.sealNumbers}
        reviewValue={review.content.waste?.sealNumbers}
        formatter={sealNumbersFormatter}
      />

      <RevisionField
        label="Conditionnement"
        bsddValue={review.bsda.packagings}
        reviewValue={review.content.packagings}
        formatter={packagingsFormatter}
      />

      <RevisionField
        label="CAP"
        bsddValue={review.bsda.destination?.cap}
        reviewValue={review.content.destination?.cap}
      />

      <RevisionField
        label="Quantité traitée (en tonnes)"
        bsddValue={review.bsda.destination?.reception?.weight}
        reviewValue={review.content.destination?.reception?.weight}
      />

      <RevisionField
        label="Code d'opération réalisée"
        bsddValue={review.bsda.destination?.operation?.code}
        reviewValue={
          [
            review.content.destination?.operation?.code,
            review.content.destination?.operation?.mode &&
              `(${getOperationModeLabel(
                review.content.destination?.operation?.mode ?? ""
              )})`
          ]
            .filter(Boolean)
            .join(" ") || null
        }
      />

      <RevisionField
        label="Description de l'opération réalisée"
        bsddValue={review.bsda.destination?.operation?.description}
        reviewValue={review.content.destination?.operation?.description}
      />

      <RevisionField
        label="Courtier"
        bsddValue={review.bsda.broker}
        reviewValue={review.content.broker}
        formatter={brokerFormatter}
      />
    </div>
  );
}

function brokerFormatter(entity: BsdaBroker | undefined): React.ReactNode {
  if (!entity?.company?.name) return null;

  return (
    <>
      <div>
        {entity.company?.name} ({entity.company?.siret}) -{" "}
        {entity.company?.address}
      </div>
      <div>
        Récepissé: {entity.recepisse?.number} - Département:{" "}
        {entity.recepisse?.department} - Date limite de validité:{" "}
        {entity.recepisse?.validityLimit
          ? formatDate(entity.recepisse?.validityLimit)
          : ""}
      </div>
    </>
  );
}

function pickupSiteFormatter(entity: PickupSite | undefined): React.ReactNode {
  if (!entity?.address) return null;

  return (
    <>
      <div>
        {entity.address}, {entity.postalCode} {entity.city}
      </div>
      <div>{entity.infos}</div>
    </>
  );
}

function booleanFormatter(entity: boolean | undefined): React.ReactNode {
  if (entity == null) return null;

  return entity ? "Oui" : "Non";
}

function sealNumbersFormatter(entity: string[] | undefined): React.ReactNode {
  // prisma does not allow nullable lists so we can't tell apart `no change requested` vs `change to empty array`
  // this is not an issue on this field as we do not want to set sealNumbers to [] on a reivsion
  // so we consider empty arrays as falsy, they are ignored when reivsion is applied
  if (!entity || !entity?.length) return null;

  return entity.join(", ");
}

function packagingsFormatter(
  entity: BsdaPackaging[] | undefined
): React.ReactNode {
  if (!entity?.length) return null;

  return entity
    .map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
    .join(", ");
}
