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
  // filter_chantier_adress,
  // filter_chantier_name,
  // filter_contenant_number,
  filter_free_text,
  filter_immat_number,
  // filter_siret,
  filter_waste_code,
} from "../Common/wordings/dashboard/wordingsDashboard";
import { BsdType } from "../../generated/graphql/types";
import { Filter, FilterType } from "../Common/Components/Filters/filtersTypes";

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
export const filterList: Filter[] = [
  {
    value: "types",
    order: "type",
    label: filter_bsd_type,
    type: FilterType.select,
    isMultiple: true,
    options: bsdTypeFilterSelectOptions,
    isActive: true,
    where: v => ({ type: { _in: v } }),
  },
  // {
  //   value: "siret",
  //   order: "siret",
  //   label: filter_siret,
  //   type: FilterType.input,
  // },
  {
    value: "waste",
    order: "wasteCode",
    label: filter_waste_code,
    type: FilterType.input,
    isActive: true,
    where: v => ({ waste: { code: { _contains: v } } }),
  },
  {
    value: "readableId",
    order: "readableId",
    label: filter_bsd_number,
    type: FilterType.input,
    isActive: true,
    where: v => ({ readableId: { _contains: v } }),
  },
  // {
  //   value: "readableId",
  //   order: "readableId",
  //   label: filter_contenant_number,
  //   type: FilterType.input,
  // },
  {
    value: "transporterNumberPlate",
    order: "transporterNumberPlate",
    label: filter_immat_number,
    type: FilterType.input,
    isActive: true,
    where: v => ({
      transporter: { transport: { plates: { _itemContains: v } } },
    }),
  },
  // {
  //   value: "chantier_name",
  //   order: "chantier_name",
  //   label: filter_chantier_name,
  //   type: FilterType.input,
  // },
  // {
  //   value: "chantier_adress",
  //   order: "chantier_adress",
  //   label: filter_chantier_adress,
  //   type: FilterType.input,
  // },
  {
    value: "transporterCustomInfo",
    order: "transporterCustomInfo",
    label: filter_free_text,
    type: FilterType.input,
    isActive: true,
    where: v => ({ transporter: { customInfo: { _match: v } } }),
  },
];

export const dropdownCreateLinks = siret => [
  {
    title: dropdown_create_bsdd,
    route: generatePath(routes.dashboard.bsdds.create, { siret }),
  },
  {
    title: dropdown_create_bsdasri,
    route: generatePath(routes.dashboard.bsdasris.create, { siret }),
  },

  {
    title: dropdown_create_bsvhu,
    route: generatePath(routes.dashboard.bsvhus.create, { siret }),
  },
  {
    title: dropdown_create_bsff,
    route: generatePath(routes.dashboard.bsffs.create, { siret }),
  },
  {
    title: dropdown_create_bsda,
    route: generatePath(routes.dashboard.bsdas.create, { siret }),
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
