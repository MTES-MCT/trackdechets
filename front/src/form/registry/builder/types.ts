import React from "react";
import { RegistryCompanyType } from "@td/codegen-ui";
import { TransportMode } from "@td/codegen-ui";
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
      title?: string;
      label: string | React.ReactNode;
      infoLabel?: string;
      required?: boolean;
      validation: Record<string, z.ZodType>;
      defaultOption?: string;
      choices?: { label: string; value: string | number }[];
      infoText?: string | ((fieldValues: any) => string | null);
      tooltip?: string;
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
      infoText?: string | ((fieldValues: any) => string | null);
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

export type FormTransporter = {
  TransportMode: TransportMode;
  CompanyType: RegistryCompanyType;
  CompanyOrgId?: string;
  RecepisseIsExempted?: boolean;
  RecepisseNumber?: string;
  CompanyName?: string;
  CompanyAddress?: string;
  CompanyPostalCode?: string;
  CompanyCity?: string;
  CompanyCountryCode?: string;
};
