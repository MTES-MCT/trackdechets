import React from "react";
import CompanyFormWrapper from "../common/Components/CompanyFormWrapper";
import { useForm } from "react-hook-form";
import {
  CompanyPrivate,
  CompanyType,
  Mutation,
  MutationDeleteBrokerReceiptArgs,
  MutationDeleteTraderReceiptArgs,
  MutationDeleteTransporterReceiptArgs,
  MutationDeleteVhuAgrementArgs,
  MutationDeleteWorkerCertificationArgs,
  MutationUpdateCompanyArgs,
  UserRole,
  WorkerCertification
} from "@td/codegen-ui";
import { formatDate } from "../common/utils";
import {
  CREATE_BROKER_RECEIPT_,
  CREATE_TRADER_RECEIPT_,
  CREATE_TRANSPORTER_RECEIPT_,
  CREATE_VHU_AGREMENT_,
  CREATE_WORKER_CERTIFICATION,
  DELETE_BROKER_RECEIPT,
  DELETE_TRADER_RECEIPT,
  DELETE_TRANSPORTER_RECEIPT,
  DELETE_VHU_AGREMENT,
  DELETE_WORKER_CERTIFICATION,
  UPDATE_BROKER_RECEIPT,
  UPDATE_COMPANY_BROKER_RECEIPT,
  UPDATE_COMPANY_COLLECTOR_TYPES,
  UPDATE_COMPANY_TRADER_RECEIPT,
  UPDATE_COMPANY_TRANSPORTER_RECEIPT,
  UPDATE_COMPANY,
  UPDATE_COMPANY_VHU_AGREMENT,
  UPDATE_COMPANY_VHU_AGREMENT_DEMOLISSEUR,
  UPDATE_COMPANY_WASTE_PROCESSOR_TYPES,
  UPDATE_COMPANY_WASTE_VEHICLES_TYPES,
  UPDATE_COMPANY_WORKER_CERTIFICATION,
  UPDATE_TRADER_RECEIPT,
  UPDATE_TRANSPORTER_RECEIPT,
  UPDATE_VHU_AGREMENT,
  UPDATE_WORKER_CERTIFICATION
} from "../common/queries";
import { gql, useMutation } from "@apollo/client";
import { Loader } from "../../common/Components";
import { NotificationError } from "../../common/Components/Error/Error";
import CompanyProfileInformation from "./CompanyProfileInformation";
import RhfCompanyTypeForm, {
  RhfCompanyTypeFormField
} from "../common/Components/CompanyTypeForm/RhfCompanyTypeForm";

interface CompanyProfileFormProps {
  company: CompanyPrivate;
}

