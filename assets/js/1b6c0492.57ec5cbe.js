(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[2099],{62577:function(e,t,n){"use strict";var r=n(67294),i=n(21140),a=n.n(i);a().initialize({startOnLoad:!0});t.Z=function(e){var t=e.chart;return(0,r.useEffect)((function(){a().contentLoaded()}),[]),r.createElement("div",{className:"mermaid"},t)}},26003:function(e,t,n){"use strict";n.d(t,{Z:function(){return u}});var r=n(67294),i=n(28084),a=n(31736),s=n(62577),o=n(71446),c=function(e){return e.split("\n").map((function(e){return r.createElement(r.Fragment,null,e,r.createElement("br",null))}))};function u(e){var t=e.path,n=(0,i.usePluginData)("workflow-doc-plugin").workflows,u=(0,o.D)(t,n);return r.createElement("div",null,u.description&&r.createElement("div",null,c(u.description)),u.chart&&r.createElement(s.Z,{chart:u.chart}),r.createElement("hr",null),u.steps.map((function(e,t){return r.createElement("div",{key:t},r.createElement("div",{className:"margin-bottom--sm"},c(e.description)),r.createElement("div",{className:"margin-bottom--lg"},r.createElement(a.Z,{className:"graphql"},e.mutation),r.createElement(a.Z,{className:"json"},e.variables)))})))}},71446:function(e,t,n){"use strict";function r(e,t,n){return void 0===n&&(n="."),e.split(n).reduce((function(e,t){return e&&e[t]}),t)}n.d(t,{D:function(){return r}})},41145:function(e,t,n){"use strict";n.r(t),n.d(t,{assets:function(){return m},contentTitle:function(){return u},default:function(){return f},frontMatter:function(){return c},metadata:function(){return l},toc:function(){return d}});var r=n(87462),i=n(63366),a=(n(67294),n(3905)),s=n(26003),o=["components"],c={title:"Acheminement direct \xe0 l'installation de traitement, d\xe9tenteur \xe9co-organisme"},u=void 0,l={unversionedId:"tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme",id:"tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme",title:"Acheminement direct \xe0 l'installation de traitement, d\xe9tenteur \xe9co-organisme",description:"",source:"@site/docs/tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme.mdx",sourceDirName:"tutoriels/examples/bsdasri",slug:"/tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme",permalink:"/tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme",editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme.mdx",tags:[],version:"current",frontMatter:{title:"Acheminement direct \xe0 l'installation de traitement, d\xe9tenteur \xe9co-organisme"},sidebar:"docs",previous:{title:"Emport direct d'un dasri sans signature producteur",permalink:"/tutoriels/examples/bsdasri/emport-direct"},next:{title:"Acheminement direct du PRED \xe0 l'installation de traitement, signature par code secret producteur",permalink:"/tutoriels/examples/bsdasri/signature-code-secret"}},m={},d=[],p={toc:d};function f(e){var t=e.components,n=(0,i.Z)(e,o);return(0,a.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)(s.Z,{path:"bsdasri.ecoOrganisme",mdxType:"Workflow"}))}f.isMDXComponent=!0},11748:function(e,t,n){var r={"./locale":89234,"./locale.js":89234};function i(e){var t=a(e);return n(t)}function a(e){if(!n.o(r,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return r[e]}i.keys=function(){return Object.keys(r)},i.resolve=a,e.exports=i,i.id=11748}}]);