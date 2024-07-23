import React from "react";
import { generatePath } from "react-router-dom";
import routes from "../routes";
import {
  bsd_type_option_bsda,
  bsd_type_option_bsdasri,
  bsd_type_option_bsdd,
  bsd_type_option_bsff,
  bsd_type_option_bsvhu,
  bsd_type_option_bspaoh,
  dropdown_create_bsda,
  dropdown_create_bsdasri,
  dropdown_create_bsdd,
  dropdown_create_bsff,
  dropdown_create_bsvhu,
  dropdown_create_bspaoh,
  filter_acceptation_sign_date,
  filter_bsd_number,
  filter_bsd_type,
  filter_cap,
  filter_chantier_adress,
  filter_chantier_name,
  filter_emitter_sign_date,
  filter_fiche_intervention_numbers,
  filter_free_text,
  filter_given_name,
  filter_immat_number,
  filter_next_destination_siret,
  filter_operation_sign_date,
  filter_reception_sign_date,
  filter_seal_numbers,
  filter_siret_productor_address,
  filter_transporter_sign_date,
  filter_tva_intra,
  filter_waste_code,
  filter_worker_operation_code,
  filter_worker_sign_date,
  bsd_sub_type_option_appendix1,
  bsd_sub_type_option_appendix2,
  bsd_sub_type_option_collection_2710,
  bsd_sub_type_option_gathering,
  bsd_sub_type_option_groupement,
  bsd_sub_type_option_initial,
  bsd_sub_type_option_reconditionnement,
  bsd_sub_type_option_reshipment,
  bsd_sub_type_option_synthesis,
  bsd_sub_type_option_temp_stored,
  bsd_sub_type_option_tournee
} from "../common/wordings/dashboard/wordingsDashboard";
import { Filter, FilterType } from "../common/Components/Filters/filtersTypes";
import {
  IconBSFF,
  IconBSDa,
  IconBSVhu,
  IconBSDD,
  IconBSDasri,
  IconBSPaohThin
} from "../common/Components/Icons/Icons";
import { getOperationCodesFromSearchString } from "./dashboardServices";
import { BsdCurrentTab } from "../common/types/commonTypes";
import { BsdSubType, BsdType, BsdWhere, OrderBy } from "@td/codegen-ui";

export const MAX_FILTER = 5;

const bsdTypeFilterSelectOptions = [
  {
    value: BsdType.Bsdd,
    label: bsd_type_option_bsdd,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      },
      {
        value: BsdSubType.Tournee,
        label: bsd_sub_type_option_tournee
      },
      {
        value: BsdSubType.Appendix1,
        label: bsd_sub_type_option_appendix1
      },
      {
        value: BsdSubType.Appendix2,
        label: bsd_sub_type_option_appendix2
      },
      {
        value: BsdSubType.TempStored,
        label: bsd_sub_type_option_temp_stored
      }
    ]
  },
  {
    value: BsdType.Bsdasri,
    label: bsd_type_option_bsdasri,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      },
      {
        value: BsdSubType.Synthesis,
        label: bsd_sub_type_option_synthesis
      },
      {
        value: BsdSubType.Gathering,
        label: bsd_sub_type_option_gathering
      }
    ]
  },
  {
    value: BsdType.Bsvhu,
    label: bsd_type_option_bsvhu,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      }
    ]
  },
  {
    value: BsdType.Bsff,
    label: bsd_type_option_bsff,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      },
      {
        value: BsdSubType.Groupement,
        label: bsd_sub_type_option_groupement
      },
      {
        value: BsdSubType.Reconditionnement,
        label: bsd_sub_type_option_reconditionnement
      },
      {
        value: BsdSubType.Reshipment,
        label: bsd_sub_type_option_reshipment
      }
    ]
  },
  {
    value: BsdType.Bsda,
    label: bsd_type_option_bsda,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      },
      {
        value: BsdSubType.Gathering,
        label: bsd_sub_type_option_gathering
      },
      {
        value: BsdSubType.Reshipment,
        label: bsd_sub_type_option_reshipment
      },
      {
        value: BsdSubType.Collection_2710,
        label: bsd_sub_type_option_collection_2710
      }
    ]
  },
  {
    value: BsdType.Bspaoh,
    label: bsd_type_option_bspaoh,
    options: [
      {
        value: BsdSubType.Initial,
        label: bsd_sub_type_option_initial
      }
    ]
  }
];

enum FilterName {
  types = "types",
  waste = "waste",
  readableId = "readableId",
  transporterNumberPlate = "transporterNumberPlate",
  transporterCustomInfo = "transporterCustomInfo",
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
  cap = "cap"
}

