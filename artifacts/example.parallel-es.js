!function(e,r){"object"==typeof exports&&"object"==typeof module?module.exports=r():"function"==typeof define&&define.amd?define([],r):"object"==typeof exports?exports["parallel-es"]=r():e["parallel-es"]=r()}(this,function(){return webpackJsonpparallel_es([1],{160:function(e,r,n){"use strict";function t(e){for(;d.rows.length>1;)d.deleteRow(1);var r=!0,n=!1,t=void 0;try{for(var a,i=o()(e);!(r=(a=i.next()).done);r=!0){var u=a.value,l=d.insertRow();l.insertCell().innerText=u.project.startYear.toLocaleString(),l.insertCell().innerText=u.project.totalAmount.toLocaleString();for(var c=["green","yellow","gray","red"],s=function(){var e=c[m],r=u.groups.find(function(r){return r.name===e});l.insertCell().innerText=r?(100*r.percentage).toFixed(2):"-"},m=0;m<c.length;m++)s()}}catch(f){n=!0,t=f}finally{try{!r&&i["return"]&&i["return"]()}finally{if(n)throw t}}}var a=n(4),o=n.n(a),i=n(24),u=n(25),l=n(23),c=document.querySelector("#mandelbrot-canvas"),s=c.getContext("2d"),m=n.i(i.a)(c.width,c.height,1e4),f={investmentAmount:62e4,numRuns:1e4,numYears:15,performance:.034,projects:[{startYear:0,totalAmount:1e4},{startYear:1,totalAmount:1e4},{startYear:2,totalAmount:1e4},{startYear:5,totalAmount:5e4},{startYear:15,totalAmount:8e5}],seed:10,volatility:.0896},d=document.querySelector("#montecarlo-table");document.querySelector("#mandelbrot-run-async").addEventListener("click",function(e){e.preventDefault(),s.putImageData(s.createImageData(c.width,c.height),0,0);var r=parseInt(document.querySelector("#mandelbrot-values-per-task").value,10);console.time("mandelbrot-async"),n.i(i.b)(m,{maxValuesPerTask:r}).subscribe(function(e,r,n){for(var t=0;t<e.length;++t)s.putImageData(new ImageData(e[t],c.width,1),0,r*n+t)}).then(function(){return console.timeEnd("mandelbrot-async")},function(e){return console.error(e)})}),document.querySelector("#mandelbrot-run-sync").addEventListener("click",function(){s.putImageData(s.createImageData(c.width,c.height),0,0),setTimeout(function(){console.time("mandelbrot-sync"),n.i(i.c)(m,function(e,r){s.putImageData(new ImageData(e,c.width,1),0,r)}),console.timeEnd("mandelbrot-sync")},0)}),document.querySelector("#montecarlo-run-sync").addEventListener("click",function(){console.time("montecarlo-sync");var e=n.i(u.a)(f);console.timeEnd("montecarlo-sync"),t(e),console.log(e)}),document.querySelector("#montecarlo-run-parallel").addEventListener("click",function(){console.time("montecarlo-parallel");var e=n.i(u.b)(f);e.then(function(e){console.timeEnd("montecarlo-parallel"),t(e),console.log(e)}),e["catch"](function(e){return console.error(e)})});var v=document.querySelector("#knight-board-result");document.querySelector("#knight-run-sync").addEventListener("click",function(){var e=parseInt(document.querySelector("#knight-board-size").value,10);v.innerText="Calculating...",setTimeout(function(){console.time("knight-run-sync");var r=n.i(l.a)({x:0,y:0},e);console.timeEnd("knight-run-sync"),v.innerText="Found "+r+" solutions for "+e+"x"+e+" board"},0)}),document.querySelector("#knight-run-parallel").addEventListener("click",function(){var e=parseInt(document.querySelector("#knight-board-size").value,10);v.innerText="Calculating...",console.time("knight-run-parallel"),n.i(l.b)({x:0,y:0},e).then(function(r){console.timeEnd("knight-run-parallel"),v.innerText="Found "+r+" solutions for "+e+"x"+e+" board"},function(e){return console.log(e)})})},23:function(e,r,n){"use strict";function t(e){var r=new Array(e*e);return r.fill(0),{board:r,boardSize:e}}function a(e,r){for(var n=r.board,t=r.boardSize,a=[{x:-2,y:-1},{x:-2,y:1},{x:-1,y:-2},{x:-1,y:2},{x:1,y:-2},{x:1,y:2},{x:2,y:-1},{x:2,y:1}],o=t*t,i=0,u=e.map(function(e,r){return{coordinate:e,n:r+1}}),l=0;l<e.length-1;++l){var c=e[l].x*t+e[l].y;n[c]=l+1}for(;u.length>0;){var s=u[u.length-1],m=s.coordinate,f=s.n,d=m.x*t+m.y;if(0===n[d])if(f!==o){n[d]=f;for(var v=0;v<a.length;++v){var y=a[v],h={x:m.x+y.x,y:m.y+y.y},p=h.x>=0&&h.y>=0&&h.x<t&&h.y<t&&0===n[h.x*t+h.y];p&&u.push({coordinate:h,n:f+1})}}else++i,u.pop();else n[d]=0,u.pop()}return i}function o(e,r){var n=t(r);return a([e],n)}function i(e,r,n){function o(n){var t=[{x:-2,y:-1},{x:-2,y:1},{x:-1,y:-2},{x:-1,y:2},{x:1,y:-2},{x:1,y:2},{x:2,y:-1},{x:2,y:1}],a=[],o=!0,i=!1,u=void 0;try{for(var c,s=l()(t);!(o=(c=s.next()).done);o=!0){var m=c.value,f={x:n.x+m.x,y:n.y+m.y},d=f.x>=0&&f.y>=0&&f.x<r&&f.y<r&&(f.x!==e.x||f.y!==e.y)&&f.x!==n.x&&f.y!==n.y;d&&a.push(f)}}catch(v){i=!0,u=v}finally{try{!o&&s["return"]&&s["return"]()}finally{if(i)throw u}}return a}function i(){var r=[],n=!0,t=!1,a=void 0;try{for(var i,u=l()(o(e));!(n=(i=u.next()).done);n=!0){var c=i.value,s=!0,m=!1,f=void 0;try{for(var d,v=l()(o(c));!(s=(d=v.next()).done);s=!0){var y=d.value;r.push([e,c,y])}}catch(h){m=!0,f=h}finally{try{!s&&v["return"]&&v["return"]()}finally{if(m)throw f}}}}catch(h){t=!0,a=h}finally{try{!n&&u["return"]&&u["return"]()}finally{if(t)throw a}}return r}var u=0,s=performance.now();return c["default"].from(i(),n).inEnvironment(t,r).map(a).reduce(0,function(e,r){return e+r}).subscribe(function(e){var r=!0,n=!1,t=void 0;try{for(var a,o=l()(e);!(r=(a=o.next()).done);r=!0){var i=a.value;u+=i}}catch(c){n=!0,t=c}finally{try{!r&&o["return"]&&o["return"]()}finally{if(n)throw t}}console.log(u/(performance.now()-s)*1e3+" results per second")})}var u=n(4),l=n.n(u),c=n(9);r.a=o,r.b=i},24:function(e,r,n){"use strict";function t(e,r,n){var t={i:-1.2,real:-2},a={i:0,real:1};a.i=t.i+(a.real-t.real)*r/e;var o={i:(a.i-t.i)/(r-1),real:(a.real-t.real)/(e-1)};return{imageHeight:r,imageWidth:e,iterations:n,max:a,min:t,scalingFactor:o}}function a(e,r){function n(e){for(var r={i:e.i,real:e.real},n=0;n<i&&!(Math.pow(r.real,2)+Math.pow(r.i,2)>4);++n){var t=r.i;r.i=2*r.real*r.i+e.i,r.real=Math.pow(r.real,2)-Math.pow(t,2)+e.real}return{z:r,n:n}}for(var t=r.min,a=r.max,o=r.scalingFactor,i=r.iterations,u=r.imageWidth,l=new Uint8ClampedArray(4*u),c=a.i-e*o.i,s=0;s<u;++s){var m={i:c,real:t.real+s*o.real},f=n(m),d=f.n,v=4*s;l[v]=255&d,l[v+1]=65280&d,l[v+2]=16711680&d,l[v+3]=255}return l}function o(e,r){return u["default"].range(0,e.imageHeight,1,r).inEnvironment(e).map(a).result()}function i(e,r){for(var n=0;n<e.imageHeight;++n){var t=a(n,e);r(t,n)}}var u=n(9);r.a=t,r.b=o,r.c=i},25:function(e,r,n){"use strict";function t(e){return m()({},{investmentAmount:1e6,liquidity:1e4,numRuns:1e4,numYears:10,performance:0,projects:[],seed:void 0,volatility:.01},e)}function a(e){function r(r,n){function t(n){for(var t=e.investmentAmount,a=100,o=0;o<n.length;++o){var i=n[o],u=0===o?0:r[o-1],l=i/a;t=(t+u)*l,n[o]=Math.round(t),a=i}return n}for(var a=new Array(e.numYears),o=0;o<=n;++o)a[o]=new Array(e.numRuns);for(var i=0;i<e.numRuns;i++){for(var u=[100],l=1;l<=n;l++){var c=1+Math.random();u.push(u[l-1]*c)}t(u);for(var s=0;s<u.length;++s)a[s][i]=u[s]}return a}function n(){for(var r=[],n=0;n<e.numYears;++n){var t=i[n]||[],a=-t.reduce(function(e,r){return e+r.totalAmount},0);r.push(a)}return r}function t(r){for(var n=[],t=e.investmentAmount,a=0;a<e.numYears;++a)t+=r[a],n.push(t);return n}var a=e.projects;e.taskIndex&&e.valuesPerWorker&&(a=e.projects.slice(e.taskIndex*e.valuesPerWorker,(e.taskIndex+1)*e.valuesPerWorker));for(var o=e.projects.sort(function(e,r){return e.startYear-r.startYear}),i={},u=0;u<o.length;++u){var l=o[u],c=i[l.startYear]=i[l.startYear]||[];c.push(l)}var s=n(),m=t(s),f=a.reduce(function(e,r){return Math.max(e,r.startYear)},0);return{investmentAmount:e.investmentAmount,liquidity:e.liquidity,noInterestReferenceLine:m,numRuns:e.numRuns,numYears:f,projectsByStartYear:i,simulatedValues:r(s,f)}}function o(e,r){function n(e,r){return r.find(function(r){return("undefined"==typeof r.from||r.from<=e)&&("undefined"==typeof r.to||r.to>e)})}function t(e,r){return[{description:"Ziel erreichbar",from:e,name:"green",percentage:0,separator:!0},{description:"mit Zusatzliquidität erreichbar",from:e-l,name:"yellow",percentage:0,separator:!0,to:e},{description:"nicht erreichbar",from:r,name:"gray",percentage:0,separator:!1,to:e-l},{description:"nicht erreichbar, mit Verlust",name:"red",percentage:0,separator:!1,to:r}]}function a(){for(var r=e.totalAmount,n=c[e.startYear],t=0;t<n.length;++t){var a=n[t];if(a===e)break;r+=a.totalAmount}return r}function o(e){var r=Math.floor(e.length/2);return e.length%2?e[r]:(e[r-1]+e[r])/2}var i=r.noInterestReferenceLine,u=r.simulatedValues,l=r.liquidity,c=r.projectsByStartYear,s=10,m=a(),f=u[e.startYear];f.sort(function(e,r){return e-r});for(var d=t(m,i[e.startYear]),v={},y=Math.round(f.length/s),h=[],p=0;p<f.length;p+=y){for(var x={max:Number.MIN_VALUE,min:Number.MAX_VALUE,subBuckets:{}},g=p;g<p+y;++g){var b=f[g];x.min=Math.min(x.min,b),x.max=Math.max(x.max,b);var w=n(f[g],d);v[w.name]=(v[w.name]||0)+1;var k=x.subBuckets[w.name]=x.subBuckets[w.name]||{group:w.name,max:Number.MIN_VALUE,min:Number.MAX_VALUE};k.min=Math.min(k.min,b),k.max=Math.max(k.max,b)}h.push(x)}var A=d.filter(function(e){return!!v[e.name]});A.forEach(function(e){return e.percentage=v[e.name]/f.length});var Y=Math.round(f.length/6);return{buckets:h,groups:A,max:f[f.length-1],median:o(f),min:f[0],project:e,twoThird:{max:f[f.length-Y],min:f[Y]}}}function i(e){var r=a(t(e)),n=[],i=!0,u=!1,l=void 0;try{for(var s,m=c()(e.projects);!(i=(s=m.next()).done);i=!0){var f=s.value;n.push(o(f,r))}}catch(d){u=!0,l=d}finally{try{!i&&m["return"]&&m["return"]()}finally{if(u)throw l}}return n}function u(e){var r=t(e);return f["default"].from(r.projects).inEnvironment(a,r).map(o).result()}var l=n(4),c=n.n(l),s=n(18),m=n.n(s),f=n(9);r.a=i,r.b=u}},[160])});