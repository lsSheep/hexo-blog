/**
 * 页面阅读计数器 v5.0
 * 
 * 后端: OpenKounter (EdgeOne Pages)
 * API: GET /api/counter?target=/path       → {"code":0,"data":{"time":5,...}}
 *       POST /api/counter {"action":"inc","target":"/path"} → {"code":0,"data":{"time":6,...}}
 *
 * 配置: <script src="/js/pageview-tracker.js" data-server="https://xxx.edgeone.cool"></script>
 */

(function() {
  'use strict';

  var script = document.currentScript;
  var SERVER = script ? script.getAttribute('data-server') : null;
  var CDN_JSON = 'https://cdn.jsdelivr.net/gh/MIutopia/hexo-blog@master/data/pageviews.json';

  function apiGet(path) {
    return fetch(SERVER + '/api/counter?target=' + encodeURIComponent(path))
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.data ? d.data.time : 0; })
      .catch(function() { return 0; });
  }

  function apiInc(path) {
    return fetch(SERVER + '/api/counter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'inc', target: path })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.data ? d.data.time : null; })
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

      var paths = [];
      for (var i = 0; i < elements.length; i++) {
        paths.push(elements[i].getAttribute('data-path') || window.location.pathname);
      }

      if (SERVER) {
        // 逐个获取（OpenKounter 无批量 GET）
        Promise.all(paths.map(function(p) { return apiGet(p); }))
          .then(function(counts) {
            for (var i = 0; i < elements.length; i++) {
              elements[i].textContent = counts[i] || '0';
            }
          });
      } else {
        // 降级：加载静态 JSON
        fetch(CDN_JSON)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            for (var i = 0; i < elements.length; i++) {
              var path = elements[i].getAttribute('data-path') || window.location.pathname;
              elements[i].textContent = (data && data[path]) || '0';
            }
          })
          .catch(function() {
            for (var i = 0; i < elements.length; i++) {
              elements[i].textContent = '0';
            }
          });
      }
    }
  };

  // 页面加载后自动执行
  function init() {
    PageView.fillCounts();
    if (document.querySelector('.article-body') && SERVER) {
      PageView.increment().then(function(count) {
        if (count !== null) {
          var elements = document.querySelectorAll('.pageview-count');
          for (var i = 0; i < elements.length; i++) {
            elements[i].textContent = count;
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
