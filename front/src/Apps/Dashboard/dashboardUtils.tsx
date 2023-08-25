import React from "react";
import { generatePath } from "react-router-dom";
import routes from "../routes";
import {
  bsd_type_option_bsda,
  bsd_type_option_bsdasri,
  bsd_type_option_bsdd,
  bsd_type_option_bsff,
  bsd_type_option_bsvhu,
  dropdown_create_bsda,
  dropdown_create_bsdasri,
  dropdown_create_bsdd,
  dropdown_create_bsff,
  dropdown_create_bsvhu,
  filter_acceptation_sign_date,
  filter_broker_siret,
  filter_bsd_number,
  filter_bsd_type,
  filter_chantier_adress,
  filter_chantier_name,
  filter_contenant_number,
  filter_emitter_name,
  filter_emitter_sign_date,
  filter_fiche_intervention_numbers,
  filter_free_text,
  filter_immat_number,
  filter_next_destination_siret,
  filter_operation_sign_date,
  filter_reception_sign_date,
  filter_seal_numbers,
  filter_siret,
  filter_siret_productor_address,
  filter_trader_siret,
  filter_transporter_sign_date,
  filter_tva_intra,
  filter_waste_code,
  filter_worker_operation_code,
  filter_worker_sign_date,
} from "../common/wordings/dashboard/wordingsDashboard";
import { BsdType, BsdWhere } from "../../generated/graphql/types";
import { Filter, FilterType } from "../common/Components/Filters/filtersTypes";
import {
  IconBSFFMedium as IconBSFF,
  IconBSDaThin as IconBSDa,
  IconBSVhuThin as IconBSVhu,
  IconBSDDThin as IconBSDD,
  IconBSDasriThin as IconBSDasri,
} from "Apps/common/Components/Icons/Icons";
import { getOperationCodesFromSearchString } from "./dashboardServices";

export const MAX_FILTER = 5;

const bsdTypeFilterSelectOptions = [
  {
    value: BsdType.Bsdd,
    label: bsd_type_option_bsdd,
  },
  {
    value: BsdType.Bsdasri,
    label: bsd_type_option_bsdasri,
  },
  {
    value: BsdType.Bsvhu,
    label: bsd_type_option_bsvhu,
  },
  {
    value: BsdType.Bsff,
    label: bsd_type_option_bsff,
  },
  {
    value: BsdType.Bsda,
    label: bsd_type_option_bsda,
  },
];

enum FilterName {
  types = "types",
  waste = "waste",
  readableId = "readableId",
  transporterNumberPlate = "transporterNumberPlate",
  transporterCustomInfo = "transporterCustomInfo",
  sirets = "sirets",
  packagingNumbers = "packagingNumbers",
  pickupSiteName = "name",
  pickupSiteAddress = "address",
  emitterSignDate = "emitterSignDate",
  workerSignDate = "workerSignDate",
  operationCode = "code",
  transporterTransportSignDate = "takenOverAt",
  destinationReceptionDate = "destinationReceptionDate",
  destinationAcceptationDate = "destinationAcceptationDate",
  destinationOperationSignDate = "destinationOperationSignDate",
  siretProductorAddress = "siretProductorAddress",
  tvaIntra = "vatNumber",
  nextDestinationSiret = "nextDestinationSiret",
  traderSiret = "traderSiret",
  brokerSiret = "brokerSiret",
  givenName = "givenName",
  sealNumbers = "sealNumbers",
  ficheInterventionNumbers = "ficheInterventionNumbers",
}

