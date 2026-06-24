/**
 * 页面阅读计数器 v5.2 - OpenKounter compatible
 */
(function() {
  'use strict';
  var script = document.currentScript;
  var S = script ? script.getAttribute('data-server') : null;

  function apiGet(p) {
    return fetch(S + '/api/counter?target=' + encodeURIComponent(p))
      .then(function(r) { return r.json(); })
      .then(function(d) { return (d.data && d.data.time) || d.count || 0; })
      .catch(function() { return 0; });
  }
  function apiInc(p) {
    return fetch(S + '/api/counter', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({action:'inc',target:p})
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { return (d.data && d.data.time) || d.count || null; })
      .catch(function() { return null; });
  }

  window.PageView = {
    increment: function(p) { p = p || window.location.pathname; return S ? apiInc(p) : Promise.resolve(null); },
    fillCounts: function() {
      var el = document.querySelectorAll('.pageview-count');
      if (!el.length) return;
      if (S) {
        var ps = [];
        for (var i = 0; i < el.length; i++) ps.push(apiGet(el[i].getAttribute('data-path') || location.pathname));
        Promise.all(ps).then(function(c) { for (var i = 0; i < el.length; i++) el[i].textContent = c[i] || '0'; });
      } else {
        fetch('https://cdn.jsdelivr.net/gh/MIutopia/hexo-blog@master/data/pageviews.json')
          .then(function(r) { return r.json(); })
          .then(function(d) { for (var i = 0; i < el.length; i++) el[i].textContent = (d && d[el[i].getAttribute('data-path') || '']) || '0'; })
          .catch(function() { for (var i = 0; i < el.length; i++) el[i].textContent = '0'; });
      }
    }
  };

  function init() {
    PageView.fillCounts();
    if (document.querySelector('.article-body') && S) {
      PageView.increment().then(function(c) {
        if (c !== null) { var el = document.querySelectorAll('.pageview-count'); for (var i = 0; i < el.length; i++) el[i].textContent = c; }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
