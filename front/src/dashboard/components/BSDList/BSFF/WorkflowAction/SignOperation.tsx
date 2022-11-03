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
  WasteAcceptationStatus,
  BsffType,
  BsffPackagingOperationInput,
  SignatureInput,
} from "generated/graphql/types";
import {
  ActionButton,
  Loader,
  Modal,
  RedErrorMessage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { NotificationError } from "common/components/Error";
import DateInput from "form/common/components/custom-inputs/DateInput";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_PACKAGING,
} from "form/bsff/utils/queries";
import { GET_BSDS } from "common/queries";
import { Column, useFilters, useTable } from "react-table";
import { IconCheckCircle1 } from "common/components/Icons";
import { BsffWasteSummary } from "./BsffWasteSummary";
import { BsffSummary } from "./BsffSummary";
import { formatDate } from "common/datetime";
import { BsffPackagingSummary } from "./BsffPackagingSummary";
import { OPERATION } from "form/bsff/utils/constants";
import CompanySelector from "form/common/components/company/CompanySelector";

const validationSchema = yup.object({
  code: yup
    .string()
    .oneOf(
      Object.keys(OPERATION),
      "Le code de traitement doit faire partie de la liste reconnue"
    )
    .required(),
  description: yup.string().ensure().required(),
  date: yup.date().required(),
  author: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignBsffOperationProps {
  bsffId: string;
  packagingsCount: number;
}

export function SignBsffOperation({
  bsffId,
  packagingsCount,
}: SignBsffOperationProps) {
  if (packagingsCount === 1) {
    return SignBsffOperationOnePackaging({ bsffId });
  }
  if (packagingsCount > 1) {
    return SignBsffOperationMultiplePackagings({ bsffId });
  }
  return null;
}

/**
 * Bouton d'action permettant de signer l'opération d'un BSFF
 * avec un seul contenant
 */
function SignBsffOperationOnePackaging({
  bsffId,
}: Pick<SignBsffOperationProps, "bsffId">) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
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
  );
}

/**
 * Bouton d'action permettant de signer l'opération
 * d'un BSFF avec plusieurs contenants
 */
export function SignBsffOperationMultiplePackagings({
  bsffId,
}: Pick<SignBsffOperationProps, "bsffId">) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'opération des contenants
      </ActionButton>
      {isOpen && (
        <SignBsffOperationMultiplePackagingsModal
          bsffId={bsffId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function SignBsffOperationOnePackagingModal({
  bsffId,
  onClose,
}: SignBsffOperationMultiplePackagingsModalProps) {
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
    setFieldValue,
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
    setFieldValue,
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
        <RedErrorMessage name="code" />
      </div>
      <CompanySelector
        name="nextDestination.company"
        allowForeignCompanies={true}
        forceManualForeignCompanyForm={true}
        skipFavorite={true}
      />
    </div>
  ) : null;
}

/**
 * Contenu de la modale permettant de signer l'opération d'un contenant
 */
function SignBsffOperationOnePackagingModalContent({
  bsff,
  packaging,
  onCancel,
}: SignBsffOperationOnePackagingModalContentProps) {
  const [updateBsffPackaging, updateBsffPackagingResult] = useMutation<
    Pick<Mutation, "updateBsffPackaging">,
    MutationUpdateBsffPackagingArgs
  >(UPDATE_BSFF_PACKAGING);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

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
          author: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await updateBsffPackaging({
            variables: {
              id: packaging.id,
              input: {
                operation: {
                  code: values.code,
                  description: values.description,
                  date: values.date,
                  noTraceability: values.noTraceability,
                  nextDestination: values.nextDestination,
                },
              },
            },
          });
          await signBsff({
            variables: {
              id: bsff.id,
              input: {
                type: BsffSignatureType.Operation,
                author: values.author,
                date: new Date().toISOString(),
                packagingId: packaging.id,
              },
            },
          });
          onCancel();
        }}
      >
        {({ values, setValues }) => (
          <Form>
            <div className="form__row">
              <label>
                Date du traitement
                <Field className="td-input" name="date" component={DateInput} />
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

interface SignBsffOperationMultiplePackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignBsffOperationMultiplePackagingsModal({
  bsffId,
  onClose,
}: SignBsffOperationMultiplePackagingsModalProps) {
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
    <Modal
      onClose={onClose}
      ariaLabel="Signer l'opération des contentants"
      isOpen
    >
      <h2 className="td-modal-title">Signer l'opération des contentants</h2>
      <BsffWasteSummary bsff={bsff} />
      <BsffPackagingTable bsff={bsff} />
    </Modal>
  );
}

interface BsffPackagingTableProps {
  bsff: Bsff;
}

function BsffPackagingTable({ bsff }: BsffPackagingTableProps) {
  const columns: Column<BsffPackaging>[] = React.useMemo(
    () => [
      {
        id: "numero",
        Header: "Numéro de contenant",
        accessor: bsffPackaging => bsffPackaging.numero,
        filter: "text",
      },
      {
        id: "name",
        Header: "Dénomination",
        accessor: bsffPackaging => bsffPackaging.name,
        filter: "text",
      },
    ],
    []
  );

  const data = React.useMemo(() => bsff.packagings, [bsff.packagings]);

  const filterTypes = React.useMemo(
    () => ({
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  // Define a default UI for filtering
  function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
    return (
      <input
        className="td-input td-input--small"
        value={filterValue || ""}
        onChange={e => {
          setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        placeholder={`Filtrer...`}
      />
    );
  }

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );
  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        filterTypes,
        defaultColumn,
      },
      useFilters
    );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        <TableRow>
          {headers.map(column => (
            <TableHeaderCell {...column.getHeaderProps()}>
              {column.render("Header")}
              <div>{column.canFilter ? column.render("Filter") : null}</div>
            </TableHeaderCell>
          ))}
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <TableCell {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </TableCell>
                );
              })}
              <TableCell>
                {row.original.operation?.signature?.date ? (
                  <div>
                    Traité le {formatDate(row.original.operation?.date ?? "")} -
                    Code {row.original.operation?.code}
                  </div>
                ) : row.original.acceptation?.status ===
                  WasteAcceptationStatus.Refused ? (
                  <div>
                    Refusé le {formatDate(row.original.acceptation?.date ?? "")}
                  </div>
                ) : (
                  <SignBsffPackaging bsff={bsff} packaging={row.original} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface SignBsffPackagingProps {
  bsff: Bsff;
  packaging: BsffPackaging;
}

function SignBsffPackaging({ bsff, packaging }: SignBsffPackagingProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'opération
      </ActionButton>

      {isOpen && (
        <Modal
          onClose={() => setIsOpen(false)}
          ariaLabel="Signer l'opération"
          isOpen
        >
          <h2 className="td-modal-title">
            Signer l'opération du contenant {packaging.numero}
          </h2>
          <SignBsffOperationOnePackagingModalContent
            bsff={bsff}
            packaging={packaging}
            onCancel={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
