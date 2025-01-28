import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsvhuInput,
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  Query,
  QueryBsvhuArgs,
  QueryCompanyPrivateInfosArgs,
  SignatureTypeInput,
  WasteVehiclesType
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import {
  GET_VHU_FORM,
  SIGN_BSVHU,
  UPDATE_VHU_FORM
} from "../../../common/queries/bsvhu/queries";
import { BsvhuJourneySummary } from "./BsvhuJourneySummary";
import WasteVhuSummary from "./WasteVhuSummary";
import IdentificationNumber from "../../../Forms/Components/IdentificationNumbers/IdentificationNumber";
import RhfOperationModeSelect from "../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import Select from "@codegouvfr/react-dsfr/Select";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../../common/queries/company/query";
import { useParams } from "react-router-dom";
import { SignatureTimestamp } from "../BSPaoh/WorkflowAction/components/Signature";

const schema = z.object({
  author: z
    .string({
      required_error: "Le nom et prénom de l'auteur de la signature est requis"
    })
    .refine(val => val.trim() !== "", {
      message: "Le nom et prénom de l'auteur de la signature est requis"
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
    .date({
      required_error: "La date de traitement est requise",
      invalid_type_error: "Format de date invalide."
    })
    .transform(v => v?.toISOString()),
  destination: z.object({
    operation: z
      .object({
        code: z.string().refine(val => val.trim() !== "", {
          message: "Le code de traitement est requis"
        }),
        date: z.coerce
          .date()
          .nullish()
          .transform(v => v?.toISOString()),
        mode: z
          .enum([
            "ELIMINATION",
            "RECYCLAGE",
            "REUTILISATION",
            "VALORISATION_ENERGETIQUE"
          ])
          .nullish()
      })
      .nullish()
      .nullish(),
    reception: z
      .object({
        identification: z
          .object({
            numbers: z.array(z.string()).nullish()
          })
          .nullish()
      })
      .nullish()
  })
});
export type ZodBsvhuOperation = z.infer<typeof schema>;

const SignVhuOperation = ({ bsvhuId, onClose }) => {
  const { siret } = useParams<{ siret: string }>();

  const { data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsvhuId
      }
    }
  );

  const [updateBsvhu, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  const [signBsvhu, { loading, error }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const title = "Signer le traitement";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: "",
    destination: {}
  };

  const methods = useForm<ZodBsvhuOperation>({
    values: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, formState, register, watch, setValue } = methods;

  const { data: dataCompany } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: { clue: siret! },
    fetchPolicy: "no-cache"
  });

  const onCancel = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    setValue("destination.reception.identification.numbers", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const operationCode = watch("destination.operation.code");

  useEffect(() => {
    if (operationCode === "R 4") {
      setValue("destination.operation.mode", "RECYCLAGE");
    } else {
      setValue("destination.operation.mode", null);
    }
  }, [operationCode, setValue]);

  if (data == null) {
    return <Loader />;
  }

  const { bsvhu } = data;

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <WasteVhuSummary bsvhu={bsvhu} />
      <BsvhuJourneySummary bsvhu={bsvhu} />

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(async data => {
            const { author, date, ...update } = data;
            await updateBsvhu({
              variables: {
                id: bsvhuId,
                input: update as BsvhuInput
              }
            });
            await signBsvhu({
              variables: {
                id: bsvhu.id,
                input: { author, date, type: SignatureTypeInput.Operation }
              }
            });
            onClose();
          })}
        >
          <Select
            label="Opération d'élimination / valorisation réalisée (code D/R)"
            className="fr-col-12"
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
            {!dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
              WasteVehiclesType.Broyeur
            ) && (
              <option value="R 4">
                R 4 - Recyclage ou récupération des métaux et des composés
                métalliques
              </option>
            )}
            {(dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
              WasteVehiclesType.Broyeur
            ) ||
              dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
                WasteVehiclesType.Demolisseur
              )) && (
              <>
                <option value="R 4">
                  R 4 - Recyclage ou récupération des métaux et des composés
                  métalliques
                </option>
                <option value="R 12">
                  R 12 - Échange de déchets en vue de les soumettre à l'une des
                  opérations numérotées R1 à R11
                </option>
              </>
            )}
          </Select>
          {operationCode && (
            <p className="fr-mt-5v fr-mb-5v fr-info-text">
              Code de traitement prévu : {operationCode}
            </p>
          )}
          <RhfOperationModeSelect
            operationCode={operationCode}
            path={"destination.operation.mode"}
            addedDsfrClass="fr-text--bold"
          />

          {dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
            WasteVehiclesType.Demolisseur
          ) && (
            <>
              <h5 className="fr-h5">Numéro de registre de police entrant</h5>
              <div className="fr-col-md-12 fr-mb-4w">
                <IdentificationNumber
                  title="Codes d'identification utilisés par l'établissement"
                  disabled={false}
                  name="destination.reception.identification.numbers"
                  infoMessage={`Vous avez  complété % numéros sur ${bsvhu.identification?.numbers?.length} VHU acceptés`}
                />
              </div>
            </>
          )}

          <p className="fr-text fr-mb-2w">
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant, je confirme
            le traitement des déchets pour la quantité indiquée dans ce
            bordereau.
          </p>

          <div className="fr-col-4 fr-mb-2w">
            <Input
              label="Date de traitement"
              nativeInputProps={{
                type: "date",
                min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
                max: datetimeToYYYYMMDD(TODAY),
                ...register("date")
              }}
              state={formState.errors.date ? "error" : "default"}
              stateRelatedMessage={formState.errors.date?.message}
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
            <Button type="button" priority="secondary" onClick={onCancel}>
              Annuler
            </Button>
            <Button disabled={loading}>Signer</Button>
          </div>
        </form>
      </FormProvider>
    </TdModal>
  );
};

export default SignVhuOperation;
