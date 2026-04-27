import {
  Bsff,
  BsdType,
  BsffType,
  Query,
  QueryBsffArgs,
  Mutation,
  MutationUpdateBsffArgs,
  MutationCreateDraftBsffArgs,
  MutationPublishBsffArgs,
  BsffInput,
  MutationCreateBsffTransporterArgs,
  MutationCreateBsffArgs,
  MutationUpdateBsffTransporterArgs,
  BsffTransporterInput,
  TransportMode,
  BsffDestinationInput,
  MutationCreateFicheInterventionBsffArgs
} from "@td/codegen-ui";

import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_DRAFT_BSFF,
  GET_BSFF_FORM,
  CREATE_BSFF,
  PUBLISH_BSFF,
  UPDATE_BSFF_FORM,
  CREATE_BSFF_FICHE_INTERVENTION
} from "../../../common/queries/bsff/queries";

import {
  CREATE_BSFF_TRANSPORTER,
  UPDATE_BSFF_TRANSPORTER
} from "../../../Forms/Components/query";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo, createContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { rawBsffSchema, ZodBsff } from "./schema";
import FormStepsContent from "../FormStepsContent";
import { Loader } from "../../../common/Components";
import initialState from "./utils/initial-state";
import { getComputedState } from "../getComputedState";
import WasteBsff from "./steps/Waste";
import EmitterBsff from "./steps/Emitter";
import DestinationBsff from "./steps/Destination";
import TransporterBsff from "./steps/Transporter";
import DetenteurBsff from "./steps/Detenteur";
import { isForeignVat } from "@td/constants";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  handleGraphQlError,
  TabId
} from "../utils";

interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}

export const BsffContext = createContext<Bsff | undefined>(undefined);

