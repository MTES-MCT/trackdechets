import React from "react";
import { Formik, FormikActions } from "formik";

type Props = { initialValues: Object; children: any[]; onSubmit: Function };
type State = { page: number; values: Object };

// Copied from Formik Doc - multi step wizard example
export class Wizard extends React.Component<Props, State> {
  static Page = ({ children }: Props & any) => children;

  constructor(props: Props) {
    super(props);
    this.state = {
      page: 0,
      values: props.initialValues
    };
  }

  next = (values: Object) =>
    this.setState(state => ({
      page: Math.min(state.page + 1, this.props.children.length - 1),
      values
    }));

  previous = () =>
    this.setState(state => ({
      page: Math.max(state.page - 1, 0)
    }));

  validate = (values: Object) => {
    const activePage: any = React.Children.toArray(this.props.children)[
      this.state.page
    ];
    return activePage.props.validate ? activePage.props.validate(values) : {};
  };

  handleSubmit = (values: Object, bag: FormikActions<Object>) => {
    const { children, onSubmit } = this.props;
    const { page } = this.state;
    const isLastPage = page === React.Children.count(children) - 1;
    if (isLastPage) {
      return onSubmit(values, bag);
    } else {
      bag.setTouched({});
      bag.setSubmitting(false);
      this.next(values);
    }
  };

  render() {
    const { children } = this.props;
    const { page, values } = this.state;
    const activePage = React.Children.toArray(children)[page];
    const isLastPage = page === React.Children.count(children) - 1;
    return (
      <Formik
        initialValues={values}
        enableReinitialize={false}
        validate={this.validate}
        onSubmit={this.handleSubmit}
        render={({ values, handleSubmit, isSubmitting, handleReset }) => (
          <form onSubmit={handleSubmit}>
            {activePage}
            <div className="buttons">
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
                  S'inscrire
                </button>
              )}
            </div>
          </form>
        )}
      />
    );
  }
}
