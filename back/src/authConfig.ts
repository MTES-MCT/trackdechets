import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import { Strategy as JwtStrategy } from "passport-jwt";
import { prisma } from "./generated/prisma-client";
import { compare } from "bcrypt";

const passport = require("passport");

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log(email, password);
    prisma.user({ email: email.trim() }).then(user => {
      if (!user) {
        return done(null, false, {
          message: `Aucun utilisateur trouvé avec l'email ${email}`
        });
      }
      if (!user.isActive) {
        return done(null, false, {
          message: `Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support.`
        });
      }

      compare(password, user.password).then(passwordValid => {
        if (!passwordValid) {
          return done(null, false, { message: "Mot de passe incorrect" });
        }
        return done(null, user);
      });
    });
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  return prisma.user({ id }).then(user => done(null, user));
});

passport.use(
  new BearerStrategy((accessToken, done) => {
    // retrieves user in db from accessToken
  })
);

passport.use(
  new JwtStrategy((jwt_payload, done) => {
    // parse old jwt token for compatibility
  })
);
