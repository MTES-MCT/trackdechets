import {
  bsd_type_option_bsda,
  bsd_type_option_bsdasri,
  bsd_type_option_bsdd,
  bsd_type_option_bsff,
  bsd_type_option_bsvhu,
  filter_bsd_number,
  filter_bsd_type,
  filter_chantier_adress,
  filter_chantier_name,
  filter_contenant_number,
  filter_free_text,
  filter_immat_number,
  filter_siret,
  filter_waste_code,
} from "assets/wordings/dashboard/wordingsDashboard";
import { BsdType } from "generated/graphql/types";
import { Filter, FilterType } from "./Components/Filters/filtersTypes";

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
    value: "bsd_type",
    label: filter_bsd_type,
    type: FilterType.select,
    isMultiple: true,
    options: bsdTypeFilterSelectOptions,
  },
  {
    value: "siret",
    label: filter_siret,
    type: FilterType.input,
  },
  {
    value: "waste_code",
    label: filter_waste_code,
    type: FilterType.input,
  },
  {
    value: "bsd_number",
    label: filter_bsd_number,
    type: FilterType.input,
  },
  {
    value: "contenant_number",
    label: filter_contenant_number,
    type: FilterType.input,
  },
  {
    value: "immat_number",
    label: filter_immat_number,
    type: FilterType.input,
  },
  {
    value: "chantier_name",
    label: filter_chantier_name,
    type: FilterType.input,
  },
  {
    value: "chantier_adress",
    label: filter_chantier_adress,
    type: FilterType.input,
  },
  {
    value: "free_text",
    label: filter_free_text,
    type: FilterType.input,
  },
];