export const filterList: Filter[] = [
  {
    name: FilterName.types,
    label: filter_bsd_type,
    type: FilterType.select,
    isMultiple: true,
    options: bsdTypeFilterSelectOptions,
    isActive: true,
  },
  {
    name: FilterName.sirets,
    label: filter_siret,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.waste,
    label: filter_waste_code,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.readableId,
    label: filter_bsd_number,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.packagingNumbers,
    label: filter_contenant_number,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.transporterNumberPlate,
    label: filter_immat_number,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.pickupSiteName,
    label: filter_chantier_name,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.pickupSiteAddress,
    label: filter_chantier_adress,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.transporterCustomInfo,
    label: filter_free_text,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.operationCode,
    label: filter_worker_operation_code,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.siretProductorAddress,
    label: filter_siret_productor_address,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.tvaIntra,
    label: filter_tva_intra,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.nextDestinationSiret,
    label: filter_next_destination_siret,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.traderSiret,
    label: filter_trader_siret,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.brokerSiret,
    label: filter_broker_siret,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.givenName,
    label: filter_emitter_name,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.sealNumbers,
    label: filter_seal_numbers,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.ficheInterventionNumbers,
    label: filter_fiche_intervention_numbers,
    type: FilterType.input,
    isActive: true,
  },
  {
    name: FilterName.emitterSignDate,
    label: filter_emitter_sign_date,
    type: FilterType.date,
    isActive: true,
  },
  {
    name: FilterName.workerSignDate,
    label: filter_worker_sign_date,
    type: FilterType.date,
    isActive: true,
  },
  {
    name: FilterName.transporterTransportSignDate,
    label: filter_transporter_sign_date,
    type: FilterType.date,
    isActive: true,
  },
  {
    name: FilterName.destinationReceptionDate,
    label: filter_reception_sign_date,
    type: FilterType.date,
    isActive: true,
  },
  {
    name: FilterName.destinationAcceptationDate,
    label: filter_acceptation_sign_date,
    type: FilterType.date,
    isActive: true,
  },
  {
    name: FilterName.destinationOperationSignDate,
    label: filter_operation_sign_date,
    type: FilterType.date,
    isActive: true,
  },
];

export const filterPredicates: {
  filterName: string;
  where: (value: any) => BsdWhere;
  order: string;
}[] = [
  {
    filterName: FilterName.types,
    where: value => ({ type: { _in: value } }),
    order: "type",
  },
  {
    filterName: FilterName.waste,
    where: value => ({ waste: { code: { _contains: value } } }),
    order: "wasteCode",
  },
  {
    filterName: FilterName.readableId,
    where: value => ({ readableId: { _contains: value } }),
    order: "readableId",
  },
  {
    filterName: FilterName.transporterNumberPlate,
    order: "transporterNumberPlate",
    where: value => ({
      transporter: { transport: { plates: { _itemContains: value } } },
    }),
  },
  {
    filterName: FilterName.transporterCustomInfo,
    where: value => ({ transporter: { customInfo: { _match: value } } }),
    order: "transporterCustomInfo",
  },
  {
    filterName: FilterName.sirets,
    where: value => ({ sirets: { _itemContains: value } }),
    order: "sirets",
  },
  {
    filterName: FilterName.packagingNumbers,
    where: value => ({ packagingNumbers: { _has: value } }),
    order: "packagingNumbers",
  },
  {
    filterName: FilterName.pickupSiteName,
    where: value => ({ emitter: { pickupSite: { name: { _match: value } } } }),
    order: "name",
  },
  {
    filterName: FilterName.pickupSiteAddress,
    where: value => ({
      emitter: { pickupSite: { address: { _match: value } } },
    }),
    order: "address",
  },
  {
    filterName: FilterName.tvaIntra,
    where: value => ({
      destination: {
        operation: {
          nextDestination: { company: { vatNumber: { _contains: value } } },
        },
      },
    }),
    order: "vatNumber",
  },
  {
    filterName: FilterName.traderSiret,
    where: value => ({
      trader: {
        company: {
          siret: { _contains: value },
        },
      },
    }),
    order: "siret",
  },
  {
    filterName: FilterName.brokerSiret,
    where: value => ({
      broker: {
        company: {
          siret: { _contains: value },
        },
      },
    }),
    order: "siret",
  },
  {
    filterName: FilterName.givenName,
    where: value => ({
      emitter: {
        company: {
          name: { _match: value },
        },
      },
    }),
    order: "name",
  },
  {
    filterName: FilterName.sealNumbers,
    where: value => ({
      sealNumbers: {
        _itemContains: value,
      },
    }),
    order: "sealNumbers",
  },
  {
    filterName: FilterName.ficheInterventionNumbers,
    where: value => ({
      ficheInterventionNumbers: {
        _itemContains: value,
      },
    }),
    order: "sealNumbers",
  },
  {
    filterName: FilterName.nextDestinationSiret,
    where: value => ({
      destination: {
        operation: {
          nextDestination: { company: { siret: { _contains: value } } },
        },
      },
    }),
    order: "siret",
  },
  {
    filterName: FilterName.operationCode,
    where: value => {
      const operationCodes = getOperationCodesFromSearchString(value);

      if (operationCodes.length > 1) {
        return {
          destination: {
            operation: {
              code: {
                _in: operationCodes,
              },
            },
          },
        };
      }

      return {
        destination: { operation: { code: { _contains: value } } },
      };
    },
    order: "code",
  },
  {
    filterName: FilterName.emitterSignDate,
    where: value => ({
      emitter: {
        emission: { date: { _lte: value.endDate, _gte: value.startDate } },
      },
    }),
    order: "date",
  },
  {
    filterName: FilterName.workerSignDate,
    where: value => ({
      worker: {
        work: { date: { _lte: value.endDate, _gte: value.startDate } },
      },
    }),
    order: "date",
  },
  {
    filterName: FilterName.transporterTransportSignDate,
    where: value => ({
      transporter: {
        transport: {
          takenOverAt: { _lte: value.endDate, _gte: value.startDate },
        },
      },
    }),
    order: "takenOverAt",
  },
  {
    filterName: FilterName.destinationReceptionDate,
    where: value => ({
      destination: {
        reception: { date: { _lte: value.endDate, _gte: value.startDate } },
      },
    }),
    order: "date",
  },
  {
    filterName: FilterName.destinationAcceptationDate,
    where: value => ({
      destination: {
        acceptation: { date: { _lte: value.endDate, _gte: value.startDate } },
      },
    }),
    order: "date",
  },
  {
    filterName: FilterName.destinationOperationSignDate,
    where: value => ({
      destination: {
        operation: { date: { _lte: value.endDate, _gte: value.startDate } },
      },
    }),
    order: "date",
  },
  {
    filterName: FilterName.siretProductorAddress,
    where: value => ({
      emitter: {
        company: { address: { _match: value } },
      },
    }),
    order: "address",
  },
];

