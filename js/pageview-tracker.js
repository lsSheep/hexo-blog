/**
 * 页面阅读计数器 v3.0
 * 
 * 支持两种模式:
 *   MODE 1 (默认): 从静态 JSON 读取计数 (无需任何后端)
 *   MODE 2: 从 Cloudflare Worker 实时读取+递增
 * 
 * 切换到 MODE 2: 在 script 标签上添加 data-worker 属性
 *   <script src="/js/pageview-tracker.js" data-worker="https://xxx.workers.dev"></script>
 */

(function() {
  'use strict';

  var script = document.currentScript;
  var WORKER = script ? script.getAttribute('data-worker') : null;
  var CDN_JSON = 'https://cdn.jsdelivr.net/gh/MIutopia/hexo-blog@master/data/pageviews.json';

  // ========== Worker 模式 ==========
  function workerGet(path) {
    return fetch(WORKER + '?path=' + encodeURIComponent(path))
      .then(function(r) { return r.text(); });
  }

  function workerInc(path) {
    return fetch(WORKER + '?path=' + encodeURIComponent(path) + '&action=inc', { method: 'POST' })
      .then(function(r) { return r.text(); });
  }

  function workerBatch(paths) {
    return fetch(WORKER + '?action=batch&paths=' + encodeURIComponent(paths.join(',')))
      .then(function(r) { return r.json(); });
  }

  // ========== 静态 JSON 模式 (默认，无需后端) ==========
  function jsonGet(path, data) {
    return Promise.resolve(data[path] || 0);
  }

  function jsonBatch(paths, data) {
    var results = {};
    paths.forEach(function(p) { results[p] = data[p] || 0; });
    return Promise.resolve(results);
  }

  // ========== 统一 API ==========
  window.PageView = {
    increment: function(path) {
      path = path || window.location.pathname;
      if (WORKER) return workerInc(path);
      return Promise.resolve(null); // 静态模式不递增
    },

    get: function(path) {
      path = path || window.location.pathname;
      if (WORKER) return workerGet(path);
      return PageView._data ? jsonGet(path, PageView._data) : Promise.resolve('0');
    },

    batch: function(paths) {
      if (WORKER) return workerBatch(paths);
      return PageView._data ? jsonBatch(paths, PageView._data) : Promise.resolve({});
    },

    fillCounts: function() {
      var elements = document.querySelectorAll('.pageview-count');
      if (elements.length === 0) return;

      var paths = [];
      for (var i = 0; i < elements.length; i++) {
        paths.push(elements[i].getAttribute('data-path') || window.location.pathname);
      }

      PageView.batch(paths).then(function(counts) {
        for (var i = 0; i < elements.length; i++) {
          var path = elements[i].getAttribute('data-path') || window.location.pathname;
          elements[i].textContent = counts[path] || '0';
        }
      });
    },

    _data: null  // 静态 JSON 数据缓存
  };

  // ========== 页面加载时自动执行 ==========
  function init() {
    if (WORKER) {
      // Worker 模式：直接填充
      PageView.fillCounts();
      // 文章页面自动 +1
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
      // 静态模式：先加载 JSON，再填充
      fetch(CDN_JSON)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          PageView._data = data;
          PageView.fillCounts();
        })
        .catch(function() {
          // JSON 不可用时全部显示 0
          PageView.fillCounts();
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
