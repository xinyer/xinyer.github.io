/**
 * store.js —— 榜单的本地持久化适配层
 *
 * 只做一件事：把 localStorage 包成「永远不会抛异常」的读写接口。
 * 三种环境下都不能让游戏挂掉：
 *   1. 正常浏览器 —— 走 localStorage；
 *   2. 隐私模式 / 存储被禁用 / file:// 下被拒 —— 降级为内存数组（本次会话内有效）；
 *   3. 存储里的 JSON 被人手改坏 —— 交给 Ranking.parse 安全降级为空榜。
 */
var RankingStore = (function () {
  'use strict';

  var KEY = 'guess-bottle/ranking/v1';
  var memory = null;    // 内存兜底（也是写入失败的最后一层）
  var probed;           // undefined = 未探测；null = 不可用；其余为可用的 Storage

  /**
   * 探测 localStorage 是否真的可写（Safari 隐私模式下会存在但 setItem 抛错）。
   * @returns {Storage|null}
   */
  function storage() {
    if (probed !== undefined) return probed;
    probed = null;
    try {
      var s = window.localStorage;
      var probe = KEY + '/probe';
      s.setItem(probe, '1');
      if (s.getItem(probe) !== '1') throw new Error('probe mismatch');
      s.removeItem(probe);
      probed = s;
    } catch (e) {
      probed = null;
    }
    return probed;
  }

  /**
   * 本机是否真的能持久化（供 UI 提示「本机保存」还是「仅本次有效」）。
   * @returns {boolean}
   */
  function available() {
    return !!storage();
  }

  /**
   * 读取榜单。
   * @returns {Array}
   */
  function load() {
    var s = storage();
    if (!s) return memory ? memory.slice() : [];
    try {
      var text = s.getItem(KEY);
      return text ? Ranking.parse(text) : [];
    } catch (e) {
      return memory ? memory.slice() : [];
    }
  }

  /**
   * 写入榜单（同时更新内存副本）。
   * @param {Array} list
   * @returns {boolean} 是否真正落盘
   */
  function save(list) {
    var clean = Ranking.normalize(list);
    memory = clean;
    var s = storage();
    if (!s) return false;
    try {
      s.setItem(KEY, Ranking.serialize(clean));
      return true;
    } catch (e) {
      return false; // 配额满 / 被拒 → 内存副本仍然有效
    }
  }

  /**
   * 清空榜单。
   * @returns {void}
   */
  function clear() {
    memory = [];
    var s = storage();
    if (!s) return;
    try {
      s.removeItem(KEY);
    } catch (e) { /* 忽略：清不掉也不该崩 */ }
  }

  return {
    KEY: KEY,
    available: available,
    load: load,
    save: save,
    clear: clear
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RankingStore;
}
if (typeof window !== 'undefined') {
  window.RankingStore = RankingStore;
}
