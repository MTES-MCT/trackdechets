"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[1859],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var i=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,i)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,i,r=function(e,t){if(null==e)return{};var n,i,r={},a=Object.keys(e);for(i=0;i<a.length;i++)n=a[i],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(i=0;i<a.length;i++)n=a[i],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=i.createContext({}),p=function(e){var t=i.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},u=function(e){var t=p(e.components);return i.createElement(s.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return i.createElement(i.Fragment,{},t)}},d=i.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=p(n),m=r,k=d["".concat(s,".").concat(m)]||d[m]||c[m]||a;return n?i.createElement(k,o(o({ref:t},u),{},{components:n})):i.createElement(k,o({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,o=new Array(a);o[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:r,o[1]=l;for(var p=2;p<a;p++)o[p]=n[p];return i.createElement.apply(null,o)}return i.createElement.apply(null,n)}d.displayName="MDXCreateElement"},841:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>o,default:()=>c,frontMatter:()=>a,metadata:()=>l,toc:()=>p});var i=n(3117),r=(n(7294),n(3905));const a={title:"Utiliser le protocole OpenID Connect"},o=void 0,l={unversionedId:"guides/openidconnect",id:"guides/openidconnect",title:"Utiliser le protocole OpenID Connect",description:"Cette fonctionalit\xe9 est r\xe9serv\xe9e \xe0 certains acteurs institutionnels.",source:"@site/docs/guides/openidconnect.md",sourceDirName:"guides",slug:"/guides/openidconnect",permalink:"/guides/openidconnect",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/guides/openidconnect.md",tags:[],version:"current",frontMatter:{title:"Utiliser le protocole OpenID Connect"},sidebar:"docs",previous:{title:"Cr\xe9er une application OAuth2",permalink:"/guides/oauth2"},next:{title:"Utiliser les webhooks",permalink:"/guides/webhooks"}},s={},p=[{value:"Scope",id:"scope",level:2}],u={toc:p};function c(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,i.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"Cette fonctionalit\xe9 est r\xe9serv\xe9e \xe0 certains acteurs institutionnels.\nAvant de pouvoir impl\xe9menter le procotole OpenID Connect, vous aurez besoin d'une application sur la plateforme Trackd\xe9chets. Vous pouvez cr\xe9er une application depuis votre compte Trackd\xe9chets dans la section Mon Compte > D\xe9veloppeurs > Mes Applications."),(0,r.kt)("p",{parentName:"admonition"},"L'activation d'OpenID Connect sur une application doit \xeatre demand\xe9e au support.")),(0,r.kt)("p",null,"Le ",(0,r.kt)("a",{parentName:"p",href:"https://openid.net/specs/openid-connect-core-1_0.html"},"protocole Open ID Connect")," permet \xe0 des logiciels tiers (\"client\") de construire un m\xe9canisme d'authentification en consid\xe9rant l'identit\xe9 d'un utilisateur de Trackd\xe9chets comme une ressource."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"+--------+                                   +--------+\n|        |                                   |        |\n|        |---------(1) AuthN Request--------\x3e|        |\n|        |                                   |        |\n|        |  +--------+                       |        |\n|        |  |        |                       |        |\n|        |  |  End-  |<--(2) AuthN & AuthZ--\x3e|        |\n|        |  |  User  |                       |        |\n|   RP   |  |        |---(3)----------------\x3e|   OP   |\n|  aka   |  +--------+                       |  aka   |\n| Client |                                   | OpenID |\n|        |<--------(4) Redirect to callback--|Provider|\n|        |                                   |        |\n|        |---------(5) ID Token Request-----\x3e|        |\n|        |                                   |        |\n|        |<--------(6) ID Token Response-----|        |\n|        |                                   |        |\n+--------+                                   +--------+\n                    Abstract Protocol Flow\nAuthN: Authentification, AuthZ: Authorization\n")),(0,r.kt)("p",null,"Le protocole Openid connect d\xe9finit diff\xe9rents workflows, seul l'",(0,r.kt)("em",{parentName:"p"},"Authorization code flow")," est impl\xe9ment\xe9."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"     +----------+\n     | Resource |\n     |   Owner  |\n     |          |\n     +----------+\n          ^\n          |\n         (B)\n     +----|-----+          Client Identifier      +---------------+\n     |         -+----(A)-- & Redirection URI ----\x3e|               |\n     |  User-   |                                 |    OpenID     |\n     |  Agent  -+----(B)-- User authenticates ---\x3e|    Provider   |\n     |          |                                 |               |\n     |         -+----(C)-- Authorization Code ---<|               |\n     +-|----|---+                                 +---------------+\n       |    |                                         ^      v\n      (A)  (C)                                        |      |\n       |    |                                         |      |\n       ^    v                                         |      |\n     +---------+                                      |      |\n     |         |>---(D)-- Authorization Code ---------'      |\n     |   RP    |          & Redirection URI                  |\n     |  Client |                                             |\n     |         |<---(E)----- ID Token -----------------------+\n     +---------+\n\n   Note: The lines illustrating steps (A), (B), and (C) are broken into\n   two parts as they pass through the user-agent.\n\n                     Authorization Code Flow\n")),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"(A) L'application cliente initie le protocole en redirigeant l'utilisateur sur l'URL d'autorisation Trackd\xe9chets ",(0,r.kt)("inlineCode",{parentName:"li"},"https://app.trackdechets.beta.gouv.fr/oidc/authorize/dialog"))),(0,r.kt)("p",null,'Les arguments suivants doivent \xeatre pass\xe9s en "query string" de la requ\xeate:'),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"client_id={client_id}"),": L'identifiant de l'application cliente"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"response_type=code")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"redirect_url={redirect_uri}"),": URL de redirection"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"scope={openid profile email}"),": le scope de la requ\xeate, voir plus bas"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"state={random}"),": une chaine al\xe9atoire qui permet de v\xe9rifier que la r\xe9ponse et la redirection (C) font partie d'une m\xeame s\xe9quence")),(0,r.kt)("p",null,"Exemple: ",(0,r.kt)("inlineCode",{parentName:"p"},"https://app.trackdechets.beta.gouv.fr/oidc/authorize/dialog?response_type=code&redirect_uri=https://client.example.com/cb&client_id=ck7d66y9s00x20784u4u7fp8l&scope=openid profile email&state=KTDRl4JI3p/TwSUJhgO2alwb")),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"(B) Le serveur d'autorisation authentifie l'utilisateur via le navigateur (\"resource owner\") et \xe9tablit si oui ou non l'utilisateur autorise ou non l'application autorise l'acc\xe8s")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"(C) Si l'utilisateur donne acc\xe8s, le serveur d'autorisation redirige l'utilisateur vers l'application cliente en utilisant l'URL de redirection fournit \xe0 l'\xe9tape (A). L'URL de redirection inclut un code d'autorisation d'une dur\xe9e de validit\xe9 de 1 minute. Par exemple: ",(0,r.kt)("inlineCode",{parentName:"p"},"https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=KTDRl4JI3p/TwSUJhgO2alwb"),". Le state re\xe7u ici doit correspondre \xe0 celui de (A)")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("p",{parentName:"li"},"(D) L'application cliente demande un jeton d'identit\xe9 au serveur d'autorisation en incluant le code d'autorisation re\xe7u \xe0 l'\xe9tape pr\xe9c\xe9dente en faisant un ",(0,r.kt)("inlineCode",{parentName:"p"},"POST")," sur l'URL ",(0,r.kt)("inlineCode",{parentName:"p"},"https://api.trackdechets.beta.gouv.fr/oidc/token"),'. Les param\xe8tres suivants doivent \xeatre pass\xe9s en utilisant le format "application/x-www-form-urlencoded".'),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"grant_type=authorization_code")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"code={code}")," code re\xe7u \xe0 l'\xe9tape pr\xe9c\xe9dente"),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"redirect_uri={redirect_uri}")," URL de redirection sp\xe9cifi\xe9 \xe0 l'\xe9tape (A)")))),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"La requ\xeate doit \xeatre authentifi\xe9e, 2 m\xe9thodes sont possibles:"),(0,r.kt)("ul",{parentName:"admonition"},(0,r.kt)("li",{parentName:"ul"},"via la ",(0,r.kt)("a",{parentName:"li",href:"https://fr.wikipedia.org/wiki/Authentification_HTTP#M%C3%A9thode_%C2%AB_Basic_%C2%BB"},"m\xe9thode basique"),", en passant base64(",(0,r.kt)("inlineCode",{parentName:"li"},"client_id"),":",(0,r.kt)("inlineCode",{parentName:"li"},"client_secret"),")"),(0,r.kt)("li",{parentName:"ul"},"en passant ",(0,r.kt)("inlineCode",{parentName:"li"},"client_id")," et ",(0,r.kt)("inlineCode",{parentName:"li"},"client_secret")," directement dans les param\xe8tres POST"))),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"(E) Si la requ\xeate est valide et autoris\xe9e, le serveur d'autorisation \xe9met un jeton d'identit\xe9 (ID token). Par exemple")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},' {\n  name: "Jean Dupont",\n  phone: "06876543",\n  email: "foo@barr.fr",\n  email_verified: true,\n  companies: [\n    {\n      id: "wxcgh123",\n      role: "ADMIN",\n      siret: "1234",\n      vat_number: null,\n      name: "une entreprise A",\n      given_name: "Succursale Marseille",\n      types: ["PRODUCER"],\n      verified: true\n    },\n\n    {\n      id: "mlkj953",\n      role: "MEMBER",\n      siret: "9876",\n      vat_number: null,\n      name: "une entreprise B",\n      given_name: "Succursale Rouen",\n      types: ["COLLECTOR", "WASTEPROCESSOR"],\n      verified: false\n    }\n  ],\n  nonce: "CYCTdEHKQAqB2ahOVWiOFSMbjdxUhGBb",\n  iat: 1672650576,\n  iss: "trackdechets",\n  aud: "your-app",\n  exp: 1672654176,\n  sub: "ck03yr7q000di0728m7uwhc1i"\n};\n')),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"Le champ ",(0,r.kt)("inlineCode",{parentName:"p"},"sub"),"correspond \xe0 l'User Id de Trackd\xe9chets")),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"Le token est sign\xe9 via une clef RSA, il est indispensable de v\xe9rifier sa signature l'audience (aud) et issuer (iss) gr\xe2ce \xe0 la clef publique.")),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"Le nonce est fourni pour \xe9viter toute attaque par rejeu, il appartient au client de s'assurer que le nonce n'a jamais \xe9t\xe9 utilis\xe9")),(0,r.kt)("h2",{id:"scope"},"Scope"),(0,r.kt)("p",null,"Le scope d\xe9finit les claims, cad les champs demand\xe9s qui seront inclus dans le token d'identit\xe9."),(0,r.kt)("p",null,"Trackd\xe9chets impl\xe9mente 3 valeurs standard et une valeur sp\xe9cifique:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"openid : obligatoire, requ\xeate le ",(0,r.kt)("inlineCode",{parentName:"li"},"sub"),", l'id de l'utilisateur"),(0,r.kt)("li",{parentName:"ul"},"email : requ\xeate email et email_verified"),(0,r.kt)("li",{parentName:"ul"},"profile : requ\xeate name & phone"),(0,r.kt)("li",{parentName:"ul"},"companies : requ\xeate la liste des \xe9tablissements de l'utilisateur :",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"id: identifiant unique au sein de Trackd\xe9chets"),(0,r.kt)("li",{parentName:"ul"},"role : r\xf4le de l'utilisateur, MEMBER ou ADMIN au sein de l'\xe9tablissement"),(0,r.kt)("li",{parentName:"ul"},"siret : siret \xe0 14 chiffres pour les entreprises fran\xe7aises"),(0,r.kt)("li",{parentName:"ul"},"name : d\xe9nomination officielle de l'\xe9tablissement"),(0,r.kt)("li",{parentName:"ul"},"given_name : nom usuel donn\xe9 par l'admin de l'\xe9tablissement"),(0,r.kt)("li",{parentName:"ul"},"types : CompanyTypes de l'\xe9tablissement (eg. ",'["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"]',")"),(0,r.kt)("li",{parentName:"ul"},"vat_number : num\xe9ro de tva si disponible, utilis\xe9 pour identifier les entreprises \xe9trang\xe8res"),(0,r.kt)("li",{parentName:"ul"},"verified: true|false, pr\xe9cise si l'\xe9tablissement est v\xe9rifi\xe9 (la v\xe9rification n'est effectu\xe9e que sur certains type d'\xe9tablissements )")))))}c.isMDXComponent=!0}}]);