import * as React from "react";
import { Formik, FormikHelpers } from "formik";
import { NextButton, PreviousButton } from "common/components/Buttons";
import "./WizardStepList.scss";

type Props = {
  initialValues: Object;
  children: any[];
  onSubmit: Function;
  onCancel: Function;
  nextButtonCaption?: string;
  submitButtonCaption?: string;
};
type State = { page: number; values: Object };

// Copied from Formik Doc - multi step wizard example
export class Wizard extends React.Component<Props, State> {
  static Page = ({ children, values, setFieldValue }: Props & any) =>
    children({ values, setFieldValue });

  contentRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);

    this.contentRef = React.createRef();
    this.state = {
      page: 0,
      values: props.initialValues,
    };
  }

  private scrollTop = () => {
    this.contentRef.current &&
      this.contentRef.current.parentElement &&
      this.contentRef.current.parentElement.scrollTo(0, 0);
  };

  next = (values: Object) => {
    this.scrollTop();
    this.setState(state => ({
      page: Math.min(state.page + 1, this.props.children.length - 1),
      values,
    }));
  };

  previous = () => {
    this.scrollTop();
    this.setState(state => ({
      page: Math.max(state.page - 1, 0),
    }));
  };
  validate = (values: Object) => {
    const activePage: any = React.Children.toArray(this.props.children)[
      this.state.page
    ];
    return activePage.props.validate ? activePage.props.validate(values) : {};
  };

  handleSubmit = (values: Object, helpers: FormikHelpers<any>) => {
    const { children, onSubmit } = this.props;
    const { page } = this.state;
    const isLastPage = page === React.Children.count(children) - 1;
    if (isLastPage) {
      return onSubmit(values, helpers);
    } else {
      helpers.setTouched({});
      helpers.setSubmitting(false);
      this.next(values);
    }
  };

  render() {
    const { children } = this.props;
    const { page, values } = this.state;
    const activePage: any = React.Children.toArray(children)[page];
    const isLastPage = page === React.Children.count(children) - 1;
    return (
      <>
        <ul className="step-header">
          {React.Children.map(children, (child, index) => (
            <li
              className={
                index === page ? "is-active" : page > index ? "is-complete" : ""
              }
              onClick={() => this.setState({ page: index })}
            >
              <span>{child.props.title}</span>
            </li>
          ))}
        </ul>
        <div className="step-content" ref={this.contentRef}>
          <Formik
            initialValues={values}
            enableReinitialize={false}
            validate={this.validate}
            onSubmit={this.handleSubmit}
          >
            {({ values, handleSubmit, isSubmitting, setFieldValue }) => (
              <form onSubmit={handleSubmit}>
                {React.cloneElement(activePage, {
                  values,
                  isSubmitting,
                  setFieldValue,
                })}
                <div className="form__actions mb-2">
                  {page > 0 && <PreviousButton onClick={this.previous} />}
                  <button
                    type="button"
                    className="btn btn--outline-primary"
                    onClick={() => this.props.onCancel()}
                  >
                    Annuler
                  </button>
                  {!isLastPage && (
                    <NextButton
                      caption={
                        !!activePage.props.nextButtonCaption
                          ? activePage.props.nextButtonCaption
                          : "Suivant"
                      }
                      onClick={() => null}
                    />
                  )}
                  {isLastPage && (
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={isSubmitting}
                    >
                      {!!activePage.props.submitButtonCaption
                        ? activePage.props.submitButtonCaption
                        : "Valider"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </Formik>
        </div>
      </>
    );
  }
}
