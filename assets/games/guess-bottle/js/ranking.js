/**
 * ranking.js —— 成绩排行榜纯逻辑层
 *
 * 本文件不依赖 DOM / localStorage，可在浏览器与 Node 中同时使用，
 * 便于 QA 直接 require() 做单元测试。
 *
 * 榜单口径（每局一条成绩）：
 *   - 排名依据：本局点击「猜瓶子」的次数，**越少越靠前**（和游戏里
 *     「你只用了 N 次就猜对啦」的价值观一致）；
 *   - 展示：该局成功猜中几个（best / total）+ 完成时刻；
 *   - 排序细则：次数少 → 猜对的 → 槽位多（更难）→ 命中多 → 更早达成。
 */
var Ranking = (function () {
  'use strict';

  /** 榜单最多保留多少条（防止 localStorage 无限膨胀）。 */
  var LIMIT = 50;

  /** 存储格式版本号。 */
  var VERSION = 1;

  /**
   * 安全转整数。
   * @param {*} value
   * @param {number} fallback
   * @returns {number}
   */
  function toInt(value, fallback) {
    var n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }

  /**
   * 组装一条合法记录：所有字段都钳到合理区间，脏值不会污染榜单。
   * @param {Object} input
   * @returns {{id:string,at:number,guesses:number,best:number,total:number,n:number,m:number,won:boolean}}
   */
  function makeRecord(input) {
    var src = input || {};
    var total = Math.max(1, toInt(src.total, 1));
    var best = Math.min(total, Math.max(0, toInt(src.best, 0)));
    var at = Math.max(0, toInt(src.at, 0)) || Date.now();
    var n = Math.max(1, Math.min(total, toInt(src.n, total)));
    var m = Math.max(0, total - n);

    return {
      id: String(src.id || ('r' + at + '-' + Math.random().toString(36).slice(2, 7))),
      at: at,
      guesses: Math.max(0, toInt(src.guesses, 0)),
      best: best,
      total: total,
      n: n,
      m: m,
      // 命中满格即为通关（best 只可能等于 total 时玩家才赢过）
      won: !!src.won || best >= total
    };
  }

  /**
   * 排序规则（升序优先级）。
   * @param {Object} a
   * @param {Object} b
   * @returns {number}
   */
  function compare(a, b) {
    if (a.guesses !== b.guesses) return a.guesses - b.guesses; // ① 次数少靠前
    if (a.won !== b.won) return a.won ? -1 : 1;                // ② 同样次数，猜对的靠前
    if (a.total !== b.total) return b.total - a.total;         // ③ 槽位多（更难）靠前
    if (a.best !== b.best) return b.best - a.best;             // ④ 命中多靠前
    return a.at - b.at;                                        // ⑤ 更早达成靠前
  }

  /**
   * 返回排序后的新数组（不改入参）。
   * @param {Array} list
   * @returns {Array}
   */
  function sortRecords(list) {
    return (list || []).slice().sort(compare);
  }

  /**
   * 按名次裁剪（只留前 LIMIT 条）。
   * @param {Array} list 已排序的数组
   * @returns {Array}
   */
  function trim(list) {
    return (list || []).slice(0, LIMIT);
  }

  /**
   * 清洗任意来源的数组（读取存储 / 旧版本数据 / 被人手改过的 JSON）。
   * 缺关键字段的条目直接丢弃，而不是让整张榜崩掉。
   * @param {Array} raw
   * @returns {Array} 清洗 + 排序 + 裁剪后的新数组
   */
  function normalize(raw) {
    var list = [];
    if (!raw || typeof raw.length !== 'number') return list;
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      if (!r || typeof r !== 'object') continue;
      if (typeof r.guesses !== 'number' || typeof r.total !== 'number') continue;
      list.push(makeRecord({
        id: r.id || ('r' + toInt(r.at, 0) + '-' + i),
        at: r.at,
        guesses: r.guesses,
        best: r.best,
        total: r.total,
        n: r.n,
        m: r.m,
        won: r.won
      }));
    }
    return trim(sortRecords(list));
  }

  /**
   * 把一条新记录并入榜单。
   * @param {Array} list 现有榜单
   * @param {Object} input 新记录
   * @returns {{list:Array,record:Object,rank:number,onBoard:boolean}}
   *   rank 为「未裁剪的完整榜」中的名次（1 起）；onBoard 表示是否进了前 LIMIT 名。
   */
  function addRecord(list, input) {
    var record = makeRecord(input);
    var merged = sortRecords((list || []).concat([record]));
    var rank = 0;
    for (var i = 0; i < merged.length; i++) {
      if (merged[i].id === record.id) { rank = i + 1; break; }
    }
    var kept = trim(merged);
    var onBoard = false;
    for (var j = 0; j < kept.length; j++) {
      if (kept[j].id === record.id) { onBoard = true; break; }
    }
    return { list: kept, record: record, rank: rank, onBoard: onBoard };
  }

  /**
   * 汇总统计。
   * @param {Array} list
   * @returns {{plays:number,wins:number,fastest:number,totalGuesses:number,avgGuesses:number}}
   */
  function stats(list) {
    var l = list || [];
    var wins = 0, totalGuesses = 0, fastest = 0;
    for (var i = 0; i < l.length; i++) {
      totalGuesses += l[i].guesses;
      if (l[i].won) {
        wins++;
        if (!fastest || l[i].guesses < fastest) fastest = l[i].guesses;
      }
    }
    return {
      plays: l.length,
      wins: wins,
      fastest: fastest,
      totalGuesses: totalGuesses,
      avgGuesses: l.length ? Math.round(totalGuesses / l.length * 10) / 10 : 0
    };
  }

  /**
   * 名次徽标（前三给奖牌，其余返回空串，由调用方显示数字）。
   * @param {number} rank
   * @returns {string}
   */
  function medalOf(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  /**
   * 难度标签（供榜单上的小徽章使用）。
   * @param {Object} record
   * @returns {string}
   */
  function difficultyLabel(record) {
    var r = record || {};
    var n = Math.max(1, toInt(r.n, 1));
    var m = Math.max(0, toInt(r.m, 0));
    return m > 0 ? (n + '瓶+' + m + '空') : (n + '瓶');
  }

  /**
   * 补零。
   * @param {number} n
   * @returns {string}
   */
  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /**
   * 把时间戳格式化成「当时的时间」，按与现在的距离自动切换粒度。
   * @param {number} ts 目标时间戳
   * @param {number} [now] 当前时间戳（测试可注入）
   * @returns {string}
   */
  function formatTime(ts, now) {
    var t = toInt(ts, 0);
    if (!t) return '—';
    var n = toInt(now, 0) || Date.now();
    var d = new Date(t);
    var dn = new Date(n);
    var diff = n - t;

    if (diff >= 0 && diff < 60 * 1000) return '刚刚';

    var hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    var sameDay = (d.getFullYear() === dn.getFullYear() &&
      d.getMonth() === dn.getMonth() && d.getDate() === dn.getDate());
    if (sameDay) return '今天 ' + hm;

    var yest = new Date(dn.getFullYear(), dn.getMonth(), dn.getDate() - 1);
    if (d.getFullYear() === yest.getFullYear() &&
      d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate()) {
      return '昨天 ' + hm;
    }

    if (d.getFullYear() === dn.getFullYear()) {
      return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + hm;
    }
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /**
   * 序列化为存储字符串。
   * @param {Array} list
   * @returns {string}
   */
  function serialize(list) {
    return JSON.stringify({ v: VERSION, records: trim(sortRecords(list)) });
  }

  /**
   * 解析存储字符串；损坏 / 旧格式一律安全降级为空榜。
   * @param {string} text
   * @returns {Array}
   */
  function parse(text) {
    if (!text) return [];
    try {
      var obj = JSON.parse(text);
      var arr = obj && obj.records ? obj.records : obj;
      return normalize(arr);
    } catch (e) {
      return [];
    }
  }

  return {
    LIMIT: LIMIT,
    VERSION: VERSION,
    makeRecord: makeRecord,
    compare: compare,
    sortRecords: sortRecords,
    trim: trim,
    normalize: normalize,
    addRecord: addRecord,
    stats: stats,
    medalOf: medalOf,
    difficultyLabel: difficultyLabel,
    formatTime: formatTime,
    serialize: serialize,
    parse: parse
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Ranking;
}
if (typeof window !== 'undefined') {
  window.Ranking = Ranking;
}
