"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[7009],{3905:function(e,t,r){r.d(t,{Zo:function(){return p},kt:function(){return m}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function u(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),s=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},p=function(e){var t=s(e.components);return n.createElement(l.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,p=u(e,["components","mdxType","originalType","parentName"]),d=s(r),m=a,f=d["".concat(l,".").concat(m)]||d[m]||c[m]||o;return r?n.createElement(f,i(i({ref:t},p),{},{components:r})):n.createElement(f,i({ref:t},p))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=d;var u={};for(var l in t)hasOwnProperty.call(t,l)&&(u[l]=t[l]);u.originalType=e,u.mdxType="string"==typeof e?e:a,i[1]=u;for(var s=2;s<o;s++)i[s]=r[s];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},3444:function(e,t,r){r.r(t),r.d(t,{assets:function(){return l},contentTitle:function(){return i},default:function(){return c},frontMatter:function(){return o},metadata:function(){return u},toc:function(){return s}});var n=r(3117),a=(r(7294),r(3905));const o={title:"Effectuer votre premi\xe8re requ\xeate"},i=void 0,u={unversionedId:"tutoriels/quickstart/first-query",id:"tutoriels/quickstart/first-query",title:"Effectuer votre premi\xe8re requ\xeate",description:"Connectez vous au playground",source:"@site/docs/tutoriels/quickstart/first-query.md",sourceDirName:"tutoriels/quickstart",slug:"/tutoriels/quickstart/first-query",permalink:"/tutoriels/quickstart/first-query",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/quickstart/first-query.md",tags:[],version:"current",frontMatter:{title:"Effectuer votre premi\xe8re requ\xeate"},sidebar:"docs",previous:{title:"Obtenir un jeton d'acc\xe8s personnel",permalink:"/tutoriels/quickstart/access-token"},next:{title:"Cr\xe9er votre premier BSD",permalink:"/tutoriels/quickstart/first-bsd"}},l={},s=[{value:"Connectez vous au playground",id:"connectez-vous-au-playground",level:3},{value:"Renseignez votre token",id:"renseignez-votre-token",level:3},{value:"\xc9crire votre premi\xe8re requ\xeate",id:"\xe9crire-votre-premi\xe8re-requ\xeate",level:3}],p={toc:s};function c(e){let{components:t,...o}=e;return(0,a.kt)("wrapper",(0,n.Z)({},p,o,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h3",{id:"connectez-vous-au-playground"},"Connectez vous au playground"),(0,a.kt)("p",null,"Rendez-vous sur le ",(0,a.kt)("a",{parentName:"p",href:"https://api.sandbox.trackdechets.beta.gouv.fr"},"playground")," GraphQL en ",(0,a.kt)("em",{parentName:"p"},"sandbox"),". Vous devez voir un \xe9cran similaire \xe0 celui-ci :"),(0,a.kt)("p",null,(0,a.kt)("img",{alt:"playground",src:r(5381).Z,width:"1918",height:"938"})),(0,a.kt)("admonition",{type:"note"},(0,a.kt)("p",{parentName:"admonition"},"Le playground GraphQL est un environnement de d\xe9veloppement int\xe9gr\xe9 au navigateur web qui permet de facilement tester des requ\xeates \xe0 l'API Trackd\xe9chets.\nIl s'affiche par d\xe9faut lors d'une connexion \xe0 la racine de l'API via un navigateur. Pour rappel :"),(0,a.kt)("table",{parentName:"admonition"},(0,a.kt)("thead",{parentName:"table"},(0,a.kt)("tr",{parentName:"thead"},(0,a.kt)("th",{parentName:"tr",align:null},"Environnement"),(0,a.kt)("th",{parentName:"tr",align:null},"URL de l'API"))),(0,a.kt)("tbody",{parentName:"table"},(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"Sandbox"),(0,a.kt)("td",{parentName:"tr",align:null},(0,a.kt)("a",{parentName:"td",href:"https://api.sandbox.trackdechets.beta.gouv.fr"},"https://api.sandbox.trackdechets.beta.gouv.fr"))),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"Production"),(0,a.kt)("td",{parentName:"tr",align:null},(0,a.kt)("a",{parentName:"td",href:"https://api.trackdechets.beta.gouv.fr"},"https://api.trackdechets.beta.gouv.fr")))))),(0,a.kt)("h3",{id:"renseignez-votre-token"},"Renseignez votre token"),(0,a.kt)("p",null,"Authentifiez-vous en ajoutant un header d'autorisation dans le bloc en bas \xe0 gauche intitul\xe9 ",(0,a.kt)("em",{parentName:"p"},"HTTP HEADERS")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "Authorization": "Bearer ACCESS_TOKEN"\n}\n')),(0,a.kt)("p",null,"o\xf9 ",(0,a.kt)("inlineCode",{parentName:"p"},"ACCESS_TOKEN")," correspond au token g\xe9n\xe9r\xe9 \xe0 l'\xe9tape pr\xe9c\xe9dente ",(0,a.kt)("a",{parentName:"p",href:"./access-token"},"Obtenir un jeton d'acc\xe8s personnel")),(0,a.kt)("h3",{id:"\xe9crire-votre-premi\xe8re-requ\xeate"},"\xc9crire votre premi\xe8re requ\xeate"),(0,a.kt)("p",null,"Une fois le header d'autorisation renseign\xe9, vous pouvez commencer \xe0 \xe9crire des requ\xeates dans le cadre de gauche et voir le r\xe9sultat dans le cadre de droite. Essayez avec la requ\xeate suivante qui permet de demander les informations relatives \xe0 l'utilisateur connect\xe9 :"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-graphql"},"query {\n  me {\n    name\n    email\n  }\n}\n")),(0,a.kt)("p",null,'puis ex\xe9cuter la requ\xeate \xe0 l\'aide du bouton "Play" au milieu. Vous devrez recevoir la r\xe9ponse suivante au format JSON :'),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "me": {\n      "name": "YOUR_NAME"\n    }\n  }\n}\n')),(0,a.kt)("p",null,"Bravo, vous venez d'effectuer votre premi\xe8re requ\xeate \xe0 l'API Trackd\xe9chets \ud83c\udf89. En terminologie GraphQL, la requ\xeate ci-dessous est une ",(0,a.kt)("inlineCode",{parentName:"p"},"query"),". Ce genre de requ\xeate se comporte comme un ",(0,a.kt)("inlineCode",{parentName:"p"},"GET")," dans le standard REST, c'est \xe0 dire qu'elle permet de lire des donn\xe9es mais pas d'en modifier. Il existe aussi un autre type de requ\xeate appel\xe9e ",(0,a.kt)("inlineCode",{parentName:"p"},"mutation")," qui va nous permettre de cr\xe9er et modifier des ressources \xe0 l'instar d'un ",(0,a.kt)("inlineCode",{parentName:"p"},"POST")," / ",(0,a.kt)("inlineCode",{parentName:"p"},"PUT")," / ",(0,a.kt)("inlineCode",{parentName:"p"},"PATCH")," en standard ",(0,a.kt)("inlineCode",{parentName:"p"},"REST"),". C'est ce que nous allons voir \xe0 l'\xe9tape suivante pour la cr\xe9ation de votre premier bordereau."),(0,a.kt)("admonition",{type:"tip"},(0,a.kt)("p",{parentName:"admonition"},"Les arguments et le type de retour de chaque ",(0,a.kt)("inlineCode",{parentName:"p"},"query")," ou ",(0,a.kt)("inlineCode",{parentName:"p"},"mutation")," est document\xe9e dans la r\xe9f\xe9rence de l'API. Exemple avec ",(0,a.kt)("a",{parentName:"p",href:"../../reference/api-reference/user-company/queries#me"},"la requ\xeate que nous venons d'effectuer"))))}c.isMDXComponent=!0},5381:function(e,t,r){t.Z=r.p+"assets/images/playground-24b4eb9c72fb86bac6c1cc8a8addd8a8.png"}}]);