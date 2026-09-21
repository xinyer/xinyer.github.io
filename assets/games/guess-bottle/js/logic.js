/**
 * logic.js —— 《猜瓶子》纯逻辑层
 *
 * 本文件不依赖任何 DOM / 浏览器 API，可在浏览器与 Node 中同时使用，
 * 便于 QA 直接 require() 进行单元测试。
 */
var GameLogic = (function () {
  'use strict';

  /**
   * 六种动森风柔和配色（低饱和马卡龙色，对色弱相对友好）。
   *
   * 取值原则（与 styles.css 的动森色板 / 页面木色纸卡底统一）：
   *  1. 饱和度压在 45%~80%、明度 55%~82%，去掉原先刺眼的糖果高饱和色；
   *  2. 每一对颜色的 CIEDE2000 色差 ≥23（正常视线），
   *     红绿色盲模拟下最小色差 8.3 / 12.3（旧色板仅 3.3 / 3.4）；
   *  3. 顺序 red→blue→green→yellow→purple→orange 即「区分度从易到难」，
   *     pickColors(n) 取前 n 个，保证 3 瓶局用的是最好分辨的红/蓝/绿。
   *  4. 绿取偏青的「岛上植物绿」，既避开草地绿(#86C953)糊在一起，
   *     也避免在红绿色盲下与橙撞色。
   *
   * hex  —— 瓶身填充（QA 靠它反解答案，必须严格等于 .bottle-body 的 fill）
   * dark —— 同色系暖调深色（瓶底内侧暗部，营造玻璃体积感）
   * @type {Array<{id:string,name:string,hex:string,dark:string}>}
   */
  var COLORS = [
    { id: 'red',    name: '红', hex: '#EC6F80', dark: '#BF4A5A' },
    { id: 'blue',   name: '蓝', hex: '#74BCE5', dark: '#3F7FA8' },
    { id: 'green',  name: '绿', hex: '#79C98C', dark: '#4A9A63' },
    { id: 'yellow', name: '黄', hex: '#F5D06B', dark: '#C9A03A' },
    { id: 'purple', name: '紫', hex: '#AC8FDD', dark: '#7757A8' },
    { id: 'orange', name: '橙', hex: '#E88A45', dark: '#BC6420' }
  ];

  /**
   * 安全地把任意值转为整数。
   * @param {*} value
   * @param {number} fallback
   * @returns {number}
   */
  function toInt(value, fallback) {
    var n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }

  /**
   * 从 COLORS 中取出前 n 个不重复颜色（返回对象数组）。
   * n 会被钳制到 [0, COLORS.length]。
   * @param {number} n
   * @returns {Array<Object>}
   */
  function pickColors(n) {
    var count = Math.max(0, Math.min(COLORS.length, toInt(n, 0)));
    var result = [];
    for (var i = 0; i < count; i++) {
      result.push(COLORS[i]);
    }
    return result;
  }

  /**
   * Fisher–Yates 洗牌，返回新数组（不修改入参）。
   * @param {Array} arr 待洗牌的数组
   * @param {Function} [rng] 返回 [0,1) 的随机函数，默认 Math.random（便于测试注入）
   * @returns {Array} 洗牌后的新数组
   */
  function shuffle(arr, rng) {
    var random = (typeof rng === 'function') ? rng : Math.random;
    var out = (arr || []).slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /**
   * 生成一个谜题。
   *
   * 规则：
   *  1. 取 n 个不重复颜色并打乱成一个颜色序列；
   *  2. 在 total = n + m 个槽位中随机挑选 m 个位置置为 null（空格）；
   *  3. 其余槽位按「从左到右」的顺序依次填入颜色序列。
   * 因此当 m = 0 时即为纯粹的随机颜色排列。
   *
   * @param {number} n 瓶子个数
   * @param {number} m 空格个数
   * @param {Function} [rng] 随机函数（测试可注入）
   * @returns {{bottleCount:number,emptyCount:number,total:number,slots:Array,colors:Array}}
   */
  function createSecret(n, m, rng) {
    var random = (typeof rng === 'function') ? rng : Math.random;
    var conf = parseDifficulty(n, m);
    n = conf.n;
    m = conf.m;

    var total = n + m;
    var sequence = shuffle(pickColors(n), random); // 打乱后的颜色序列

    // 随机选出 m 个空位
    var positions = [];
    for (var p = 0; p < total; p++) {
      positions.push(p);
    }
    var shuffledPositions = shuffle(positions, random);
    var emptySet = {};
    for (var e = 0; e < m; e++) {
      emptySet[shuffledPositions[e]] = true;
    }

    // 初始化槽位并填充颜色
    var slots = new Array(total);
    var cursor = 0;
    for (var s = 0; s < total; s++) {
      if (emptySet[s]) {
        slots[s] = null;          // 空格
      } else {
        slots[s] = sequence[cursor];
        cursor++;
      }
    }

    return {
      bottleCount: n,
      emptyCount: m,
      total: total,
      slots: slots,
      colors: sequence
    };
  }

  /**
   * 判断两个槽位内容是否「相同」。
   * 允许传入颜色对象或颜色 id 字符串；两者可混用。
   * 双方同为 null（空格）视为相同。
   * @param {Object|string|null} a
   * @param {Object|string|null} b
   * @returns {boolean}
   */
  function colorsEqual(a, b) {
    if (a === null || a === undefined) {
      return (b === null || b === undefined);
    }
    if (b === null || b === undefined) {
      return false;
    }
    var ida = (typeof a === 'string') ? a : a.id;
    var idb = (typeof b === 'string') ? b : b.id;
    return ida === idb;
  }

  /**
   * 逐槽比对玩家猜想与谜题。
   * @param {(Object|Array)} secret 谜题对象（取 .slots）或直接传入 slots 数组
   * @param {Array} guess 玩家猜想，长度应为 total，元素为颜色对象/id 或 null
   * @returns {{correct:number,total:number}}
   */
  function scoreGuess(secret, guess) {
    var slots = (secret && secret.slots) ? secret.slots : (secret || []);
    var g = guess || [];
    var total = slots.length;
    var correct = 0;
    for (var i = 0; i < total; i++) {
      if (colorsEqual(slots[i], g[i])) {
        correct++;
      }
    }
    return { correct: correct, total: total };
  }

  /**
   * 是否完全猜对。
   * @param {number} correct
   * @param {number} total
   * @returns {boolean}
   */
  function isWin(correct, total) {
    return correct === total;
  }

  /**
   * 玩家是否已把 n 个瓶子全部放上架子。
   * @param {Array} guess
   * @param {number} n
   * @returns {boolean}
   */
  function isValidGuess(guess, n) {
    var g = guess || [];
    var placed = 0;
    for (var i = 0; i < g.length; i++) {
      if (g[i] !== null && g[i] !== undefined) {
        placed++;
      }
    }
    return placed === n;
  }

  /**
   * 难度参数边界钳制：瓶子数 3~6，空格数 0~2，且 n + m <= 8。
   * @param {number} n
   * @param {number} m
   * @returns {{n:number,m:number}}
   */
  function parseDifficulty(n, m) {
    var nn = toInt(n, 4);
    var mm = toInt(m, 0);

    nn = Math.min(6, Math.max(3, nn));
    mm = Math.min(2, Math.max(0, mm));
    if (nn + mm > 8) {
      mm = Math.max(0, 8 - nn);
    }
    return { n: nn, m: mm };
  }

  return {
    COLORS: COLORS,
    pickColors: pickColors,
    shuffle: shuffle,
    createSecret: createSecret,
    scoreGuess: scoreGuess,
    isWin: isWin,
    isValidGuess: isValidGuess,
    parseDifficulty: parseDifficulty
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameLogic;
}
if (typeof window !== 'undefined') {
  window.GameLogic = GameLogic;
}
