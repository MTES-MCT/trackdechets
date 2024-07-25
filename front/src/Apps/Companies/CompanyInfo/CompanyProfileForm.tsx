import React from "react";
import CompanyFormWrapper from "../common/Components/CompanyFormWrapper";
import { useForm } from "react-hook-form";
import {
  CompanyPrivate,
  CompanyType,
  Mutation,
  MutationCreateBrokerReceiptArgs,
  MutationCreateTraderReceiptArgs,
  MutationCreateTransporterReceiptArgs,
  MutationCreateVhuAgrementArgs,
  MutationCreateWorkerCertificationArgs,
  MutationDeleteBrokerReceiptArgs,
  MutationDeleteTraderReceiptArgs,
  MutationDeleteTransporterReceiptArgs,
  MutationDeleteWorkerCertificationArgs,
  MutationUpdateBrokerReceiptArgs,
  MutationUpdateCompanyArgs,
  MutationUpdateTraderReceiptArgs,
  MutationUpdateVhuAgrementArgs,
  MutationUpdateWorkerCertificationArgs,
  UserRole,
  WasteVehiclesType
} from "@td/codegen-ui";
import { formatDate } from "../common/utils";
import {
  CREATE_BROKER_RECEIPT,
  CREATE_TRADER_RECEIPT,
  CREATE_TRANSPORTER_RECEIPT,
  CREATE_VHU_AGREMENT,
  CREATE_WORKER_CERTIFICATION,
  DELETE_BROKER_RECEIPT,
  DELETE_TRADER_RECEIPT,
  DELETE_TRANSPORTER_RECEIPT,
  DELETE_VHU_AGREMENT,
  DELETE_WORKER_CERTIFICATION,
  UPDATE_BROKER_RECEIPT,
  UPDATE_COMPANY_PROFILE,
  UPDATE_TRADER_RECEIPT,
  UPDATE_TRANSPORTER_RECEIPT,
  UPDATE_VHU_AGREMENT,
  UPDATE_WORKER_CERTIFICATION
} from "../common/queries";
import { useMutation } from "@apollo/client";
import { Loader } from "../../common/Components";
import { NotificationError } from "../../common/Components/Error/Error";
import CompanyProfileInformation from "./CompanyProfileInformation";
import RhfCompanyTypeForm, {
  RhfCompanyTypeFormField
} from "../common/Components/CompanyTypeForm/RhfCompanyTypeForm";
import { MutationUpdateTransporterReceiptArgs } from "back/src/generated/graphql/types";

interface CompanyProfileFormProps {
  company: CompanyPrivate;
}

