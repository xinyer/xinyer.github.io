/* =========================================================
   problems.js — 三档难度下的「牌面」生成
   ---------------------------------------------------------
   规则：卡片代表的目标数字始终是 1~9（决定翻牌顺序），
         模式只改变牌面显示什么。

     简单 easy —— 直接显示数字：            7
     困难 hard —— 10 以内的加减法：         3+4 / 10-3
     地狱 hell —— 100 以内加减乘除（含两三项）：72÷8 / 85-76 / 6×7-33 / 56-50+3

   地狱模式的两条硬约束（保证心算可行）：
     · 出现的每个数字、以及每一步的中间结果都不超过 100
     · 中间结果不出现负数（不做「先减后加」跨零的题）
   ========================================================= */
window.Problems = (function () {
  'use strict';

  var MODES = [
    { id: 'easy', name: '简单', desc: '直接显示 1-9 的数字', tone: '#7ed0b0' },
    { id: 'hard', name: '困难', desc: '10 以内的加法与减法', tone: '#ffc46b' },
    { id: 'hell', name: '地狱', desc: '100 以内加减乘除', tone: '#ff7a6b' }
  ];

  var MODE_IDS = MODES.map(function (m) { return m.id; });

  var ADD = '+';
  var SUB = '-';
  var MUL = '×';
  var DIV = '÷';

  function randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------
     困难：10 以内加减法，两项
       n = 1 时没有合法加法（a、b 都要 ≥ 1），只有减法分支
     --------------------------------------------------------- */
  function hardExpr(n) {
    var candidates = [];

    // a + b = n
    for (var a = 1; a < n; a++) {
      candidates.push(a + ADD + (n - a));
    }

    // a - b = n，且 a ≤ 10
    for (var b = 1; b <= 10 - n; b++) {
      candidates.push((n + b) + SUB + b);
    }

    return pick(candidates);
  }

  /* ---------------------------------------------------------
     地狱：100 以内加减乘除
     每类都写成「随机试一次，不合法就返回 null」，然后打乱顺序逐个试，
     比枚举全部候选省事，也天然带随机性。
     --------------------------------------------------------- */
  function hellExpr(n) {
    var makers = [
      // 85 - 76 = 9  （两位数减法）
      function () {
        var b = randInt(1, 100 - n);
        return (n + b) + SUB + b;
      },

      // 72 ÷ 8 = 9  （除法，被除数 ≤ 100）
      function () {
        var maxD = Math.min(9, Math.floor(100 / n));
        if (maxD < 2) return null;
        var d = randInt(2, maxD);
        return (n * d) + DIV + d;
      },

      // 6 × 7 - 33 = 9  （先乘后减，中间结果 ≤ 81）
      function () {
        var k = randInt(2, 9);
        var m = randInt(2, 9);
        var p = k * m;
        if (p <= n) return null;
        return k + MUL + m + SUB + (p - n);
      },

      // 2 × 3 + 3 = 9  （先乘后加）
      function () {
        var k = randInt(2, 9);
        var m = randInt(2, 9);
        var p = k * m;
        if (p >= n) return null;
        return k + MUL + m + ADD + (n - p);
      },

      // 47 + 8 - 46 = 9  （三项加减，和 ≤ 100）
      function () {
        var a = randInt(11, 60);
        var b = randInt(5, 40);
        if (a + b > 100) return null;
        var c = a + b - n;
        if (c < 1 || c > 100) return null;
        return a + ADD + b + SUB + c;
      },

      // 56 - 50 + 3 = 9  （先减后加，中间结果不为负）
      function () {
        var c = randInt(1, Math.max(1, n - 1));   // c < n 才能保证 a > b
        var b = randInt(11, 60);
        var a = n + b - c;
        if (a <= b || a > 100) return null;       // 取严格大于，避免出现 39-39 这种
        return a + SUB + b + ADD + c;
      }
    ];

    var order = shuffled(makers);
    for (var i = 0; i < order.length; i++) {
      var expr = order[i]();
      if (expr) return expr;
    }

    // 理论到不了这里（两位数减法分支对任意 n ∈ [1,9] 都成立）
    return n + ADD + '0';
  }

  var BUILDERS = {
    easy: function (n) { return String(n); },
    hard: hardExpr,
    hell: hellExpr
  };

  /* ---------------------------------------------------------
     求值：只用于自检（生产代码不需要，因为牌面由生成器保证）
     支持 + - × ÷，按从左到右计算（与牌面读法一致）
     --------------------------------------------------------- */
  function evaluate(expr) {
    var tokens = String(expr).match(/\d+|[+\-×÷]/g);
    if (!tokens) return NaN;

    var acc = Number(tokens[0]);
    for (var i = 1; i < tokens.length; i += 2) {
      var op = tokens[i];
      var val = Number(tokens[i + 1]);
      if (op === ADD) acc += val;
      else if (op === SUB) acc -= val;
      else if (op === MUL) acc *= val;
      else if (op === DIV) acc /= val;
      else return NaN;
    }
    return acc;
  }

  /* 把算式里出现的所有数字取出来（自检用） */
  function operands(expr) {
    var m = String(expr).match(/\d+/g);
    return m ? m.map(Number) : [];
  }

  return {
    MODES: MODES,
    MODE_IDS: MODE_IDS,

    isMode: function (id) {
      return MODE_IDS.indexOf(id) !== -1;
    },

    mode: function (id) {
      for (var i = 0; i < MODES.length; i++) {
        if (MODES[i].id === id) return MODES[i];
      }
      return MODES[0];
    },

    /** 生成结果等于 n 的牌面文本 */
    make: function (mode, n) {
      var fn = BUILDERS[mode] || BUILDERS.easy;
      return fn(n);
    },

    /**
     * 为一整局生成牌面
     * 返回 { 1: '3+4', 2: '2×3+3', ..., 9: '85-76' }
     * 每个数字只有一个牌面，所以天然不会重复。
     */
    makeSet: function (mode, total) {
      var out = {};
      for (var n = 1; n <= (total || 9); n++) {
        out[n] = this.make(mode, n);
      }
      return out;
    },

    /* —— 以下两个只给自检脚本用 —— */
    evaluate: evaluate,
    operands: operands
  };
})();