export const dropdownCreateLinks = siret => [
  {
    title: dropdown_create_bsdd,
    route: generatePath(routes.dashboardv2.bsdds.create, { siret }),
    icon: <IconBSDD />,
  },
  {
    title: dropdown_create_bsdasri,
    route: generatePath(routes.dashboardv2.bsdasris.create, { siret }),
    icon: <IconBSDasri />,
  },

  {
    title: dropdown_create_bsvhu,
    route: generatePath(routes.dashboardv2.bsvhus.create, { siret }),
    icon: <IconBSVhu />,
  },
  {
    title: dropdown_create_bsff,
    route: generatePath(routes.dashboardv2.bsffs.create, { siret }),
    icon: <IconBSFF />,
  },
  {
    title: dropdown_create_bsda,
    route: generatePath(routes.dashboardv2.bsdas.create, { siret }),
    icon: <IconBSDa />,
  },
];

export const getOverviewPath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboardv2.bsdds.view;
    case BsdType.Bsda:
      return routes.dashboardv2.bsdas.view;
    case BsdType.Bsdasri:
      return routes.dashboardv2.bsdasris.view;
    case BsdType.Bsff:
      return routes.dashboardv2.bsffs.view;
    case BsdType.Bsvhu:
      return routes.dashboardv2.bsvhus.view;

    default:
      break;
  }
};

export const getUpdatePath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboardv2.bsdds.edit;
    case BsdType.Bsda:
      return routes.dashboardv2.bsdas.edit;
    case BsdType.Bsdasri:
      return routes.dashboardv2.bsdasris.edit;
    case BsdType.Bsff:
      return routes.dashboardv2.bsffs.edit;
    case BsdType.Bsvhu:
      return routes.dashboardv2.bsvhus.edit;

    default:
      break;
  }
};

export const getRevisionPath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboardv2.bsdds.review;
    case BsdType.Bsda:
      return routes.dashboardv2.bsdas.review;

    default:
      break;
  }
};
