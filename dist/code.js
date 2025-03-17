(()=>{"use strict";function e(e){const t=Math.round(255*e.r).toString(16).padStart(2,"0"),r=Math.round(255*e.g).toString(16).padStart(2,"0"),o=Math.round(255*e.b).toString(16).padStart(2,"0");return"a"in e&&void 0!==e.a&&1!==e.a?`#${t}${r}${o}${Math.round(255*e.a).toString(16).padStart(2,"0")}`:`#${t}${r}${o}`}function t(e,t){switch(e){case"COLOR":return"color";case"FLOAT":return"number"==typeof t?"number":"string"==typeof t&&(t.endsWith("px")||t.endsWith("rem")||t.endsWith("em")||t.endsWith("%"))?"dimension":"number";case"STRING":return"string";case"BOOLEAN":return"boolean";default:return"number"==typeof t?"number":"string"==typeof t?t.startsWith("#")||t.startsWith("rgb")?"color":t.match(/\d+(\.\d+)?(px|rem|em|%)/)?"dimension":t.startsWith("{")&&t.endsWith("}")?"reference":"string":"boolean"==typeof t?"boolean":"string"}}function r(e,t,r=""){const o={$value:e,$type:t};return r&&(o.$description=r),o}function o({r:e,g:t,b:r,a:o=1}){const n=Math.round(255*e),s=Math.round(255*t),a=Math.round(255*r);return void 0!==o&&o<1?`rgba(${n}, ${s}, ${a}, ${o.toFixed(2)})`:`rgb(${n}, ${s}, ${a})`}function n({r:e,g:t,b:r,a:o=1}){var n;const s=function({r:e,g:t,b:r,a:o=1}){const n=Math.max(e,t,r),s=Math.min(e,t,r),a=n-s;let i=0,c=0,l=(n+s)/2;if(0!==a)switch(c=l>.5?a/(2-n-s):a/(n+s),n){case e:i=60*((t-r)/a+(t<r?6:0));break;case t:i=60*((r-e)/a+2);break;case r:i=60*((e-t)/a+4)}return{h:i,s:100*c,l:100*l,a:o}}({r:e,g:t,b:r,a:o});return void 0!==o&&o<1?`hsla(${Math.round(s.h)}deg, ${Math.round(s.s)}%, ${Math.round(s.l)}%, ${null===(n=s.a)||void 0===n?void 0:n.toFixed(2)})`:`hsl(${Math.round(s.h)}deg, ${Math.round(s.s)}%, ${Math.round(s.l)}%)`}function s(e,t,r=new Set){if(!e||"string"!=typeof e)return{value:e,type:"unknown",isResolved:!1};if(!e.startsWith("{")||!e.endsWith("}"))return{value:e,type:"unknown",isResolved:!1};const o=e.substring(1,e.length-1);if(r.has(o))return console.warn(`Circular reference detected: ${o}`),{value:e,type:"reference",originalReference:e,isResolved:!1};if(r.add(o),t[o]){const n=t[o];if("string"==typeof n.value&&n.value.startsWith("{")&&n.value.endsWith("}")){const a=s(n.value,t,r);return Object.assign(Object.assign({},a),{originalReference:e,originalPath:n.originalPath,resolvedFrom:o})}return{value:n.value,type:n.type,originalReference:e,originalPath:n.originalPath,isResolved:!0,resolvedFrom:o}}const n=o.includes("/")?o.replace(/\//g,"."):o.replace(/\./g,"/");if(t[n]){const o=t[n];if("string"==typeof o.value&&o.value.startsWith("{")&&o.value.endsWith("}")){const a=s(o.value,t,r);return Object.assign(Object.assign({},a),{originalReference:e,originalPath:o.originalPath,resolvedFrom:n})}return{value:o.value,type:o.type,originalReference:e,originalPath:o.originalPath,isResolved:!0,resolvedFrom:n}}const a=o.split(/[\/\.]/).pop()||"";if(a!==o&&t[a]){const o=t[a];if("string"==typeof o.value&&o.value.startsWith("{")&&o.value.endsWith("}")){const n=s(o.value,t,r);return Object.assign(Object.assign({},n),{originalReference:e,originalPath:o.originalPath,resolvedFrom:a})}return{value:o.value,type:o.type,originalReference:e,originalPath:o.originalPath,isResolved:!0,resolvedFrom:a}}const i=function(e,t){const r=Object.keys(t);let o=null,n=0;const s=e.toLowerCase();for(const e of r){const t=e.toLowerCase();if(t.endsWith(s)){const r=s.length/t.length;r>n&&(o=e,n=r)}else{const r=s.split(/[\/\.]/),a=t.split(/[\/\.]/);if(r[r.length-1]===a[a.length-1]){const t=.5;t>n&&(o=e,n=t)}}}return o}(o,t);if(i){const o=t[i];if("string"==typeof o.value&&o.value.startsWith("{")&&o.value.endsWith("}")){const n=s(o.value,t,r);return Object.assign(Object.assign({},n),{originalReference:e,originalPath:o.originalPath,resolvedFrom:i})}return{value:o.value,type:o.type,originalReference:e,originalPath:o.originalPath,isResolved:!0,resolvedFrom:i}}return{value:e,type:"reference",originalReference:e,isResolved:!1}}function a(t,r,o,n){if(null==t)return null;if("object"==typeof t&&("VARIABLE_ALIAS"===t.type||"VARIABLE_REFERENCE"===t.type))return function(e,t,r){if(!e||"object"!=typeof e)return e;if(("VARIABLE_ALIAS"===e.type||"VARIABLE_REFERENCE"===e.type)&&e.id){const o=t.find((t=>t.id===e.id));if(o){const t=o.name.replace(/\//g,".");return e.id&&t&&r.set(e.id,t),`{${t}}`}}return e}(t,o,n);if("object"==typeof t&&"r"in t&&"g"in t&&"b"in t)return e(t);if(Array.isArray(t))return t.map((e=>a(e,r,o,n)));if("object"==typeof t&&null!==t){if(0===Object.keys(t).length)return"{}";const e={};for(const s in t)e[s]=a(t[s],r,o,n);return e}return t}function i(){return e=this,o=void 0,i=function*(){try{console.log("Starting DTCG-compliant variable extraction");const e=yield figma.variables.getLocalVariableCollections();console.log("Collections found:",e.length);const o=figma.variables.getLocalVariables(),n=new Map,i={};for(const s of e){const e=s.name.toLowerCase();console.log("Processing collection:",e),i[e]={};const c=o.filter((e=>e.variableCollectionId===s.id));console.log(`Found ${c.length} variables in collection ${e}`);for(const l of s.modes){const s=l.name;console.log(`Processing mode: ${s}`),i[e][s]={};for(const u of c){const c=u.valuesByMode[l.modeId];if(void 0===c)continue;const d=u.name.split("/").filter((e=>e.trim().length>0)),f=d.length>0?d:["base"],g=a(c,u.resolvedType,o,n),p=r(g,t(u.resolvedType,g),"");let h=i[e][s];for(let e=0;e<f.length-1;e++){const t=f[e];h[t]||(h[t]={}),h=h[t]}h[f[f.length-1]]=p}}}console.log("Validating references...");const c=function(e,t){const r=JSON.parse(JSON.stringify(e)),o={};if(t instanceof Map)for(const[e,r]of t.entries())o[r]={value:`{${r}}`,type:"reference"};else Object.assign(o,t);function n(e,t=""){if(e&&"object"==typeof e)if(Array.isArray(e))e.forEach(((e,r)=>n(e,`${t}[${r}]`)));else for(const r in e){const a=e[r],i=t?`${t}.${r}`:r;if(!r.startsWith("$")||"$value"===r)if("$value"===r&&"string"==typeof a&&a.startsWith("{")&&a.endsWith("}")){a.substring(1,a.length-1);const t=s(a,o);t.isResolved?(e.$originalValue=a,e.$value=t.value,e.$resolvedFrom=t.resolvedFrom,"reference"===e.$type&&t.type?e.$type=t.type:e.$type||(e.$type=t.type||"reference")):e.$type||(e.$type="reference")}else"object"==typeof a&&null!==a&&n(a,i)}}0===Object.keys(o).length&&Object.assign(o,function(e){const t={};function r(e,o="",n=""){if(e&&"object"==typeof e)if(void 0===e.$value||void 0===e.$type)for(const t in e){const s=o?`${o}/${t}`:t,a=n?`${n}.${t}`:t;"object"==typeof e[t]&&null!==e[t]&&r(e[t],s,a)}else{const r=o.replace(/\//g,".");t[r]={value:e.$value,type:e.$type,originalPath:n},t[o]={value:e.$value,type:e.$type,originalPath:n};const s=r.split(".");for(let a=s.length;a>0;a--){const i=s.slice(s.length-a).join(".");t[i]||i===r||(t[i]={value:e.$value,type:e.$type,originalPath:n});const c=s.slice(s.length-a).join("/");t[c]||c===o||(t[c]={value:e.$value,type:e.$type,originalPath:n})}const a=s[s.length-1];t[a]||(t[a]={value:e.$value,type:e.$type,originalPath:n})}}for(const t in e)for(const o in e[t])r(e[t][o],`${t}/${o}`,`${t}.${o}`),r(e[t][o],"","");return t}(e));for(const e in r)for(const t in r[e])n(r[e][t],`${e}.${t}`);return r}(i,n);return console.log("DTCG-compliant extraction finished"),c}catch(e){throw console.error("Error in extractDTCGVariables:",e),e}},new((n=void 0)||(n=Promise))((function(t,r){function s(e){try{c(i.next(e))}catch(e){r(e)}}function a(e){try{c(i.throw(e))}catch(e){r(e)}}function c(e){var r;e.done?t(e.value):(r=e.value,r instanceof n?r:new n((function(e){e(r)}))).then(s,a)}c((i=i.apply(e,o||[])).next())}));var e,o,n,i}var c=function(e,t,r,o){return new(r||(r=Promise))((function(n,s){function a(e){try{c(o.next(e))}catch(e){s(e)}}function i(e){try{c(o.throw(e))}catch(e){s(e)}}function c(e){var t;e.done?n(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(a,i)}c((o=o.apply(e,t||[])).next())}))};function l(e,t,r,o){return c(this,arguments,void 0,(function*(e,t,r,o,n="",s){let a=!1,i=0,c=0;const f=[],g=Object.keys(t).sort(((e,r)=>{const o=e=>{const r=t[e];return r&&"object"==typeof r&&void 0!==r.$value&&"string"==typeof r.$value&&r.$value.startsWith("{")&&r.$value.endsWith("}")},n=e.split("/").length,s=r.split("/").length;if(n!==s)return n-s;const a=o(e);return a!==o(r)?a?1:-1:e.localeCompare(r)}));for(const p of g){const g=t[p],h=n?`${n}/${p}`:p;if(g&&"object"==typeof g&&void 0!==g.$value){const t=h;let n=e.find((e=>e.name===t));try{const l="string"==typeof g.$value&&g.$value.startsWith("{")&&g.$value.endsWith("}"),p=u(g.$value,g.$type);if(null===p&&l){console.warn(`Could not resolve reference for variable ${t}: ${g.$value}`),f.push(`Could not resolve reference for ${t}: ${g.$value}`);continue}if(!n){const r=d(g.$type);if(!r){console.error(`Invalid variable type: ${g.$type}`),f.push(`Invalid variable type: ${g.$type}`);continue}let a;if(s)a=s;else{const e=o.split(".")[0],t=figma.variables.getLocalVariableCollections().find((t=>t.name.toLowerCase()===e.toLowerCase()));if(!t){console.error(`Collection not found: ${e}`),f.push(`Collection not found: ${e}`);continue}a=t.id}console.log(`Creating new variable: ${t} of type ${r}`),n=figma.variables.createVariable(t,a,r),e.push(n),c++}yield n.setValueForMode(r,p),l?console.log(`${n?"Updated":"Created"} variable with reference: ${t} → ${g.$value}`):console.log(`${n?"Updated":"Created"} variable: ${t}`),a=!0,i++}catch(e){console.error(`Error updating/creating variable ${t}:`,e),f.push(`Error with ${t}: ${e instanceof Error?e.message:String(e)}`)}}else if(g&&"object"==typeof g&&!Array.isArray(g)){const t=yield l(e,g,r,o,h,s);a=a||t.updated,i+=t.updatedCount,c+=t.createdCount,t.referenceErrors&&t.referenceErrors.length>0&&f.push(...t.referenceErrors)}}return{updated:a,updatedCount:i,createdCount:c,referenceErrors:f}}))}function u(e,t){switch(t){case"color":return"string"==typeof e&&e.startsWith("{")&&e.endsWith("}")?f(e):null==(r=e)?{r:0,g:0,b:0,a:1}:"object"==typeof r&&null!==r&&"r"in r?r:"string"==typeof r&&r.startsWith("#")?function(e){try{3===(e=e.replace("#","")).length&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),4===e.length&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]+e[3]+e[3]);let t=1;8===e.length&&(t=parseInt(e.slice(6,8),16)/255,e=e.substring(0,6));const r=parseInt(e.slice(0,2),16)/255,o=parseInt(e.slice(2,4),16)/255,n=parseInt(e.slice(4,6),16)/255;return isNaN(r)||isNaN(o)||isNaN(n)||isNaN(t)?(console.warn(`Invalid hex color values in: #${e}`),{r:0,g:0,b:0,a:1}):{r,g:o,b:n,a:t}}catch(t){return console.error(`Error parsing hex color: #${e}`,t),{r:0,g:0,b:0,a:1}}}(r):"string"==typeof r&&(r.startsWith("rgb(")||r.startsWith("rgba("))?function(e){try{let t=e.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)/);if(t||(t=e.match(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*(\d*\.?\d+))?\s*\)/)),t||(t=e.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[/, ]\s*(\d*\.?\d+))?\s*\)/)),!t)return console.warn(`Failed to parse RGB color: ${e}`),{r:0,g:0,b:0,a:1};const r=parseInt(t[1],10)/255,o=parseInt(t[2],10)/255;return{r,g:o,b:parseInt(t[3],10)/255,a:void 0!==t[4]?parseFloat(t[4]):1}}catch(t){return console.error(`Error parsing RGB color: ${e}`,t),{r:0,g:0,b:0,a:1}}}(r):"string"==typeof r&&(r.startsWith("hsl(")||r.startsWith("hsla("))?function(e){try{let t=e.match(/hsla?\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:%)\s*,\s*(\d+)(?:%)\s*(?:,\s*(\d*\.?\d+))?\s*\)/);if(t||(t=e.match(/hsla?\(\s*(\d+)(?:deg)?\s+(\d+)(?:%)\s+(\d+)(?:%)\s*(?:\/\s*(\d*\.?\d+))?\s*\)/)),t||(t=e.match(/hsla?\(\s*(\d+(?:\.\d+)?)(?:deg|rad|grad|turn)?\s*[, ]\s*(\d+(?:\.\d+)?)%?\s*[, ]\s*(\d+(?:\.\d+)?)%?(?:\s*[/, ]\s*(\d*\.?\d+))?\s*\)/)),!t)return console.warn(`Failed to parse HSL color: ${e}`),{r:0,g:0,b:0,a:1};const r=parseFloat(t[1]),o=parseFloat(t[2])/100,n=parseFloat(t[3])/100,s=void 0!==t[4]?parseFloat(t[4]):1,a=(e,t,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<1/6?e+6*(t-e)*r:r<.5?t:r<2/3?e+(t-e)*(2/3-r)*6:e);let i,c,l;if(0===o)i=c=l=n;else{const e=n<.5?n*(1+o):n+o-n*o,t=2*n-e;i=a(t,e,(r/360+1/3)%1),c=a(t,e,r/360%1),l=a(t,e,(r/360-1/3+1)%1)}return{r:i,g:c,b:l,a:s}}catch(t){return console.error(`Error parsing HSL color: ${e}`,t),{r:0,g:0,b:0,a:1}}}(r):(console.warn(`Unrecognized color format: ${r}`),{r:0,g:0,b:0,a:1});case"number":return"string"==typeof e&&e.startsWith("{")&&e.endsWith("}")?f(e):"string"==typeof e?parseFloat(e):e;case"boolean":return"string"==typeof e&&e.startsWith("{")&&e.endsWith("}")?f(e):Boolean(e);default:return"string"==typeof e&&e.startsWith("{")&&e.endsWith("}")?f(e):e}var r}function d(e){switch(e.toLowerCase()){case"color":return"COLOR";case"number":case"dimension":case"spacing":case"borderWidth":case"borderRadius":case"fontWeight":case"lineHeight":case"fontSizes":case"size":case"opacity":return"FLOAT";case"string":case"fontFamily":case"fontStyle":case"textCase":case"textDecoration":case"duration":case"letterSpacing":return"STRING";case"boolean":return"BOOLEAN";default:return e.includes("color")?"COLOR":e.includes("size")||e.includes("width")||e.includes("height")?"FLOAT":(console.warn(`Unknown DTCG type "${e}" - defaulting to STRING`),"STRING")}}function f(e){try{const t=e.substring(1,e.length-1).replace(/\./g,"/"),r=figma.variables.getLocalVariables().find((e=>e.name===t));return r?{type:"VARIABLE_ALIAS",id:r.id}:(console.warn(`Referenced variable not found: ${t}`),null)}catch(e){return console.error("Error resolving reference to Figma alias:",e),null}}let g=!0,p="hex",h=null;figma.showUI(__html__,{width:1080,height:800}),console.log("Plugin UI shown with updated dimensions"),figma.ui.onmessage=t=>{return r=void 0,s=void 0,u=function*(){if(console.log("Plugin received message from UI:",t.type),"ui-ready"===t.type){if(console.log("UI is ready, sending data"),g){g=!1;try{const e=yield i();h=JSON.parse(JSON.stringify(e)),console.log("Extracted DTCG-compliant tokens, sending to UI"),figma.ui.postMessage({type:"tokens-data",data:e})}catch(e){console.error("Error extracting tokens:",e),figma.ui.postMessage({type:"error",message:`Error extracting tokens: ${e instanceof Error?e.message:"Unknown error"}`})}}}else if("extract-tokens"===t.type)try{const e=yield i();h=JSON.parse(JSON.stringify(e)),console.log("Extracted tokens on demand, sending to UI"),figma.ui.postMessage({type:"tokens-data",data:e})}catch(e){console.error("Error extracting tokens:",e),figma.ui.postMessage({type:"error",message:`Error extracting tokens: ${e instanceof Error?e.message:"Unknown error"}`})}else if("apply-color-format"===t.type){if(t.colorFormat){p=t.colorFormat,console.log(`Color format set to: ${p}`);try{h||(h=yield i());const t=function(t,r){const s=JSON.parse(JSON.stringify(t));function a(t){if(t&&"object"==typeof t&&void 0!==t.$value){if("color"===t.$type){if("string"==typeof t.$value&&t.$value.startsWith("{")&&t.$value.endsWith("}"))return t;t.$value=function(t,r){if("string"==typeof t){if(t.startsWith("#")){const e=function(e){3===(e=e.replace("#","")).length&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]);let t=1;8===e.length&&(t=parseInt(e.slice(6,8),16)/255,e=e.substring(0,6));const r=parseInt(e,16);return{r:(r>>16&255)/255,g:(r>>8&255)/255,b:(255&r)/255,a:t}}(t);switch(r){case"hex":return t;case"rgba":return o(e);case"hsla":return n(e)}}return t}if("object"==typeof t&&"r"in t&&"g"in t&&"b"in t)switch(r){case"hex":default:return e(t);case"rgba":return o(t);case"hsla":return n(t)}return t}(t.$value,r)}return t}if(t&&"object"==typeof t&&!Array.isArray(t))for(const e in t)t[e]=a(t[e]);return t}for(const e in s)for(const t in s[e])s[e][t]=a(s[e][t]);return s}(JSON.parse(JSON.stringify(h)),p);figma.ui.postMessage({type:"tokens-data",data:t})}catch(e){console.error("Error applying color format:",e),figma.ui.postMessage({type:"error",message:`Error applying color format: ${e instanceof Error?e.message:"Unknown error"}`})}}}else if("update-variables"===t.type)try{console.log("Received update variables request");const e=yield function(e){return c(this,void 0,void 0,(function*(){try{if(console.log("Starting variable update process"),!e||"object"!=typeof e)return{success:!1,error:"Invalid JSON data provided"};const t=yield figma.variables.getLocalVariableCollections();let r=!1,o=0,n=0,s=0,a=0,i=0;const c=[],u=[],d=Object.keys(e),f=(t.map((e=>e.name.toLowerCase())),new Map);t.forEach((e=>{const t=new Set;e.modes.forEach((e=>{t.add(e.name.toLowerCase())})),f.set(e.name.toLowerCase(),t)}));for(const f of d){console.log(`Processing collection: ${f}`);let g=t.find((e=>e.name.toLowerCase()===f.toLowerCase()));if(!g){if(d.length===t.length&&0===s){const e=t.filter((e=>!d.some((t=>t.toLowerCase()===e.name.toLowerCase()))));if(1===e.length){const t=e[0];console.log(`Renaming collection: ${t.name} to ${f}`);try{t.name=f,g=t,i++}catch(e){console.error(`Error renaming collection ${t.name} to ${f}:`,e),u.push(`Error renaming collection: ${e instanceof Error?e.message:String(e)}`)}}}if(!g){console.log(`Creating new collection: ${f}`);try{g=figma.variables.createVariableCollection(f),s++,1===s&&t.push(g)}catch(e){console.error(`Error creating collection ${f}:`,e),u.push(`Error creating collection ${f}: ${e instanceof Error?e.message:String(e)}`);continue}}}const p=figma.variables.getLocalVariables().filter((e=>e.variableCollectionId===g.id)),h=e[f],y=Object.keys(h);for(const e of y){console.log(`Processing mode: ${e}`);let t=g.modes.find((t=>t.name.toLowerCase()===e.toLowerCase()));if(!t){const r=g.modes;if(y.length===r.length&&0===a){const o=r.filter((e=>!y.some((t=>t.toLowerCase()===e.name.toLowerCase()))));if(1===o.length){const r=o[0];console.log(`Renaming mode: ${r.name} to ${e}`);try{g.renameMode(r.modeId,e),t=g.modes.find((e=>e.modeId===r.modeId)),i++}catch(t){console.error(`Error renaming mode ${r.name} to ${e}:`,t),u.push(`Error renaming mode: ${t instanceof Error?t.message:String(t)}`)}}}if(!t){console.log(`Creating new mode: ${e} in collection ${f}`);try{const r=g.addMode(e);if(a++,t=g.modes.find((e=>e.modeId===r)),!t)throw new Error(`Failed to find newly created mode: ${e}`)}catch(t){console.error(`Error creating mode ${e} in collection ${f}:`,t),u.push(`Error creating mode ${e}: ${t instanceof Error?t.message:String(t)}`);continue}}}const s=h[e],d=yield l(p,s,t.modeId,`${f}.${e}`,g.id);r=r||d.updated,n+=d.updatedCount||0,o+=d.createdCount||0,d.referenceErrors&&d.referenceErrors.length>0&&c.push(...d.referenceErrors)}}if(!r&&0===s&&0===a&&0===i)return console.log("No variables, collections, or modes were updated, created, or renamed - possibly empty input"),{success:!0,error:"No variables, collections, or modes were updated, created, or renamed. The filter might be too restrictive or data is empty."};const g=[...c,...u];if(g.length>0){console.warn(`Operation completed with ${g.length} warnings`);const e=Array.from(new Set(g));return{success:!0,warnings:e,error:`Variables updated with ${e.length} warning(s).`,created:o,updated:n,collections:s,modes:a,renamed:i}}const p=[];o>0&&p.push(`created ${o} variables`),n>0&&p.push(`updated ${n} variables`),s>0&&p.push(`created ${s} collections`),a>0&&p.push(`created ${a} modes`),i>0&&p.push(`renamed ${i} collections/modes`);const h=p.join(", ");return console.log(`Variable update completed successfully: ${h}`),{success:!0,created:o,updated:n,collections:s,modes:a,renamed:i}}catch(e){return console.error("Error updating variables:",e),{success:!1,error:e instanceof Error?e.message:"Unknown error updating variables"}}}))}(t.data);figma.ui.postMessage({type:"update-variables-result",success:e.success,error:e.error,warnings:e.warnings,created:e.created,updated:e.updated,collections:e.collections,modes:e.modes,renamed:e.renamed})}catch(e){console.error("Error handling variable update:",e),figma.ui.postMessage({type:"update-variables-result",success:!1,error:`Error handling variable update: ${e instanceof Error?e.message:"Unknown error"}`})}else"close"===t.type&&figma.closePlugin()},new((a=void 0)||(a=Promise))((function(e,t){function o(e){try{i(u.next(e))}catch(e){t(e)}}function n(e){try{i(u.throw(e))}catch(e){t(e)}}function i(t){var r;t.done?e(t.value):(r=t.value,r instanceof a?r:new a((function(e){e(r)}))).then(o,n)}i((u=u.apply(r,s||[])).next())}));var r,s,a,u}})();