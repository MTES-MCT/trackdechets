import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaInput,
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
  Query,
  QueryBsdaArgs
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React, { useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import RhfOperationModeSelect from "../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import Select from "@codegouvfr/react-dsfr/Select";
import { SignatureTimestamp } from "../BSPaoh/WorkflowAction/components/Signature";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import {
  GET_BSDA,
  SIGN_BsDA,
  UPDATE_BSDA
} from "../../../common/queries/bsda/queries";
import { getComputedState } from "../../Creation/getComputedState";
import { getInitialCompany } from "../../../common/data/initialState";
import { datetimeToYYYYMMDDHHSS } from "../BSPaoh/paohUtils";

const schema = z.object({
  author: z
    .string({
      required_error: "Le nom et prénom de l'auteur de la signature sont requis"
    })
    .refine(val => val.trim() !== "", {
      message: "Le nom et prénom de l'auteur de la signature sont requis"
    })
    .pipe(
      z
        .string()
        .min(
          2,
          "Le nom et prénom de l'auteur de la signature doit comporter au moins 2 caractères"
        )
    ),
  date: z.coerce
    .date()
    .nullish()
    .transform(v => v?.toISOString()),
  destination: z.object({
    operation: z
      .object({
        code: z
          .string()
          .refine(val => val.trim() !== "", {
            message: "Le code de traitement est requis"
          })
          .nullish(),
        date: z.coerce
          .date({
            required_error: "La date de traitement est requise",
            invalid_type_error: "Format de date invalide."
          })
          .transform(v => v?.toISOString()),
        mode: z
          .enum([
            "ELIMINATION",
            "RECYCLAGE",
            "REUTILISATION",
            "VALORISATION_ENERGETIQUE"
          ])
          .nullish(),
        description: z.string().nullish()
      })
      .nullish()
      .nullish(),
    reception: z
      .object({
        identification: z
          .object({
            numbers: z.array(z.string()).nullish()
          })
          .nullish(),
        acceptationStatus: z
          .enum(["ACCEPTED", "PARTIALLY_REFUSED", "REFUSED"])
          .nullish()
      })
      .nullish()
  })
});
export type ZodBsdaOperation = z.infer<typeof schema>;

const SignBsdaOperation = ({ bsdaId, onClose }) => {
  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId
    },
    fetchPolicy: "network-only"
  });

  const [updateBsda, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBsda">, MutationUpdateBsdaArgs>(
      UPDATE_BSDA
    );
  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BsDA);

  const title = "Signer le traitement";
  const TODAY = useMemo(() => new Date(), []);

  const initialState = {
    date: datetimeToYYYYMMDDHHSS(TODAY),
    author: "",
    ...getComputedState(
      {
        destination: {
          operation: {
            date: datetimeToYYYYMMDD(TODAY),
            code: "",
            nextDestination: { company: getInitialCompany() }
          }
        }
      },
      data?.bsda
    )
  } as ZodBsdaOperation;

  const methods = useForm<ZodBsdaOperation>({
    values: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, formState, register, watch, setValue } = methods;

  const onCancel = () => {
    reset();
    onClose();
  };

  const operationCode = watch("destination.operation.code");

  useEffect(() => {
    setValue("destination.operation.date", datetimeToYYYYMMDD(TODAY));
  }, [TODAY, setValue]);

  const onSubmit = async data => {
    const { author, date, ...update } = data;
    await updateBsda({
      variables: {
        id: bsda.id,
        input: update as BsdaInput
      }
    });
    await signBsda({
      variables: {
        id: bsda.id,
        input: {
          date,
          author,
          type: BsdaSignatureType.Operation
        }
      }
    });
    onClose();
  };

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  const isTempStorageReception =
    !bsda.forwarding &&
    !bsda.grouping?.length &&
    bsda.destination?.operation?.nextDestination?.company?.siret;

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <BsdaWasteSummary bsda={bsda} />
      <BsdaJourneySummary bsda={bsda} />

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="fr-text fr-mb-2w">
            Vous hésitez sur le type d'opération à choisir ? Vous pouvez
            consulter la liste de traitement des déchets sur{" "}
            <a
              className="fr-link force-external-link-content force-underline-link"
              href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000026902174"
              target="_blank"
              rel="noopener noreferrer"
            >
              legifrance
            </a>
            . Le type d'opération figure sur le CAP qui a été émis par le
            destinataire.
          </p>
          <Select
            label="Traitement d'élimination / valorisation prévue (code D/R)"
            className="fr-col-12 fr-mt-1w"
            nativeSelectProps={{
              ...register("destination.operation.code")
            }}
            state={
              formState.errors.destination?.operation?.code
                ? "error"
                : "default"
            }
            stateRelatedMessage={
              formState.errors.destination?.operation?.code?.message
            }
          >
            <option value="">Sélectionnez une valeur...</option>
            {!isTempStorageReception && (
              <>
                <option value="R 5">
                  R 5 - Recyclage ou récupération d'autres matières inorganiques
                  (dont vitrification)
                </option>
                <option value="D 5">
                  D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
                </option>
                <option value="D 9">
                  D 9 - Traitement chimique ou prétraitement (dont
                  vitrification)
                </option>
              </>
            )}
            <option value="R 13">
              R 13 - Opérations de transit incluant le groupement sans
              transvasement préalable à R 5
            </option>
            <option value="D 15">
              D 15 - Transit incluant le groupement sans transvasement
            </option>
          </Select>

          <p className="fr-mt-5v fr-mb-5v fr-info-text">
            Code de traitement prévu : {bsda.destination?.plannedOperationCode}
          </p>

          <RhfOperationModeSelect
            operationCode={operationCode}
            path={"destination.operation.mode"}
            addedDsfrClass="fr-text--bold"
          />

          <Input
            label="Description du traitement (Optionnel)"
            nativeInputProps={{
              placeholder: "ISDD, ISDND, etc.",
              ...register("destination.operation.description")
            }}
          />

          <p className="fr-text fr-mb-2w">
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant, je confirme
            le traitement des déchets pour la quantité indiquée dans ce
            bordereau.
          </p>

          <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
            <Input
              label="Date de traitement"
              nativeInputProps={{
                type: "date",
                min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
                max: datetimeToYYYYMMDD(TODAY),
                ...register("destination.operation.date")
              }}
              state={
                formState.errors.destination?.operation?.date
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={
                formState.errors.destination?.operation?.date?.message
              }
            />
          </div>
          <div className="fr-col-8 fr-mb-2w">
            <Input
              label="Nom et prénom"
              state={formState.errors.author ? "error" : "default"}
              nativeInputProps={{
                ...register("author")
              }}
              stateRelatedMessage={formState.errors.author?.message}
            />
          </div>
          <SignatureTimestamp />
          <div className="fr-mb-8w">
            {updateError && <DsfrNotificationError apolloError={updateError} />}
            {error && <DsfrNotificationError apolloError={error} />}
          </div>

          <hr className="fr-mt-2w" />
          <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
            <Button
              type="button"
              priority="secondary"
              onClick={onCancel}
              disabled={loading || loadingUpdate}
            >
              Annuler
            </Button>
            <Button disabled={loading || loadingUpdate}>Signer</Button>
          </div>
        </form>
      </FormProvider>
    </TdModal>
  );
};

export default SignBsdaOperation;