export const quickFilterList: Filter[] = [
  {
    name: FilterName.readableId,
    label: filter_bsd_number,
    type: FilterType.input,
    isActive: true,
    placeholder: `ex: "BSDA-202311.... " ou "B123"`
  },
  {
    name: FilterName.waste,
    label: filter_waste_code,
    type: FilterType.input,
    isActive: true,
    placeholder: `ex: "01 02 03*" ou "amiante"`
  },
  {
    name: FilterName.givenName,
    label: filter_given_name,
    type: FilterType.input,
    isActive: true,
    placeholder: `ex: "Track" ou "5323014000..."`
  },
  {
    name: FilterName.cap,
    label: filter_cap,
    type: FilterType.input,
    isActive: true,
    placeholder: `ex: "2023COL123"`
  },
  {
    name: FilterName.pickupSiteName,
    label: filter_chantier_name,
    type: FilterType.input,
    isActive: true,
    placeholder: `ex: "Chantier du Parc"`
  }
];

export const advancedFilterList: Filter[][] = [
  [
    {
      name: FilterName.types,
      label: filter_bsd_type,
      type: FilterType.select,
      isMultiple: true,
      options: bsdTypeFilterSelectOptions,
      isActive: true
    },
    {
      name: FilterName.transporterNumberPlate,
      label: filter_immat_number,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.transporterCustomInfo,
      label: filter_free_text,
      type: FilterType.input,
      isActive: true
    }
  ],
  [
    {
      name: FilterName.pickupSiteAddress,
      label: filter_chantier_adress,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.siretProductorAddress,
      label: filter_siret_productor_address,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.operationCode,
      label: filter_worker_operation_code,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.destinationAcceptationDate,
      label: filter_acceptation_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.transporterTransportSignDate,
      label: filter_transporter_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.destinationReceptionDate,
      label: filter_reception_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.workerSignDate,
      label: filter_worker_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.emitterSignDate,
      label: filter_emitter_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.destinationOperationSignDate,
      label: filter_operation_sign_date,
      type: FilterType.date,
      isActive: true
    },
    {
      name: FilterName.ficheInterventionNumbers,
      label: filter_fiche_intervention_numbers,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.sealNumbers,
      label: filter_seal_numbers,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.tvaIntra,
      label: filter_tva_intra,
      type: FilterType.input,
      isActive: true
    },
    {
      name: FilterName.nextDestinationSiret,
      label: filter_next_destination_siret,
      type: FilterType.input,
      isActive: true
    }
  ]
];

export const filterList = [...advancedFilterList.flat(), ...quickFilterList];

export const filterPredicates: {
  filterName: string;
  where: (value: any) => BsdWhere;
  orderBy?: keyof OrderBy;
}[] = [
  {
    filterName: FilterName.types,
    where: value => {
      console.log(">> filterPredicates");
      console.log("value", value);

      const filter = { type: { _in: value } };

      return filter;
    }
  },
  {
    filterName: FilterName.waste,
    where: value => ({
      _and: [
        {
          _or: [
            { waste: { code: { _contains: value } } },
            { waste: { description: { _match: value } } }
          ]
        }
      ]
    })
  },
  {
    filterName: FilterName.readableId,
    where: value => ({
      _and: [
        {
          _or: [
            { readableId: { _contains: value } },
            { customId: { _contains: value } },
            { packagingNumbers: { _hasSome: value } },
            { packagingNumbers: { _itemContains: value } },
            { identificationNumbers: { _itemContains: value } },
            { identificationNumbers: { _hasSome: value } }
          ]
        }
      ]
    })
  },
  {
    filterName: FilterName.transporterNumberPlate,
    where: value => ({
      transporter: { transport: { plates: { _itemContains: value } } }
    })
  },
  {
    filterName: FilterName.transporterCustomInfo,
    where: value => ({ transporter: { customInfo: { _match: value } } })
  },
  {
    filterName: FilterName.pickupSiteName,
    where: value => ({ emitter: { pickupSite: { name: { _match: value } } } })
  },
  {
    filterName: FilterName.pickupSiteAddress,
    where: value => ({
      emitter: { pickupSite: { address: { _match: value } } }
    })
  },
  {
    filterName: FilterName.tvaIntra,
    where: value => ({
      _and: [
        {
          _or: [
            {
              transporter: {
                company: {
                  vatNumber: { _contains: value }
                }
              }
            },
            {
              destination: {
                operation: {
                  nextDestination: {
                    company: { vatNumber: { _contains: value } }
                  }
                }
              }
            }
          ]
        }
      ]
    })
  },
  {
    filterName: FilterName.givenName,
    where: value => ({
      _and: [
        {
          _or: [
            { companyNames: { _match: value } },
            { companyOrgIds: { _itemContains: value } }
          ]
        }
      ]
    })
  },
  {
    filterName: FilterName.sealNumbers,
    where: value => ({
      sealNumbers: {
        _itemContains: value
      }
    })
  },
  {
    filterName: FilterName.ficheInterventionNumbers,
    where: value => ({
      ficheInterventionNumbers: {
        _itemContains: value
      }
    })
  },
  {
    filterName: FilterName.nextDestinationSiret,
    where: value => ({
      destination: {
        operation: {
          nextDestination: { company: { siret: { _contains: value } } }
        }
      }
    })
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
                _in: operationCodes
              }
            }
          }
        };
      }

      return {
        destination: { operation: { code: { _contains: value } } }
      };
    }
  },
  {
    filterName: FilterName.emitterSignDate,
    where: value => ({
      emitter: {
        emission: { date: { _lte: value.endDate, _gte: value.startDate } }
      }
    })
  },
  {
    filterName: FilterName.workerSignDate,
    where: value => ({
      worker: {
        work: { date: { _lte: value.endDate, _gte: value.startDate } }
      }
    })
  },
  {
    filterName: FilterName.transporterTransportSignDate,
    where: value => ({
      transporter: {
        transport: {
          takenOverAt: { _lte: value.endDate, _gte: value.startDate }
        }
      }
    })
  },
  {
    filterName: FilterName.destinationReceptionDate,
    where: value => ({
      destination: {
        reception: { date: { _lte: value.endDate, _gte: value.startDate } }
      }
    })
  },
  {
    filterName: FilterName.destinationAcceptationDate,
    where: value => ({
      destination: {
        acceptation: { date: { _lte: value.endDate, _gte: value.startDate } }
      }
    })
  },
  {
    filterName: FilterName.destinationOperationSignDate,
    where: value => ({
      destination: {
        operation: { date: { _lte: value.endDate, _gte: value.startDate } }
      }
    })
  },
  {
    filterName: FilterName.siretProductorAddress,
    where: value => ({
      emitter: {
        company: { address: { _match: value } }
      }
    })
  },
  {
    filterName: FilterName.cap,
    where: value => ({ destination: { cap: { _match: value } } })
  }
];

