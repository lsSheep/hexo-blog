/**
 * 页面阅读计数器 v5.1 - OpenKounter (EdgeOne Pages)
 */
(function() {
  'use strict';

  var script = document.currentScript;
  var SERVER = script ? script.getAttribute('data-server') : null;
  var CDN_JSON = 'https://cdn.jsdelivr.net/gh/MIutopia/hexo-blog@master/data/pageviews.json';

  function apiGet(path) {
    return fetch(SERVER + '/api/counter?path=' + encodeURIComponent(path))
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.count || 0; })
      .catch(function() { return 0; });
  }

  function apiInc(path) {
    return fetch(SERVER + '/api/counter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'inc', target: path })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.count || null; })
      .catch(function() { return null; });
  }

  window.PageView = {
    increment: function(path) {
      path = path || window.location.pathname;
      if (SERVER) return apiInc(path);
      return Promise.resolve(null);
    },
    get: function(path) {
      path = path || window.location.pathname;
      if (SERVER) return apiGet(path);
      return Promise.resolve(0);
    },
    fillCounts: function() {
      var elements = document.querySelectorAll('.pageview-count');
      if (elements.length === 0) return;
      if (SERVER) {
        var ps = [];
        for (var i = 0; i < elements.length; i++) ps.push(apiGet(elements[i].getAttribute('data-path') || window.location.pathname));
        Promise.all(ps).then(function(c) { for (var i = 0; i < elements.length; i++) elements[i].textContent = c[i] || '0'; });
      } else {
        fetch(CDN_JSON).then(function(r) { return r.json(); }).then(function(d) {
          for (var i = 0; i < elements.length; i++) elements[i].textContent = (d && d[elements[i].getAttribute('data-path') || '']) || '0';
        }).catch(function() { for (var i = 0; i < elements.length; i++) elements[i].textContent = '0'; });
      }
    }
  };

  function init() {
    PageView.fillCounts();
    if (document.querySelector('.article-body') && SERVER) {
      PageView.increment().then(function(count) {
        if (count !== null) {
          var el = document.querySelectorAll('.pageview-count');
          for (var i = 0; i < el.length; i++) el[i].textContent = count;
        }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
