"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[3213],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return f}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function a(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var i=r.createContext({}),u=function(e){var t=r.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},p=function(e){var t=u(e.components);return r.createElement(i.Provider,{value:t},e.children)},l={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,c=e.originalType,i=e.parentName,p=a(e,["components","mdxType","originalType","parentName"]),d=u(n),f=o,m=d["".concat(i,".").concat(f)]||d[f]||l[f]||c;return n?r.createElement(m,s(s({ref:t},p),{},{components:n})):r.createElement(m,s({ref:t},p))}));function f(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var c=n.length,s=new Array(c);s[0]=d;var a={};for(var i in t)hasOwnProperty.call(t,i)&&(a[i]=t[i]);a.originalType=e,a.mdxType="string"==typeof e?e:o,s[1]=a;for(var u=2;u<c;u++)s[u]=n[u];return r.createElement.apply(null,s)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},8630:function(e,t,n){n.r(t),n.d(t,{assets:function(){return i},contentTitle:function(){return s},default:function(){return l},frontMatter:function(){return c},metadata:function(){return a},toc:function(){return u}});var r=n(3117),o=(n(7294),n(3905));const c={title:"Obtenir un jeton d'acc\xe8s personnel"},s=void 0,a={unversionedId:"tutoriels/quickstart/access-token",id:"tutoriels/quickstart/access-token",title:"Obtenir un jeton d'acc\xe8s personnel",description:"Une fois votre compte cr\xe9e et votre premier \xe9tablissement rattach\xe9 en sandbox rendez-vous dans Mon Compte > Int\xe9gration API > Jeton d'acc\xe8s API puis G\xe9n\xe9rer un nouveau jeton d'acc\xe8s",source:"@site/docs/tutoriels/quickstart/access-token.md",sourceDirName:"tutoriels/quickstart",slug:"/tutoriels/quickstart/access-token",permalink:"/tutoriels/quickstart/access-token",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/quickstart/access-token.md",tags:[],version:"current",frontMatter:{title:"Obtenir un jeton d'acc\xe8s personnel"},sidebar:"docs",previous:{title:"Cr\xe9er un compte",permalink:"/tutoriels/quickstart/create-account"},next:{title:"Effectuer votre premi\xe8re requ\xeate",permalink:"/tutoriels/quickstart/first-query"}},i={},u=[],p={toc:u};function l(e){let{components:t,...c}=e;return(0,o.kt)("wrapper",(0,r.Z)({},p,c,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"Une fois votre compte cr\xe9e et votre premier \xe9tablissement rattach\xe9 en ",(0,o.kt)("em",{parentName:"p"},"sandbox")," rendez-vous dans ",(0,o.kt)("em",{parentName:"p"},"Mon Compte")," > ",(0,o.kt)("em",{parentName:"p"},"Int\xe9gration API")," > ",(0,o.kt)("em",{parentName:"p"},"Jeton d'acc\xe8s API")," puis ",(0,o.kt)("em",{parentName:"p"},"G\xe9n\xe9rer un nouveau jeton d'acc\xe8s")),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"access-token-generate.png",src:n(9396).Z,width:"1905",height:"890"})),(0,o.kt)("hr",null),(0,o.kt)("p",null,"Pensez \xe0 donner une description \xe0 votre jeton d'acc\xe8s pour vous souvenir de son utilit\xe9."),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"access-token-description.png",src:n(142).Z,width:"1912",height:"896"})),(0,o.kt)("hr",null),(0,o.kt)("p",null,"Une fois le jeton d'acc\xe8s g\xe9n\xe9r\xe9, pensez \xe0 le copier quelque part, vous ne serez plus en mesure de le consulter ult\xe9rieurement."),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"access-token-copy.png",src:n(2689).Z,width:"1902",height:"893"})),(0,o.kt)("hr",null),(0,o.kt)("p",null,"Vous pouvez r\xe9voquer vos tokens \xe0 tout moment depuis le m\xeame espace."),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"access-token-list.png",src:n(1162).Z,width:"1902",height:"894"})))}l.isMDXComponent=!0},2689:function(e,t,n){t.Z=n.p+"assets/images/access-token-copy-9edb013adb1161a0ff9c22731dc799b5.png"},142:function(e,t,n){t.Z=n.p+"assets/images/access-token-description-a7ffa222d522cdbca32b5a0dfd5ecb99.png"},9396:function(e,t,n){t.Z=n.p+"assets/images/access-token-generate-296ae458572894c4198492083a4b00f8.png"},1162:function(e,t,n){t.Z=n.p+"assets/images/access-token-list-694826099d3ce69d7b022a856b194550.png"}}]);