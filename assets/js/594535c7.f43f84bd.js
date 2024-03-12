"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[2970],{1347:(e,n,r)=>{r.d(n,{A:()=>l});r(6540);var t=r(8215);const a={tabItem:"tabItem_Ymn6"};var u=r(4848);function l(e){var n=e.children,r=e.hidden,l=e.className;return(0,u.jsx)("div",{role:"tabpanel",className:(0,t.A)(a.tabItem,l),hidden:r,children:n})}},3384:(e,n,r)=>{r.d(n,{A:()=>w});var t=r(6540),a=r(8215),u=r(5236),l=r(6347),s=r(8385),o=r(5793),i=r(7422),d=r(1038);function c(e){var n,r;return null!=(n=null==(r=t.Children.toArray(e).filter((function(e){return"\n"!==e})).map((function(e){if(!e||(0,t.isValidElement)(e)&&((n=e.props)&&"object"==typeof n&&"value"in n))return e;var n;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:r.filter(Boolean))?n:[]}function f(e){var n=e.values,r=e.children;return(0,t.useMemo)((function(){var e=null!=n?n:function(e){return c(e).map((function(e){var n=e.props;return{value:n.value,label:n.label,attributes:n.attributes,default:n.default}}))}(r);return function(e){var n=(0,i.X)(e,(function(e,n){return e.value===n.value}));if(n.length>0)throw new Error('Docusaurus error: Duplicate values "'+n.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[n,r])}function p(e){var n=e.value;return e.tabValues.some((function(e){return e.value===n}))}function x(e){var n=e.queryString,r=void 0!==n&&n,a=e.groupId,u=(0,l.W6)(),s=function(e){var n=e.queryString,r=void 0!==n&&n,t=e.groupId;if("string"==typeof r)return r;if(!1===r)return null;if(!0===r&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=t?t:null}({queryString:r,groupId:a});return[(0,o.aZ)(s),(0,t.useCallback)((function(e){if(s){var n=new URLSearchParams(u.location.search);n.set(s,e),u.replace(Object.assign({},u.location,{search:n.toString()}))}}),[s,u])]}function b(e){var n,r,a,u,l=e.defaultValue,o=e.queryString,i=void 0!==o&&o,c=e.groupId,b=f(e),h=(0,t.useState)((function(){return function(e){var n,r=e.defaultValue,t=e.tabValues;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(r){if(!p({value:r,tabValues:t}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+r+'" but none of its children has the corresponding value. Available values are: '+t.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return r}var a=null!=(n=t.find((function(e){return e.default})))?n:t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:l,tabValues:b})})),v=h[0],m=h[1],g=x({queryString:i,groupId:c}),j=g[0],k=g[1],w=(n=function(e){return e?"docusaurus.tab."+e:null}({groupId:c}.groupId),r=(0,d.Dv)(n),a=r[0],u=r[1],[a,(0,t.useCallback)((function(e){n&&u.set(e)}),[n,u])]),y=w[0],A=w[1],I=function(){var e=null!=j?j:y;return p({value:e,tabValues:b})?e:null}();return(0,s.A)((function(){I&&m(I)}),[I]),{selectedValue:v,selectValue:(0,t.useCallback)((function(e){if(!p({value:e,tabValues:b}))throw new Error("Can't select invalid tab value="+e);m(e),k(e),A(e)}),[k,A,b]),tabValues:b}}var h=r(195);const v={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var m=r(4848);function g(e){var n=e.className,r=e.block,t=e.selectedValue,l=e.selectValue,s=e.tabValues,o=[],i=(0,u.a_)().blockElementScrollPositionUntilNextRender,d=function(e){var n=e.currentTarget,r=o.indexOf(n),a=s[r].value;a!==t&&(i(n),l(a))},c=function(e){var n,r=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":var t,a=o.indexOf(e.currentTarget)+1;r=null!=(t=o[a])?t:o[0];break;case"ArrowLeft":var u,l=o.indexOf(e.currentTarget)-1;r=null!=(u=o[l])?u:o[o.length-1]}null==(n=r)||n.focus()};return(0,m.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":r},n),children:s.map((function(e){var n=e.value,r=e.label,u=e.attributes;return(0,m.jsx)("li",Object.assign({role:"tab",tabIndex:t===n?0:-1,"aria-selected":t===n,ref:function(e){return o.push(e)},onKeyDown:c,onClick:d},u,{className:(0,a.A)("tabs__item",v.tabItem,null==u?void 0:u.className,{"tabs__item--active":t===n}),children:null!=r?r:n}),n)}))})}function j(e){var n=e.lazy,r=e.children,a=e.selectedValue,u=(Array.isArray(r)?r:[r]).filter(Boolean);if(n){var l=u.find((function(e){return e.props.value===a}));return l?(0,t.cloneElement)(l,{className:"margin-top--md"}):null}return(0,m.jsx)("div",{className:"margin-top--md",children:u.map((function(e,n){return(0,t.cloneElement)(e,{key:n,hidden:e.props.value!==a})}))})}function k(e){var n=b(e);return(0,m.jsxs)("div",{className:(0,a.A)("tabs-container",v.tabList),children:[(0,m.jsx)(g,Object.assign({},e,n)),(0,m.jsx)(j,Object.assign({},e,n))]})}function w(e){var n=(0,h.A)();return(0,m.jsx)(k,Object.assign({},e,{children:c(e.children)}),String(n))}},6119:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>f,contentTitle:()=>d,default:()=>b,frontMatter:()=>i,metadata:()=>c,toc:()=>p});var t=r(4848),a=r(8453),u=(r(6540),r(3384)),l=r(1347),s=r(7945);const o=function(){return(0,t.jsxs)(u.A,{defaultValue:"bsdd",values:[{label:"D\xe9chets dangereux",value:"bsdd"},{label:"DASRI",value:"bsdasri"},{label:"VHU",value:"bsvhu"},{label:"Amiante",value:"bsda"},{label:"Fluides Frigo",value:"bsff"}],children:[(0,t.jsxs)(l.A,{value:"bsdd",children:[(0,t.jsx)(s.A,{className:"graphql",children:'query {\n  formPdf(id: "BSD_ID") {\n    downloadLink\n  }\n}\n'}),(0,t.jsx)(s.A,{className:"json",children:'{\n  "data": {\n    "formPdf": {\n      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"\n    }\n  }\n}'})]}),(0,t.jsxs)(l.A,{value:"bsdasri",children:[(0,t.jsx)(s.A,{className:"graphql",children:'query {\n  bsdasriPd(id: "BSD_ID") {\n    downloadLink\n  }\n}\n'}),(0,t.jsx)(s.A,{className:"json",children:'{\n  "data": {\n    "bsdasriPdf": {\n      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"\n    }\n  }\n}'})]}),(0,t.jsxs)(l.A,{value:"bsvhu",children:[(0,t.jsx)(s.A,{className:"graphql",children:'query {\n  bsvhuPdf(id: "BSD_ID") {\n    downloadLink\n  }\n}\n'}),(0,t.jsx)(s.A,{className:"json",children:'{\n  "data": {\n    "bsvhuPdf": {\n      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"\n    }\n  }\n}'})]}),(0,t.jsxs)(l.A,{value:"bsda",children:[(0,t.jsx)(s.A,{className:"graphql",children:'query {\n  bsdaPdf(id: "BSD_ID") {\n    downloadLink\n  }\n}\n'}),(0,t.jsx)(s.A,{className:"json",children:'{\n  "data": {\n    "bsdaPdf": {\n      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"\n    }\n  }\n}'})]}),(0,t.jsxs)(l.A,{value:"bsff",children:[(0,t.jsx)(s.A,{className:"graphql",children:'query {\n  bsffPdf(id: "BSD_ID") {\n    downloadLink\n  }\n}\n'}),(0,t.jsx)(s.A,{className:"json",children:'{\n  "data": {\n    "bsffPdf": {\n      "downloadLink": "https://api.trackdechets.beta.gouv.fr/download?token=form_pdf-xxxxxxxxx-xxxx"\n    }\n  }\n}'})]})]})},i={title:"Exporter un bordereau en pdf"},d=void 0,c={id:"guides/pdf",title:"Exporter un bordereau en pdf",description:"Il est possible \xe0 tout moment d'obtenir une version pdf d'un BSD (\xe0 l'exception d'un BSD \xe0 l'\xe9tat brouillon). L'obtention du pdf se fait en deux temps. Il faut d'abord r\xe9cup\xe9rer un lien de t\xe9l\xe9chargement gr\xe2ce \xe0 une mutation graphQL en passant en argument l'identifiant du BSD, puis utiliser ce lien pour t\xe9l\xe9charger le fichier",source:"@site/docs/guides/pdf.mdx",sourceDirName:"guides",slug:"/guides/pdf",permalink:"/guides/pdf",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/guides/pdf.mdx",tags:[],version:"current",frontMatter:{title:"Exporter un bordereau en pdf"},sidebar:"docs",previous:{title:"Faire une requ\xeate GraphQL dans le langage de son choix",permalink:"/guides/language"},next:{title:"Exporter un registre",permalink:"/guides/registre"}},f={},p=[];function x(e){const n={admonition:"admonition",p:"p",...(0,a.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:"Il est possible \xe0 tout moment d'obtenir une version pdf d'un BSD (\xe0 l'exception d'un BSD \xe0 l'\xe9tat brouillon). L'obtention du pdf se fait en deux temps. Il faut d'abord r\xe9cup\xe9rer un lien de t\xe9l\xe9chargement gr\xe2ce \xe0 une mutation graphQL en passant en argument l'identifiant du BSD, puis utiliser ce lien pour t\xe9l\xe9charger le fichier"}),"\n",(0,t.jsx)(o,{}),"\n",(0,t.jsx)(n.admonition,{type:"warning",children:(0,t.jsx)(n.p,{children:"L'URL a une dur\xe9e de validit\xe9 de 10 secondes."})})]})}function b(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(x,{...e})}):x(e)}},8453:(e,n,r)=>{r.d(n,{R:()=>l,x:()=>s});var t=r(6540);const a={},u=t.createContext(a);function l(e){const n=t.useContext(u);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:l(e.components),t.createElement(u.Provider,{value:n},e.children)}}}]);