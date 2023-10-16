import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  BsffPackaging,
  MutationUpdateBsffPackagingArgs,
  WasteAcceptationStatus,
  Bsff,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import {
  ActionButton,
  Modal,
  RedErrorMessage,
  Switch,
} from "common/components";
import { Loader } from "Apps/common/Components";
import { NotificationError } from "Apps/common/Components/Error/Error";
import DateInput from "form/common/components/custom-inputs/DateInput";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_PACKAGING,
} from "form/bsff/utils/queries";
import { GET_BSDS } from "Apps/common/queries";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { BSFF_WASTES } from "generated/constants";
import { IconCheckCircle1 } from "Apps/common/Components/Icons/Icons";
import { BsffSummary } from "./BsffSummary";
import TdTooltip from "common/components/Tooltip";
import { BsffPackagingSummary } from "./BsffPackagingSummary";
import { subMonths } from "date-fns";
import { useRouteMatch } from "react-router-dom";
import { ValidationBsdContext } from "Pages/Dashboard";

const validationSchema = yup.object({
  numero: yup.string(),
  analysisWasteCode: yup.string().required(),
  analysisWasteDescription: yup.string().required(),
  acceptationDate: yup.date().required("La date d'acceptation est requise"),
  acceptationStatus: yup
    .string()
    .oneOf([
      "",
      null,
      WasteAcceptationStatus.Accepted,
      WasteAcceptationStatus.Refused,
    ]),
  acceptationWeight: yup
    .number()
    .required()
    .when("acceptationStatus", {
      is: value => value === WasteAcceptationStatus.Refused,
      then: schema =>
        schema.max(0, "La quantité reçue doit être égale à 0 en cas de refus"),
      otherwise: schema =>
        schema.moreThan(0, "Vous devez saisir une quantité supérieure à 0"),
    }),
  acceptationRefusalReason: yup.string().when("acceptationStatus", {
    is: value => value === WasteAcceptationStatus.Refused,
    then: schema =>
      schema
        .ensure()
        .min(1, "Le motif du refus doit être complété en cas de refus"),
    otherwise: schema => schema.nullable(),
  }),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignBsffAcceptationOnePackagingProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

/**
 * Bouton d'action permettant de signer l'acceptation d'un BSFF
 * avec un seul contenant
 */
export function SignBsffAcceptationOnePackaging({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true,
}: SignBsffAcceptationOnePackagingProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {displayActionButton && (
        <>
          <ActionButton
            icon={<IconCheckCircle1 size="24px" />}
            onClick={() => setIsOpen(true)}
          >
            Signer l'acceptation
          </ActionButton>
          {isOpen && (
            <SignBsffAcceptationOnePackagingModal
              bsffId={bsffId}
              onClose={() => setIsOpen(false)}
            />
          )}
        </>
      )}

      {isModalOpenFromParent && (
        <SignBsffAcceptationOnePackagingModal
          bsffId={bsffId}
          onClose={onModalCloseFromParent!}
        />
      )}
    </>
  );
}

interface SignBsffAcceptationOnePackagingModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignBsffAcceptationOnePackagingModal({
  bsffId,
  onClose,
}: SignBsffAcceptationOnePackagingModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;

  return (
    <Modal onClose={onClose} ariaLabel="Signer l'acceptation" isOpen>
      <h2 className="td-modal-title">Signer l'acceptation</h2>
      <BsffSummary bsff={bsff} />
      <SignBsffAcceptationOnePackagingModalContent
        bsff={bsff}
        packaging={bsff.packagings[0]}
        onCancel={onClose}
      />
    </Modal>
  );
}

interface SignBsffAcceptationOnePackagingModalContentProps {
  bsff: Bsff;
  packaging: BsffPackaging;
  onCancel: () => void;
}

/**
 * Contenu de la modale permettant de signer l'acceptation d'un contenant
 */
export function SignBsffAcceptationOnePackagingModalContent({
  bsff,
  packaging,
  onCancel,
}: SignBsffAcceptationOnePackagingModalContentProps) {
  const [updateBsffPackaging, updateBsffPackagingResult] = useMutation<
    Pick<Mutation, "updateBsffPackaging">,
    MutationUpdateBsffPackagingArgs
  >(UPDATE_BSFF_PACKAGING);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const TODAY = new Date();

  const loading = updateBsffPackagingResult.loading || signBsffResult.loading;
  const error = updateBsffPackagingResult.error ?? signBsffResult.error;

  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const { setHasValidationApiError } = React.useContext(ValidationBsdContext);

  return (
    <>
      {bsff.packagings?.length > 1 && (
        <BsffPackagingSummary bsff={bsff} packaging={packaging} />
      )}
      <Formik
        initialValues={{
          numero: packaging.numero,
          analysisWasteCode:
            packaging?.acceptation?.wasteCode ?? bsff.waste?.code ?? "",
          analysisWasteDescription:
            packaging?.acceptation?.wasteDescription ??
            bsff.waste?.description ??
            "",
          acceptationStatus: WasteAcceptationStatus.Accepted,
          acceptationDate:
            packaging.acceptation?.date ?? new Date().toISOString(),
          acceptationWeight: packaging.weight,
          acceptationRefusalReason: "",
          signatureAuthor: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await updateBsffPackaging({
            variables: {
              id: packaging.id,
              input: {
                numero: values.numero,
                acceptation: {
                  wasteCode: values.analysisWasteCode,
                  wasteDescription: values.analysisWasteDescription,
                  date: values.acceptationDate,
                  status: values.acceptationStatus,
                  weight: values.acceptationWeight,
                  refusalReason: values.acceptationRefusalReason,
                },
              },
            },
          });
          signBsff({
            variables: {
              id: bsff.id,
              input: {
                type: BsffSignatureType.Acceptation,
                author: values.signatureAuthor,
                date: new Date().toISOString(),
                packagingId: packaging.id,
              },
            },
          })
            .then(() => {
              onCancel();
            })
            .catch(() => {
              if (isV2Routes) {
                setHasValidationApiError(true);
              }
            });
        }}
      >
        {({ values, setValues }) => (
          <Form>
            <div className="form__row">
              <label>
                Code déchet{" "}
                <TdTooltip msg="Permet de spécifier le code déchet après une éventuelle analyse" />
                <Field
                  as="select"
                  name="analysisWasteCode"
                  className="td-select"
                >
                  <option />
                  {BSFF_WASTES.map(item => (
                    <option value={item.code} key={item.code}>
                      {item.code} - {item.description}
                    </option>
                  ))}
                </Field>
              </label>
              <RedErrorMessage name="analysisWasteCode" />
            </div>
            <div className="form__row">
              <label>
                Description du fluide{" "}
                <TdTooltip msg="Permet de spécifier la description du fluide après une éventuelle analyse" />
                <Field className="td-input" name="analysisWasteDescription" />
              </label>
              <RedErrorMessage name="analysisWasteDescription" />
            </div>
            <div className="form__row">
              <label>
                Numéro du contenant{" "}
                <TdTooltip msg="Permet de rectifier le numéro du contenant en cas de saisie erronée par l'émetteur du BSFF" />
                <Field className="td-input" name="numero" />
              </label>
              <RedErrorMessage name="numero" />
            </div>
            <div className="form__row">
              <label>
                <Switch
                  label="Le contenant a été refusé"
                  onChange={checked =>
                    setValues({
                      ...values,
                      acceptationStatus: checked
                        ? WasteAcceptationStatus.Refused
                        : WasteAcceptationStatus.Accepted,
                      acceptationWeight: 0,
                    })
                  }
                  checked={
                    values.acceptationStatus === WasteAcceptationStatus.Refused
                  }
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Date{" "}
                {values.acceptationStatus === WasteAcceptationStatus.Accepted
                  ? "de l'acceptation"
                  : "du refus"}
                <div className="td-date-wrapper">
                  <Field
                    className="td-input"
                    name="acceptationDate"
                    component={DateInput}
                    maxDate={TODAY}
                    minDate={subMonths(TODAY, 2)}
                  />
                </div>
              </label>
              <RedErrorMessage name="acceptationDate" />
            </div>
            <div className="form__row">
              <label>
                Quantité de déchet présentée en kg (pour les installations
                d'entreposage ou de reconditionnement, la quantité peut être
                estimée)
                <Field
                  className="td-input"
                  name="acceptationWeight"
                  component={NumberInput}
                  disabled={
                    values.acceptationStatus === WasteAcceptationStatus.Refused
                  }
                />
              </label>
              <RedErrorMessage name="acceptationWeight" />
            </div>

            {values.acceptationStatus === WasteAcceptationStatus.Refused && (
              <div className="form__row">
                <label>
                  <Field
                    as="textarea"
                    className="td-input"
                    name="acceptationRefusalReason"
                    placeholder="Motif du refus"
                  />
                </label>
                <RedErrorMessage name="acceptationRefusalReason" />{" "}
              </div>
            )}
            <div className="form__row">
              <label>
                NOM et prénom du signataire
                <Field
                  className="td-input"
                  name="signatureAuthor"
                  placeholder="NOM Prénom"
                />
              </label>
              <RedErrorMessage name="signatureAuthor" />
            </div>

            <p className="tw-mt-6">
              En qualité de <strong>destinataire du déchet</strong>, j'atteste
              que les informations ci-dessus sont correctes. En signant ce
              document, je déclare{" "}
              {values.acceptationStatus === WasteAcceptationStatus.Accepted
                ? "accepter "
                : "refuser "}
              le contenant.
            </p>

            {error && <NotificationError apolloError={error} />}

            <div className="td-modal-actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onCancel}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                <span>{loading ? "Signature en cours..." : "Signer"}</span>
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