const CompanyProfileForm = ({ company }: CompanyProfileFormProps) => {
  const [
    updateCompany,
    { loading: loadingCompanyUpdate, error: errorCompanyUpdate }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_PROFILE
  );

  const defaultValues: RhfCompanyTypeFormField = {
    companyTypes: company.companyTypes,
    vhuAgrementBroyeur: company.vhuAgrementBroyeur,
    vhuAgrementDemolisseur: company.vhuAgrementDemolisseur,
    transporterReceipt: company.transporterReceipt && {
      ...company.transporterReceipt,
      validityLimit: formatDate(company.transporterReceipt?.validityLimit)
    },
    brokerReceipt: company.brokerReceipt && {
      ...company.brokerReceipt,
      validityLimit: formatDate(company.brokerReceipt?.validityLimit)
    },
    traderReceipt: company.traderReceipt && {
      ...company.traderReceipt,
      validityLimit: formatDate(company.traderReceipt?.validityLimit)
    },
    workerCertification: company.workerCertification && {
      ...company.workerCertification,
      validityLimit: formatDate(company.workerCertification?.validityLimit)
    },
    collectorTypes: company.collectorTypes,
    wasteProcessorTypes: company.wasteProcessorTypes,
    wasteVehiclesTypes: company.wasteVehiclesTypes,
    ecoOrganismeAgreements: company.ecoOrganismeAgreements
  };

  const { handleSubmit, reset, formState, register, watch, setValue } =
    useForm<RhfCompanyTypeFormField>({
      defaultValues
    });

  const [
    createTransporterReceipt,
    {
      loading: loadingCreateTransporterReceipt,
      error: errorCreateTransporterReceipt
    }
  ] = useMutation<
    Pick<Mutation, "createTransporterReceipt">,
    MutationCreateTransporterReceiptArgs
  >(CREATE_TRANSPORTER_RECEIPT);

  const [
    updateTransporterReceipt,
    {
      loading: loadingUpdateTransporterReceipt,
      error: errorUpdateTransporterReceipt
    }
  ] = useMutation<
    Pick<Mutation, "updateTransporterReceipt">,
    MutationUpdateTransporterReceiptArgs
  >(UPDATE_TRANSPORTER_RECEIPT);

  const loadingTransportReceipt =
    loadingCreateTransporterReceipt || loadingUpdateTransporterReceipt;
  const errorTransportReceipt =
    errorCreateTransporterReceipt || errorUpdateTransporterReceipt;

  const [deleteTransporterReceipt] = useMutation<
    Pick<Mutation, "deleteTransporterReceipt">,
    MutationDeleteTransporterReceiptArgs
  >(DELETE_TRANSPORTER_RECEIPT);

  const [
    createVhuAgrement,
    { loading: loadingCreateVhuAgrement, error: errorCreateVhuAgrement }
  ] = useMutation<
    Pick<Mutation, "createVhuAgrement">,
    MutationCreateVhuAgrementArgs
  >(CREATE_VHU_AGREMENT);

  const [
    updateVhuAgrement,
    { loading: loadingUpdateVhuAgrement, error: errorUpdateVhuAgrement }
  ] = useMutation<
    Pick<Mutation, "updateVhuAgrement">,
    MutationUpdateVhuAgrementArgs
  >(UPDATE_VHU_AGREMENT);

  const loadingVhuAgrement =
    loadingCreateVhuAgrement || loadingUpdateVhuAgrement;
  const errorVhuAgrement = errorCreateVhuAgrement || errorUpdateVhuAgrement;

  const [
    deleteVhuAgrement,
    { loading: loadingDeleteVhuAgrement, error: errorDeleteVhuAgrement }
  ] = useMutation(DELETE_VHU_AGREMENT);

  const [
    createTraderReceipt,
    { loading: loadingCreateTraderReceipt, error: errorCreateTraderReceipt }
  ] = useMutation<
    Pick<Mutation, "createTraderReceipt">,
    MutationCreateTraderReceiptArgs
  >(CREATE_TRADER_RECEIPT);

  const [
    updateTraderReceipt,
    { loading: loadingUpdateTraderReceipt, error: errorUpdateTraderReceipt }
  ] = useMutation<
    Pick<Mutation, "updateTraderReceipt">,
    MutationUpdateTraderReceiptArgs
  >(UPDATE_TRADER_RECEIPT);

  const loadingTraderReceipt =
    loadingCreateTraderReceipt || loadingUpdateTraderReceipt;
  const errorTraderReceipt =
    errorCreateTraderReceipt || errorUpdateTraderReceipt;

  const [
    deleteTraderReceipt,
    { loading: deleteLoadingTraderReceipt, error: deleteErrorTraderReceipt }
  ] = useMutation<
    Pick<Mutation, "deleteTraderReceipt">,
    MutationDeleteTraderReceiptArgs
  >(DELETE_TRADER_RECEIPT);

  const [
    createBrokerReceipt,
    { loading: loadingCreateBrokerReceipt, error: errorCreateBrokerReceipt }
  ] = useMutation<
    Pick<Mutation, "createBrokerReceipt">,
    MutationCreateBrokerReceiptArgs
  >(CREATE_BROKER_RECEIPT);

  const [
    updateBrokerReceipt,
    { loading: loadingUpdateBrokerReceipt, error: errorUpdateBrokerReceipt }
  ] = useMutation<
    Pick<Mutation, "updateBrokerReceipt">,
    MutationUpdateBrokerReceiptArgs
  >(UPDATE_BROKER_RECEIPT);

  const loadingBrokerReceipt =
    loadingCreateBrokerReceipt || loadingUpdateBrokerReceipt;
  const errorBrokerReceipt =
    errorCreateBrokerReceipt || errorUpdateBrokerReceipt;

  const [
    deleteBrokerReceipt,
    { loading: deleteLoadingBrokerReceipt, error: deleteErrorBrokerReceipt }
  ] = useMutation<
    Pick<Mutation, "deleteBrokerReceipt">,
    MutationDeleteBrokerReceiptArgs
  >(DELETE_BROKER_RECEIPT);

  const [
    createWorkerCertification,
    {
      loading: loadingCreateWorkerCertification,
      error: errorCreateWorkerCertification
    }
  ] = useMutation<
    Pick<Mutation, "createWorkerCertification">,
    MutationCreateWorkerCertificationArgs
  >(CREATE_WORKER_CERTIFICATION);

  const [
    updateWorkerCertification,
    {
      loading: loadingUpdateWorkerCertification,
      error: errorUpdateWorkerCertification
    }
  ] = useMutation<
    Pick<Mutation, "updateWorkerCertification">,
    MutationUpdateWorkerCertificationArgs
  >(UPDATE_WORKER_CERTIFICATION);

  const loadingWorkerCertification =
    loadingCreateWorkerCertification || loadingUpdateWorkerCertification;
  const errorWorkerCertification =
    errorCreateWorkerCertification || errorUpdateWorkerCertification;

  const [
    deleteWorkerCertification,
    { loading: deleteLoadingWorkerCertif, error: deleteErrorWorkerCertif }
  ] = useMutation<
    Pick<Mutation, "deleteWorkerCertification">,
    MutationDeleteWorkerCertificationArgs
  >(DELETE_WORKER_CERTIFICATION);

  const handleTransporterReceiptUpdate = async (
    data: RhfCompanyTypeFormField
  ) => {
    let transporterReceiptId: string | null | undefined = undefined;
    let shouldDeleteTransporterReceipt = false;

    if (data.companyTypes.includes(CompanyType.Transporter)) {
      if (!!formState.dirtyFields.transporterReceipt) {
        if (
          !!data.transporterReceipt?.receiptNumber &&
          !!data.transporterReceipt?.validityLimit &&
          !!data.transporterReceipt?.department
        ) {
          const transporterReceiptData = {
            receiptNumber: data.transporterReceipt?.receiptNumber,
            validityLimit: data.transporterReceipt?.validityLimit as any,
            department: data.transporterReceipt?.department
          };

          if (company.transporterReceipt) {
            // Un récépissé transporteur existe déjà, il suffit de le mettre à jour
            await updateTransporterReceipt({
              variables: {
                input: {
                  id: company.transporterReceipt.id,
                  ...transporterReceiptData
                }
              }
            });
          } else {
            // L'établissement ne possède pas encore de récépissé transporteur,
            // il est nécessaire de le créer est de l'associer à l'établissement
            // en passant le paramètre `transporterReceiptId` à `updateCompany`
            const { data: newReceiptData } = await createTransporterReceipt({
              variables: { input: transporterReceiptData }
            });
            if (newReceiptData) {
              transporterReceiptId = newReceiptData.createTransporterReceipt.id;
            }
          }
        } else {
          // on supprime le récépissé
          transporterReceiptId = null;
          shouldDeleteTransporterReceipt = true;
        }
      }
    } else if (company.transporterReceipt) {
      // L'établissement possédait un récépissé transporteur mais le profil TRANSPORTEUR
      // a été dé-sélectionné. On supprime donc le récépissé correspondant.

      // Permet de dissocier le récépissé de l'établissement
      transporterReceiptId = null;

      // Permet de supprimer le récépissé après l'avoir dissocié
      shouldDeleteTransporterReceipt = true;
    }

    return { transporterReceiptId, shouldDeleteTransporterReceipt };
  };

  const handleTraderReceiptUpdate = async (data: RhfCompanyTypeFormField) => {
    let traderReceiptId: string | null | undefined = undefined;
    let shouldDeleteTraderReceipt = false;

    if (data.companyTypes.includes(CompanyType.Trader)) {
      if (!!formState.dirtyFields.traderReceipt) {
        if (
          !!data.traderReceipt?.receiptNumber &&
          !!data.traderReceipt?.validityLimit &&
          !!data.traderReceipt?.department
        ) {
          const traderReceiptData = {
            receiptNumber: data.traderReceipt?.receiptNumber,
            validityLimit: data.traderReceipt?.validityLimit as any,
            department: data.traderReceipt?.department
          };

          if (company.traderReceipt) {
            // Un récépissé négociant existe déjà, il suffit de le mettre à jour
            await updateTraderReceipt({
              variables: {
                input: {
                  id: company.traderReceipt.id,
                  ...traderReceiptData
                }
              }
            });
          } else {
            // L'établissement ne possède pas encore de récépissé négociant,
            // il est nécessaire de le créer est de l'associer à l'établissement
            // en passant le paramètre `traderReceiptId` à `updateCompany`
            const { data: newReceiptData } = await createTraderReceipt({
              variables: { input: traderReceiptData }
            });
            if (newReceiptData) {
              traderReceiptId = newReceiptData.createTraderReceipt.id;
            }
          }
        } else {
          // do nothing, la validation ne le permet pas normalement
        }
      }
    } else if (company.traderReceipt) {
      // L'établissement possédait un récépissé négociant mais le profil TRADER
      // a été dé-sélectionné. On supprime donc le récépissé correspondant.

      // Permet de dissocier le récépissé de l'établissement
      traderReceiptId = null;

      // Permet de supprimer le récépissé après l'avoir dissocié
      shouldDeleteTraderReceipt = true;
    }

    return {
      traderReceiptId,
      shouldDeleteTraderReceipt
    };
  };

  const handleBrokerReceiptUpdate = async (data: RhfCompanyTypeFormField) => {
    let brokerReceiptId: string | null | undefined = undefined;
    let shouldDeleteBrokerReceipt = false;

    if (data.companyTypes.includes(CompanyType.Broker)) {
      if (!!formState.dirtyFields.brokerReceipt) {
        if (
          !!data.brokerReceipt?.receiptNumber &&
          !!data.brokerReceipt?.validityLimit &&
          !!data.brokerReceipt?.department
        ) {
          const brokerReceiptData = {
            receiptNumber: data.brokerReceipt?.receiptNumber,
            validityLimit: data.brokerReceipt?.validityLimit as any,
            department: data.brokerReceipt?.department
          };

          if (company.brokerReceipt) {
            // Un récépissé courtier existe déjà, il suffit de le mettre à jour
            await updateBrokerReceipt({
              variables: {
                input: {
                  id: company.brokerReceipt.id,
                  ...brokerReceiptData
                }
              }
            });
          } else {
            // L'établissement ne possède pas encore de récépissé courier,
            // il est nécessaire de le créer est de l'associer à l'établissement
            // en passant le paramètre `brokerReceiptId` à `updateCompany`
            const { data: newReceiptData } = await createBrokerReceipt({
              variables: { input: brokerReceiptData }
            });
            if (newReceiptData) {
              brokerReceiptId = newReceiptData.createBrokerReceipt.id;
            }
          }
        } else {
          // do nothing, la validation ne le permet pas normalement
        }
      }
    } else if (company.brokerReceipt) {
      // L'établissement possédait un récépissé courtier mais le profil COURTIER
      // a été dé-sélectionné. On supprime donc le récépissé correspondant.

      // Permet de dissocier le récépissé de l'établissement
      brokerReceiptId = null;

      // Permet de supprimer le récépissé après l'avoir dissocié
      shouldDeleteBrokerReceipt = true;
    }

    return {
      brokerReceiptId,
      shouldDeleteBrokerReceipt
    };
  };

  const handleWorkerCertificationUpdate = async (
    data: RhfCompanyTypeFormField
  ) => {
    let workerCertificationId: string | null | undefined = undefined;
    let shouldDeleteWorkerCertification = false;

    if (data.companyTypes.includes(CompanyType.Worker)) {
      if (!!formState.dirtyFields.workerCertification) {
        const workerCertificationData = {
          hasSubSectionFour:
            data.workerCertification?.hasSubSectionFour ?? false,
          hasSubSectionThree:
            data.workerCertification?.hasSubSectionThree ?? false,
          certificationNumber: data.workerCertification?.certificationNumber,
          validityLimit: data.workerCertification?.validityLimit,
          organisation: data.workerCertification?.organisation
        };

        if (company.workerCertification) {
          // Une certification existe déjà, il suffit de la mettre à jour
          await updateWorkerCertification({
            variables: {
              input: {
                id: company.workerCertification.id,
                ...workerCertificationData
              }
            }
          });
        } else {
          // L'établissement ne possède pas encore de certification,
          // il est nécessaire de la créer est de l'associer à l'établissement
          // en passant le paramètre `workerCertificationId` à `updateCompany`
          const { data: newCertificationData } =
            await createWorkerCertification({
              variables: { input: workerCertificationData }
            });
          if (newCertificationData) {
            workerCertificationId =
              newCertificationData.createWorkerCertification.id;
          }
        }
      }
    } else if (company.workerCertification) {
      // L'établissement possédait une certification mais le profil WORKER
      // a été dé-sélectionné. On supprime donc la certification correspondante.

      // Permet de dissocier la certification de l'établissement
      workerCertificationId = null;

      // Permet de supprimer la certification après l'avoir dissocié
      shouldDeleteWorkerCertification = true;
    }

    return {
      workerCertificationId,
      shouldDeleteWorkerCertification
    };
  };

  const handleVhuAgrementBroyeurUpdate = async (
    data: RhfCompanyTypeFormField
  ) => {
    let vhuAgrementBroyeurId: string | null | undefined = undefined;
    let shouldDeleteVhuBroyeurAgrement = false;

    if (
      data.companyTypes.includes(CompanyType.WasteVehicles) &&
      data.wasteVehiclesTypes.includes(WasteVehiclesType.Broyeur)
    ) {
      if (!!formState.dirtyFields.vhuAgrementBroyeur) {
        if (
          !!data?.vhuAgrementBroyeur?.agrementNumber &&
          !!data?.vhuAgrementBroyeur?.department
        ) {
          const vhuAgrementBroyeurData = {
            agrementNumber: data?.vhuAgrementBroyeur?.agrementNumber,
            department: data?.vhuAgrementBroyeur?.department
          };

          if (company.vhuAgrementBroyeur) {
            // Un agrément existe déjà, il suffit de le mettre à jour
            await updateVhuAgrement({
              variables: {
                input: {
                  id: company.vhuAgrementBroyeur.id,
                  ...vhuAgrementBroyeurData
                }
              }
            });
          } else {
            // L'établissement ne possède pas encore d'agrément broyeur,
            // il est nécessaire de le créer est de l'associer à l'établissement
            // en passant le paramètre `vhuBroyeurAgrementId` à `updateCompany`
            const { data: newAgrementData } = await createVhuAgrement({
              variables: { input: vhuAgrementBroyeurData }
            });
            if (newAgrementData) {
              vhuAgrementBroyeurId = newAgrementData.createVhuAgrement.id;
            }
          }
        } else {
          // do nothing, la validation ne le permet pas normalement
        }
      }
    } else if (company.vhuAgrementBroyeur) {
      // L'établissement possédait un agrément mais le profil BROYEUR
      // a été dé-sélectionné. On supprime donc l'agrément correspondant.

      // Permet de dissocier l'agrément de l'établissement
      vhuAgrementBroyeurId = null;

      // Permet de supprimer l'agrément après l'avoir dissocié
      shouldDeleteVhuBroyeurAgrement = true;
    }

    return {
      vhuAgrementBroyeurId,
      shouldDeleteVhuBroyeurAgrement
    };
  };

  const handleVhuAgrementDemolisseurUpdate = async (
    data: RhfCompanyTypeFormField
  ) => {
    let vhuAgrementDemolisseurId: string | null | undefined = undefined;
    let shouldDeleteVhuDemolisseurAgrement = false;

    if (
      data.companyTypes.includes(CompanyType.WasteVehicles) &&
      data.wasteVehiclesTypes.includes(WasteVehiclesType.Demolisseur)
    ) {
      if (!!formState.dirtyFields.vhuAgrementDemolisseur) {
        if (
          !!data?.vhuAgrementDemolisseur?.agrementNumber &&
          !!data?.vhuAgrementDemolisseur?.department
        ) {
          const vhuAgrementDemolisseurData = {
            agrementNumber: data?.vhuAgrementDemolisseur?.agrementNumber,
            department: data?.vhuAgrementDemolisseur?.department
          };

          if (company.vhuAgrementDemolisseur) {
            // Un agrément existe déjà, il suffit de le mettre à jour
            await updateVhuAgrement({
              variables: {
                input: {
                  id: company.vhuAgrementDemolisseur.id,
                  ...vhuAgrementDemolisseurData
                }
              }
            });
          } else {
            // L'établissement ne possède pas encore d'agrément démolisseur,
            // il est nécessaire de le créer est de l'associer à l'établissement
            // en passant le paramètre `vhuAgrementDemolisseurId` à `updateCompany`
            const { data: newAgrementData } = await createVhuAgrement({
              variables: { input: vhuAgrementDemolisseurData }
            });
            if (newAgrementData) {
              vhuAgrementDemolisseurId = newAgrementData.createVhuAgrement.id;
            }
          }
        } else {
          // do nothing, la validation ne le permet pas normalement
        }
      }
    } else if (company.vhuAgrementDemolisseur) {
      // L'établissement possédait un agrément mais le profil DEMOLISSEUR
      // a été dé-sélectionné. On supprime donc l'agrément correspondant.

      // Permet de dissocier l'agrément de l'établissement
      vhuAgrementDemolisseurId = null;

      // Permet de supprimer l'agrément après l'avoir dissocié
      shouldDeleteVhuDemolisseurAgrement = true;
    }

    return {
      vhuAgrementDemolisseurId,
      shouldDeleteVhuDemolisseurAgrement
    };
  };

  const handleCompanyUpdate = async (data: RhfCompanyTypeFormField) => {
    const args: MutationUpdateCompanyArgs = {
      id: company.id,
      companyTypes: data.companyTypes,
      ecoOrganismeAgreements: data.ecoOrganismeAgreements,
      collectorTypes: data.companyTypes.includes(CompanyType.Collector)
        ? data.collectorTypes
        : [],
      wasteProcessorTypes: data.companyTypes.includes(
        CompanyType.Wasteprocessor
      )
        ? data.wasteProcessorTypes
        : [],
      wasteVehiclesTypes: data.companyTypes.includes(CompanyType.WasteVehicles)
        ? data.wasteVehiclesTypes
        : []
    };

    const { transporterReceiptId, shouldDeleteTransporterReceipt } =
      await handleTransporterReceiptUpdate(data);

    if (transporterReceiptId !== undefined) {
      args.transporterReceiptId = transporterReceiptId;
    }

    const { traderReceiptId, shouldDeleteTraderReceipt } =
      await handleTraderReceiptUpdate(data);

    if (traderReceiptId !== undefined) {
      args.traderReceiptId = traderReceiptId;
    }

    const { brokerReceiptId, shouldDeleteBrokerReceipt } =
      await handleBrokerReceiptUpdate(data);

    if (brokerReceiptId !== undefined) {
      args.brokerReceiptId = brokerReceiptId;
    }

    const { workerCertificationId, shouldDeleteWorkerCertification } =
      await handleWorkerCertificationUpdate(data);

    if (workerCertificationId !== undefined) {
      args.workerCertificationId = workerCertificationId;
    }

    const { vhuAgrementBroyeurId, shouldDeleteVhuBroyeurAgrement } =
      await handleVhuAgrementBroyeurUpdate(data);

    if (vhuAgrementBroyeurId !== undefined) {
      args.vhuAgrementBroyeurId = vhuAgrementBroyeurId;
    }

    const { vhuAgrementDemolisseurId, shouldDeleteVhuDemolisseurAgrement } =
      await handleVhuAgrementDemolisseurUpdate(data);

    if (vhuAgrementDemolisseurId !== undefined) {
      args.vhuAgrementDemolisseurId = vhuAgrementDemolisseurId;
    }

    await updateCompany({
      variables: args
    });

    if (shouldDeleteTransporterReceipt && company.transporterReceipt?.id) {
      await deleteTransporterReceipt({
        variables: { input: { id: company.transporterReceipt?.id } }
      });
    }

    if (shouldDeleteTraderReceipt && company.traderReceipt?.id) {
      await deleteTraderReceipt({
        variables: { input: { id: company.traderReceipt?.id } }
      });
    }

    if (shouldDeleteBrokerReceipt && company.brokerReceipt?.id) {
      await deleteBrokerReceipt({
        variables: { input: { id: company.brokerReceipt?.id } }
      });
    }

    if (shouldDeleteWorkerCertification && company.workerCertification?.id) {
      await deleteWorkerCertification({
        variables: { input: { id: company.workerCertification?.id } }
      });
    }

    if (shouldDeleteVhuBroyeurAgrement && company.vhuAgrementBroyeur?.id) {
      await deleteVhuAgrement({
        variables: { input: { id: company.vhuAgrementBroyeur?.id } }
      });
    }

    if (
      shouldDeleteVhuDemolisseurAgrement &&
      company.vhuAgrementDemolisseur?.id
    ) {
      await deleteVhuAgrement({
        variables: { input: { id: company.vhuAgrementDemolisseur?.id } }
      });
    }
  };

  const loading =
    loadingCompanyUpdate ||
    loadingTransportReceipt ||
    loadingVhuAgrement ||
    loadingDeleteVhuAgrement ||
    loadingTraderReceipt ||
    deleteLoadingTraderReceipt ||
    loadingBrokerReceipt ||
    deleteLoadingBrokerReceipt ||
    loadingWorkerCertification ||
    deleteLoadingWorkerCertif;

  const error =
    errorCompanyUpdate ||
    errorTransportReceipt ||
    errorVhuAgrement ||
    errorDeleteVhuAgrement ||
    errorTraderReceipt ||
    deleteErrorTraderReceipt ||
    errorBrokerReceipt ||
    deleteErrorBrokerReceipt ||
    errorWorkerCertification ||
    deleteErrorWorkerCertif;

  return (
    <CompanyFormWrapper
      title="Profil"
      reset={reset}
      disabled={!formState.isDirty || formState.isSubmitting}
      defaultValues={defaultValues}
      isAdmin={company.userRole === UserRole.Admin}
      dataTestId="company-profile-edit"
    >
      {(formRef, isEditing, onClose) =>
        isEditing ? (
          <form
            ref={formRef}
            onSubmit={handleSubmit(async data => {
              await handleCompanyUpdate(data);
              if (!error) {
                onClose();
              }
            })}
          >
            <RhfCompanyTypeForm
              watch={watch}
              register={register}
              setValue={setValue}
              formState={formState}
            />
            {loading && <Loader />}
            {error && <NotificationError apolloError={error} />}
          </form>
        ) : (
          <CompanyProfileInformation company={company} />
        )
      }
    </CompanyFormWrapper>
  );
};
export default CompanyProfileForm;
