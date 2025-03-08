(()=>{"use strict";var n={56:(n,e,t)=>{n.exports=function(n){var e=t.nc;e&&n.setAttribute("nonce",e)}},72:n=>{var e=[];function t(n){for(var t=-1,o=0;o<e.length;o++)if(e[o].identifier===n){t=o;break}return t}function o(n,o){for(var a={},i=[],c=0;c<n.length;c++){var s=n[c],l=o.base?s[0]+o.base:s[0],d=a[l]||0,p="".concat(l," ").concat(d);a[l]=d+1;var u=t(p),f={css:s[1],media:s[2],sourceMap:s[3],supports:s[4],layer:s[5]};if(-1!==u)e[u].references++,e[u].updater(f);else{var m=r(f,o);o.byIndex=c,e.splice(c,0,{identifier:p,updater:m,references:1})}i.push(p)}return i}function r(n,e){var t=e.domAPI(e);return t.update(n),function(e){if(e){if(e.css===n.css&&e.media===n.media&&e.sourceMap===n.sourceMap&&e.supports===n.supports&&e.layer===n.layer)return;t.update(n=e)}else t.remove()}}n.exports=function(n,r){var a=o(n=n||[],r=r||{});return function(n){n=n||[];for(var i=0;i<a.length;i++){var c=t(a[i]);e[c].references--}for(var s=o(n,r),l=0;l<a.length;l++){var d=t(a[l]);0===e[d].references&&(e[d].updater(),e.splice(d,1))}a=s}}},113:n=>{n.exports=function(n,e){if(e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}},314:n=>{n.exports=function(n){var e=[];return e.toString=function(){return this.map((function(e){var t="",o=void 0!==e[5];return e[4]&&(t+="@supports (".concat(e[4],") {")),e[2]&&(t+="@media ".concat(e[2]," {")),o&&(t+="@layer".concat(e[5].length>0?" ".concat(e[5]):""," {")),t+=n(e),o&&(t+="}"),e[2]&&(t+="}"),e[4]&&(t+="}"),t})).join("")},e.i=function(n,t,o,r,a){"string"==typeof n&&(n=[[null,n,void 0]]);var i={};if(o)for(var c=0;c<this.length;c++){var s=this[c][0];null!=s&&(i[s]=!0)}for(var l=0;l<n.length;l++){var d=[].concat(n[l]);o&&i[d[0]]||(void 0!==a&&(void 0===d[5]||(d[1]="@layer".concat(d[5].length>0?" ".concat(d[5]):""," {").concat(d[1],"}")),d[5]=a),t&&(d[2]?(d[1]="@media ".concat(d[2]," {").concat(d[1],"}"),d[2]=t):d[2]=t),r&&(d[4]?(d[1]="@supports (".concat(d[4],") {").concat(d[1],"}"),d[4]=r):d[4]="".concat(r)),e.push(d))}},e}},365:(n,e,t)=>{t.d(e,{A:()=>c});var o=t(601),r=t.n(o),a=t(314),i=t.n(a)()(r());i.push([n.id,"/* Reset & Base Styles */\n* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n  font-size: 12px;\n  color: #333;\n  background-color: #f5f5f5;\n  line-height: 1.5;\n  padding: 20px;\n}\n\n/* Container */\n.container {\n  max-width: 100%;\n  margin: 0 auto;\n  background-color: white;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n  padding: 16px;\n}\n\n/* Typography */\nh2 {\n  margin-bottom: 16px;\n  font-size: 16px;\n  font-weight: 600;\n  color: #333;\n}\n\nh3 {\n  font-size: 14px;\n  margin-bottom: 12px;\n  color: #333;\n}\n\nh4 {\n  font-size: 12px;\n  margin-bottom: 8px;\n  color: #555;\n}\n\np {\n  margin-bottom: 16px;\n  color: #666;\n}\n\n/* Sections */\n.section {\n  margin-bottom: 24px;\n}\n\n.options {\n  margin-bottom: 20px;\n}\n\n/* Form Elements */\n.checkbox-list, .radio-group {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin-bottom: 16px;\n}\n\n.checkbox-item, .radio-group label {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n}\n\ninput[type=\"checkbox\"], input[type=\"radio\"] {\n  cursor: pointer;\n}\n\n/* Buttons */\nbutton {\n  cursor: pointer;\n  border: none;\n  border-radius: 4px;\n  padding: 8px 16px;\n  font-size: 12px;\n  transition: background-color 0.2s;\n}\n\n.primary-button {\n  background-color: #18a0fb;\n  color: white;\n  font-weight: 500;\n}\n\n.primary-button:hover {\n  background-color: #0d8ce0;\n}\n\n.primary-button:disabled {\n  background-color: #cccccc;\n  cursor: not-allowed;\n}\n\n.small-button {\n  padding: 4px 8px;\n  font-size: 11px;\n  background-color: #f0f0f0;\n  color: #333;\n}\n\n.small-button:hover {\n  background-color: #e0e0e0;\n}\n\n/* Actions */\n.actions {\n  display: flex;\n  gap: 12px;\n  margin-top: 20px;\n}\n\n/* Preview Section */\n.preview-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 8px;\n}\n\n.preview-container {\n  max-height: 200px;\n  overflow-y: auto;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  background-color: #f9f9f9;\n  padding: 8px;\n  margin-bottom: 16px;\n  transition: max-height 0.3s;\n}\n\n.preview-container.collapsed {\n  max-height: 0;\n  overflow: hidden;\n  border: none;\n  padding: 0;\n  margin-bottom: 8px;\n}\n\n.preview-content {\n  font-family: monospace;\n  font-size: 11px;\n  white-space: pre-wrap;\n  word-break: break-all;\n}\n\n/* Status Messages */\n.status {\n  padding: 8px 12px;\n  border-radius: 4px;\n  margin-top: 16px;\n  font-size: 12px;\n}\n\n.info {\n  background-color: #e8f4fd;\n  color: #0366d6;\n}\n\n.success {\n  background-color: #e6ffed;\n  color: #22863a;\n}\n\n.error {\n  background-color: #ffeef0;\n  color: #d73a49;\n}\n\n.loading {\n  color: #666;\n  font-style: italic;\n}",""]);const c=i},540:n=>{n.exports=function(n){var e=document.createElement("style");return n.setAttributes(e,n.attributes),n.insert(e,n.options),e}},601:n=>{n.exports=function(n){return n[1]}},659:n=>{var e={};n.exports=function(n,t){var o=function(n){if(void 0===e[n]){var t=document.querySelector(n);if(window.HTMLIFrameElement&&t instanceof window.HTMLIFrameElement)try{t=t.contentDocument.head}catch(n){t=null}e[n]=t}return e[n]}(n);if(!o)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");o.appendChild(t)}},825:n=>{n.exports=function(n){if("undefined"==typeof document)return{update:function(){},remove:function(){}};var e=n.insertStyleElement(n);return{update:function(t){!function(n,e,t){var o="";t.supports&&(o+="@supports (".concat(t.supports,") {")),t.media&&(o+="@media ".concat(t.media," {"));var r=void 0!==t.layer;r&&(o+="@layer".concat(t.layer.length>0?" ".concat(t.layer):""," {")),o+=t.css,r&&(o+="}"),t.media&&(o+="}"),t.supports&&(o+="}");var a=t.sourceMap;a&&"undefined"!=typeof btoa&&(o+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(a))))," */")),e.styleTagTransform(o,n,e.options)}(e,n,t)},remove:function(){!function(n){if(null===n.parentNode)return!1;n.parentNode.removeChild(n)}(e)}}}}},e={};function t(o){var r=e[o];if(void 0!==r)return r.exports;var a=e[o]={id:o,exports:{}};return n[o](a,a.exports,t),a.exports}t.n=n=>{var e=n&&n.__esModule?()=>n.default:()=>n;return t.d(e,{a:e}),e},t.d=(n,e)=>{for(var o in e)t.o(e,o)&&!t.o(n,o)&&Object.defineProperty(n,o,{enumerable:!0,get:e[o]})},t.o=(n,e)=>Object.prototype.hasOwnProperty.call(n,e),t.nc=void 0;var o=t(72),r=t.n(o),a=t(825),i=t.n(a),c=t(659),s=t.n(c),l=t(56),d=t.n(l),p=t(540),u=t.n(p),f=t(113),m=t.n(f),g=t(365),b={};b.styleTagTransform=m(),b.setAttributes=d(),b.insert=s().bind(null,"head"),b.domAPI=i(),b.insertStyleElement=u(),r()(g.A,b),g.A&&g.A.locals&&g.A.locals;let x=null,v=[];function h(n,e){if(0===e.length)return n;const t={};for(const o of e)n[o]&&(t[o]=n[o]);return t}function y(){const n=document.getElementById("download-button"),e=document.getElementById("preview-content"),t=document.getElementById("status");if(x){const r=h(x,v);e.textContent=(o=r,JSON.stringify(o,null,2)),n.disabled=0===Object.keys(r).length,t.textContent=`Tokens extracted: ${Object.keys(x).length} collections found`,t.className="status success"}else e.textContent="// No tokens extracted yet",n.disabled=!0;var o}document.addEventListener("DOMContentLoaded",(()=>{console.log("UI DOM loaded");const n=document.getElementById("extract-button"),e=document.getElementById("download-button"),t=document.getElementById("status"),o=document.getElementById("toggle-preview"),r=document.getElementById("preview-container"),a=document.getElementById("collection-list");t.textContent="Waiting for plugin to initialize...",t.className="status info",o.addEventListener("click",(()=>{r.classList.toggle("collapsed")})),n.addEventListener("click",(()=>{t.textContent="Extracting tokens...",t.className="status info",a.innerHTML='<div class="loading">Scanning collections...</div>',console.log("Extract button clicked, sending message to plugin"),parent.postMessage({pluginMessage:{type:"extract-tokens"}},"*")})),e.addEventListener("click",(()=>{x&&(!function(n){const e=JSON.stringify(n,null,2),t=new Blob([e],{type:"application/json"}),o=URL.createObjectURL(t),r=document.createElement("a");r.href=o,r.download="design-tokens.json",r.click(),URL.revokeObjectURL(o)}(h(x,v)),t.textContent="Tokens downloaded successfully!",t.className="status success")})),window.onmessage=n=>{console.log("Message received from plugin:",n.data);const e=n.data.pluginMessage;e?"tokens-data"===e.type?(console.log("Received tokens data"),x=e.data,function(){const n=document.getElementById("collection-list");x&&0!==Object.keys(x).length?(n.innerHTML="",Object.keys(x).forEach((e=>{const t=document.createElement("div");t.className="checkbox-item";const o=document.createElement("input");o.type="checkbox",o.id=`collection-${e}`,o.value=e,o.checked=!0,o.addEventListener("change",(()=>{o.checked?v.includes(e)||v.push(e):v=v.filter((n=>n!==e)),y()})),v.includes(e)||v.push(e);const r=document.createElement("label");r.htmlFor=`collection-${e}`,void 0!==x[e].variableCount?r.textContent=`${e} (${x[e].variableCount} variables)`:r.textContent=e,t.appendChild(o),t.appendChild(r),n.appendChild(t)}))):n.innerHTML="<div>No collections found</div>"}(),y()):"error"===e.type&&(console.error("Received error from plugin:",e.message),t.textContent=e.message,t.className="status error",a.innerHTML="<div>Error loading collections</div>"):console.log("Message doesn't contain pluginMessage")},console.log("UI initialization complete")}))})();