const CompanyProfileForm = ({ company }: CompanyProfileFormProps) => {
  const [
    updateCompany,
    {
      data: dataUpdateCompanyType,
      loading: LoadingCompanyTypes,
      error: errorCompanyTypes
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY
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
      defaultValues,
      values: dataUpdateCompanyType?.updateCompany && {
        ...defaultValues,
        companyTypes: dataUpdateCompanyType?.updateCompany?.companyTypes
      }
    });

  const [
    createOrUpdateTransporterReceipt,
    { loading: LoadingTransportReceipt, error: errorTransportReceipt }
  ] = useMutation(
    company.transporterReceipt
      ? UPDATE_TRANSPORTER_RECEIPT
      : CREATE_TRANSPORTER_RECEIPT_
  );

  const [
    updateCompanyTransporterReceipt,
    {
      loading: LoadingUpdateCompanyTransportReceipt,
      error: errorUpdateCompanyTransportReceipt
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_TRANSPORTER_RECEIPT
  );

  const [deleteTransporterReceipt] = useMutation<
    Pick<Mutation, "deleteTransporterReceipt">,
    MutationDeleteTransporterReceiptArgs
  >(DELETE_TRANSPORTER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment TransporterReceiptCompanyFragment on CompanyPrivate {
            id
            transporterReceipt {
              id
            }
          }
        `,
        data: { transporterReceipt: null }
      });
    }
  });

  const [
    createOrUpdateVhuAgrementBroyeur,
    { loading: LoadingVhuBroyeur, error: errorVhuBroyeur }
  ] = useMutation(
    company.vhuAgrementBroyeur ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT_
  );

  const [
    createOrUpdateVhuAgrementDemolisseur,
    { loading: LoadingVhuDemolisseur, error: errorVhuDemolisseur }
  ] = useMutation(
    company.vhuAgrementDemolisseur ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT_
  );

  const [
    updateCompanyVhuAgrementBroyeur,
    {
      loading: loadingUpdateCompanyVhuBroyeur,
      error: errorUpdateCompanyVhuBroyeur
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_VHU_AGREMENT
  );

  const [
    deleteVhuAgrementBroyeur,
    { loading: loadingDeleteVhuBroyeur, error: errorDeleteVhuBroyeur }
  ] = useMutation(DELETE_VHU_AGREMENT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment VhuAgrementBroyeurCompanyFragment on CompanyPrivate {
            id
            vhuAgrementBroyeur {
              id
            }
          }
        `,
        data: { vhuAgrementBroyeur: null }
      });
    }
  });

  const [
    updateCompanyVhuAgrementDemolisseur,
    {
      loading: loadingUpdateCompanyVhuDemolisseur,
      error: errorUpdateCompanyVhuDemolisseur
    }
  ] = useMutation(UPDATE_COMPANY_VHU_AGREMENT_DEMOLISSEUR);

  const [
    deleteVhuAgrementDemolisseur,
    { loading: loadingDeleteVhuDemolisseur, error: errorDeleteVhuDemolisseur }
  ] = useMutation<
    Pick<Mutation, "deleteVhuAgrement">,
    MutationDeleteVhuAgrementArgs
  >(DELETE_VHU_AGREMENT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment VhuAgrementDemolisseurCompanyFragment on CompanyPrivate {
            id
            vhuAgrementDemolisseur {
              id
            }
          }
        `,
        data: { vhuAgrementDemolisseur: null }
      });
    }
  });

  const [
    createOrUpdateTraderReceipt,
    {
      loading: updateOrCreateLoadingTraderReceipt,
      error: updateOrCreateErrorTraderReceipt
    }
  ] = useMutation(
    company.traderReceipt ? UPDATE_TRADER_RECEIPT : CREATE_TRADER_RECEIPT_
  );

  const [
    updateCompanyTraderReceipt,
    {
      loading: updateCompanyLoadingTraderReceipt,
      error: updateCompanyErrorTraderReceipt
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_TRADER_RECEIPT
  );

  const [
    deleteTraderReceipt,
    { loading: deleteLoadingTraderReceipt, error: deleteErrorTraderReceipt }
  ] = useMutation<
    Pick<Mutation, "deleteTraderReceipt">,
    MutationDeleteTraderReceiptArgs
  >(DELETE_TRADER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment TraderReceiptCompanyFragment on CompanyPrivate {
            id
            traderReceipt {
              id
            }
          }
        `,
        data: { traderReceipt: null }
      });
    }
  });

  const [
    createOrUpdateBrokerReceipt,
    {
      loading: updateOrCreateLoadingBrokerReceipt,
      error: updateOrCreateErrorBrokerReceipt
    }
  ] = useMutation(
    company.brokerReceipt ? UPDATE_BROKER_RECEIPT : CREATE_BROKER_RECEIPT_
  );

  const [
    updateCompanyBrokerReceipt,
    {
      loading: updateCompanyLoadingBrokerReceipt,
      error: updateCompanyErrorBrokerReceipt
    }
  ] = useMutation(UPDATE_COMPANY_BROKER_RECEIPT);

  const [
    deleteBrokerReceipt,
    { loading: deleteLoadingBrokerReceipt, error: deleteErrorBrokerReceipt }
  ] = useMutation<
    Pick<Mutation, "deleteBrokerReceipt">,
    MutationDeleteBrokerReceiptArgs
  >(DELETE_BROKER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment BrokerReceiptCompanyFragment on CompanyPrivate {
            brokerReceipt {
              id
            }
          }
        `,
        data: { brokerReceipt: null }
      });
    }
  });

  const [
    createOrUpdateWorkerCertification,
    {
      loading: updateOrCreateLoadingWorkerCertif,
      error: updateOrCreateErrorWorkerCertif
    }
  ] = useMutation(
    company.workerCertification
      ? UPDATE_WORKER_CERTIFICATION
      : CREATE_WORKER_CERTIFICATION
  );

  const [
    updateCompanyWorkerCertification,
    {
      loading: updateCompanyWorkerCertifLoading,
      error: updateCompanyWorkerCertifError
    }
  ] = useMutation(UPDATE_COMPANY_WORKER_CERTIFICATION);

  const [
    deleteWorkerCertification,
    { loading: deleteLoadingWorkerCertif, error: deleteErrorWorkerCertif }
  ] = useMutation<
    Pick<Mutation, "deleteWorkerCertification">,
    MutationDeleteWorkerCertificationArgs
  >(DELETE_WORKER_CERTIFICATION, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment WorkerCertificationCompanyFragment on CompanyPrivate {
            id
            workerCertification {
              id
            }
          }
        `,
        data: { workerCertification: null }
      });
    }
  });

  const [
    updateCompanyCollectorTypes,
    {
      loading: updateCompanyCollectorTypesLoading,
      error: updateCompanyCollectorTypesError
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_COLLECTOR_TYPES
  );

  const [
    updateCompanyWasteProcessorTypes,
    {
      loading: updateCompanyWasteProcessorTypesLoading,
      error: updateCompanyWasteProcessorTypesError
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_WASTE_PROCESSOR_TYPES
  );

  const [
    updateCompanyWasteVehiclesTypes,
    {
      loading: updateCompanyWasteVehiclesTypesLoading,
      error: updateCompanyWasteVehiclesTypesError
    }
  ] = useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
    UPDATE_COMPANY_WASTE_VEHICLES_TYPES
  );

  const handleCreateOrUpdateBrokerReceipt = async dataToUpdate => {
    const input = {
      ...(company.brokerReceipt?.id ? { id: company.brokerReceipt.id } : {}),
      receiptNumber: dataToUpdate.brokerReceipt.receiptNumber,
      validityLimit: dataToUpdate.brokerReceipt.validityLimit,
      department: dataToUpdate.brokerReceipt.department
    };
    const { data } = await createOrUpdateBrokerReceipt({
      variables: { input }
    });
    if (data.createBrokerReceipt) {
      await updateCompanyBrokerReceipt({
        variables: {
          id: company.id,
          brokerReceiptId: data.createBrokerReceipt.id
        }
      });
    }
  };
  const handleCreateOrUpdateWorkerCertification = async dataToUpdate => {
    let input = {
      ...(company.workerCertification?.id
        ? { id: company.workerCertification.id }
        : {}),
      hasSubSectionFour:
        dataToUpdate.workerCertification.hasSubSectionFour ?? false,
      hasSubSectionThree:
        dataToUpdate.workerCertification.hasSubSectionThree ?? false
    };

    if (dataToUpdate.workerCertification.hasSubSectionThree) {
      input = {
        ...input,
        hasSubSectionThree: dataToUpdate.workerCertification.hasSubSectionThree,
        certificationNumber:
          dataToUpdate.workerCertification.certificationNumber,
        validityLimit: dataToUpdate.workerCertification.validityLimit ?? null,
        organisation: dataToUpdate.workerCertification.organisation
      } as WorkerCertification;
    }
    const { data } = await createOrUpdateWorkerCertification({
      variables: { input }
    });
    if (data.createWorkerCertification) {
      await updateCompanyWorkerCertification({
        variables: {
          id: company.id,
          workerCertificationId: data.createWorkerCertification.id
        }
      });
    }
  };
  const handleCreateOrUpdateTraderReceipt = async dataToUpdate => {
    const input = {
      ...(company.traderReceipt?.id ? { id: company.traderReceipt.id } : {}),
      receiptNumber: dataToUpdate.traderReceipt.receiptNumber,
      validityLimit: dataToUpdate.traderReceipt.validityLimit,
      department: dataToUpdate.traderReceipt.department
    };
    const { data } = await createOrUpdateTraderReceipt({
      variables: { input }
    });
    if (data.createTraderReceipt) {
      await updateCompanyTraderReceipt({
        variables: {
          id: company.id,
          traderReceiptId: data.createTraderReceipt.id
        }
      });
    }
  };

  const handleCreateOrUpdateTransporterReceipt = async dataToUpdate => {
    const input = {
      ...(company.transporterReceipt?.id
        ? { id: company.transporterReceipt.id }
        : {}),
      receiptNumber: dataToUpdate.transporterReceipt.receiptNumber,
      validityLimit: dataToUpdate.transporterReceipt.validityLimit,
      department: dataToUpdate.transporterReceipt.department
    };
    const { data } = await createOrUpdateTransporterReceipt({
      variables: { input }
    });
    if (data.createTransporterReceipt) {
      await updateCompanyTransporterReceipt({
        variables: {
          id: company.id,
          transporterReceiptId: data.createTransporterReceipt.id
        }
      });
    }
  };

  const handleCreateOrUpdateVhuAgrementBroyeur = async dataToUpdate => {
    const inputBroyeur = {
      ...(company.vhuAgrementBroyeur?.id
        ? { id: company.vhuAgrementBroyeur.id }
        : {}),

      agrementNumber: dataToUpdate.vhuAgrementBroyeur.agrementNumber,
      department: dataToUpdate.vhuAgrementBroyeur.department
    };
    const { data: dataBroyeur } = await createOrUpdateVhuAgrementBroyeur({
      variables: { input: inputBroyeur }
    });
    if (dataBroyeur.createVhuAgrement) {
      await updateCompanyVhuAgrementBroyeur({
        variables: {
          id: company.id,
          vhuAgrementBroyeurId: dataBroyeur.createVhuAgrement.id
        }
      });
    }
  };

  const handleCreateOrUpdateVhuAgrementDemolisseur = async dataToUpdate => {
    const inputDemolisseur = {
      ...(company.vhuAgrementDemolisseur?.id
        ? { id: company.vhuAgrementDemolisseur.id }
        : {}),

      agrementNumber: dataToUpdate.vhuAgrementDemolisseur.agrementNumber,
      department: dataToUpdate.vhuAgrementDemolisseur.department
    };
    const { data: dataDemolisseur } =
      await createOrUpdateVhuAgrementDemolisseur({
        variables: { input: inputDemolisseur }
      });
    if (dataDemolisseur.createVhuAgrement) {
      await updateCompanyVhuAgrementDemolisseur({
        variables: {
          id: company.id,
          vhuAgrementDemolisseurId: dataDemolisseur.createVhuAgrement.id
        }
      });
    }
  };

  const handleSubTypesDeletes = async (companyTypesToUpdate: CompanyType[]) => {
    const shouldDeleteWorkerCertification =
      !companyTypesToUpdate.includes(CompanyType.Worker) &&
      company.workerCertification;
    const shouldDeleteTransporterReceipt =
      !companyTypesToUpdate.includes(CompanyType.Transporter) &&
      company.transporterReceipt;
    const shouldDeleteBrokerReceipt =
      !companyTypesToUpdate.includes(CompanyType.Broker) &&
      company.brokerReceipt;
    const shouldDeleteTraderReceipt =
      !companyTypesToUpdate.includes(CompanyType.Trader) &&
      company.traderReceipt;
    const shouldDeleteVhuAgrementBroyeur =
      !companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      company.vhuAgrementBroyeur;
    const shouldDeleteVhuAgrementDemolisseur =
      !companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      company.vhuAgrementDemolisseur;

    if (shouldDeleteWorkerCertification && company.workerCertification?.id) {
      await deleteWorkerCertification({
        variables: {
          input: { id: company.workerCertification.id }
        }
      });
    }
    if (shouldDeleteBrokerReceipt && company.brokerReceipt?.id) {
      await deleteBrokerReceipt({
        variables: {
          input: { id: company.brokerReceipt.id }
        }
      });
    }
    if (shouldDeleteTraderReceipt && company.traderReceipt?.id) {
      await deleteTraderReceipt({
        variables: {
          input: { id: company.traderReceipt.id }
        }
      });
    }
    if (shouldDeleteTransporterReceipt && company.transporterReceipt?.id) {
      await deleteTransporterReceipt({
        variables: {
          input: { id: company.transporterReceipt.id }
        }
      });
    }
    if (shouldDeleteVhuAgrementBroyeur && company.vhuAgrementBroyeur?.id) {
      await deleteVhuAgrementBroyeur({
        variables: {
          input: { id: company.vhuAgrementBroyeur.id }
        }
      });
    }
    if (
      shouldDeleteVhuAgrementDemolisseur &&
      company.vhuAgrementDemolisseur?.id
    ) {
      await deleteVhuAgrementDemolisseur({
        variables: {
          input: { id: company.vhuAgrementDemolisseur.id }
        }
      });
    }
  };

  const handleSubTypesUpdates = async (
    data: RhfCompanyTypeFormField,
    companyTypesToUpdate: CompanyType[]
  ) => {
    const shouldCreateOrUpdateWorkerCertification =
      companyTypesToUpdate.includes(CompanyType.Worker);
    const shouldCreateOrUpdateTransporterReceipt =
      companyTypesToUpdate.includes(CompanyType.Transporter) &&
      data.transporterReceipt?.receiptNumber;
    const shouldCreateOrUpdateBrokerReceipt =
      companyTypesToUpdate.includes(CompanyType.Broker) &&
      data.brokerReceipt?.receiptNumber;
    const shouldCreateOrUpdateTraderReceipt =
      companyTypesToUpdate.includes(CompanyType.Trader) &&
      data.traderReceipt?.receiptNumber;
    const shouldCreateOrUpdateVhuAgrementBroyeur =
      companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      data.vhuAgrementBroyeur?.agrementNumber;
    const shouldCreateOrUpdateVhuAgrementDemolisseur =
      companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      data.vhuAgrementDemolisseur?.agrementNumber;
    const hasCollectorType = companyTypesToUpdate.includes(
      CompanyType.Collector
    );
    const hasWasteProcessorType = companyTypesToUpdate.includes(
      CompanyType.Wasteprocessor
    );
    const hasWasteVehiclesType = companyTypesToUpdate.includes(
      CompanyType.WasteVehicles
    );
    const shouldUpdateCollectorTypes =
      hasCollectorType || (!hasCollectorType && data.collectorTypes);
    const shouldUpdateWasteProcessorTypes =
      hasWasteProcessorType ||
      (!hasWasteProcessorType && data.wasteProcessorTypes);
    const shouldUpdateWasteVehiclesTypes =
      hasWasteVehiclesType ||
      (!hasWasteVehiclesType && data.wasteVehiclesTypes);

    if (shouldUpdateCollectorTypes) {
      await updateCompanyCollectorTypes({
        variables: {
          id: company.id,
          collectorTypes: hasCollectorType ? data.collectorTypes : []
        }
      });
    }
    if (shouldUpdateWasteProcessorTypes) {
      await updateCompanyWasteProcessorTypes({
        variables: {
          id: company.id,
          wasteProcessorTypes: hasWasteProcessorType
            ? data.wasteProcessorTypes
            : []
        }
      });
    }

    if (shouldUpdateWasteVehiclesTypes) {
      await updateCompanyWasteVehiclesTypes({
        variables: {
          id: company.id,
          wasteVehiclesTypes: hasWasteVehiclesType
            ? data.wasteVehiclesTypes
            : []
        }
      });
    }

    if (shouldCreateOrUpdateWorkerCertification) {
      await handleCreateOrUpdateWorkerCertification(data);
    }
    if (shouldCreateOrUpdateBrokerReceipt) {
      await handleCreateOrUpdateBrokerReceipt(data);
    }
    if (shouldCreateOrUpdateTraderReceipt) {
      await handleCreateOrUpdateTraderReceipt(data);
    }
    if (shouldCreateOrUpdateTransporterReceipt) {
      await handleCreateOrUpdateTransporterReceipt(data);
    }
    if (shouldCreateOrUpdateVhuAgrementBroyeur) {
      await handleCreateOrUpdateVhuAgrementBroyeur(data);
    }
    if (shouldCreateOrUpdateVhuAgrementDemolisseur) {
      await handleCreateOrUpdateVhuAgrementDemolisseur(data);
    }
  };

  const handleUpdateCompanyTypes = async (data: RhfCompanyTypeFormField) => {
    const companyTypesToUpdate = data.companyTypes;

    await updateCompany({
      variables: {
        id: company.id,
        companyTypes: companyTypesToUpdate,
        ecoOrganismeAgreements: data.ecoOrganismeAgreements
      }
    });

    //updates
    handleSubTypesUpdates(data, companyTypesToUpdate);

    //deletes
    handleSubTypesDeletes(companyTypesToUpdate);
  };

  const loading =
    LoadingCompanyTypes ||
    LoadingTransportReceipt ||
    LoadingUpdateCompanyTransportReceipt ||
    LoadingVhuBroyeur ||
    LoadingVhuDemolisseur ||
    loadingUpdateCompanyVhuBroyeur ||
    loadingDeleteVhuBroyeur ||
    loadingUpdateCompanyVhuDemolisseur ||
    loadingDeleteVhuDemolisseur ||
    updateOrCreateLoadingTraderReceipt ||
    updateCompanyLoadingTraderReceipt ||
    deleteLoadingTraderReceipt ||
    updateOrCreateLoadingBrokerReceipt ||
    updateCompanyLoadingBrokerReceipt ||
    deleteLoadingBrokerReceipt ||
    updateOrCreateLoadingWorkerCertif ||
    updateCompanyWorkerCertifLoading ||
    deleteLoadingWorkerCertif ||
    updateCompanyCollectorTypesLoading ||
    updateCompanyWasteProcessorTypesLoading ||
    updateCompanyWasteVehiclesTypesLoading;
  const error =
    errorCompanyTypes ||
    errorTransportReceipt ||
    errorUpdateCompanyTransportReceipt ||
    errorVhuBroyeur ||
    errorVhuDemolisseur ||
    errorUpdateCompanyVhuBroyeur ||
    errorDeleteVhuBroyeur ||
    errorUpdateCompanyVhuDemolisseur ||
    errorDeleteVhuDemolisseur ||
    updateOrCreateErrorTraderReceipt ||
    updateCompanyErrorTraderReceipt ||
    deleteErrorTraderReceipt ||
    updateOrCreateErrorBrokerReceipt ||
    updateCompanyErrorBrokerReceipt ||
    deleteErrorBrokerReceipt ||
    updateOrCreateErrorWorkerCertif ||
    updateCompanyWorkerCertifError ||
    deleteErrorWorkerCertif ||
    updateCompanyCollectorTypesError ||
    updateCompanyWasteProcessorTypesError ||
    updateCompanyWasteVehiclesTypesError;

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
              await handleUpdateCompanyTypes(data);
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
