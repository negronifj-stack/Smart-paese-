/* Horloge virtuelle : le film est rendu image par image, jamais en temps réel.
   - performance.now() renvoie le temps du film ;
   - requestAnimationFrame ne déclenche rien de lui-même : le réalisateur appelle VClock.step(ms) ;
   - Math.random est remplacé par un générateur à graine fixe, pour que deux rendus
     (ou deux processus de rendu parallèles) produisent exactement les mêmes textures. */
(function () {
  "use strict";
  var now = 0, queue = [], id = 0;
  var seed = 20261111;
  Math.random = function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  performance.now = function () { return now; };
  window.requestAnimationFrame = function (cb) { queue.push(cb); return ++id; };
  window.cancelAnimationFrame = function () { queue = []; };
  window.VClock = {
    get now() { return now; },
    step: function (ms) { now = ms; var q = queue; queue = []; for (var i = 0; i < q.length; i++) q[i](ms); }
  };
})();
