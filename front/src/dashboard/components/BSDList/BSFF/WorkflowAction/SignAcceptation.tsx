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
  Loader,
  Modal,
  RedErrorMessage,
  Switch,
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
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { BSFF_WASTES } from "generated/constants";
import { Column, useFilters, useTable } from "react-table";
import { IconCheckCircle1 } from "common/components/Icons";
import { BsffWasteSummary } from "./BsffWasteSummary";
import { BsffSummary } from "./BsffSummary";
import TdTooltip from "common/components/Tooltip";
import { formatDate } from "common/datetime";
import { BsffPackagingSummary } from "./BsffPackagingSummary";

const validationSchema = yup.object({
  analysisWasteCode: yup.string().required(),
  analysisWasteDescription: yup.string().required(),
  acceptationDate: yup.date().required(),
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

interface SignBsffAcceptationProps {
  bsffId: string;
  packagingsCount: number;
}

export function SignBsffAcceptation({
  bsffId,
  packagingsCount,
}: SignBsffAcceptationProps) {
  if (packagingsCount === 1) {
    return SignBsffAcceptationOnePackaging({ bsffId });
  }
  if (packagingsCount > 1) {
    return SignBsffAcceptationMultiplePackagings({ bsffId });
  }
  return null;
}

/**
 * Bouton d'action permettant de signer l'acceptation d'un BSFF
 * avec un seul contenant
 */
function SignBsffAcceptationOnePackaging({
  bsffId,
}: Pick<SignBsffAcceptationProps, "bsffId">) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
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
  );
}

/**
 * Bouton d'action permettant de signer l'acceptation
 * d'un BSFF avec plusieurs contenants
 */
export function SignBsffAcceptationMultiplePackagings({
  bsffId,
}: Pick<SignBsffAcceptationProps, "bsffId">) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'acceptation des contenants
      </ActionButton>
      {isOpen && (
        <SignBsffAcceptationMultiplePackagingsModal
          bsffId={bsffId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function SignBsffAcceptationOnePackagingModal({
  bsffId,
  onClose,
}: SignBsffAcceptationMultiplePackagingsModalProps) {
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
function SignBsffAcceptationOnePackagingModalContent({
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

  const loading = updateBsffPackagingResult.loading || signBsffResult.loading;
  const error = updateBsffPackagingResult.error ?? signBsffResult.error;

  return (
    <>
      <BsffPackagingSummary bsff={bsff} packaging={packaging} />
      <Formik
        initialValues={{
          analysisWasteCode:
            packaging?.acceptation?.wasteCode ?? bsff.waste?.code ?? "",
          analysisWasteDescription:
            packaging?.acceptation?.wasteDescription ??
            bsff.waste?.description ??
            "",
          acceptationStatus: WasteAcceptationStatus.Accepted,
          acceptationDate:
            packaging.acceptation?.date ?? new Date().toISOString(),
          acceptationWeight: 0,
          acceptationRefusalReason: "",
          signatureAuthor: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await updateBsffPackaging({
            variables: {
              id: packaging.id,
              input: {
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
          await signBsff({
            variables: {
              id: bsff.id,
              input: {
                type: BsffSignatureType.Acceptation,
                author: values.signatureAuthor,
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
                <Field
                  className="td-input"
                  name="acceptationDate"
                  component={DateInput}
                />
              </label>
              <RedErrorMessage name="acceptationDate" />
            </div>
            <div className="form__row">
              <label>
                Quantité de déchet présenté (pour les installations
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

interface SignBsffAcceptationMultiplePackagingsModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignBsffAcceptationMultiplePackagingsModal({
  bsffId,
  onClose,
}: SignBsffAcceptationMultiplePackagingsModalProps) {
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
      ariaLabel="Signer l'acceptation des contentants"
      isOpen
    >
      <h2 className="td-modal-title">Signer l'acceptation des contentants</h2>
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
                {row.original.acceptation?.signature?.date ? (
                  row.original.acceptation?.status ===
                  WasteAcceptationStatus.Accepted ? (
                    <div>
                      Accepté le{" "}
                      {formatDate(row.original.acceptation?.date ?? "")}
                    </div>
                  ) : (
                    <div>
                      Refusé le{" "}
                      {formatDate(row.original.acceptation?.date ?? "")}
                    </div>
                  )
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
        Signer l'acceptation
      </ActionButton>

      {isOpen && (
        <Modal
          onClose={() => setIsOpen(false)}
          ariaLabel="Signer l'acceptation"
          isOpen
        >
          <h2 className="td-modal-title">
            Signer l'acceptation du contenant {packaging.numero}
          </h2>
          <SignBsffAcceptationOnePackagingModalContent
            bsff={bsff}
            packaging={packaging}
            onCancel={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
