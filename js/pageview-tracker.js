/**
 * 页面阅读计数器 v4.0
 * 
 * 后端: Cloudflare Worker + KV
 * API:
 *   GET /?path=/post-path       → {"path":"...", "count":5}
 *   GET /?path=/post-path&inc=1 → {"path":"...", "count":6}
 * 
 * Worker URL 通过 script 标签的 data-worker 属性配置:
 *   <script src="/js/pageview-tracker.js" data-worker="https://xxx.workers.dev"></script>
 */

(function() {
  'use strict';

  var script = document.currentScript;
  var WORKER = script ? script.getAttribute('data-worker') : null;
  // jsdelivr CDN 静态 JSON 作为降级方案
  var CDN_JSON = 'https://cdn.jsdelivr.net/gh/MIutopia/hexo-blog@master/data/pageviews.json';
  var _data = null;

  // ===== Worker API (实时) =====
  function workerGet(path) {
    return fetch(WORKER + '/?path=' + encodeURIComponent(path))
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.count; })
      .catch(function() { return 0; });
  }

  function workerInc(path) {
    return fetch(WORKER + '/?path=' + encodeURIComponent(path) + '&inc=1')
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.count; })
      .catch(function() { return null; });
  }

  // 批量获取（并发请求）
  function workerBatch(paths) {
    return Promise.all(paths.map(function(p) { return workerGet(p); }))
      .then(function(counts) {
        var results = {};
        paths.forEach(function(p, i) { results[p] = counts[i]; });
        return results;
      });
  }

  // ===== 静态 JSON 降级 =====
  function jsonBatch(paths, data) {
    var results = {};
    paths.forEach(function(p) { results[p] = (data && data[p]) || 0; });
    return Promise.resolve(results);
  }

  // ===== 公共 API =====
  window.PageView = {
    increment: function(path) {
      path = path || window.location.pathname;
      if (WORKER) return workerInc(path);
      return Promise.resolve(null);
    },

    get: function(path) {
      path = path || window.location.pathname;
      if (WORKER) return workerGet(path);
      return Promise.resolve((_data && _data[path]) || 0);
    },

    fillCounts: function() {
      var elements = document.querySelectorAll('.pageview-count');
      if (elements.length === 0) return;

      var paths = [];
      for (var i = 0; i < elements.length; i++) {
        paths.push(elements[i].getAttribute('data-path') || window.location.pathname);
      }

      var batchFn = WORKER ? workerBatch(paths) : jsonBatch(paths, _data);
      batchFn.then(function(counts) {
        for (var i = 0; i < elements.length; i++) {
          var path = elements[i].getAttribute('data-path') || window.location.pathname;
          elements[i].textContent = counts[path] || '0';
        }
      });
    }
  };

  // ===== 页面加载自动执行 =====
  function init() {
    if (WORKER) {
      // 实时模式
      PageView.fillCounts();
      if (document.querySelector('.article-body')) {
        PageView.increment().then(function(count) {
          if (count !== null) {
            var elements = document.querySelectorAll('.pageview-count');
            for (var i = 0; i < elements.length; i++) {
              elements[i].textContent = count;
            }
          }
        });
      }
    } else {
      // 降级模式: 加载静态 JSON
      fetch(CDN_JSON)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          _data = data;
          PageView.fillCounts();
        })
        .catch(function() {
          PageView.fillCounts(); // 全部显示 0
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
