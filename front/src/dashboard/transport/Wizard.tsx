import React from "react";
import { Formik, FormikHelpers } from "formik";
import "./Wizard.scss";

type Props = {
  initialValues: Object;
  children: any[];
  onSubmit: Function;
  onCancel: Function;
};
type State = { page: number; values: Object };

// Copied from Formik Doc - multi step wizard example
export class Wizard extends React.Component<Props, State> {
  static Page = ({ children, values }: Props & any) => children(values);
  contentRef: React.RefObject<any>;

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
      this.contentRef.current.parentNode &&
      this.contentRef.current.parentNode.scrollTo(0, 0);
  };

  next = (values: Object) => {
    this.scrollTop();
    this.setState((state) => ({
      page: Math.min(state.page + 1, this.props.children.length - 1),
      values,
    }));
  };

  previous = () => {
    this.scrollTop();
    this.setState((state) => ({
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
      <React.Fragment>
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
            render={({ values, handleSubmit, isSubmitting, handleReset }) => (
              <form onSubmit={handleSubmit}>
                {React.cloneElement(activePage, { values, isSubmitting })}
                <div className="buttons">
                  <button
                    type="button"
                    className="button warning"
                    onClick={() => this.props.onCancel()}
                  >
                    Annuler
                  </button>
                  {page > 0 && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={this.previous}
                    >
                      Précédent
                    </button>
                  )}

                  {!isLastPage && (
                    <button className="button" type="submit">
                      Suivant
                    </button>
                  )}
                  {isLastPage && (
                    <button
                      type="submit"
                      className="button"
                      disabled={isSubmitting}
                    >
                      Valider
                    </button>
                  )}
                </div>
              </form>
            )}
          />
        </div>
      </React.Fragment>
    );
  }
}
