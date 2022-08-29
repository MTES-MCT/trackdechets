"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[5606],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return m}});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var u=r.createContext({}),s=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},c=function(e){var t=s(e.components);return r.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,u=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),d=s(n),m=i,h=d["".concat(u,".").concat(m)]||d[m]||p[m]||o;return n?r.createElement(h,a(a({ref:t},c),{},{components:n})):r.createElement(h,a({ref:t},c))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=d;var l={};for(var u in t)hasOwnProperty.call(t,u)&&(l[u]=t[u]);l.originalType=e,l.mdxType="string"==typeof e?e:i,a[1]=l;for(var s=2;s<o;s++)a[s]=n[s];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},857:function(e,t,n){n.r(t),n.d(t,{assets:function(){return u},contentTitle:function(){return a},default:function(){return p},frontMatter:function(){return o},metadata:function(){return l},toc:function(){return s}});var r=n(3117),i=(n(7294),n(3905));const o={title:"Cr\xe9er une application OAuth2"},a=void 0,l={unversionedId:"guides/oauth2",id:"guides/oauth2",title:"Cr\xe9er une application OAuth2",description:"Avant de pouvoir impl\xe9menter le procotole OAuth2, vous aurez besoin d'une application sur la plateforme Trackd\xe9chets. Vous pouvez cr\xe9er une application depuis votre compte Trackd\xe9chets dans la section Mon Compte > D\xe9veloppeurs > Mes Applications.",source:"@site/docs/guides/oauth2.md",sourceDirName:"guides",slug:"/guides/oauth2",permalink:"/guides/oauth2",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/guides/oauth2.md",tags:[],version:"current",frontMatter:{title:"Cr\xe9er une application OAuth2"},sidebar:"docs",previous:{title:"Rechercher un \xe9tablissement partenaire par son n\xb0 SIRET pour les entreprises fran\xe7aises ou par son n\xb0TVA intracommunautaire pour les entreprises europ\xe9ennes.",permalink:"/guides/sirene"},next:{title:"Queries",permalink:"/reference/api-reference/bsdd/queries"}},u={},s=[],c={toc:s};function p(e){let{components:t,...o}=e;return(0,i.kt)("wrapper",(0,r.Z)({},c,o,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"Avant de pouvoir impl\xe9menter le procotole OAuth2, vous aurez besoin d'une application sur la plateforme Trackd\xe9chets. Vous pouvez cr\xe9er une application depuis votre compte Trackd\xe9chets dans la section Mon Compte > D\xe9veloppeurs > Mes Applications.")),(0,i.kt)("p",null,"Le ",(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749"},"protocole OAuth2"),' permet \xe0 des logiciels tiers type SaaS d\xe9chets ("client") d\'acc\xe9der \xe0 l\'API Trackd\xe9chets ("ressource server") pour le compte d\'utilisateurs ("ressource owner") sans exposer le mot de passe de celui-ci.'),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"     +--------+                               +---------------+\n     |        |--(A)- Authorization Request ->|   Resource    |\n     |        |                               |     Owner     |\n     |        |<-(B)-- Authorization Grant ---|               |\n     |        |                               +---------------+\n     |        |\n     |        |                               +---------------+\n     |        |--(C)-- Authorization Grant --\x3e| Authorization |\n     | Client |                               |     Server    |\n     |        |<-(D)----- Access Token -------|               |\n     |        |                               +---------------+\n     |        |\n     |        |                               +---------------+\n     |        |--(E)----- Access Token ------\x3e|    Resource   |\n     |        |                               |     Server    |\n     |        |<-(F)--- Protected Resource ---|               |\n     +--------+                               +---------------+\n\n                    Abstract Protocol Flow\n")),(0,i.kt)("p",null,'Seul le "grant" par \xe9change de de code d\'autorisation est impl\xe9ment\xe9e dans Trackd\xe9chets ',(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749#section-4.1"},"https://tools.ietf.org/html/rfc6749#section-4.1"),". Le sch\xe9ma de flux est le suivant"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"     +----------+\n     | Resource |\n     |   Owner  |\n     |          |\n     +----------+\n          ^\n          |\n         (B)\n     +----|-----+          Client Identifier      +---------------+\n     |         -+----(A)-- & Redirection URI ----\x3e|               |\n     |  User-   |                                 | Authorization |\n     |  Agent  -+----(B)-- User authenticates ---\x3e|     Server    |\n     |          |                                 |               |\n     |         -+----(C)-- Authorization Code ---<|               |\n     +-|----|---+                                 +---------------+\n       |    |                                         ^      v\n      (A)  (C)                                        |      |\n       |    |                                         |      |\n       ^    v                                         |      |\n     +---------+                                      |      |\n     |         |>---(D)-- Authorization Code ---------'      |\n     |  Client |          & Redirection URI                  |\n     |         |                                             |\n     |         |<---(E)----- Access Token -------------------'\n     +---------+\n\n   Note: The lines illustrating steps (A), (B), and (C) are broken into\n   two parts as they pass through the user-agent.\n\n                     Authorization Code Flow\n")),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"(A) L'application cliente initie le protocole en redirigeant l'utilisateur (\"resource owner\") sur l'URL d'autorisation Trackd\xe9chets ",(0,i.kt)("inlineCode",{parentName:"li"},"https://app.trackdechets.beta.gouv.fr/oauth2/authorize/dialog"))),(0,i.kt)("p",null,'Les arguments suivants doivent \xeatre pass\xe9s en "query string" de la requ\xeate (Cf ',(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749#section-4.1.1"},"https://tools.ietf.org/html/rfc6749#section-4.1.1"),"):"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"client_id={client_id}"),": L'identifiant de l'application cliente"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"response_type=code")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"redirect_url={redirect_uri}"),": URL de redirection")),(0,i.kt)("p",null,"Exemple: ",(0,i.kt)("inlineCode",{parentName:"p"},"https://app.trackdechets.beta.gouv.fr/oauth2/authorize/dialog?response_type=code&redirect_uri=https://client.example.com/cb&client_id=ck7d66y9s00x20784u4u7fp8l")),(0,i.kt)("p",null,"Si la requ\xeate \xe9choue \xe0 cause d'un param\xe8tre invalide, une erreur est retourn\xe9e ",(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749#section-4.1.2.1"},"https://tools.ietf.org/html/rfc6749#section-4.1.2.1")),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"(B) Le serveur d'autorisation authentifie l'utilisateur via le navigateur (\"resource owner\") et \xe9tablit si oui ou non l'utilisateur autorise ou non l'application autorise l'acc\xe8s")),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"oauth2-dialog.png",src:n(2229).Z,width:"882",height:"563"})),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"(C) Si l'utilisateur donne acc\xe8s, le serveur d'autorisation redirige l'utilisateur vers l'application cliente en utilisant l'URL de redirection fournit \xe0 l'\xe9tape (A) ",(0,i.kt)("a",{parentName:"li",href:"https://tools.ietf.org/html/rfc6749#section-4.1.2"},"https://tools.ietf.org/html/rfc6749#section-4.1.2"),". L'URL de redirection inclut un code d'autorisation avec une dur\xe9e de validit\xe9 de 10 minutes. Par exemple: ",(0,i.kt)("inlineCode",{parentName:"li"},"https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA"),".")),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},"(D) L'application cliente demande un jeton d'acc\xe8s au serveur d'autorisation en incluant le code d'autorisation re\xe7u \xe0 l'\xe9tape pr\xe9c\xe9dente en faisant un ",(0,i.kt)("inlineCode",{parentName:"p"},"POST")," sur l'URL ",(0,i.kt)("inlineCode",{parentName:"p"},"https://api.trackdechets.beta.gouv.fr/oauth2/token"),". Cf ",(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749#section-4.1.3"},"https://tools.ietf.org/html/rfc6749#section-4.1.3"),'. Les param\xe8tres suivants doivent \xeatre pass\xe9s en utilisant le format "application/x-www-form-urlencoded".'),(0,i.kt)("ul",{parentName:"li"},(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"grant_type=authorization_code")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"code={code}")," code re\xe7u \xe0 l'\xe9tape pr\xe9c\xe9dente"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"redirect_uri={redirect_uri}")," URL de redirection sp\xe9cifi\xe9 \xe0 l'\xe9tape (A)")))),(0,i.kt)("p",null,"La requ\xeate doit \xeatre authentifi\xe9e avec avec le ",(0,i.kt)("inlineCode",{parentName:"p"},"client_id")," et ",(0,i.kt)("inlineCode",{parentName:"p"},"client_secret")," (",(0,i.kt)("a",{parentName:"p",href:"https://fr.wikipedia.org/wiki/Authentification_HTTP#M%C3%A9thode_%C2%AB_Basic_%C2%BB"},"m\xe9thode basique"),")."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"POST /oauth2/token HTTP/1.1\nHost: api.trackdechets.beta.gouv.fr\nAuthorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA\n&redirect_uri=https://client.example.com/cb\n")),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"(E) Si la requ\xeate est valide et autoris\xe9e, le serveur d'autorisation \xe9met un jeton d'acc\xe8s. Par exemple")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},'HTTP/1.1 200 OK\nContent-Type: application/json;charset=UTF-8\nCache-Control: no-store\nPragma: no-cache\n\n{\n  "access_token":"*****************",\n  "token_type":"bearer",\n    user: {\n      email: "foo@bar.com",\n      name: "Foo Bar"\n    }\n}\n')),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},"Le token \xe9mit a une dur\xe9e de vie infinie, il n'y a pas besoin de le rafraichir"),". Il pourra toutefois \xeatre r\xe9voqu\xe9 par l'utilisateur dans son espace client Trackd\xe9chets."),(0,i.kt)("p",null,"Vous pouvez ensuite stocker ce token et l'utiliser pour acc\xe9der aux ressources de l'utilisateur sur la plateforme Trackd\xe9chets."),(0,i.kt)("p",null,"Si la requ\xeate \xe9choue, le serveur r\xe9pond par un message d'erreur tel que d\xe9crit ",(0,i.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc6749#section-5.2"},"ici")),(0,i.kt)("admonition",{type:"tip"},(0,i.kt)("p",{parentName:"admonition"},"Une application OAuth2 de d\xe9monstration a \xe9t\xe9 cr\xe9ee \xe0 l'adresse ",(0,i.kt)("a",{parentName:"p",href:"https://td-oauth2-demo.osc-fr1.scalingo.io/"},"https://td-oauth2-demo.osc-fr1.scalingo.io/"))))}p.isMDXComponent=!0},2229:function(e,t,n){t.Z=n.p+"assets/images/oauth2-dialog-4cb88af95a355bb29ffdbd42354af730.png"}}]);