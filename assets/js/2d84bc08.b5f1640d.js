"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[6167],{2577:function(e,t,n){var r=n(7294),a=n(7273);a.Z.initialize({startOnLoad:!0});t.Z=e=>{let{chart:t}=e;return(0,r.useEffect)((()=>{a.Z.contentLoaded()}),[]),r.createElement("div",{className:"mermaid"},t)}},6003:function(e,t,n){n.d(t,{Z:function(){return c}});var r=n(7294),a=n(8084),o=n(814),i=n(2577),s=n(1446);const l=e=>e.split("\n").map((e=>r.createElement(r.Fragment,null,e,r.createElement("br",null))));function c(e){let{path:t}=e;const{workflows:n}=(0,a.eZ)("workflow-doc-plugin"),c=(0,s.D)(t,n);return r.createElement("div",null,c.description&&r.createElement("div",null,l(c.description)),c.chart&&r.createElement(i.Z,{chart:c.chart}),r.createElement("hr",null),c.steps.map(((e,t)=>r.createElement("div",{key:t},r.createElement("div",{className:"margin-bottom--sm"},l(e.description)),r.createElement("div",{className:"margin-bottom--lg"},r.createElement(o.Z,{className:"graphql"},e.mutation),r.createElement(o.Z,{className:"json"},e.variables))))))}},1446:function(e,t,n){function r(e,t,n){return void 0===n&&(n="."),e.split(n).reduce(((e,t)=>e&&e[t]),t)}n.d(t,{D:function(){return r}})},8727:function(e,t,n){n.r(t),n.d(t,{assets:function(){return c},contentTitle:function(){return s},default:function(){return m},frontMatter:function(){return i},metadata:function(){return l},toc:function(){return u}});var r=n(3117),a=(n(7294),n(3905)),o=n(6003);const i={title:"Groupement de d\xe9chets amiante"},s=void 0,l={unversionedId:"tutoriels/examples/bsda/groupement",id:"tutoriels/examples/bsda/groupement",title:"Groupement de d\xe9chets amiante",description:"",source:"@site/docs/tutoriels/examples/bsda/groupement.mdx",sourceDirName:"tutoriels/examples/bsda",slug:"/tutoriels/examples/bsda/groupement",permalink:"/tutoriels/examples/bsda/groupement",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/examples/bsda/groupement.mdx",tags:[],version:"current",frontMatter:{title:"Groupement de d\xe9chets amiante"},sidebar:"docs",previous:{title:"Collecte d'amiante sur un chantier d'un particulier",permalink:"/tutoriels/examples/bsda/collecte-chantier-particulier"},next:{title:"Utiliser le playground",permalink:"/guides/playground"}},c={},u=[],d={toc:u};function m(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)(o.Z,{path:"bsda.groupement",mdxType:"Workflow"}))}m.isMDXComponent=!0}}]);