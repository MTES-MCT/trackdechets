import type { ComponentType } from "react";
import type {
  FrIconClassName,
  RiIconClassName
} from "@codegouvfr/react-dsfr/fr/generatedFromCss/classNames";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
type FieldStyle = { className?: string; parentClassName?: string };

export type FormShapeField =
  | {
      name: string;
      shape: "generic";
      style?: FieldStyle;
      type: string;
      label: string;
      required?: boolean;
      validation: Record<string, z.ZodType>;
      choices?: { label: string; value: string | number }[];
      disableOnModify?: boolean;
    }
  | {
      props?: Record<string, any>;
      shape: "custom";
      style?: FieldStyle;
      names: string[];
      required?: boolean;
      validation: Record<string, z.ZodType>;
      Component: ComponentType<{
        props?: Record<string, any>;
        methods: UseFormReturn<any>;
      }>;
    }
  | {
      shape: "layout";
      style?: FieldStyle;
      fields: FormShapeField[];
    };

type FormShapeItem = {
  tabId: string;
  tabTitle: string;
  iconId?: FrIconClassName | RiIconClassName;
  fields: FormShapeField[];
};

export type FormShape = FormShapeItem[];
