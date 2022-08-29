"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[6902],{3905:function(e,t,n){n.d(t,{Zo:function(){return o},kt:function(){return k}});var r=n(7294);function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function u(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){l(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,l=function(e,t){if(null==e)return{};var n,r,l={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(l[n]=e[n]);return l}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(l[n]=e[n])}return l}var s=r.createContext({}),f=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):u(u({},t),e)),n},o=function(e){var t=f(e.components);return r.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},c=r.forwardRef((function(e,t){var n=e.components,l=e.mdxType,a=e.originalType,s=e.parentName,o=i(e,["components","mdxType","originalType","parentName"]),c=f(n),k=l,d=c["".concat(s,".").concat(k)]||c[k]||p[k]||a;return n?r.createElement(d,u(u({ref:t},o),{},{components:n})):r.createElement(d,u({ref:t},o))}));function k(e,t){var n=arguments,l=t&&t.mdxType;if("string"==typeof e||l){var a=n.length,u=new Array(a);u[0]=c;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:l,u[1]=i;for(var f=2;f<a;f++)u[f]=n[f];return r.createElement.apply(null,u)}return r.createElement.apply(null,n)}c.displayName="MDXCreateElement"},8701:function(e,t,n){n.r(t),n.d(t,{assets:function(){return s},contentTitle:function(){return u},default:function(){return p},frontMatter:function(){return a},metadata:function(){return i},toc:function(){return f}});var r=n(3117),l=(n(7294),n(3905));const a={id:"mutations",title:"Mutations",slug:"mutations",sidebar_position:2},u=void 0,i={unversionedId:"reference/api-reference/bsff/mutations",id:"reference/api-reference/bsff/mutations",title:"Mutations",description:"createBsff",source:"@site/docs/reference/api-reference/bsff/mutations.md",sourceDirName:"reference/api-reference/bsff",slug:"/reference/api-reference/bsff/mutations",permalink:"/reference/api-reference/bsff/mutations",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/api-reference/bsff/mutations.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{id:"mutations",title:"Mutations",slug:"mutations",sidebar_position:2},sidebar:"docs",previous:{title:"Queries",permalink:"/reference/api-reference/bsff/queries"},next:{title:"Objects",permalink:"/reference/api-reference/bsff/objects"}},s={},f=[{value:"createBsff",id:"createbsff",level:2},{value:"createDraftBsff",id:"createdraftbsff",level:2},{value:"createFicheInterventionBsff",id:"createficheinterventionbsff",level:2},{value:"createPdfAccessToken",id:"createpdfaccesstoken",level:2},{value:"deleteBsff",id:"deletebsff",level:2},{value:"publishBsff",id:"publishbsff",level:2},{value:"signBsff",id:"signbsff",level:2},{value:"updateBsff",id:"updatebsff",level:2},{value:"updateFicheInterventionBsff",id:"updateficheinterventionbsff",level:2}],o={toc:f};function p(e){let{components:t,...n}=e;return(0,l.kt)("wrapper",(0,r.Z)({},o,n,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"createbsff"},"createBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant de cr\xe9er un nouveau bordereau de suivi de fluides frigorig\xe8nes."),(0,l.kt)("p",null,"Ces champs sont requis :"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"emitter {\n  company {\n    name\n    siret\n    address\n    contact\n    phone\n    mail\n  }\n}\nwaste {\n  code\n  adr\n}\nweight {\n  value\n}\n")),(0,l.kt)("p",null,"Si vous souhaitez cr\xe9er un BSFF sans ces informations, utilisez createDraftBsff."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#bsffinput"},(0,l.kt)("code",null,"BsffInput!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"createdraftbsff"},"createDraftBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant de cr\xe9er un nouveau bordereau de suivi de fluides frigorig\xe8nes, \xe0 l'\xe9tat de brouillon.\nUn brouillon n'a pas de champs requis, la validation se fait au moment de le publier."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#bsffinput"},(0,l.kt)("code",null,"BsffInput!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"createficheinterventionbsff"},"createFicheInterventionBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsffficheintervention"},"BsffFicheIntervention!")),(0,l.kt)("p",null,"Mutation permettant de cr\xe9er une fiche d'intervention."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#bsffficheinterventioninput"},(0,l.kt)("code",null,"BsffFicheInterventionInput!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"createpdfaccesstoken"},"createPdfAccessToken"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/scalars#string"},"String!")),(0,l.kt)("p",null,"Mutation permettant d'obtenir un lien de t\xe9l\xe9chargement valide 30 minutes.\nA destination des forces de l'ordre qui ne disposent pas d'acc\xe8s \xe0 Trackd\xe9chets, le lien\nest accessible sans authentification, et peut \xeatre transmis sous la form de QR-code.\nLa cha\xeen retourn\xe9e est l'url de t\xe9l\xe9chargement."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#createpdfaccesstokeninput"},(0,l.kt)("code",null,"CreatePdfAccessTokenInput!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"deletebsff"},"deleteBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant de supprimer un bordereau existant de suivi de fluides frigorig\xe8nes.\n\xc0 condition qu'il n'ait pas encore \xe9t\xe9 sign\xe9."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"id",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#id"},(0,l.kt)("code",null,"ID!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"publishbsff"},"publishBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant de publier un brouillon."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"id",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#id"},(0,l.kt)("code",null,"ID!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"signbsff"},"signBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant d'apposer une signature sur le bordereau."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Champs requis pour ",(0,l.kt)("inlineCode",{parentName:"strong"},"EMISSION")," :")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"emitter {\n  company {\n    name\n    siret\n    address\n    contact\n    phone\n    mail\n  }\n}\nwaste {\n  code\n  adr\n}\nweight {\n  value\n}\n")),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Champs requis pour ",(0,l.kt)("inlineCode",{parentName:"strong"},"TRANSPORT")," :")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"transporter {\n  company {\n    name\n    siret\n    address\n    contact\n    phone\n    mail\n  }\n  transport {\n    mode\n  }\n}\npackagings {\n  name\n  numero\n  weight\n}\n")),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Champs requis pour ",(0,l.kt)("inlineCode",{parentName:"strong"},"RECEPTION")," :")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"destination {\n  company {\n    name\n    siret\n    address\n    contact\n    phone\n    mail\n  }\n  reception {\n    date\n    weight\n    acceptation {\n      status\n    }\n  }\n}\n")),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Champs requis pour ",(0,l.kt)("inlineCode",{parentName:"strong"},"OPERATION")," :")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"destination {\n  operation {\n    code\n  }\n}\n")),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"id",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#id"},(0,l.kt)("code",null,"ID!"))),(0,l.kt)("td",null,(0,l.kt)("p",null,"Identifiant du BSFF \xe0 signer."))),(0,l.kt)("tr",null,(0,l.kt)("td",null,"type",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/enums#bsffsignaturetype"},(0,l.kt)("code",null,"BsffSignatureType!"))),(0,l.kt)("td",null,(0,l.kt)("p",null,"Type de signature \xe0 apposer, voir l'enum pour plus de d\xe9tails."))),(0,l.kt)("tr",null,(0,l.kt)("td",null,"signature",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#signatureinput"},(0,l.kt)("code",null,"SignatureInput!"))),(0,l.kt)("td",null,(0,l.kt)("p",null,"Informations \xe0 propos de la personne signant le BSFF."))),(0,l.kt)("tr",null,(0,l.kt)("td",null,"securityCode",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#int"},(0,l.kt)("code",null,"Int"))),(0,l.kt)("td",null,(0,l.kt)("p",null,"Code de signature de l'auteur de la signature."),(0,l.kt)("p",null,"Ce param\xe8tre est optionnel, il n'est utile que dans le cas o\xf9 vous souhaitez signer pour un tiers sans moyen de vous authentifier \xe0 sa place. Ce tiers peut alors saisir son code de signature dans votre outil."))))),(0,l.kt)("h2",{id:"updatebsff"},"updateBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsff"},"Bsff!")),(0,l.kt)("p",null,"Mutation permettant de modifier un bordereau existant de suivi de fluides frigorig\xe8nes."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"id",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#id"},(0,l.kt)("code",null,"ID!"))),(0,l.kt)("td",null)),(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#bsffinput"},(0,l.kt)("code",null,"BsffInput!"))),(0,l.kt)("td",null)))),(0,l.kt)("h2",{id:"updateficheinterventionbsff"},"updateFicheInterventionBsff"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Type:")," ",(0,l.kt)("a",{parentName:"p",href:"/reference/api-reference/bsff/objects#bsffficheintervention"},"BsffFicheIntervention!")),(0,l.kt)("p",null,"Mutation permettant de mettre \xe0 jour une fiche d'intervention."),(0,l.kt)("p",{style:{marginBottom:"0.4em"}},(0,l.kt)("strong",null,"Arguments")),(0,l.kt)("table",null,(0,l.kt)("thead",null,(0,l.kt)("tr",null,(0,l.kt)("th",null,"Name"),(0,l.kt)("th",null,"Description"))),(0,l.kt)("tbody",null,(0,l.kt)("tr",null,(0,l.kt)("td",null,"id",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/scalars#id"},(0,l.kt)("code",null,"ID!"))),(0,l.kt)("td",null)),(0,l.kt)("tr",null,(0,l.kt)("td",null,"input",(0,l.kt)("br",null),(0,l.kt)("a",{href:"/reference/api-reference/bsff/inputObjects#bsffficheinterventioninput"},(0,l.kt)("code",null,"BsffFicheInterventionInput!"))),(0,l.kt)("td",null)))))}p.isMDXComponent=!0}}]);