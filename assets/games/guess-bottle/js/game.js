/**
 * game.js —— UI 绑定、拖拽 / 点选交互与主流程
 *
 * 依赖（按顺序在 index.html 中加载）：
 *   window.GameLogic    —— 纯逻辑
 *   window.Bottle       —— 瓶子 SVG 渲染
 *   window.Ranking      —— 排行榜纯逻辑
 *   window.RankingStore —— 榜单本地持久化
 *   window.Sound        —— WebAudio 音效
 */
(function () {
  'use strict';

  var L = window.GameLogic;
  var B = window.Bottle;
  var R = window.Ranking;
  var RS = window.RankingStore;
  var S = window.Sound;

  var DEFAULT_N = 4;
  var DEFAULT_M = 0;
  var DRAG_THRESHOLD = 6;

  var els = {};          // 缓存的 DOM 节点
  var state = {};        // 游戏状态
  var drag = null;       // 进行中的拖拽
  var selection = null;  // 点选状态 { from:'pool'|'slot', colorId, index? }

  /* ============================ 工具函数 ============================ */

  /**
   * 按 id 取 DOM。
   * @param {string} id
   * @returns {HTMLElement}
   */
  function $(id) { return document.getElementById(id); }

  /**
   * 根据颜色 id 取颜色对象。
   * @param {string} id
   * @returns {{id:string,name:string,hex:string,dark:string}}
   */
  function colorById(id) {
    var list = L.COLORS;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return { id: id, name: String(id), hex: '#CCCCCC', dark: '#999999' };
  }

  /**
   * 元素是否位于指定祖先内。
   * @param {Element} el
   * @param {string} selector
   * @returns {Element|null}
   */
  function closest(el, selector) {
    if (!el || typeof el.closest !== 'function') return null;
    return el.closest(selector);
  }

  /* ============================ DOM 缓存 ============================ */

  function cacheDom() {
    els.bottleCountGroup = $('bottleCountGroup');
    els.emptyCountGroup = $('emptyCountGroup');
    els.btnRestart = $('btnRestart');
    els.btnSound = $('btnSound');
    els.btnGiveUp = $('btnGiveUp');
    els.shelf = $('shelf');
    els.slotRow = $('slotRow');
    els.backRow = $('backRow');
    els.pool = $('pool');
    els.btnGuess = $('btnGuess');
    els.placedInfo = $('placedInfo');
    els.resultMsg = $('resultMsg');
    els.historyList = $('historyList');
    els.rankingList = $('rankingList');
    els.rankingStats = $('rankingStats');
    els.btnClearRanking = $('btnClearRanking');
    els.ghostLayer = $('ghostLayer');
    els.confettiLayer = $('confettiLayer');
    els.overlay = $('overlay');
    els.overlayCard = $('overlayCard');
  }

  /* ============================ 游戏状态 ============================ */

  /**
   * 开新一局。
   * @param {number} n 瓶子个数
   * @param {number} m 空格个数
   */
  function newGame(n, m) {
    var conf = L.parseDifficulty(n, m);
    state.n = conf.n;
    state.m = conf.m;
    state.secret = L.createSecret(conf.n, conf.m);
    state.total = state.secret.total;
    state.placement = new Array(state.total);
    for (var i = 0; i < state.total; i++) {
      state.placement[i] = null;
    }
    state.attempts = [];
    state.solved = false;
    state.revealed = false;
    state.lastGuessKey = null;

    // 本局战绩（局终写进排行榜）
    state.roundGuesses = 0;   // 本局点了几次「猜瓶子」（排名依据）
    state.roundBest = 0;      // 本局单次最高命中数（榜上展示的「成功 X/Y」）
    state.recorded = false;   // 防止同一局重复入榜

    selection = null;
    drag = null;

    // 产品规则：瓶子池的显示顺序与「答案填充顺序」相互独立地洗牌一次，
    // 且保证「池顺序 ≠ 答案排列」——避免玩家第一脚无脑按池子从左到右摆放就白送胜利。
    // 仅在开局时洗牌一次并存入 state，拖拽过程中顺序保持稳定（不会跳位）。
    var poolIds = [];
    var poolSeq = state.secret.colors;
    for (var p = 0; p < poolSeq.length; p++) {
      poolIds.push(poolSeq[p].id);
    }
    var secretKey = poolIds.join(',');
    var guard = 0;
    do {
      state.poolOrder = L.shuffle(poolIds);
      guard++;
    } while (state.poolOrder.join(',') === secretKey && guard < 50); // 安全上限，防意外死循环

    closeOverlay();
    els.btnGiveUp.disabled = false;
    updateSegmented();
    renderShelf();
    renderPool();
    renderHistory();
    renderResult('', '');
    updateGuessButton();
  }

  /**
   * 更新难度分段按钮的选中态。
   */
  function updateSegmented() {
    var nBtns = els.bottleCountGroup.querySelectorAll('button');
    for (var i = 0; i < nBtns.length; i++) {
      var nv = parseInt(nBtns[i].getAttribute('data-n'), 10);
      nBtns[i].classList.toggle('active', nv === state.n);
    }
    var mBtns = els.emptyCountGroup.querySelectorAll('button');
    for (var j = 0; j < mBtns.length; j++) {
      var mv = parseInt(mBtns[j].getAttribute('data-m'), 10);
      mBtns[j].classList.toggle('active', mv === state.m);
    }
  }

  /* ============================ 渲染 ============================ */

  /**
   * 渲染架子：上排玩家放置槽位 + 下排神秘背面剪影。
   */
  function renderShelf() {
    var html = '';
    for (var i = 0; i < state.total; i++) {
      var colorId = state.placement[i];
      var color = colorId ? colorById(colorId) : null;
      var inner = color ? B.colored(color) : B.outline();
      var cls = 'slot' + (color ? ' slot-filled' : ' slot-empty');
      html += '<div class="' + cls + '" data-index="' + i + '">' + inner + '</div>';
    }
    els.slotRow.innerHTML = html;
    renderBacks();
  }

  /**
   * 渲染神秘瓶子背面。
   * 未揭示答案时，所有槽位（含空格）一律显示完全一致的背面剪影，绝不泄漏信息。
   */
  function renderBacks() {
    var html = '';
    for (var i = 0; i < state.total; i++) {
      var cellCls = 'back-cell';
      var inner;
      if (state.revealed) {
        var c = state.secret.slots[i];
        if (c) {
          inner = B.colored(c);
        } else {
          inner = '<div class="empty-mark">空</div>';
          cellCls += ' back-cell-empty';
        }
      } else {
        inner = B.back();
      }
      html += '<div class="' + cellCls + '">' + inner + '</div>';
    }
    els.backRow.innerHTML = html;
  }

  /**
   * 计算当前仍在瓶子池中的颜色 id。
   * 顺序取自开局时独立洗好的 state.poolOrder（与秘密槽位顺序无关），
   * 保证池子内容恒为「全部 n 种颜色各 1 个」，且拖拽过程中顺序稳定。
   * @returns {string[]}
   */
  function getPoolColorIds() {
    var used = {};
    for (var i = 0; i < state.total; i++) {
      if (state.placement[i]) used[state.placement[i]] = true;
    }
    var ids = [];
    var order = state.poolOrder || [];
    for (var j = 0; j < order.length; j++) {
      if (!used[order[j]]) ids.push(order[j]);
    }
    return ids;
  }

  /**
   * 渲染瓶子池。
   */
  function renderPool() {
    var ids = getPoolColorIds();
    if (ids.length === 0) {
      els.pool.classList.add('pool-done');
      els.pool.innerHTML = '<div class="pool-empty-hint">瓶子都放上架子啦～</div>';
      return;
    }
    els.pool.classList.remove('pool-done');
    var html = '';
    for (var i = 0; i < ids.length; i++) {
      var color = colorById(ids[i]);
      html += '<div class="pool-bottle" data-color="' + ids[i] + '">' + B.colored(color) + '</div>';
    }
    els.pool.innerHTML = html;
    applySelection();
  }

  /**
   * 渲染尝试记录。
   */
  function renderHistory() {
    if (state.attempts.length === 0) {
      els.historyList.innerHTML =
        '<div class="history-empty">还没有猜过瓶子～ 摆好后点「猜瓶子」试试吧！</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < state.attempts.length; i++) {
      var a = state.attempts[i];
      var dots = '';
      for (var k = 0; k < state.total; k++) {
        var cid = a.guess[k];
        if (cid) {
          var c = colorById(cid);
          dots += '<span class="dot" style="background:' + c.hex + '"></span>';
        } else {
          dots += '<span class="dot dot-empty"></span>';
        }
      }
      var perfect = L.isWin(a.correct, a.total);
      html += '<div class="history-row' + (perfect ? ' history-win' : '') + '">' +
        '<span class="history-index">#' + (i + 1) + '</span>' +
        '<span class="history-dots">' + dots + '</span>' +
        '<span class="history-score">' + a.correct + '/' + a.total + '</span>' +
        '</div>';
    }
    els.historyList.innerHTML = html;
    els.historyList.scrollTop = els.historyList.scrollHeight;
  }

  /**
   * 设置结果文案。
   * @param {string} text
   * @param {string} kind 'win' | 'guess' | 'giveup' | ''
   */
  function renderResult(text, kind) {
    els.resultMsg.textContent = text || '';
    els.resultMsg.className = 'result' + (kind ? ' result-' + kind : '');
  }

  /* ============================ 成绩排行榜 ============================ */

  /**
   * 渲染排行榜（汇总条 + 名次列表）。
   * 只把数字/时间写进 HTML（无用户输入），不存在注入面。
   */
  function renderRanking() {
    var list = state.records || [];
    var st = R.stats(list);

    // 汇总条：共几局 / 成功几次 / 最快几回
    var chips = '<span class="ranking-chip">共 <b>' + st.plays + '</b> 局</span>' +
      '<span class="ranking-chip">成功 <b>' + st.wins + '</b> 次</span>';
    if (st.wins > 0) {
      chips += '<span class="ranking-chip is-best">最快 <b>' + st.fastest + '</b> 次猜对</span>';
    }
    if (st.plays > 0) {
      chips += '<span class="ranking-chip is-hint">平均 ' + st.avgGuesses + ' 次/局</span>';
    }
    // 存储不可用时说清楚，避免玩家以为成绩丢了
    if (!state.rankingSaved) {
      chips += '<span class="ranking-chip is-hint">本机存储不可用，成绩仅本次有效</span>';
    }
    els.rankingStats.innerHTML = chips;

    if (list.length === 0) {
      els.rankingList.innerHTML = '<div class="ranking-empty">还没有成绩～ 猜一局就会上榜啦！</div>';
      return;
    }

    var now = Date.now();
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var rank = i + 1;
      var medal = R.medalOf(rank);
      var latest = (r.id === state.lastRecordId) ? ' is-latest' : '';
      var top = rank <= 3 ? ' is-top' : '';
      html += '<div class="ranking-row' + top + latest + '" data-rank="' + rank + '"' +
        ' data-count="' + r.guesses + '">' +
        '<span class="rank-medal">' + (medal || rank) + '</span>' +
        '<span class="rank-guesses"><b>' + r.guesses + '</b> 次</span>' +
        '<span class="rank-success' + (r.won ? '' : ' is-miss') + '">成功 ' +
          r.best + '/' + r.total + (r.won ? ' 🎉' : '') + '</span>' +
        '<span class="rank-diff">' + R.difficultyLabel(r) + '</span>' +
        '<span class="rank-time">' + R.formatTime(r.at, now) + '</span>' +
        '</div>';
    }
    els.rankingList.innerHTML = html;
  }

  /**
   * 一局结束时把战绩写进排行榜（同一局只会写一次）。
   * @param {string} reason 'win' | 'giveup'
   * @returns {{rank:number,record:Object}|null} 未达标（一次都没猜）时返回 null
   */
  function finalizeRound(reason) {
    if (state.recorded) return null;
    state.recorded = true;
    if (!state.roundGuesses || state.roundGuesses <= 0) return null;

    var res = R.addRecord(state.records, {
      at: Date.now(),
      guesses: state.roundGuesses,
      best: state.roundBest,
      total: state.total,
      n: state.n,
      m: state.m,
      won: state.solved
    });
    state.records = res.list;
    state.lastRank = res.rank;
    state.lastRecordId = res.record.id;
    state.rankingSaved = RS.save(state.records);
    renderRanking();
    return res;
  }

  /**
   * 弹窗询问后清空排行榜。
   */
  function askClearRanking() {
    showOverlay(
      '<div class="overlay-emoji">🧹</div>' +
      '<h2>清空排行榜？</h2>' +
      '<p>一共 <b>' + (state.records || []).length + '</b> 条成绩，清空后就找不回来啦</p>' +
      '<button type="button" class="btn btn-primary" id="overlayClearYes">清空</button>' +
      '<button type="button" class="btn btn-ghost" id="overlayClearNo">算了</button>'
    );
    var yes = $('overlayClearYes');
    var no = $('overlayClearNo');
    if (yes) {
      yes.addEventListener('click', function () {
        RS.clear();
        state.records = [];
        state.lastRecordId = null;
        state.lastRank = 0;
        renderRanking();
        closeOverlay();
        toast('排行榜已清空');
      });
    }
    if (no) no.addEventListener('click', closeOverlay);
  }

  /**
   * 结果文案做一次弹动闪烁。
   */
  function flashResult() {
    els.resultMsg.classList.remove('flash');
    void els.resultMsg.offsetWidth;
    els.resultMsg.classList.add('flash');
  }

  /**
   * 刷新选中态高亮。
   */
  function applySelection() {
    var nodes = document.querySelectorAll('.selected');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove('selected');
    }
    if (!selection) return;
    if (selection.from === 'pool') {
      var el = els.pool.querySelector('.pool-bottle[data-color="' + selection.colorId + '"]');
      if (el) el.classList.add('selected');
    } else {
      var slot = els.slotRow.querySelector('.slot[data-index="' + selection.index + '"]');
      if (slot) slot.classList.add('selected');
    }
  }

  /**
   * 已放置的瓶子数量。
   * @returns {number}
   */
  function countPlaced() {
    var c = 0;
    for (var i = 0; i < state.total; i++) {
      if (state.placement[i]) c++;
    }
    return c;
  }

  /**
   * 更新「猜瓶子」按钮可用态与提示文字。
   */
  function updateGuessButton() {
    var valid = !state.solved && !state.revealed && L.isValidGuess(state.placement, state.n);
    els.btnGuess.disabled = !valid;

    var need = state.n - countPlaced();
    if (state.revealed) {
      els.placedInfo.textContent = '已看答案，点「重新开始」再来一局吧';
    } else if (state.solved) {
      els.placedInfo.textContent = '全部猜对啦！🎉';
    } else if (need > 0) {
      els.placedInfo.textContent = '还要放满 ' + need + ' 个瓶子哦';
    } else {
      els.placedInfo.textContent = '已经放满啦，点「猜瓶子」试试！';
    }
  }

  /**
   * 让某个槽位做一次弹动。
   * @param {number} index
   */
  function popSlot(index) {
    var el = els.slotRow.querySelector('.slot[data-index="' + index + '"]');
    if (!el) return;
    el.classList.add('pop');
    setTimeout(function () { el.classList.remove('pop'); }, 280);
  }

  /* ============================ 摆放逻辑 ============================ */

  /**
   * 找到某颜色当前被放置在哪个槽位。
   * @param {string} colorId
   * @returns {number} 索引，未找到为 -1
   */
  function findPlacementIndex(colorId) {
    for (var i = 0; i < state.total; i++) {
      if (state.placement[i] === colorId) return i;
    }
    return -1;
  }

  /**
   * 把某个颜色放到指定槽位。
   * 该颜色会先从原位移除（保证唯一）；目标槽位原有瓶子自动回到池中（池为派生）。
   * @param {{colorId:string}} from
   * @param {number} slotIndex
   */
  function placeColorAt(from, slotIndex) {
    var colorId = from && from.colorId;
    if (!colorId) return;

    var prev = findPlacementIndex(colorId);
    if (prev !== -1) state.placement[prev] = null;
    state.placement[slotIndex] = colorId;

    afterMove();
    popSlot(slotIndex);
    S.place();
  }

  /**
   * 把槽位上的瓶子取回瓶子池。
   * @param {number} slotIndex
   */
  function returnColorToPool(slotIndex) {
    if (!state.placement[slotIndex]) return;
    state.placement[slotIndex] = null;
    afterMove();
    S.pickup();
  }

  /**
   * 交换两个槽位的瓶子。
   * @param {number} a
   * @param {number} b
   */
  function swapSlots(a, b) {
    var tmp = state.placement[a];
    state.placement[a] = state.placement[b];
    state.placement[b] = tmp;
    afterMove();
    S.place();
  }

  /**
   * 每次摆放变化后的统一刷新。
   */
  function afterMove() {
    selection = null;
    renderShelf();
    renderPool();
    renderResult('', '');
    updateGuessButton();
  }

  /* ============================ 拖拽 / 点选 ============================ */

  /**
   * 从被拖拽/点击的 DOM 解析出拖拽源。
   * @param {Element} item
   * @returns {{from:string,colorId:string,index?:number,element:Element}|null}
   */
  function resolveDraggable(item) {
    if (state.solved || state.revealed) return null;
    if (item.classList.contains('pool-bottle')) {
      return { from: 'pool', colorId: item.getAttribute('data-color'), element: item };
    }
    if (item.classList.contains('slot-filled')) {
      var slot = closest(item, '.slot');
      if (!slot) return null;
      var idx = parseInt(slot.getAttribute('data-index'), 10);
      var colorId = state.placement[idx];
      if (!colorId) return null;
      return { from: 'slot', index: idx, colorId: colorId, element: item };
    }
    return null;
  }

  /**
   * 指针按下：区分拖拽源与「点选放置」。
   * @param {PointerEvent} e
   */
  function onPointerDown(e) {
    S.unlock();

    var draggable = closest(e.target, '.pool-bottle, .slot-filled');
    if (draggable) {
      var from = resolveDraggable(draggable);
      if (!from) return;
      drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        from: from,
        moved: false,
        ghostEl: null
      };
      return;
    }

    // 未命中拖拽源：处理「点选放置」到空槽位
    var slotEl = closest(e.target, '.slot');
    if (slotEl) {
      var idx = parseInt(slotEl.getAttribute('data-index'), 10);
      if (selection && selection.from === 'pool') {
        placeColorAt({ colorId: selection.colorId }, idx);
      } else if (selection && selection.from === 'slot') {
        if (selection.index === idx) {
          selection = null;
          applySelection();
        } else {
          swapSlots(selection.index, idx);
        }
      }
      return;
    }

    // 点击池背景：把选中的槽位瓶子取回池中；否则取消选择
    if (closest(e.target, '#pool') && selection) {
      if (selection.from === 'slot') {
        returnColorToPool(selection.index);
      } else {
        selection = null;
        applySelection();
      }
    }
  }

  /**
   * 指针移动：超过阈值后开始拖拽。
   * @param {PointerEvent} e
   */
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var dx = e.clientX - drag.startX;
    var dy = e.clientY - drag.startY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (!drag.moved && dist > DRAG_THRESHOLD) {
      drag.moved = true;
      startGhost(e);
    }
    if (drag.moved) {
      e.preventDefault();
      moveGhost(e.clientX, e.clientY);
      highlightUnder(e.clientX, e.clientY);
    }
  }

  /**
   * 指针抬起：结束拖拽或作为一次轻点处理。
   * @param {PointerEvent} e
   */
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var d = drag;
    drag = null;

    if (d.ghostEl && d.ghostEl.parentNode) {
      d.ghostEl.parentNode.removeChild(d.ghostEl);
    }
    if (d.from && d.from.element) {
      d.from.element.classList.remove('dragging-source');
    }
    clearHighlights();

    if (d.moved) {
      var target = dropTargetAt(e.clientX, e.clientY);
      performDrop(d.from, target);
    } else {
      handleTap(d.from);
    }
    updateGuessButton();
  }

  /**
   * 创建跟随指针的幽灵瓶子。
   * @param {PointerEvent} e
   */
  function startGhost(e) {
    var color = colorById(drag.from.colorId);
    var g = document.createElement('div');
    g.className = 'ghost-bottle';
    g.innerHTML = B.colored(color, 'bottle-ghost');
    els.ghostLayer.appendChild(g);
    drag.ghostEl = g;
    if (drag.from.element) drag.from.element.classList.add('dragging-source');
    moveGhost(e.clientX, e.clientY);
    selection = null;
    applySelection();
    S.pickup();
  }

  /**
   * 移动幽灵瓶子。
   * @param {number} x
   * @param {number} y
   */
  function moveGhost(x, y) {
    if (!drag || !drag.ghostEl) return;
    drag.ghostEl.style.left = x + 'px';
    drag.ghostEl.style.top = y + 'px';
  }

  /**
   * 计算坐标下的落点。
   * @param {number} x
   * @param {number} y
   * @returns {{type:string,index?:number}|null}
   */
  function dropTargetAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    var slot = closest(el, '.slot');
    if (slot) {
      return { type: 'slot', index: parseInt(slot.getAttribute('data-index'), 10) };
    }
    if (closest(el, '#pool')) return { type: 'pool' };
    return null;
  }

  /**
   * 高亮指针下方的落点。
   * @param {number} x
   * @param {number} y
   */
  function highlightUnder(x, y) {
    clearHighlights();
    var t = dropTargetAt(x, y);
    if (!t) return;
    if (t.type === 'slot') {
      var slot = els.slotRow.querySelector('.slot[data-index="' + t.index + '"]');
      if (slot) slot.classList.add('drop-hover');
    } else if (t.type === 'pool') {
      els.pool.classList.add('pool-hover');
    }
  }

  /**
   * 清除所有落点高亮。
   */
  function clearHighlights() {
    var hs = document.querySelectorAll('.drop-hover');
    for (var i = 0; i < hs.length; i++) {
      hs[i].classList.remove('drop-hover');
    }
    els.pool.classList.remove('pool-hover');
  }

  /**
   * 执行一次拖拽落点操作。
   * @param {{from:string,colorId:string,index?:number}} from
   * @param {{type:string,index?:number}|null} target
   */
  function performDrop(from, target) {
    if (!target) return; // 拖到空白处 → 原样返回
    if (target.type === 'slot') {
      placeColorAt({ colorId: from.colorId }, target.index);
    } else if (target.type === 'pool') {
      if (from.from === 'slot') returnColorToPool(from.index);
    }
  }

  /**
   * 轻点（非拖拽）逻辑：实现「点选放置 / 取回 / 交换」。
   * @param {{from:string,colorId:string,index?:number}} from
   */
  function handleTap(from) {
    if (from.from === 'pool') {
      if (selection && selection.from === 'slot') {
        // 先把槽位上的瓶子取回，再拿起新瓶子
        returnColorToPool(selection.index);
        selection = { from: 'pool', colorId: from.colorId };
        renderPool();
        applySelection();
      } else if (selection && selection.from === 'pool' && selection.colorId === from.colorId) {
        selection = null;
        applySelection();
      } else {
        selection = { from: 'pool', colorId: from.colorId };
        applySelection();
      }
      return;
    }

    // from slot
    var idx = from.index;
    if (selection && selection.from === 'pool') {
      placeColorAt({ colorId: selection.colorId }, idx);
    } else if (selection && selection.from === 'slot') {
      if (selection.index === idx) {
        selection = null;
        applySelection();
      } else {
        swapSlots(selection.index, idx);
      }
    } else {
      selection = { from: 'slot', index: idx, colorId: state.placement[idx] };
      applySelection();
    }
  }

  /* ============================ 猜瓶子 ============================ */

  /**
   * 点击「猜瓶子」。
   */
  function onGuess() {
    if (state.solved || state.revealed) return;
    if (!L.isValidGuess(state.placement, state.n)) return;

    // 产品规则：同一摆放快速连点「猜瓶子」只计 1 次，避免重复计分 / 重复播放动画；
    // 摆放改变后的新猜想照常计分（需求 7 允许反复调整顺序后再猜）。
    var keyParts = [];
    for (var kk = 0; kk < state.total; kk++) {
      keyParts.push(state.placement[kk] || '-');
    }
    var guessKey = keyParts.join(',');
    if (state.lastGuessKey === guessKey) return;
    state.lastGuessKey = guessKey;

    S.unlock();

    var result = L.scoreGuess(state.secret, state.placement);
    var win = L.isWin(result.correct, result.total);

    // 本局战绩累计（排行榜按「猜瓶子」次数排名）
    state.roundGuesses++;
    if (result.correct > state.roundBest) state.roundBest = result.correct;

    // 记录本次尝试
    state.attempts.push({
      guess: state.placement.slice(),
      correct: result.correct,
      total: result.total
    });
    renderHistory();

    // 动画 + 音效
    animateGuess();
    S.guess();
    setTimeout(function () { S.correctUp(result.correct); }, 160);

    if (win) {
      state.solved = true;
      finalizeRound('win');
      renderResult('全部猜对啦！🎉 一共猜了 ' + state.attempts.length + ' 次', 'win');
      updateGuessButton();
      S.win();
      setTimeout(celebrate, 520);
    } else {
      renderResult('猜中 ' + result.correct + ' / ' + result.total + ' 个！再想想～', 'guess');
      flashResult();
    }
  }

  /**
   * 播放「猜」的动画（放大镜扫过货架，重触发）。
   */
  function animateGuess() {
    els.shelf.classList.remove('guessing');
    void els.shelf.offsetWidth;
    els.shelf.classList.add('guessing');
    setTimeout(function () { els.shelf.classList.remove('guessing'); }, 540);
  }

  /**
   * 胜利庆祝：彩带 + 弹窗。
   */
  function celebrate() {
    spawnConfetti();
    var rankLine = '';
    if (state.lastRank > 0) {
      var medal = R.medalOf(state.lastRank);
      rankLine = '<p class="overlay-rank">' + (medal || '📌') +
        ' 这局排第 <b>' + state.lastRank + '</b> 名' +
        (state.rankingSaved ? '' : '（本机存储不可用，仅本次有效）') + '</p>';
    }
    showOverlay(
      '<div class="overlay-emoji">🎉</div>' +
      '<h2>全部猜对啦！</h2>' +
      '<p>你只用了 <b>' + state.attempts.length + '</b> 次就猜对啦，好厉害！</p>' +
      rankLine +
      '<button type="button" class="btn btn-primary" id="overlayPlayAgain">再来一局</button>' +
      '<button type="button" class="btn btn-ghost" id="overlayClose">看看这局</button>'
    );
    var again = $('overlayPlayAgain');
    var close = $('overlayClose');
    if (again) again.addEventListener('click', function () { newGame(state.n, state.m); });
    if (close) close.addEventListener('click', closeOverlay);
  }

  /**
   * 生成随机彩带（动森色板：叶子绿 / 岛果黄 / 奶油 / 花瓣粉 / 天空蓝）。
   */
  function spawnConfetti() {
    var colors = ['#7CC44E', '#9FDD6B', '#FFD86B', '#FFF3D6', '#F7A3B8', '#7ECBEC'];
    var count = 64;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.width = (6 + Math.random() * 8) + 'px';
      c.style.height = (10 + Math.random() * 10) + 'px';
      c.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      if (Math.random() < 0.3) c.style.borderRadius = '50%';
      frag.appendChild(c);
    }
    els.confettiLayer.appendChild(frag);
    setTimeout(function () { els.confettiLayer.innerHTML = ''; }, 4000);
  }

  /* ============================ 看答案 / 音效 ============================ */

  /**
   * 看答案（揭示谜题并停止操作）。
   */
  function giveUp() {
    if (state.solved || state.revealed) return;
    state.revealed = true;
    selection = null;
    finalizeRound('giveup');
    S.click();
    renderShelf();
    renderPool();
    renderResult('这就是答案啦，点「重新开始」再来一局吧～', 'giveup');
    els.btnGiveUp.disabled = true;
    updateGuessButton();
  }

  /**
   * 切换音效开关。
   */
  function toggleSound() {
    var nowMuted = S.toggle();
    if (!nowMuted) {
      S.unlock();
      S.click();
    }
    renderSoundButton();
  }

  /**
   * 刷新音效按钮文案。
   */
  function renderSoundButton() {
    var isMuted = S.muted();
    els.btnSound.textContent = isMuted ? '🔇 音效关' : '🔊 音效开';
    els.btnSound.classList.toggle('is-muted', isMuted);
  }

  /* ============================ 弹窗 / 提示 ============================ */

  /**
   * 显示弹窗。
   * @param {string} html
   */
  function showOverlay(html) {
    els.overlayCard.innerHTML = html;
    els.overlay.classList.add('show');
  }

  /**
   * 关闭弹窗。
   */
  function closeOverlay() {
    els.overlay.classList.remove('show');
  }

  /**
   * 底部浮动提示。
   * @param {string} message
   */
  function toast(message) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 320);
    }, 1600);
  }

  /* ============================ 难度切换 ============================ */

  /**
   * 以新难度立即重开（若难度未变化则仅刷新选中态）。
   * @param {number} n
   * @param {number} m
   */
  function restartWith(n, m) {
    var conf = L.parseDifficulty(n, m);
    S.unlock();
    S.click();
    if (conf.n !== state.n || conf.m !== state.m) {
      newGame(conf.n, conf.m);
      toast('新的一局：' + conf.n + ' 个瓶子 / ' + conf.m + ' 个空格');
    } else {
      updateSegmented();
    }
  }

  /* ============================ 事件绑定 ============================ */

  function bindEvents() {
    els.bottleCountGroup.addEventListener('click', function (e) {
      var btn = closest(e.target, 'button[data-n]');
      if (!btn) return;
      restartWith(parseInt(btn.getAttribute('data-n'), 10), state.m);
    });

    els.emptyCountGroup.addEventListener('click', function (e) {
      var btn = closest(e.target, 'button[data-m]');
      if (!btn) return;
      restartWith(state.n, parseInt(btn.getAttribute('data-m'), 10));
    });

    els.btnRestart.addEventListener('click', function () {
      S.unlock();
      S.click();
      newGame(state.n, state.m);
      toast('来一局新的～');
    });

    els.btnSound.addEventListener('click', toggleSound);
    els.btnGiveUp.addEventListener('click', giveUp);
    els.btnGuess.addEventListener('click', onGuess);
    els.btnClearRanking.addEventListener('click', askClearRanking);

    // 拖拽 / 点选（事件委托）
    els.pool.addEventListener('pointerdown', onPointerDown);
    els.slotRow.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 首次用户交互解锁音频
    window.addEventListener('pointerdown', function () { S.unlock(); }, { once: true });
  }

  /* ============================ 启动 ============================ */

  function init() {
    if (!L || !B || !S || !R || !RS) {
      // 依赖缺失时给出可见提示，避免白屏
      document.body.insertAdjacentHTML(
        'afterbegin',
        '<p style="padding:16px;color:#E03E3E;font-weight:700">' +
        '加载失败：请确认 js/ 目录下的 logic.js、bottle.js、ranking.js、store.js、sound.js 均已就绪。</p>'
      );
      return;
    }
    cacheDom();
    bindEvents();
    // 载入历史榜单（存储不可用时降级为内存，游戏照常可玩）
    state.records = RS.load();
    state.rankingSaved = RS.available();
    state.lastRecordId = null;
    state.lastRank = 0;
    newGame(DEFAULT_N, DEFAULT_M);
    renderRanking();
    renderSoundButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
