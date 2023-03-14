"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[9060],{3905:(e,t,l)=>{l.d(t,{Zo:()=>o,kt:()=>p});var r=l(7294);function n(e,t,l){return t in e?Object.defineProperty(e,t,{value:l,enumerable:!0,configurable:!0,writable:!0}):e[t]=l,e}function a(e,t){var l=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),l.push.apply(l,r)}return l}function u(e){for(var t=1;t<arguments.length;t++){var l=null!=arguments[t]?arguments[t]:{};t%2?a(Object(l),!0).forEach((function(t){n(e,t,l[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(l)):a(Object(l)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(l,t))}))}return e}function i(e,t){if(null==e)return{};var l,r,n=function(e,t){if(null==e)return{};var l,r,n={},a=Object.keys(e);for(r=0;r<a.length;r++)l=a[r],t.indexOf(l)>=0||(n[l]=e[l]);return n}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)l=a[r],t.indexOf(l)>=0||Object.prototype.propertyIsEnumerable.call(e,l)&&(n[l]=e[l])}return n}var s=r.createContext({}),c=function(e){var t=r.useContext(s),l=t;return e&&(l="function"==typeof e?e(t):u(u({},t),e)),l},o=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},k={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var l=e.components,n=e.mdxType,a=e.originalType,s=e.parentName,o=i(e,["components","mdxType","originalType","parentName"]),d=c(l),p=n,f=d["".concat(s,".").concat(p)]||d[p]||k[p]||a;return l?r.createElement(f,u(u({ref:t},o),{},{components:l})):r.createElement(f,u({ref:t},o))}));function p(e,t){var l=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=l.length,u=new Array(a);u[0]=d;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:n,u[1]=i;for(var c=2;c<a;c++)u[c]=l[c];return r.createElement.apply(null,u)}return r.createElement.apply(null,l)}d.displayName="MDXCreateElement"},4906:(e,t,l)=>{l.r(t),l.d(t,{assets:()=>s,contentTitle:()=>u,default:()=>k,frontMatter:()=>a,metadata:()=>i,toc:()=>c});var r=l(3117),n=(l(7294),l(3905));const a={id:"inputObjects",title:"Input objects",slug:"inputObjects",sidebar_position:8},u=void 0,i={unversionedId:"reference/api-reference/user-company/inputObjects",id:"reference/api-reference/user-company/inputObjects",title:"Input objects",description:"CompanyValidationInput",source:"@site/docs/reference/api-reference/user-company/inputObjects.md",sourceDirName:"reference/api-reference/user-company",slug:"/reference/api-reference/user-company/inputObjects",permalink:"/reference/api-reference/user-company/inputObjects",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/api-reference/user-company/inputObjects.md",tags:[],version:"current",sidebarPosition:8,frontMatter:{id:"inputObjects",title:"Input objects",slug:"inputObjects",sidebar_position:8},sidebar:"docs",previous:{title:"Enums",permalink:"/reference/api-reference/user-company/enums"},next:{title:"Scalars",permalink:"/reference/api-reference/user-company/scalars"}},s={},c=[{value:"CompanyValidationInput",id:"companyvalidationinput",level:2},{value:"DateFilter",id:"datefilter",level:2},{value:"IdFilter",id:"idfilter",level:2},{value:"NumericFilter",id:"numericfilter",level:2},{value:"StringFilter",id:"stringfilter",level:2},{value:"StringNullableListFilter",id:"stringnullablelistfilter",level:2}],o={toc:c};function k(e){let{components:t,...l}=e;return(0,n.kt)("wrapper",(0,r.Z)({},o,l,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("h2",{id:"companyvalidationinput"},"CompanyValidationInput"),(0,n.kt)("p",null,"Basic Company Infos to validate and correct"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"siret",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"SIRET de l'\xe9tablissement compos\xe9 de 14 caract\xe8res num\xe9riques"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"vatNumber",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"Num\xe9ro de TVA intra-communautaire de l'\xe9tablissement. \xc0 renseigner pour les transporteurs \xe9trangers uniquement."))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"name",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"Nom de l'\xe9tablissement"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"address",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"Adresse de l'\xe9tablissement"))))),(0,n.kt)("h2",{id:"datefilter"},"DateFilter"),(0,n.kt)("p",null,"Filtre de date"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"_gte",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#datetime"},(0,n.kt)("code",null,"DateTime"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La date de l'enregistrement est sup\xe9rieure ou \xe9gale \xe0 la date du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_gt",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#datetime"},(0,n.kt)("code",null,"DateTime"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La date de l'enregistrement est strictement sup\xe9rieure \xe0 la date du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_lte",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#datetime"},(0,n.kt)("code",null,"DateTime"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La date de l'enregistrement est inf\xe9rieure ou \xe9gale \xe0 la date du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_lt",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#datetime"},(0,n.kt)("code",null,"DateTime"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La date de l'enregistrement est strictement inf\xe9rieure \xe0 la date du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_eq",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#datetime"},(0,n.kt)("code",null,"DateTime"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La date de l'enregistrement est strictement \xe9gale \xe0 la date du filtre"))))),(0,n.kt)("h2",{id:"idfilter"},"IdFilter"),(0,n.kt)("p",null,"Filtre pour les identifiants"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"_eq",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#id"},(0,n.kt)("code",null,"ID"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"L'identifiant de l'enregistrement est exactement \xe9gale \xe0 la valeur du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_in",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#id"},(0,n.kt)("code",null,"[ID!]"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"L'identifiant de l'enregistrement fait partie de la liste du filtre"))))),(0,n.kt)("h2",{id:"numericfilter"},"NumericFilter"),(0,n.kt)("p",null,"Filtre pour les valeurs num\xe9riques"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"_gte",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#float"},(0,n.kt)("code",null,"Float"))),(0,n.kt)("td",null)),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_gt",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#float"},(0,n.kt)("code",null,"Float"))),(0,n.kt)("td",null)),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_lte",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#float"},(0,n.kt)("code",null,"Float"))),(0,n.kt)("td",null)),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_lt",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#float"},(0,n.kt)("code",null,"Float"))),(0,n.kt)("td",null)),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_eq",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#float"},(0,n.kt)("code",null,"Float"))),(0,n.kt)("td",null)))),(0,n.kt)("h2",{id:"stringfilter"},"StringFilter"),(0,n.kt)("p",null,"Filtre pour les cha\xeene de caract\xe8res"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"_eq",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La cha\xeene de caract\xe8re de l'enregistrement doit correspondre exactement \xe0 la valeur du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_in",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"[String!]"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La cha\xeene de caract\xe8re de l'enregistrement existe dans la liste du filtre"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_contains",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La cha\xeene de caract\xe8re de l'enregistrement contient la valeur du filtre"))))),(0,n.kt)("h2",{id:"stringnullablelistfilter"},"StringNullableListFilter"),(0,n.kt)("p",null,"Filtre pour les listes de cha\xeenes de caract\xe8res"),(0,n.kt)("p",{style:{marginBottom:"0.4em"}},(0,n.kt)("strong",null,"Arguments")),(0,n.kt)("table",null,(0,n.kt)("thead",null,(0,n.kt)("tr",null,(0,n.kt)("th",null,"Name"),(0,n.kt)("th",null,"Description"))),(0,n.kt)("tbody",null,(0,n.kt)("tr",null,(0,n.kt)("td",null,"_in",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"[String!]"))),(0,n.kt)("td",null,(0,n.kt)("blockquote",null,"Deprecated: use _hasSome instead"),(0,n.kt)("p",null,"Au moins une valeur existe dans la liste"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_eq",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"[String!]"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La liste correspond exactement \xe0 la liste fournie. N'est pas impl\xe9ment\xe9 dans la query ",(0,n.kt)("code",null,"bsds")))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_hasSome",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"[String!]"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"Au moins une valeur existe dans la liste"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_has",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La valeur est pr\xe9sente dans la liste"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_hasEvery",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"[String!]"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"Toutes les valeurs existes dans la liste"))),(0,n.kt)("tr",null,(0,n.kt)("td",null,"_itemContains",(0,n.kt)("br",null),(0,n.kt)("a",{href:"/reference/api-reference/user-company/scalars#string"},(0,n.kt)("code",null,"String"))),(0,n.kt)("td",null,(0,n.kt)("p",null,"La cha\xeene de caract\xe8re est contenu dans au moins un \xe9l\xe9ment de la liste. N'est impl\xe9m\xe9nt\xe9 que sur la query ",(0,n.kt)("code",null,"bsds")))))))}k.isMDXComponent=!0}}]);