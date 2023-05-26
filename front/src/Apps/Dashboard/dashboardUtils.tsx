import React from "react";
import { generatePath } from "react-router-dom";
import routes from "../../common/routes";
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
  filter_bsd_number,
  filter_bsd_type,
  filter_chantier_adress,
  filter_chantier_name,
  filter_contenant_number,
  filter_free_text,
  filter_immat_number,
  filter_siret,
  filter_waste_code,
} from "../Common/wordings/dashboard/wordingsDashboard";
import { BsdType, BsdWhere } from "../../generated/graphql/types";
import { Filter, FilterType } from "../Common/Components/Filters/filtersTypes";
import {
  IconBSFFMedium as IconBSFF,
  IconBSDaThin as IconBSDa,
  IconBSVhuThin as IconBSVhu,
  IconBSDDThin as IconBSDD,
  IconBSDasriThin as IconBSDasri,
} from "common/components/Icons";

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
    where: value => ({ sirets: { _has: value } }),
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