const BsffFormSteps = ({
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

  // ================= QUERY =================
  const bsffQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: { id: bsdId! },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const sealedFields = useMemo(
    () =>
      (bsffQuery?.data?.bsff?.metadata?.fields?.sealed ?? [])
        ?.map(f => f.join("."))
        .filter(Boolean),
    [bsffQuery.data]
  );
  // ================= MUTATIONS =================
  const [createDraftBsff, { loading: creating }] = useMutation<
    Pick<Mutation, "createDraftBsff">,
    MutationCreateDraftBsffArgs
  >(CREATE_DRAFT_BSFF);

  const [updateBsff, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  const [publishBsff, { loading: publishing }] = useMutation<
    Pick<Mutation, "publishBsff">,
    MutationPublishBsffArgs
  >(PUBLISH_BSFF);

  const [createBsffTransporter, { loading: creatingBsffTransporter }] =
    useMutation<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER);

  const [updateBsffTransporter, { loading: updatingBsffTransporter }] =
    useMutation<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER);

  const [createBsff, { loading: creatingBsff }] = useMutation<
    Pick<Mutation, "createBsff">,
    MutationCreateBsffArgs // ← vérifier que ce type existe dans @td/codegen-ui
  >(CREATE_BSFF);

  const [createFicheIntervention] = useMutation<
    Pick<Mutation, "createFicheInterventionBsff">,
    MutationCreateFicheInterventionBsffArgs
  >(CREATE_BSFF_FICHE_INTERVENTION);

  const bsffState = useMemo(
    () =>
      getComputedState(initialState, bsffQuery.data?.bsff, [
        {
          path: "packagings",
          getComputedValue: (intialValue, actualValue) =>
            actualValue.length ? actualValue : intialValue
        },
        {
          path: "grouping",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        },
        {
          path: "forwarding",
          getComputedValue: (initialValue, actualValue) => {
            if (Array.isArray(actualValue)) {
              return actualValue[0] ?? initialValue;
            }
            return actualValue ?? initialValue;
          }
        },
        {
          path: "repackaging",
          getComputedValue: (initialValue, actualValue) =>
            Array.isArray(actualValue) && actualValue.length
              ? actualValue
              : initialValue
        },
        {
          path: "transporters",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        },
        {
          path: "ficheInterventions",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        }
      ]),
    [bsffQuery.data]
  );
  const methods = useForm<ZodBsff>({
    values: bsffState,
    resolver: async (data, context, options) => {
      return zodResolver(rawBsffSchema)(data, context, options);
    }
  });

  useEffect(() => {
    if (bsffState?.id && bsffQuery.data?.bsff?.id) {
      methods.reset(bsffState);
    }
  }, [bsffState, bsffQuery.data?.bsff?.id, methods]);

  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsff,
    errorsFromPublishApi
  );

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsff,
    publishErrorTabIds,
    formStateErrorsKeys
  );
  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsff, errorsFromPublishApi),
    [errorsFromPublishApi]
  );

  useEffect(() => {
    for (const error of publishErrorMessages) {
      methods.setError(error.name as keyof ZodBsff, {
        type: "custom",
        message: error.message
      });
    }
  }, [publishErrorMessages, methods]);

  const [bsffContext, setBsffContext] = useState<Bsff | undefined>();

  useEffect(() => {
    if (bsffQuery.data?.bsff?.id) {
      setBsffContext(bsffQuery.data.bsff);
    }
  }, [bsffQuery.data?.bsff]);

  const type = methods.watch("type");

  const tabsContent = useMemo(
    () => ({
      waste: <WasteBsff />,
      emitter:
        type === BsffType.CollectePetitesQuantites ? (
          <EmitterBsff />
        ) : undefined,
      detenteur: <DetenteurBsff />,
      transporter: <TransporterBsff />,
      destination: <DestinationBsff />
    }),
    [type]
  );

  const loading =
    creating ||
    publishing ||
    creatingBsff ||
    updating ||
    creatingBsffTransporter ||
    updatingBsffTransporter;
  const mainCtaLabel = bsffState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = bsffState.id ? "" : "Enregistrer en brouillon";

  function cleanCompany(company: any) {
    if (!company) return undefined;
    const isEmpty = Object.values(company).every(v => !v);
    return isEmpty ? undefined : company;
  }

  async function saveBsff(values: ZodBsff, draft: boolean) {
    const {
      transporters = [],
      destination,
      packagings,
      type,
      grouping = [],
      forwarding,
      repackaging = [],
      waste,
      ficheInterventions = [],
      emitter,
      weight
    } = values;

    // TRANSPORTERS
    let transporterIds: string[] = [];
    try {
      transporterIds = await Promise.all(
        transporters
          .filter(t => t && (t.company?.siret || t.company?.vatNumber))
          .map(t => saveBsffTransporter(t))
      );
    } catch {
      return;
    }

    // FICHE INTERVENTIONS
    let ficheInterventionIds: string[] = [];

    if (ficheInterventions?.length) {
      try {
        ficheInterventionIds = await Promise.all(
          ficheInterventions.map(async fi => {
            //Déjà existante (édition)
            if ((fi as any)?.id) return (fi as any).id;

            //Nouvelle fiche → créer via API
            const { data } = await createFicheIntervention({
              variables: {
                input: {
                  numero: fi.numero,
                  weight: Number(fi.weight),
                  postalCode: fi.postalCode,
                  detenteur: fi.detenteur,
                  operateur: {
                    company: cleanCompany(emitter?.company)
                  }
                }
              }
            });

            return data?.createFicheInterventionBsff?.id ?? null;
          })
        );

        //Nettoyage des null
        ficheInterventionIds = ficheInterventionIds.filter(
          (id): id is string => !!id
        );
      } catch (err) {
        console.error("Erreur création fiche intervention", err);
        return;
      }
    }

    //  CLEAN DATA
    const cleanWaste = waste?.code
      ? {
          code: waste.code,
          adr: waste.adr?.trim() || null,
          description: waste.description?.trim() || null
        }
      : undefined;

    const cleanDestination: BsffDestinationInput | undefined = destination
      ? {
          cap: destination.cap ?? undefined,
          company: cleanCompany(destination.company),
          customInfo: destination.customInfo ?? undefined,
          plannedOperationCode: destination.plannedOperationCode ?? undefined,
          reception: destination.reception?.date
            ? { date: destination.reception.date.toISOString() }
            : undefined
        }
      : undefined;

    const cleanPackagings =
      type && [BsffType.Groupement, BsffType.Reexpedition].includes(type)
        ? undefined
        : packagings?.map(p => ({
            type: p.type,
            numero: p.numero,
            other: p.other ?? null,
            volume: p.volume ?? null,
            weight: Number(p.weight ?? 0)
          }));

    // ================= INPUT =================
    const input: BsffInput = {
      type,
      emitter: emitter
        ? {
            ...emitter,
            company: cleanCompany(emitter.company)
          }
        : undefined,
      waste: cleanWaste,
      weight: {
        value: Number(weight?.value ?? 0),
        isEstimate: weight?.isEstimate ?? false
      },
      destination: cleanDestination,
      transporters: transporterIds,
      ficheInterventions: ficheInterventionIds,
      packagings: cleanPackagings,
      forwarding:
        type === BsffType.Reexpedition
          ? forwarding?.id
            ? [forwarding.id]
            : []
          : [],
      repackaging:
        type === BsffType.Reconditionnement ? repackaging.map(r => r.id) : [],
      grouping:
        type === BsffType.Groupement ? grouping?.map(g => g.id) ?? [] : []
    };

    //  UPDATE
    if (bsffState.id) {
      if (draft) {
        return updateBsff({ variables: { id: bsffState.id, input } });
      }

      await updateBsff({ variables: { id: bsffState.id, input } });

      try {
        return await publishBsff({ variables: { id: bsffState.id } });
      } catch (err: any) {
        const normalizedErrors = handleGraphQlError(err);
        setPublishErrors(normalizedErrors);
        throw err;
      }
    }

    // CREATE =================
    if (draft) {
      return createDraftBsff({ variables: { input } });
    }

    try {
      return await createBsff({ variables: { input } });
    } catch (err: any) {
      const normalizedErrors = handleGraphQlError(err);
      setPublishErrors(normalizedErrors);
      throw err;
    }
  }

  async function saveBsffTransporter(t: any): Promise<string> {
    const { id, takenOverAt, transport, ...input } = t;

    const cleanInput: BsffTransporterInput = {
      ...input,
      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },
      recepisse: {
        ...input.recepisse,
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
      if (!takenOverAt) {
        await updateBsffTransporter({
          variables: { id, input: cleanInput }
        });
      }
      return id;
    }

    const { data } = await createBsffTransporter({
      variables: { input: cleanInput }
    });

    return data?.createBsffTransporter?.id ?? "";
  }

  return (
    <BsffContext.Provider value={bsffContext}>
      <FormStepsContent
        bsdType={BsdType.Bsff}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveBsff}
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
    </BsffContext.Provider>
  );
};

export default BsffFormSteps;
