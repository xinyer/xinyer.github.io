/* =========================================================
   game.js — 游戏核心状态机（纯逻辑，不碰 DOM）
   ---------------------------------------------------------
   规则：
   · 9 张卡片，正面是 1-9，位置随机打乱，初始全部背面朝上
   · 玩家依次点击卡片，卡片翻转显示数字
   · 只有当点击出来的数字序列恰好是 1,2,3,…,9 时才算成功
   · 任何一次点错 → 所有已翻开的卡片全部翻回背面，进度清零
   ========================================================= */
window.MemoryGame = (function () {
  'use strict';

  var DEFAULTS = {
    total: 9,          // 卡片数量
    peekMs: 760,       // 点错后停留展示的时间（让玩家看清错在哪）
    sweepMs: 70        // 翻回时每张卡片的错峰间隔
  };

  /* Fisher-Yates 洗牌 */
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function range(from, to) {
    var out = [];
    for (var n = from; n <= to; n++) out.push(n);
    return out;
  }

  /* ---------------------------------------------------------
     构造：options 可覆盖 total / peekMs / sweepMs
     --------------------------------------------------------- */
  function MemoryGame(options) {
    this.options = Object.assign({}, DEFAULTS, options || {});
    this._handlers = {};
    this._timer = null;
    /* 时钟可注入，便于在 Node 里确定性地测试计时逻辑 */
    this._now = (options && typeof options.now === 'function') ? options.now : Date.now;
    this.reset();
  }

  /* ---------- 极简事件系统 ---------- */
  MemoryGame.prototype.on = function (event, handler) {
    (this._handlers[event] || (this._handlers[event] = [])).push(handler);
    return this;
  };

  MemoryGame.prototype._emit = function (event, payload) {
    var list = this._handlers[event];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      list[i].call(this, payload);
    }
  };

  /* ---------- 开局 / 重开 ---------- */
  MemoryGame.prototype.reset = function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    var total = this.options.total;

    /** order[cardIndex] = 该位置上卡片的数字 */
    this.order = shuffle(range(1, total));
    /** 本次已按顺序翻开的数字 */
    this.sequence = [];
    /** 失误次数 */
    this.misses = 0;
    /** 处于错误展示期，期间不接受点击 */
    this.locked = false;
    /** 是否已通关 */
    this.finished = false;
    /** 计时：第一次点击才起表；点错翻回时继续走，不重置 */
    this.startedAt = null;
    this.elapsedMs = 0;

    this._emit('reset', this.snapshot());
    return this;
  };

  /* ---------- 对外快照 ---------- */
  MemoryGame.prototype.snapshot = function () {
    return {
      order: this.order.slice(),
      sequence: this.sequence.slice(),
      misses: this.misses,
      total: this.options.total,
      /** 下一个该翻的数字 */
      next: this.sequence.length + 1,
      finished: this.finished,
      locked: this.locked,
      elapsing: this.startedAt !== null && !this.finished,
      elapsedMs: this.elapsed()
    };
  };

  /**
   * 当前已用时间（毫秒）
   *   未开始点击 → 0
   *   通关后     → 定格的总用时
   */
  MemoryGame.prototype.elapsed = function () {
    if (this.finished) return this.elapsedMs;
    if (this.startedAt === null) return 0;
    return this._now() - this.startedAt;
  };

  /* ---------- 查询 ---------- */
  MemoryGame.prototype.numberAt = function (index) {
    return this.order[index];
  };

  /** 该位置的卡片当前是否处于翻开状态 */
  MemoryGame.prototype.isOpenAt = function (index) {
    return this.sequence.indexOf(this.order[index]) !== -1;
  };

  /** 该位置的卡片是否已经"正确锁定" */
  MemoryGame.prototype.isDoneAt = function (index) {
    return this.isOpenAt(index);
  };

  /* ---------------------------------------------------------
     核心动作：点击第 index 张卡片
     返回本次结果对象，未生效则返回 null
     --------------------------------------------------------- */
  MemoryGame.prototype.pick = function (index) {
    if (this.locked || this.finished) return null;
    if (index < 0 || index >= this.order.length) return null;
    if (this.isOpenAt(index)) return null; // 已翻开，忽略重复点击

    // 首次点击才起表
    if (this.startedAt === null) this.startedAt = this._now();

    var number = this.order[index];
    var step = this.sequence.length + 1; // 这一次点击"应该"是几
    this.sequence.push(number);

    var result = {
      index: index,
      number: number,
      step: step,
      total: this.options.total,
      correct: number === step
    };

    this._emit('flip', result);

    if (result.correct) {
      this._emit('correct', result);

      if (this.sequence.length === this.options.total) {
        this.finished = true;
        // 停表
        this.elapsedMs = this.startedAt === null ? 0 : this._now() - this.startedAt;
        this._emit('win', this.snapshot());
      }
    } else {
      this.misses += 1;
      this.locked = true;
      this._emit('wrong', result);
      this._beginSweepBack();
    }

    return result;
  };

  /* 点错后：稍作停留 → 把所有卡片翻回背面 */
  MemoryGame.prototype._beginSweepBack = function () {
    var self = this;
    var total = self.options.total;

    self._timer = setTimeout(function () {
      self._timer = null;
      self.sequence = [];
      self.locked = false;
      self._emit('sweep', self.snapshot());
    }, self.options.peekMs);

    // 兜底：确保计时器不会因为页面隐藏而卡死状态（同时暴露给 UI 做归档）
    self._sweepPlan = {
      delay: self.options.peekMs,
      stagger: self.options.sweepMs,
      total: total
    };
  };

  /** 甩掉待执行的计时器（例如玩家中途重开） */
  MemoryGame.prototype.dispose = function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  };

  return MemoryGame;
})();
