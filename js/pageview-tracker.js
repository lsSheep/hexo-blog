/**
 * 页面阅读计数器 - 前端脚本 (v1.0)
 * 
 * 用于显示每篇文章的阅读次数。
 * Cloudflare Worker 部署完成后，修改下方的 WORKER_URL 即可启用。
 * 
 * HTML 中使用:
 *   <span class="pageview-count" data-path="/post-path/"></span>
 *
 * 文章页面自动计数:
 *   <script src="/js/pageview-tracker.js" data-worker="https://YOUR_WORKER.workers.dev"></script>
 */

(function() {
  'use strict';

  var script = document.currentScript;
  var WORKER_URL = script ? script.getAttribute('data-worker') : null;

  window.PageView = {
    /**
     * 增加阅读计数（文章页面调用，仅在 Worker URL 配置后生效）
     */
    increment: function(path) {
      if (!WORKER_URL) return Promise.resolve(null);
      path = path || window.location.pathname;
      return fetch(WORKER_URL + '?path=' + encodeURIComponent(path) + '&action=inc', { method: 'POST' })
        .then(function(r) { return r.text(); })
        .catch(function() { return null; });
    },

    /**
     * 获取单个页面阅读数
     */
    get: function(path) {
      if (!WORKER_URL) return Promise.resolve('0');
      path = path || window.location.pathname;
      return fetch(WORKER_URL + '?path=' + encodeURIComponent(path))
        .then(function(r) { return r.text(); })
        .catch(function() { return '0'; });
    },

    /**
     * 批量获取页面阅读数
     */
    batch: function(paths) {
      if (!WORKER_URL) return Promise.resolve({});
      return fetch(WORKER_URL + '?action=batch&paths=' + encodeURIComponent(paths.join(',')), { method: 'POST' })
        .then(function(r) { return r.json(); })
        .catch(function() { return {}; });
    },

    /**
     * 自动填充页面上的所有阅读计数元素
     */
    fillCounts: function() {
      if (!WORKER_URL) return;
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
    }
  };

  // 页面加载后自动填充
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PageView.fillCounts);
  } else {
    PageView.fillCounts();
  }

  // 文章页面自动 +1
  if (document.querySelector('.article-body') && WORKER_URL) {
    PageView.increment().then(function(count) {
      if (count) {
        var viewEls = document.querySelectorAll('.pageview-count');
        for (var i = 0; i < viewEls.length; i++) {
          if (!viewEls[i].textContent || viewEls[i].textContent === '0') {
            viewEls[i].textContent = count;
          }
        }
      }
    });
  }
})();
