import type { ComponentType } from "react";
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
      defaultOption?: string;
      choices?: { label: string; value: string | number }[];
      infoText?: string;
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
      infoText?: string;
    }
  | {
      shape: "layout";
      style?: FieldStyle;
      fields: FormShapeField[];
      infoText?: string;
    };

type FormShapeItem = {
  tabId: string;
  tabTitle: string;
  fields: FormShapeField[];
};

export type FormShapeFieldWithState = FormShapeField & {
  disabled?: boolean;
};

type FormShapeItemWithState = FormShapeItem & {
  error?: boolean;
  fields: FormShapeFieldWithState[];
};

export type FormShape = FormShapeItemWithState[];

export type FormShapeWithState = FormShapeItemWithState[];
