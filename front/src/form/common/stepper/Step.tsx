import { createElement } from "react";
import "./Step.scss";
import { Form } from "@td/codegen-ui";

export interface IStepContainerProps {
  component?: any;
  children?: JSX.Element;
  title: string;
  disabled?: boolean;
  status?: string;
  stepName?: string;
  form?: Form | undefined;
}
export function StepContainer(props: IStepContainerProps) {
  return props.component
    ? createElement(props.component, {
        disabled: props.disabled,
        status: props.status,
        stepName: props.stepName,
        form: props.form
      })
    : props.children
    ? props.children
    : null;
}

export function Step({ children }) {
  return children;
}
