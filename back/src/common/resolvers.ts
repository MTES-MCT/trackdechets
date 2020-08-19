import { AuthType } from "../auth";
import * as Yup from "yup";
import { ResolverFn } from "../generated/graphql/types";
import { GraphQLResolveInfo } from "graphql";
import { GraphQLContext } from "../types";
import { NotLoggedIn } from "./errors";

type Permission = (context: GraphQLContext) => void;

interface TDResolverOpts<TResult, TParent, TArgs> {
  authStrategies?: AuthType[];
  permissions?: Permission[];
  validateFn?: (args: TArgs) => void;
  validationSchema?: Yup.Schema<any>;
  resolveFn: ResolverFn<TResult, TParent, GraphQLContext, TArgs>;
}

// Default authentication strategies
const defaultStrategies = [AuthType.Bearer, AuthType.JWT, AuthType.Session];

export const isAuthenticated: Permission = context => {
  if (!context.user) {
    throw new NotLoggedIn();
  }
};

export class TDResolver<TResult, TParent, TArgs> {
  resolveFn: ResolverFn<TResult, TParent, GraphQLContext, TArgs>;
  authStrategies: AuthType[];
  permissions: Permission[];
  validateFn: (args: TArgs) => void;
  validationSchema: Yup.Schema<any>;

  constructor(opts: TDResolverOpts<TResult, TParent, TArgs>) {
    this.authStrategies = opts.authStrategies || defaultStrategies;
    this.permissions = opts.permissions || [];

    if (opts.validateFn && opts.validationSchema) {
      const errMsg =
        "You may specify either a validate function or a validationSchema but not both";
      throw new Error(errMsg);
    }

    this.validateFn = opts.validateFn;
    this.validationSchema = opts.validationSchema;
    this.resolveFn = opts.resolveFn;
  }

  // Check permissions, it may raise UNAUTHENTICATED or FORBIDDEN error
  checkPermissions(context: GraphQLContext) {
    for (const permission of this.permissions) {
      permission(context);
    }
  }

  // Validate resolvers args using either custom validation function
  // or yup schema
  validate(args: TArgs) {
    if (this.validateFn) {
      this.validateFn(args);
    } else if (this.validationSchema) {
      this.validationSchema.validateSync(args);
    }
  }

  // Decorated resolve function that handles permissions and validation
  resolve(
    parent: TParent,
    args: TArgs,
    context: GraphQLContext,
    info: GraphQLResolveInfo
  ) {
    // Get rid of user info if it was not authenticated with an auth strategy
    // allowed for this resolver. For example a mutation used to renew a user password
    // will only be allowed if user is authenticated from Trackdéchets UI (session)
    if (context.user && this.authStrategies.includes(context.user.auth)) {
      context.user = null;
    }

    // check permissions
    this.checkPermissions(context);

    // validate input
    this.validate(args);

    // apply actual resolve function
    return this.resolveFn(parent, args, context, info);
  }
}
