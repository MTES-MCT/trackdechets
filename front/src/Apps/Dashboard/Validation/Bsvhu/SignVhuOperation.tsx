import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsvhuInput,
  FavoriteType,
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
import { datetimeToYYYYMMDDHHSS } from "../BSPaoh/paohUtils";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import CompanyContactInfo from "../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";

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
        nextDestination: z
          .object({
            company: z.object({
              orgId: z.string().nullish(),
              siret: z.string().nullish(),
              vatNumber: z.string().nullish(),
              name: z.string().nullish(),
              contact: z.string().nullish(),
              phone: z.string().nullish(),
              mail: z.string().nullish(),
              address: z.string().nullish()
            })
          })
          .nullish()
      })
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

  const [updateBsvhu, { error: updateError, loading: loadingUpdate }] =
    useMutation<Pick<Mutation, "updateBsvhu">, MutationUpdateBsvhuArgs>(
      UPDATE_VHU_FORM
    );

  const [signBsvhu, { loading, error }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const title = "Signer le traitement";
  const TODAY = new Date();

  const initialState: ZodBsvhuOperation = {
    date: datetimeToYYYYMMDDHHSS(TODAY),
    author: "",
    destination: {
      operation: {
        date: datetimeToYYYYMMDD(TODAY),
        code: null,
        mode: null,
        nextDestination: {
          company: {
            orgId: null,
            siret: null,
            vatNumber: null,
            name: null,
            address: null,
            contact: null,
            phone: null,
            mail: null
          }
        }
      }
    }
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
  const orgIdNextDestination = watch(
    "destination.operation.nextDestination.company.orgId"
  );

  useEffect(() => {
    if (operationCode === "R 4") {
      setValue("destination.operation.mode", "RECYCLAGE");
    } else {
      setValue("destination.operation.mode", null);
    }
  }, [operationCode, setValue]);

  const onSubmit = async (data: ZodBsvhuOperation) => {
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
        input: {
          author,
          date: TODAY.toISOString(),
          type: SignatureTypeInput.Operation
        }
      }
    });
    onClose();
  };

  if (data == null) {
    return <Loader />;
  }

  const { bsvhu } = data;

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <WasteVhuSummary bsvhu={bsvhu} />
      <BsvhuJourneySummary bsvhu={bsvhu} />

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
            WasteVehiclesType.Demolisseur
          ) && (
            <>
              <h5 className="fr-h5 fr-mb-2w">
                Numéro de registre de police entrant
              </h5>
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

          <Select
            label="Opération d'élimination / valorisation réalisée (code D/R)"
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

            <option value="R 4">
              R 4 - Recyclage ou récupération des métaux et des composés
              métalliques
            </option>

            {(dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
              WasteVehiclesType.Broyeur
            ) ||
              dataCompany?.companyPrivateInfos?.wasteVehiclesTypes?.includes(
                WasteVehiclesType.Demolisseur
              )) && (
              <option value="R 12">
                R 12 - Échange de déchets en vue de les soumettre à l'une des
                opérations numérotées R1 à R11
              </option>
            )}
          </Select>

          <p className="fr-mt-5v fr-mb-5v fr-info-text">
            Code de traitement prévu : {bsvhu.destination?.plannedOperationCode}
          </p>

          {operationCode === "R 12" && (
            <div className="fr-col-md-10 fr-mt-4w">
              <h4 className="fr-h4 fr-mt-2w">
                Installation de broyage prévisionelle (optionnelle)
              </h4>
              <CompanySelectorWrapper
                orgId={siret}
                favoriteType={FavoriteType.Destination}
                selectedCompanyOrgId={orgIdNextDestination}
                allowForeignCompanies={true}
                onCompanySelected={company => {
                  if (company) {
                    const name = `destination.operation.nextDestination.company`;
                    setValue(`${name}.orgId`, company.orgId);
                    setValue(`${name}.siret`, company.siret);
                    setValue(`${name}.vatNumber`, company.vatNumber);
                    setValue(`${name}.name`, company.name);
                    setValue(`${name}.address`, company.address);
                    setValue(
                      `${name}.contact`,
                      bsvhu.destination?.operation?.nextDestination?.company
                        ?.contact || company.contact
                    );
                    setValue(
                      `${name}.phone`,
                      bsvhu.destination?.operation?.nextDestination?.company
                        ?.phone || company.contactPhone
                    );

                    setValue(
                      `${name}.mail`,
                      bsvhu.destination?.operation?.nextDestination?.company
                        ?.mail || company.contactEmail
                    );
                  }
                }}
              />
              <CompanyContactInfo
                fieldName={`destination.operation.nextDestination.company`}
                key={orgIdNextDestination}
              />
            </div>
          )}

          <RhfOperationModeSelect
            operationCode={operationCode}
            path={"destination.operation.mode"}
            addedDsfrClass="fr-text--bold"
          />

          <p className="fr-text fr-mb-2w">
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes et certifie que le
            traitement indiquée ci-contre a bien été réalisée pour la quantité
            de déchets renseignée.
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

export default SignVhuOperation;
