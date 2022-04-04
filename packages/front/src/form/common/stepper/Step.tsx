import { createElement } from "react";
import "./Step.scss";

export interface IStepContainerProps {
  component?: any;
  children?: JSX.Element;
  title: string;
  disabled?: boolean;
  status?: string;
  stepName?: string;
}
export function StepContainer(props: IStepContainerProps) {
  return props.component
    ? createElement(props.component, {
        disabled: props.disabled,
        status: props.status,
        stepName: props.stepName
      })
    : props.children
    ? props.children
    : null;
}

export function Step({ children }) {
  return children;
}
