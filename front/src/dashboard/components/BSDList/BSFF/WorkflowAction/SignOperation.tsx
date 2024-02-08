import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as yup from "yup";
import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  BsffPackaging,
  MutationUpdateBsffPackagingArgs,
  Bsff,
  Query,
  QueryBsffArgs,
  BsffOperationCode,
  BsffType,
  BsffPackagingOperationInput,
  SignatureInput
} from "@td/codegen-ui";
import {
  ActionButton,
  Modal,
  RedErrorMessage
} from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_PACKAGING
} from "../../../../../form/bsff/utils/queries";
import { IconCheckCircle1 } from "../../../../../Apps/common/Components/Icons/Icons";
import { BsffSummary } from "./BsffSummary";
import { BsffPackagingSummary } from "./BsffPackagingSummary";
import { OPERATION } from "../../../../../form/bsff/utils/constants";
import CompanySelector from "../../../../../form/common/components/company/CompanySelector";
import { companySchema } from "../../../../../common/validation/schema";
import { subMonths } from "date-fns";
import OperationModeSelect from "../../../../../common/components/OperationModeSelect";

const operationCode = yup
  .string()
  .required("Le code de l'opération de traitement est requis")
  .oneOf(
    Object.keys(OPERATION),
    "Le code de l'opération de traitement ne fait pas partie de la liste reconnue"
  );

const validationSchema = yup.object({
  code: operationCode,
  description: yup
    .string()
    .ensure()
    .required("La description de l'opération réalisée est obligatoire"),
  date: yup.date().required("La date de l'opération est requise"),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  nextDestination: yup.object().when("code", {
    is: (code: string) => OPERATION[code]?.successors?.length > 0,
    then: schema =>
      schema.when("noTraceability", {
        is: true,
        then: schema => schema.nullable(),
        otherwise: schema =>
          schema.shape({
            plannedOperationCode: operationCode,
            company: companySchema,
            cap: yup.string().nullable().notRequired()
          })
      }),
    otherwise: schema => schema.nullable()
  })
});

interface SignBsffOperationProps {
  bsffId: string;
}

interface ModalAdapterProps {
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

/**
 * Bouton d'action permettant de signer l'opération d'un BSFF
 * avec un seul contenant
 */
export function SignBsffOperationOnePackaging({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true
}: Pick<SignBsffOperationProps, "bsffId"> & ModalAdapterProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {displayActionButton && (
        <>
          <ActionButton
            icon={<IconCheckCircle1 size="24px" />}
            onClick={() => setIsOpen(true)}
          >
            Signer l'opération
          </ActionButton>
          {isOpen && (
            <SignBsffOperationOnePackagingModal
              bsffId={bsffId}
              onClose={() => setIsOpen(false)}
            />
          )}
        </>
      )}

      {isModalOpenFromParent && (
        <SignBsffOperationOnePackagingModal
          bsffId={bsffId}
          onClose={onModalCloseFromParent!}
        />
      )}
    </>
  );
}

interface SignBsffOperationOnePackagingModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignBsffOperationOnePackagingModal({
  bsffId,
  onClose
}: SignBsffOperationOnePackagingModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId
    }
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;

  return (
    <Modal onClose={onClose} ariaLabel="Signer l'opération" isOpen>
      <h2 className="td-modal-title">Signer l'opération</h2>
      <BsffSummary bsff={bsff} />
      <SignBsffOperationOnePackagingModalContent
        bsff={bsff}
        packaging={bsff.packagings[0]}
        onCancel={onClose}
      />
    </Modal>
  );
}

interface SignBsffOperationOnePackagingModalContentProps {
  bsff: Bsff;
  packaging: BsffPackaging;
  onCancel: () => void;
}

function NoTraceabilityField(props) {
  const {
    values: { code },
    touched,
    setFieldValue
  } = useFormikContext<BsffPackagingOperationInput>();

  const isGroupement = OPERATION[code]?.successors.includes(
    BsffType.Groupement
  );

  React.useEffect(() => {
    if (!isGroupement) {
      setFieldValue(props.name, false);
    }
  }, [isGroupement, touched.code, setFieldValue, props.name]);

  return isGroupement ? (
    <div className="form__row form__row--inline">
      <Field
        type="checkbox"
        name={props.name}
        id="id_noTraceability"
        className="td-checkbox"
      />

      <label htmlFor="id_noTraceability">
        {" "}
        Rupture de traçabilité autorisée par arrêté préfectoral pour ce déchet -
        la responsabilité du producteur du déchet est transférée
      </label>
    </div>
  ) : null;
}

