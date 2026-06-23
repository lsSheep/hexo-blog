/**
 * 页面阅读计数器 - 前端脚本 (v2.0)
 * 
 * 基于 CountAPI (https://countapi.xyz) — 完全免费，零配置
 * 
 * HTML 中使用:
 *   <span class="pageview-count" data-path="/post-path/"></span>
 *
 * 引入:
 *   <script src="/js/pageview-tracker.js"></script>
 */

(function() {
  'use strict';

  // CountAPI 配置 (完全免费，无需注册)
  var NAMESPACE = 'cloudetopia.top';
  var API_BASE = 'https://api.countapi.xyz';

  function slugify(path) {
    // 将路径转换为安全的 key
    return path.replace(/[^a-zA-Z0-9一-鿿\/\-_]/g, '-').replace(/\/$/, '');
  }

  window.PageView = {
    /**
     * 增加阅读计数并返回新值
     */
    increment: function(path) {
      path = slugify(path || window.location.pathname);
      return fetch(API_BASE + '/hit/' + NAMESPACE + path)
        .then(function(r) { return r.json(); })
        .then(function(data) { return data.value; })
        .catch(function() { return null; });
    },

    /**
     * 获取单个页面阅读数
     */
    get: function(path) {
      path = slugify(path || window.location.pathname);
      return fetch(API_BASE + '/get/' + NAMESPACE + path)
        .then(function(r) { return r.json(); })
        .then(function(data) { return data.value; })
        .catch(function() { return '0'; });
    },

    /**
     * 批量获取（CountAPI 不支持批量，逐个获取）
     */
    batch: function(paths) {
      return Promise.all(paths.map(function(p) { return PageView.get(p); }))
        .then(function(counts) {
          var result = {};
          paths.forEach(function(p, i) { result[p] = counts[i]; });
          return result;
        });
    },

    /**
     * 自动填充页面上的所有阅读计数元素
     */
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
    }
  };

  // 页面加载后自动填充阅读数
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PageView.fillCounts);
  } else {
    PageView.fillCounts();
  }

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
})();
