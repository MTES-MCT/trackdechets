(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[4518],{62577:function(e,t,r){"use strict";var n=r(67294),i=r(21140),a=r.n(i);a().initialize({startOnLoad:!0});t.Z=function(e){var t=e.chart;return(0,n.useEffect)((function(){a().contentLoaded()}),[]),n.createElement("div",{className:"mermaid"},t)}},26003:function(e,t,r){"use strict";r.d(t,{Z:function(){return u}});var n=r(67294),i=r(28084),a=r(31736),c=r(62577),l=r(71446),o=function(e){return e.split("\n").map((function(e){return n.createElement(n.Fragment,null,e,n.createElement("br",null))}))};function u(e){var t=e.path,r=(0,i.usePluginData)("workflow-doc-plugin").workflows,u=(0,l.D)(t,r);return n.createElement("div",null,u.description&&n.createElement("div",null,o(u.description)),u.chart&&n.createElement(c.Z,{chart:u.chart}),n.createElement("hr",null),u.steps.map((function(e,t){return n.createElement("div",{key:t},n.createElement("div",{className:"margin-bottom--sm"},o(e.description)),n.createElement("div",{className:"margin-bottom--lg"},n.createElement(a.Z,{className:"graphql"},e.mutation),n.createElement(a.Z,{className:"json"},e.variables)))})))}},71446:function(e,t,r){"use strict";function n(e,t,r){return void 0===r&&(r="."),e.split(r).reduce((function(e,t){return e&&e[t]}),t)}r.d(t,{D:function(){return n}})},57778:function(e,t,r){"use strict";r.r(t),r.d(t,{assets:function(){return d},contentTitle:function(){return u},default:function(){return f},frontMatter:function(){return o},metadata:function(){return s},toc:function(){return m}});var n=r(87462),i=r(63366),a=(r(67294),r(3905)),c=r(26003),l=["components"],o={title:"Collecte d'amiante sur un chantier d'un particulier"},u=void 0,s={unversionedId:"tutoriels/examples/bsda/collecte-chantier-particulier",id:"tutoriels/examples/bsda/collecte-chantier-particulier",title:"Collecte d'amiante sur un chantier d'un particulier",description:"",source:"@site/docs/tutoriels/examples/bsda/collecte-chantier-particulier.mdx",sourceDirName:"tutoriels/examples/bsda",slug:"/tutoriels/examples/bsda/collecte-chantier-particulier",permalink:"/tutoriels/examples/bsda/collecte-chantier-particulier",editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/examples/bsda/collecte-chantier-particulier.mdx",tags:[],version:"current",frontMatter:{title:"Collecte d'amiante sur un chantier d'un particulier"},sidebar:"docs",previous:{title:"Collecte d'amiante sur un chantier",permalink:"/tutoriels/examples/bsda/collecte-chantier"},next:{title:"Groupement de d\xe9chets amiante",permalink:"/tutoriels/examples/bsda/groupement"}},d={},m=[],p={toc:m};function f(e){var t=e.components,r=(0,i.Z)(e,l);return(0,a.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)(c.Z,{path:"bsda.collecteChantierParticulier",mdxType:"Workflow"}))}f.isMDXComponent=!0},11748:function(e,t,r){var n={"./locale":89234,"./locale.js":89234};function i(e){var t=a(e);return r(t)}function a(e){if(!r.o(n,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return n[e]}i.keys=function(){return Object.keys(n)},i.resolve=a,e.exports=i,i.id=11748}}]);