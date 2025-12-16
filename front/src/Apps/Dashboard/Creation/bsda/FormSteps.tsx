import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bsda,
  BsdType,
  BsdaType,
  Query,
  QueryBsdaArgs,
  Mutation,
  MutationCreateBsdaArgs,
  MutationUpdateBsdaArgs,
  MutationCreateBsdaTransporterArgs,
  MutationUpdateBsdaTransporterArgs,
  BsdaInput,
  BsdaTransporterInput,
  TransportMode
} from "@td/codegen-ui";
import omitDeep from "omit-deep-lodash";
import React, { useMemo, useState, createContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "../../../common/Components";
import FormStepsContent from "../FormStepsContent";
import EmitterBsda from "./steps/Emitter";

import {
  CREATE_BSDA,
  GET_BSDA,
  PUBLISH_BSDA,
  UPDATE_BSDA
} from "../../../common/queries/bsda/queries";
import { getComputedState } from "../getComputedState";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  TabId
} from "../utils";
import { rawBsdaSchema, ZodBsda } from "./schema";
import initialState, {
  BsdaValues,
  CreateOrUpdateBsdaTransporterInput
} from "./utils/initial-state";
import Worker from "./steps/Worker";
import TransporterBsda from "./steps/Transporter";
import DestinationBsda from "./steps/Destination";
import ActorsList from "./steps/ActorsList";
import WasteBsda from "./steps/Waste";
import {
  CREATE_BSDA_TRANSPORTER,
  UPDATE_BSDA_TRANSPORTER
} from "../../../Forms/Components/query";
import { isForeignVat } from "@td/constants";
import { toastApolloError } from "../toaster";
import { cleanPackagings } from "../../../Forms/Components/PackagingList/helpers";
import { isDefinedStrict } from "../../../../common/helper";
import { parseDate } from "../../../../common/datetime";

interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
export const BsdaContext = createContext<Bsda | undefined>(undefined);

