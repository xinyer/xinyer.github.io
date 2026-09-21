/* =========================================================
   leaderboard.js — 排行榜数据层（localStorage 持久化）
   ---------------------------------------------------------
   ⚠️ 成绩按「难度模式」隔离：简单模式 12 秒和地狱模式 12 秒不是一回事，
      混在一张榜上没有可比性。所以存储结构多了一层模式维度。

   每个角色在每个模式下分别保留两条「个人最佳」：
     · bestTime —— 最快通关用时（毫秒）
     · bestMiss —— 最少失误次数（失误相同时取用时更短的）

   数据结构：
     {
       "easy": { "<角色id>": { bestTime: {ms,misses,at}, bestMiss: {...} }, ... },
       "hard": { ... },
       "hell": { ... }
     }

   兼容：早期版本的记录是扁平的 { "<角色id>": {...} }，
        加载时会自动迁移到 easy 模式名下，已有成绩不会丢。
   ========================================================= */
window.Leaderboard = (function () {
  'use strict';

  var KEY = 'memory-cards:records:v1';
  var MODES = ['easy', 'hard', 'hell'];
  var DEFAULT_MODE = 'easy';

  var memoryStore = null;   // localStorage 不可用时的内存兜底

  function probeStorage() {
    try {
      var k = '__mc_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;   // 隐私模式 / 禁用 Cookie 等
    }
  }

  var hasStorage = probeStorage();

  function normalizeMode(mode) {
    return MODES.indexOf(mode) !== -1 ? mode : DEFAULT_MODE;
  }

  /**
   * 把任意历史结构整理成 { <mode>: { <id>: {...} } }
   * · 空对象 → 空结构
   * · 已经是模式结构 → 原样
   * · 扁平结构（旧版本）→ 整份归入简单模式
   */
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return {};

    var keys = Object.keys(raw);
    if (!keys.length) return {};

    var looksLikeModes = keys.every(function (k) {
      return MODES.indexOf(k) !== -1;
    });
    if (looksLikeModes) return raw;

    var out = {};
    out[DEFAULT_MODE] = raw;
    return out;
  }

  function save(data) {
    if (!hasStorage) {
      memoryStore = data;
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // 配额满 / 隐私模式：静默降级为内存存储，不影响玩法
      hasStorage = false;
      memoryStore = data;
    }
  }

  var migrated = false;

  function load() {
    var raw;

    if (!hasStorage) {
      raw = memoryStore || {};
    } else {
      try {
        var text = window.localStorage.getItem(KEY);
        raw = text ? JSON.parse(text) : {};
      } catch (e) {
        raw = {};
      }
    }

    var data = migrate(raw);

    // 迁移过一次就落盘，避免每次读取都重算
    if (!migrated && JSON.stringify(data) !== JSON.stringify(raw)) {
      migrated = true;
      save(data);
    }

    return data;
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  /** 取某个模式的口袋，没有就建一个 */
  function bucketOf(data, mode) {
    var m = normalizeMode(mode);
    if (!data[m] || typeof data[m] !== 'object') data[m] = {};
    return data[m];
  }

  /* 把记录整理成榜单行，再按 compare 排序 */
  function rowsFrom(mode, field, compare) {
    var data = load();
    var bucket = data[normalizeMode(mode)] || {};
    var rows = [];

    Object.keys(bucket).forEach(function (id) {
      var rec = bucket[id] && bucket[id][field];
      if (rec && typeof rec.ms === 'number') {
        rows.push({ id: id, ms: rec.ms, misses: rec.misses, at: rec.at });
      }
    });

    rows.sort(compare);
    return rows;
  }

  return {
    MODES: MODES,
    DEFAULT_MODE: DEFAULT_MODE,
    STORAGE_KEY: KEY,

    /** 某模式下某角色的全部记录，没有则返回 { } */
    get: function (mode, id) {
      var data = load();
      var bucket = data[normalizeMode(mode)] || {};
      return clone(bucket[id] || {});
    },

    /** 某模式下的全部记录（深拷贝） */
    all: function (mode) {
      var data = load();
      return clone(data[normalizeMode(mode)] || {});
    },

    /** 某模式下是否有任何记录 */
    hasAny: function (mode) {
      var data = load();
      return Object.keys(data[normalizeMode(mode)] || {}).length > 0;
    },

    /**
     * 提交一次通关成绩（按模式分别记录）
     * 返回 { time: 是否刷新了用时纪录, miss: 是否刷新了失误纪录 }
     */
    submit: function (mode, id, ms, misses) {
      if (!id || !isFinite(ms) || ms < 0) return null;

      var data = load();
      var bucket = bucketOf(data, mode);
      var rec = bucket[id] || {};
      var improved = { time: false, miss: false };
      var at = Date.now();

      if (!rec.bestTime || ms < rec.bestTime.ms) {
        rec.bestTime = { ms: Math.round(ms), misses: misses, at: at };
        improved.time = true;
      }

      var cur = rec.bestMiss;
      if (!cur || misses < cur.misses || (misses === cur.misses && ms < cur.ms)) {
        rec.bestMiss = { ms: Math.round(ms), misses: misses, at: at };
        improved.miss = true;
      }

      bucket[id] = rec;
      save(data);
      return improved;
    },

    /** 用时榜：快的在前，同用时失误少的在前 */
    rankingTime: function (mode) {
      return rowsFrom(mode, 'bestTime', function (a, b) {
        return a.ms - b.ms || a.misses - b.misses;
      });
    },

    /** 失误榜：失误少的在前，同失误用时短的在前 */
    rankingMiss: function (mode) {
      return rowsFrom(mode, 'bestMiss', function (a, b) {
        return a.misses - b.misses || a.ms - b.ms;
      });
    },

    /** 清空某个模式（不传则清空全部） */
    clear: function (mode) {
      if (mode === undefined) {
        save({});
        if (!hasStorage) memoryStore = {};
        return;
      }
      var data = load();
      delete data[normalizeMode(mode)];
      save(data);
    },

    /**
     * 调试用：注入示例记录（只在 ?seed=1 时被调用）
     * rows: [{ id, ms, misses }]
     */
    seed: function (mode, rows) {
      var data = load();
      var bucket = bucketOf(data, mode);
      var now = Date.now();

      (rows || []).forEach(function (r, i) {
        bucket[r.id] = {
          bestTime: { ms: r.ms, misses: r.misses, at: now - i * 86400000 },
          bestMiss: { ms: r.ms, misses: r.misses, at: now - i * 86400000 }
        };
      });

      save(data);
    },

    /** 存储是否真的落盘（供调试面板显示） */
    isPersistent: function () {
      return hasStorage;
    }
  };
})();