function NextDestinationField(props) {
  const {
    values: { code, noTraceability, nextDestination },
    setFieldValue
  } = useFormikContext<BsffPackagingOperationInput>();

  const hasNextDestination =
    OPERATION[code]?.successors?.length > 0 && !noTraceability;

  React.useEffect(() => {
    if (!hasNextDestination) {
      setFieldValue(props.name, null);
    } else {
      setFieldValue(props.name, {
        plannedOperationCode: "",
        company: {},
        cap: ""
      });
    }
  }, [hasNextDestination, props.name, setFieldValue]);

  return hasNextDestination && nextDestination ? (
    <div className="form__row">
      <h4 className="h4">Destination ultérieure prévue</h4>
      <div className="form__row">
        <label>
          Code de l'opération d'élimination ou valorisation prévue
          <Field
            as="select"
            name="nextDestination.plannedOperationCode"
            className="td-select"
          >
            <option />
            {Object.values(OPERATION).map(operation => (
              <option key={operation.code} value={operation.code}>
                {operation.code} - {operation.description}
              </option>
            ))}
          </Field>
        </label>
        <RedErrorMessage name="nextDestination.plannedOperationCode" />
      </div>
      <CompanySelector name="nextDestination.company" skipFavorite={true} />
      <div className="form__row">
        <label>
          Numéro de CAP (optionnel)
          <Field type="text" name="nextDestination.cap" className="td-input" />
        </label>
      </div>
    </div>
  ) : null;
}

/**
 * Contenu de la modale permettant de signer l'opération d'un contenant
 */
export function SignBsffOperationOnePackagingModalContent({
  bsff,
  packaging,
  onCancel
}: SignBsffOperationOnePackagingModalContentProps) {
  const [updateBsffPackaging, updateBsffPackagingResult] = useMutation<
    Pick<Mutation, "updateBsffPackaging">,
    MutationUpdateBsffPackagingArgs
  >(UPDATE_BSFF_PACKAGING);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const TODAY = new Date();

  const loading = updateBsffPackagingResult.loading || signBsffResult.loading;
  const error = updateBsffPackagingResult.error ?? signBsffResult.error;

  return (
    <>
      {bsff.packagings?.length > 1 && (
        <BsffPackagingSummary bsff={bsff} packaging={packaging} />
      )}
      <Formik<BsffPackagingOperationInput & SignatureInput>
        initialValues={{
          code:
            bsff?.destination?.plannedOperationCode ??
            ("" as BsffOperationCode),
          description: "",
          date: new Date().toISOString(),
          noTraceability: false,
          nextDestination: null,
          author: ""
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await updateBsffPackaging({
            variables: {
              id: packaging.id,
              input: {
                operation: {
                  code: values.code,
                  mode: values.mode,
                  description: values.description,
                  date: values.date,
                  noTraceability: values.noTraceability,
                  nextDestination: values.nextDestination
                }
              }
            }
          });
          await signBsff({
            variables: {
              id: bsff.id,
              input: {
                type: BsffSignatureType.Operation,
                author: values.author,
                date: new Date().toISOString(),
                packagingId: packaging.id
              }
            }
          });
          onCancel();
        }}
      >
        {({ values }) => (
          <Form>
            <div className="form__row">
              <label>
                Date du traitement
                <div className="td-date-wrapper">
                  <Field
                    className="td-input"
                    name="date"
                    component={DateInput}
                    maxDate={TODAY}
                    minDate={subMonths(TODAY, 2)}
                    required
                  />
                </div>
              </label>
              <RedErrorMessage name="date" />
            </div>

            <div className="form__row">
              <label>
                Code de traitement
                <Field as="select" name="code" className="td-select">
                  <option />
                  {Object.values(OPERATION).map(operation => (
                    <option key={operation.code} value={operation.code}>
                      {operation.code} - {operation.description}
                    </option>
                  ))}
                </Field>
              </label>
              <RedErrorMessage name="code" />
            </div>
            <OperationModeSelect operationCode={values?.code} name="mode" />
            <div className="form__row">
              <label>
                Description de l'opération réalisée
                <Field className="td-input" name="description" />
              </label>
              <RedErrorMessage name="description" />
            </div>
            <NoTraceabilityField name="noTraceability" />
            <NextDestinationField name="nextDestination" />
            <div className="form__row">
              <label>
                NOM et prénom du signataire
                <Field
                  className="td-input"
                  name="author"
                  placeholder="NOM Prénom"
                />
              </label>
              <RedErrorMessage name="author" />
            </div>

            <p className="tw-mt-6">
              En qualité de <strong>destinataire du déchet</strong>, j'atteste
              que les informations ci-dessus sont correctes. En signant ce
              document, je déclare avoir traité le déchet.
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
