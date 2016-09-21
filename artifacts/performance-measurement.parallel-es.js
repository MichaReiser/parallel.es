!function(r,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports["parallel-es"]=e():r["parallel-es"]=e()}(this,function(){return webpackJsonpparallel_es([0],{175:function(r,e,n){"use strict";function t(r){for(var e=[],t=arguments.length,a=Array(t>1?t-1:0),o=1;o<t;o++)a[o-1]=arguments[o];for(var u=[void 0].concat(a),i=function(){var t=u[c];e.push({title:"Mandelbrot "+r.imageWidth+"x"+r.imageHeight+", "+r.iterations+" parallel ("+t+")",func:function(){var e=performance.now();return n.i(p.b)(r,{maxValuesPerTask:t}).then(function(){var r=performance.now();return r-e})}})},c=0;c<u.length;c++)i();return e}function a(r){function e(r){for(var e=[],n=0;n<r;++n)e.push({startYear:Math.round(15*Math.random()),totalAmount:Math.round(1e5*Math.random())});return e}for(var t=[],a=arguments.length,o=Array(a>1?a-1:0),u=1;u<a;u++)o[u-1]=arguments[u];var i=!0,c=!1,l=void 0;try{for(var f,m=function(){var a=f.value;t.push({title:"Montecarlo "+a+" sync",func:function(){var t=v()(r,{projects:e(a)}),o=performance.now();return n.i(y.a)(t),s.a.resolve(performance.now()-o)}},{title:"Monte carlo "+a+" parallel",func:function(){var t=v()(r,{projects:e(a)}),o=performance.now();return n.i(y.b)(t).then(function(){return performance.now()-o})}})},d=h()(o);!(i=(f=d.next()).done);i=!0)m()}catch(p){c=!0,l=p}finally{try{!i&&d["return"]&&d["return"]()}finally{if(c)throw l}}return t}function o(){for(var r=[],e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];var o=!0,u=!1,i=void 0;try{for(var c,l=function(){var e=c.value;r.push({title:"Knights Tour ("+e+"x"+e+") sync",func:function(){var r=performance.now();return n.i(x.a)({x:0,y:0},e),s.a.resolve(performance.now()-r)}}),r.push({title:"Knights Tour ("+e+"x"+e+") parallel",func:function(){var r=performance.now();return n.i(x.b)({x:0,y:0},e).then(function(){return performance.now()-r})}})},f=h()(t);!(o=(c=f.next()).done);o=!0)l()}catch(m){u=!0,i=m}finally{try{!o&&f["return"]&&f["return"]()}finally{if(u)throw i}}return r}function u(){var r=parseInt(document.querySelector("#mandelbrot-height").value,10),e=parseInt(document.querySelector("#mandelbrot-width").value,10),u=parseInt(document.querySelector("#mandelbrot-iterations").value,10),i=n.i(p.a)(e,r,u),c={investmentAmount:62e4,numRuns:1e4,numYears:15,performance:.034,seed:10,volatility:.0896},f=[{title:"Mandelbrot "+e+"x"+r+", "+u+" sync",func:function(){var r=performance.now();n.i(p.c)(i,function(){});var e=performance.now();return s.a.resolve(e-r)}}];return[].concat(f,l()(t(i,1,75,150,300,600,1200)),l()(a(c,1,2,4,6,8,10,15)),l()(o(5,6)))}function i(){function r(){for(;w.rows.length>0;)w.deleteRow(0)}function e(){var r=w.createTHead(),e=r.insertRow(),t=document.createElement("th");t.innerText="Example / Round",e.appendChild(t);for(var a=0;a<n;++a){var o=document.createElement("th");o.innerText=a+1+"",e.appendChild(o)}var u=document.createElement("th");u.innerText="average",e.appendChild(u)}var n=parseInt(b.value,10)||10,t=void 0,a=new s.a(function(r){t=r});r(),e();for(var o=w.createTBody(),i=u(),c=function(r){var e=i[r],t=o.insertRow();t.insertCell().textContent=e.title;for(var u=0,c=0;c<n;++c)a=a.then(function(){return e.func()}).then(function(r){return t.insertCell().textContent=r.toFixed(4),u+=r,r});a=a.then(function(){var r=u/n;return t.insertCell().textContent=r.toFixed(4),r})},l=0;l<i.length;++l)c(l);t()}var c=n(25),l=n.n(c),f=n(24),s=n.n(f),m=n(19),v=n.n(m),d=n(3),h=n.n(d),p=n(27),y=n(28),x=n(26),g=document.querySelector("#run"),w=document.querySelector("#output-table"),b=document.querySelector("#number-of-runs");g.addEventListener("click",function(r){r.preventDefault(),i()})},26:function(r,e,n){"use strict";function t(r){var e=new Array(r*r);return e.fill(0),{board:e,boardSize:r}}function a(r,e){for(var n=e.board,t=e.boardSize,a=[{x:-2,y:-1},{x:-2,y:1},{x:-1,y:-2},{x:-1,y:2},{x:1,y:-2},{x:1,y:2},{x:2,y:-1},{x:2,y:1}],o=t*t,u=0,i=r.map(function(r,e){return{coordinate:r,n:e+1}}),c=0;c<r.length-1;++c){var l=r[c].x*t+r[c].y;n[l]=c+1}for(;i.length>0;){var f=i[i.length-1],s=f.coordinate,m=f.n,v=s.x*t+s.y;if(0===n[v])if(m!==o){n[v]=m;for(var d=0;d<a.length;++d){var h=a[d],p={x:s.x+h.x,y:s.y+h.y},y=p.x>=0&&p.y>=0&&p.x<t&&p.y<t&&0===n[p.x*t+p.y];y&&i.push({coordinate:p,n:m+1})}}else++u,i.pop();else n[v]=0,i.pop()}return u}function o(r,e){var n=t(e);return a([r],n)}function u(r,e,n){function o(n){var t=[{x:-2,y:-1},{x:-2,y:1},{x:-1,y:-2},{x:-1,y:2},{x:1,y:-2},{x:1,y:2},{x:2,y:-1},{x:2,y:1}],a=[],o=!0,u=!1,i=void 0;try{for(var l,f=c()(t);!(o=(l=f.next()).done);o=!0){var s=l.value,m={x:n.x+s.x,y:n.y+s.y},v=m.x>=0&&m.y>=0&&m.x<e&&m.y<e&&(m.x!==r.x||m.y!==r.y)&&m.x!==n.x&&m.y!==n.y;v&&a.push(m)}}catch(d){u=!0,i=d}finally{try{!o&&f["return"]&&f["return"]()}finally{if(u)throw i}}return a}function u(){var e=[],n=!0,t=!1,a=void 0;try{for(var u,i=c()(o(r));!(n=(u=i.next()).done);n=!0){var l=u.value,f=!0,s=!1,m=void 0;try{for(var v,d=c()(o(l));!(f=(v=d.next()).done);f=!0){var h=v.value;e.push([r,l,h])}}catch(p){s=!0,m=p}finally{try{!f&&d["return"]&&d["return"]()}finally{if(s)throw m}}}}catch(p){t=!0,a=p}finally{try{!n&&i["return"]&&i["return"]()}finally{if(t)throw a}}return e}var i=0,f=performance.now();return l["default"].from(u(),n).inEnvironment(t,e).map(a).reduce(0,function(r,e){return r+e}).subscribe(function(r){var e=!0,n=!1,t=void 0;try{for(var a,o=c()(r);!(e=(a=o.next()).done);e=!0){var u=a.value;i+=u}}catch(l){n=!0,t=l}finally{try{!e&&o["return"]&&o["return"]()}finally{if(n)throw t}}console.log(i/(performance.now()-f)*1e3+" results per second")})}var i=n(3),c=n.n(i),l=n(9);e.a=o,e.b=u},27:function(r,e,n){"use strict";function t(r,e,n){var t={i:-1.2,real:-2},a={i:0,real:1};a.i=t.i+(a.real-t.real)*e/r;var o={i:(a.i-t.i)/(e-1),real:(a.real-t.real)/(r-1)};return{imageHeight:e,imageWidth:r,iterations:n,max:a,min:t,scalingFactor:o}}function a(r,e){function n(r){for(var e={i:r.i,real:r.real},n=0;n<u&&!(Math.pow(e.real,2)+Math.pow(e.i,2)>4);++n){var t=e.i;e.i=2*e.real*e.i+r.i,e.real=Math.pow(e.real,2)-Math.pow(t,2)+r.real}return{z:e,n:n}}for(var t=e.min,a=e.max,o=e.scalingFactor,u=e.iterations,i=e.imageWidth,c=new Uint8ClampedArray(4*i),l=a.i-r*o.i,f=0;f<i;++f){var s={i:l,real:t.real+f*o.real},m=n(s),v=m.n,d=4*f;c[d]=255&v,c[d+1]=65280&v,c[d+2]=16711680&v,c[d+3]=255}return c}function o(r,e){return i["default"].range(0,r.imageHeight,1,e).inEnvironment(r).map(a)}function u(r,e){for(var n=0;n<r.imageHeight;++n){var t=a(n,r);e(t,n)}}var i=n(9);e.a=t,e.b=o,e.c=u},28:function(r,e,n){"use strict";function t(r){return s()({},{investmentAmount:1e6,liquidity:1e4,numRuns:1e4,numYears:10,performance:0,projects:[],seed:void 0,volatility:.01},r)}function a(r){function e(e,n){function t(n){for(var t=r.investmentAmount,a=100,o=0;o<n.length;++o){var u=n[o],i=0===o?0:e[o-1],c=u/a;t=(t+i)*c,n[o]=Math.round(t),a=u}return n}for(var a=new Array(r.numYears),o=0;o<=n;++o)a[o]=new Array(r.numRuns);for(var u=0;u<r.numRuns;u++){for(var i=[100],c=1;c<=n;c++){var l=1+Math.random();i.push(i[c-1]*l)}t(i);for(var f=0;f<i.length;++f)a[f][u]=i[f]}return a}function n(){for(var e=[],n=0;n<r.numYears;++n){var t=u[n]||[],a=-t.reduce(function(r,e){return r+e.totalAmount},0);e.push(a)}return e}function t(e){for(var n=[],t=r.investmentAmount,a=0;a<r.numYears;++a)t+=e[a],n.push(t);return n}var a=r.projects;r.taskIndex&&r.valuesPerWorker&&(a=r.projects.slice(r.taskIndex*r.valuesPerWorker,(r.taskIndex+1)*r.valuesPerWorker));for(var o=r.projects.sort(function(r,e){return r.startYear-e.startYear}),u={},i=0;i<o.length;++i){var c=o[i],l=u[c.startYear]=u[c.startYear]||[];l.push(c)}var f=n(),s=t(f),m=a.reduce(function(r,e){return Math.max(r,e.startYear)},0);return{investmentAmount:r.investmentAmount,liquidity:r.liquidity,noInterestReferenceLine:s,numRuns:r.numRuns,numYears:m,projectsByStartYear:u,simulatedValues:e(f,m)}}function o(r,e){function n(r,e){return e.find(function(e){return("undefined"==typeof e.from||e.from<=r)&&("undefined"==typeof e.to||e.to>r)})}function t(r,e){return[{description:"Ziel erreichbar",from:r,name:"green",percentage:0,separator:!0},{description:"mit Zusatzliquidität erreichbar",from:r-c,name:"yellow",percentage:0,separator:!0,to:r},{description:"nicht erreichbar",from:e,name:"gray",percentage:0,separator:!1,to:r-c},{description:"nicht erreichbar, mit Verlust",name:"red",percentage:0,separator:!1,to:e}]}function a(){for(var e=r.totalAmount,n=l[r.startYear],t=0;t<n.length;++t){var a=n[t];if(a===r)break;e+=a.totalAmount}return e}function o(r){var e=Math.floor(r.length/2);return r.length%2?r[e]:(r[e-1]+r[e])/2}var u=e.noInterestReferenceLine,i=e.simulatedValues,c=e.liquidity,l=e.projectsByStartYear,f=10,s=a(),m=i[r.startYear];m.sort(function(r,e){return r-e});for(var v=t(s,u[r.startYear]),d={},h=Math.round(m.length/f),p=[],y=0;y<m.length;y+=h){for(var x={max:Number.MIN_VALUE,min:Number.MAX_VALUE,subBuckets:{}},g=y;g<y+h;++g){var w=m[g];x.min=Math.min(x.min,w),x.max=Math.max(x.max,w);var b=n(m[g],v);d[b.name]=(d[b.name]||0)+1;var M=x.subBuckets[b.name]=x.subBuckets[b.name]||{group:b.name,max:Number.MIN_VALUE,min:Number.MAX_VALUE};M.min=Math.min(M.min,w),M.max=Math.max(M.max,w)}p.push(x)}var A=v.filter(function(r){return!!d[r.name]});A.forEach(function(r){return r.percentage=d[r.name]/m.length});var Y=Math.round(m.length/6);return{buckets:p,groups:A,max:m[m.length-1],median:o(m),min:m[0],project:r,twoThird:{max:m[m.length-Y],min:m[Y]}}}function u(r){var e=a(t(r)),n=[],u=!0,i=!1,c=void 0;try{for(var f,s=l()(r.projects);!(u=(f=s.next()).done);u=!0){var m=f.value;n.push(o(m,e))}}catch(v){i=!0,c=v}finally{try{!u&&s["return"]&&s["return"]()}finally{if(i)throw c}}return n}function i(r){var e=t(r);return m["default"].from(e.projects).inEnvironment(a,e).map(o)}var c=n(3),l=n.n(c),f=n(19),s=n.n(f),m=n(9);e.a=u,e.b=i}},[175])});