export const dropdownCreateLinks = (siret, location) => [
  {
    title: dropdown_create_bsdd,
    route: generatePath(routes.dashboard.bsdds.create, { siret }),
    icon: <IconBSDD />
  },
  {
    title: dropdown_create_bsdasri,
    route: generatePath(routes.dashboard.bsdasris.create, { siret }),
    icon: <IconBSDasri />
  },

  {
    title: dropdown_create_bsvhu,
    route: generatePath(routes.dashboard.bsvhus.create, { siret }),
    icon: <IconBSVhu />
  },
  {
    title: dropdown_create_bsff,
    route: generatePath(routes.dashboard.bsffs.create, { siret }),
    icon: <IconBSFF />
  },
  {
    title: dropdown_create_bsda,
    route: generatePath(routes.dashboard.bsdas.create, { siret }),
    icon: <IconBSDa />
  },
  {
    title: dropdown_create_bspaoh,
    route: generatePath(routes.dashboard.bspaohs.create, { siret }),
    state: { background: location },
    icon: <IconBSPaohThin />
  }
];

export const getOverviewPath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboard.bsdds.view;
    case BsdType.Bsda:
      return routes.dashboard.bsdas.view;
    case BsdType.Bsdasri:
      return routes.dashboard.bsdasris.view;
    case BsdType.Bsff:
      return routes.dashboard.bsffs.view;
    case BsdType.Bsvhu:
      return routes.dashboard.bsvhus.view;
    case BsdType.Bspaoh:
      return routes.dashboard.bspaohs.view;

    default:
      break;
  }
};

export const getUpdatePath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboard.bsdds.edit;
    case BsdType.Bsda:
      return routes.dashboard.bsdas.edit;
    case BsdType.Bsdasri:
      return routes.dashboard.bsdasris.edit;
    case BsdType.Bsff:
      return routes.dashboard.bsffs.edit;
    case BsdType.Bsvhu:
      return routes.dashboard.bsvhus.edit;
    case BsdType.Bspaoh:
      return routes.dashboard.bspaohs.edit;
    default:
      break;
  }
};

export const getRevisionPath = bsd => {
  switch (bsd.type) {
    case BsdType.Bsdd:
      return routes.dashboard.bsdds.review;
    case BsdType.Bsda:
      return routes.dashboard.bsdas.review;
    case BsdType.Bsdasri:
      return routes.dashboard.bsdasris.review;
    default:
      break;
  }
};

export const getBsdCurrentTab = ({
  isDraftTab,
  isActTab,
  isFollowTab,
  isArchivesTab,
  isToCollectTab,
  isCollectedTab,
  isReviewedTab,
  isToReviewTab
}): BsdCurrentTab => {
  if (isDraftTab) {
    return "draftTab";
  }
  if (isActTab) {
    return "actTab";
  }
  if (isFollowTab) {
    return "followTab";
  }
  if (isArchivesTab) {
    return "archivesTab";
  }
  if (isReviewedTab) {
    return "reviewedTab";
  }
  if (isToReviewTab) {
    return "toReviewTab";
  }
  if (isToCollectTab) {
    return "toCollectTab";
  }
  if (isCollectedTab) {
    return "collectedTab";
  }
  // default tab
  return "allBsdsTab";
};