const BsdaFormSteps = ({
  bsdId,
  publishErrorsFromRedirect
}: Readonly<Props>) => {
  const [publishErrors, setPublishErrors] = useState<
    | {
        code: string;
        path: string[];
        message: string;
      }[]
    | undefined
  >();

  const bsdaQuery = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdId!
    },
    skip: !bsdId,
    fetchPolicy: "network-only"
  });

  const sealedFields = useMemo(
    () =>
      (bsdaQuery?.data?.bsda?.metadata?.fields?.sealed ?? [])
        ?.map(f => f.join("."))
        .filter(Boolean),
    [bsdaQuery.data]
  );

  const [createBsda, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsda">,
    MutationCreateBsdaArgs
  >(CREATE_BSDA);

  const [publishBsda, { loading: publishing }] = useMutation<
    Pick<Mutation, "createBsda">,
    MutationCreateBsdaArgs
  >(PUBLISH_BSDA);

  const [updateBsda, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);

  const [createBsdaTransporter, { loading: creatingBsdaTransporter }] =
    useMutation<
      Pick<Mutation, "createBsdaTransporter">,
      MutationCreateBsdaTransporterArgs
    >(CREATE_BSDA_TRANSPORTER);

  const [updateBsdaTransporter, { loading: updatingBsdaTransporter }] =
    useMutation<
      Pick<Mutation, "updateBsdaTransporter">,
      MutationUpdateBsdaTransporterArgs
    >(UPDATE_BSDA_TRANSPORTER);

  const bsdaState = useMemo(
    () =>
      getComputedState(initialState, bsdaQuery.data?.bsda, [
        {
          path: "packagings",
          getComputedValue: (intialValue, actualValue) =>
            actualValue.length ? actualValue : intialValue
        },
        {
          path: "grouping",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.map(g => g.id) ?? initialValue
        }
      ]),
    [bsdaQuery.data]
  );

  const methods = useForm<ZodBsda>({
    values: bsdaState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBsdaSchema)(data, context, options);
    }
  });
  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsda,
    errorsFromPublishApi
  );

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsda,
    publishErrorTabIds,
    formStateErrorsKeys
  );
  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsda, errorsFromPublishApi),
    [errorsFromPublishApi]
  );
  const [bsdaContext, setBsdaContext] = useState<Bsda | undefined>();

  const type = methods.watch("type");

  useEffect(() => {
    if (bsdaQuery.data?.bsda?.id) {
      setBsdaContext(bsdaQuery.data.bsda);
    }
  }, [bsdaQuery.data?.bsda]);

  const tabsContent = useMemo(
    () => ({
      waste: (
        <WasteBsda
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.waste
          )}
        />
      ),
      emitter: (
        <EmitterBsda
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.emitter
          )}
        />
      ),
      worker:
        type === BsdaType.OtherCollections ? (
          <Worker
            errors={publishErrorMessages.filter(
              error => error.tabId === TabId.worker
            )}
          />
        ) : null,
      transporter: <TransporterBsda />,
      destination: (
        <DestinationBsda
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.destination
          )}
        />
      ),
      other: <ActorsList />
    }),
    [publishErrorMessages, type]
  );

  const loading =
    creating ||
    publishing ||
    updating ||
    creatingBsdaTransporter ||
    updatingBsdaTransporter;
  const mainCtaLabel = bsdaState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = bsdaState.id ? "" : "Enregistrer en brouillon";

  const cleanupFields = (input: BsdaInput): BsdaInput => {
    // When created through api, this field might be null in db
    // We send it as false at creation time from the UI, but we dont have any
    // mean to edit it, and it is locked once signed by worker
    // This can lead to unsolvable cases.
    // While waiting a better fix (eg. an editable field or to default the field as false),
    // this function unlocks users

    return omitDeep(input, "worker.work");
  };

  async function saveBsda(values: BsdaInput, draft: boolean): Promise<any> {
    const bsdaInput = await saveTransporters(values as BsdaValues);
    const input = { ...bsdaInput };

    const cleanInputTransporters =
      input.type === BsdaType.Collection_2710
        ? // s'assure qu'on ne crée pas un transporteur "vide"
          // dans le cadre d'un BSDA de collecte en déchetterie
          // qui n'autorise pas l'ajout de transporteur
          { ...input, transporters: [] }
        : input;

    let cleanInput = omitDeep(cleanInputTransporters, [
      "isDraft",
      "ecoOrganisme.hasEcoOrganisme",
      "hasBroker",
      "hasIntermediaries",
      "emitter.company.street",
      "emitter.company.city",
      "emitter.company.postalCode"
    ]);
    const worker = cleanInput.worker.isDisabled
      ? { ...cleanInput.worker }
      : cleanInput.worker.certification
      ? {
          ...cleanInput.worker,
          certification: {
            ...cleanInput.worker.certification,
            validityLimit: Boolean(
              cleanInput.worker?.certification?.validityLimit
            )
              ? parseDate(
                  cleanInput.worker?.certification?.validityLimit
                ).toISOString()
              : null
          }
        }
      : {
          isDisabled: false,
          company: cleanInput.worker.company,
          certification: {
            hasSubSectionFour: false,
            hasSubSectionThree: false,
            certificationNumber: "",
            validityLimit: null,
            organisation: ""
          }
        };

    cleanInput = {
      ...cleanInput,
      worker
    };

    if (bsdaState.id) {
      return updateBsda({
        variables: { id: bsdaState.id, input: cleanupFields(cleanInput) }
      });
    } else {
      if (draft) {
        return createBsda({ variables: { input: cleanInput } });
      } else {
        return publishBsda({ variables: { input: cleanInput } });
      }
    }
  }

  async function saveBsdaTransporter(
    transporterInput: CreateOrUpdateBsdaTransporterInput
  ): Promise<string> {
    const { id, transport, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles dans les
    // cas suivants :
    // - l'exemption est cochée
    // - le transporteur est étranger
    // - le transport ne se fait pas par la route
    const cleanInput: BsdaTransporterInput = {
      ...input,
      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },
      recepisse: {
        ...input.recepisse,
        validityLimit: !!input.recepisse?.validityLimit
          ? parseDate(input.recepisse.validityLimit).toISOString()
          : null,
        ...(input.recepisse?.isExempted ||
        isForeignVat(input?.company?.vatNumber) ||
        transport?.mode !== TransportMode.Road
          ? {
              number: null,
              validityLimit: null,
              department: null
            }
          : {})
      }
    };

    if (id) {
      // Le transporteur existe déjà en base de données, on met
      // à jour les infos (uniquement si le transporteur n'a pas encore
      // pris en charge le déchet) et on renvoie l'identifiant
      if (!transport?.takenOverAt) {
        const { errors } = await updateBsdaTransporter({
          variables: { id, input: cleanInput },
          onError: err => {
            toastApolloError(err);
          }
        });
        if (errors) {
          throw new Error(errors.map(e => e.message).join("\n"));
        }
      }
      return id;
    } else {
      // Le transporteur n'existe pas encore en base, on le crée
      // et on renvoie l'identifiant retourné
      const { data, errors } = await createBsdaTransporter({
        variables: { input: cleanInput },
        onError: err => {
          toastApolloError(err);
        }
      });
      if (errors) {
        throw new Error(errors.map(e => e.message).join("\n"));
      }
      // if `errors` is not defined then data?.createFormTransporter?.id
      // should be defined. For type safety we return "" if it is not, but
      // it should not hapen
      return data?.createBsdaTransporter?.id ?? "";
    }
  }

  async function saveTransporters(values: BsdaValues) {
    const { id, transporters, packagings, ...input } = values;
    let transporterIds: string[] = [];

    try {
      transporterIds = await Promise.all(
        transporters.map(t => saveBsdaTransporter(t))
      );
    } catch (_) {
      // Si une erreur survient pendant la sauvegarde des données
      // transporteur, on n'essaye même pas de sauvgarder le bordereau
      return;
    }

    const bsdaInput: BsdaInput = {
      ...input,
      transporters: transporterIds,
      packagings: cleanPackagings(packagings ?? [])
    };

    // Careful. Legacy BSDAs have a `waste.isSubjectToADR` field
    // set to null, but the toggle is automatically set to true.
    const initialBsda = bsdaQuery.data?.bsda;
    if (
      // If legacy BSDA...
      initialBsda?.waste?.isSubjectToADR === null &&
      // ...and the user did not change the toggle (nor the ADR value)
      bsdaInput.waste?.isSubjectToADR === true &&
      (!isDefinedStrict(bsdaInput.waste?.adr) ||
        bsdaInput.waste?.adr === initialBsda.waste?.adr)
    ) {
      bsdaInput.waste.isSubjectToADR = null;
    }

    return bsdaInput;
  }

  return (
    <BsdaContext.Provider value={bsdaContext}>
      <FormStepsContent
        bsdType={BsdType.Bsda}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveBsda}
        useformMethods={methods}
        tabsContent={tabsContent}
        sealedFields={sealedFields}
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
        genericErrorMessage={publishErrorMessages.filter(
          error => error.tabId === TabId.none
        )}
      />
      {loading && <Loader />}
    </BsdaContext.Provider>
  );
};

export default BsdaFormSteps;
