/* =========================================================
   leaderboard.js — 排行榜数据层（localStorage 持久化）
   ---------------------------------------------------------
   存储仍然按「难度模式」隔离 —— 一条成绩到底是在哪档难度下打出来的，
   这个信息不能丢，榜单上要靠它显示难度标签。

   但**榜单本身是全难度混排的**：同一个角色在三档难度下可能各有一条记录，
   上榜时只取其中最优的那一条，并带上它来自哪个难度（row.mode）。

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

  /* —— 两种排序规则，聚合与排序共用同一套，避免两处判断漂移 —— */
  function cmpTime(a, b) { return (a.ms - b.ms) || (a.misses - b.misses); }
  function cmpMiss(a, b) { return (a.misses - b.misses) || (a.ms - b.ms); }

  /**
   * 跨难度收集榜单行
   *
   * 遍历所有难度，把每个角色的记录都摊平成候选行；
   * 同一角色命中多条时，按 compare 只留最优的一条 ——
   * 留下的那条自带 mode 字段，榜单上据此显示难度标签。
   *
   * @param {string}   field    'bestTime' | 'bestMiss'
   * @param {function} compare  排序/择优规则
   * @param {string=}  onlyMode 只统计某一档难度（不传 = 全难度混排）
   */
  function collect(field, compare, onlyMode) {
    var data = load();
    var best = {};   // id → 该角色当前最优的一条

    var modes = onlyMode ? [normalizeMode(onlyMode)] : MODES;

    modes.forEach(function (mode) {
      var bucket = data[mode];
      if (!bucket || typeof bucket !== 'object') return;

      Object.keys(bucket).forEach(function (id) {
        var rec = bucket[id] && bucket[id][field];
        if (!rec || typeof rec.ms !== 'number') return;

        var row = { id: id, ms: rec.ms, misses: rec.misses, at: rec.at, mode: mode };
        var cur = best[id];
        if (!cur || compare(row, cur) < 0) best[id] = row;
      });
    });

    var rows = Object.keys(best).map(function (id) { return best[id]; });
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

    /**
     * 用时榜：快的在前，同用时失误少的在前
     * 不传 mode = 全难度混排（每个角色取三档里最优的一条）
     */
    rankingTime: function (mode) {
      return collect('bestTime', cmpTime, mode);
    },

    /** 失误榜：失误少的在前，同失误用时短的在前（同样默认全难度混排） */
    rankingMiss: function (mode) {
      return collect('bestMiss', cmpMiss, mode);
    },

    /**
     * 某个角色跨难度的最佳成绩
     * 返回 { time: row|null, miss: row|null }，两条各自带 mode 字段
     * （时间和失误的最优可能来自不同难度，所以不能合成一条）
     */
    bestOf: function (id) {
      if (!id) return { time: null, miss: null };
      return {
        time: collect('bestTime', cmpTime).filter(function (r) { return r.id === id; })[0] || null,
        miss: collect('bestMiss', cmpMiss).filter(function (r) { return r.id === id; })[0] || null
      };
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
