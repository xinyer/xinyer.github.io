/* =========================================================
   main.js — 渲染层：把游戏状态接到 DOM 上，并驱动动画 / 音效 / 选角 / 排行榜
   ========================================================= */
(function () {
  'use strict';

  /* 每个数字一个马卡龙色，方便一眼区分 */
  var TONES = [
    '#ff9b85', // 1 珊瑚
    '#ffc46b', // 2 蜜橙
    '#ffe08a', // 3 明黄
    '#a8dd8a', // 4 草绿
    '#7ed0b0', // 5 薄荷
    '#84c5e8', // 6 天蓝
    '#9aa8e8', // 7 蓝紫
    '#c3a2e8', // 8 淡紫
    '#f0a0c8'  // 9 樱粉
  ];

  var CONFETTI_COLORS = ['#ffd166', '#ff9b85', '#7ed0b0', '#84c5e8', '#c3a2e8', '#a8dd8a', '#fffaf0'];

  var LAST_ROLE_KEY = 'memory-cards:last-role:v1';
  var LAST_MODE_KEY = 'memory-cards:last-mode:v1';

  /* 牌面越长字号越小（比例相对卡片边长），保证算式不溢出胶囊。
     档位是实测出来的：圆体字体里数字宽约 0.6em，运算符略窄，
     按 88% 宽的胶囊反推，5 个字符超过 0.215 就会横向放不下。 */
  var EXPR_FONT_STEPS = [
    [1, 0.40], [2, 0.34], [3, 0.28], [4, 0.245],
    [5, 0.215], [6, 0.19], [7, 0.17], [8, 0.155]
  ];

  function exprFontScale(len) {
    for (var i = 0; i < EXPR_FONT_STEPS.length; i++) {
      if (len <= EXPR_FONT_STEPS[i][0]) return EXPR_FONT_STEPS[i][1];
    }
    return 0.15;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     时间格式化
       formatTime(12345)          → "0:12.3"
       formatTime(12345, true)    → "12.3s"
       formatTime(65200, true)    → "1:05.2"
     --------------------------------------------------------- */
  function formatTime(ms, compact) {
    var sec = Math.max(0, ms) / 1000;
    if (compact && sec < 60) return sec.toFixed(1) + 's';
    var m = Math.floor(sec / 60);
    var s = sec - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  function readLastRole() {
    try { return window.localStorage.getItem(LAST_ROLE_KEY); } catch (e) { return null; }
  }

  function writeLastRole(id) {
    try { window.localStorage.setItem(LAST_ROLE_KEY, id); } catch (e) { /* 忽略 */ }
  }

  function readLastMode() {
    try { return window.localStorage.getItem(LAST_MODE_KEY); } catch (e) { return null; }
  }

  function writeLastMode(id) {
    try { window.localStorage.setItem(LAST_MODE_KEY, id); } catch (e) { /* 忽略 */ }
  }

  /* ---------------------------------------------------------
     撒花
     --------------------------------------------------------- */
  function createConfetti(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var raf = null;
    var w = 0;
    var h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function burst(count, originY) {
      for (var i = 0; i < count; i++) {
        parts.push({
          x: w / 2 + rand(-w * 0.22, w * 0.22),
          y: originY + rand(-40, 30),
          vx: rand(-8.5, 8.5),
          vy: rand(-17, -5),
          g: 0.34,
          drag: 0.995,
          size: rand(6, 11.5),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.24, 0.24),
          color: pick(CONFETTI_COLORS),
          shape: Math.random() < 0.28 ? 'circle' : 'rect',
          opacity: 1
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += p.g;
        p.vx *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > h * 0.78) p.opacity -= 0.022;

        if (p.opacity <= 0 || p.y > h + 60) {
          parts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
        }
        ctx.restore();
      }

      if (parts.length) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
        ctx.clearRect(0, 0, w, h);
      }
    }

    window.addEventListener('resize', resize);
    resize();

    return {
      fire: function () {
        if (reduceMotion) return;
        var base = window.innerWidth < 640 ? 70 : 120;
        resize();
        parts.length = 0;
        burst(base, h * 0.58);
        setTimeout(function () { burst(Math.round(base * 0.6), h * 0.5); }, 320);
        if (!raf) raf = requestAnimationFrame(step);
      },
      stop: function () {
        parts.length = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        ctx.clearRect(0, 0, w, h);
      }
    };
  }

  /* ---------------------------------------------------------
     场景装饰：飘落的叶子
     --------------------------------------------------------- */
  function spawnLeaves(host, count) {
    if (reduceMotion) return;
    var svg = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" ' +
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M5.5 26.5C5.5 14 14 5.5 26.5 5.5c0 12.5-8.5 21-21 21z"/>' +
              '<path d="M5.5 26.5C11 21 16.5 15.5 22 10"/></svg>';

    for (var i = 0; i < count; i++) {
      var leaf = document.createElement('span');
      leaf.className = 'leaf';
      leaf.innerHTML = svg;
      leaf.style.left = (4 + Math.random() * 92) + '%';
      leaf.style.width = leaf.style.height = (12 + Math.random() * 10) + 'px';
      leaf.style.color = Math.random() < 0.45 ? '#9ede7c' : (Math.random() < 0.6 ? '#6bbb4c' : '#7ed0b0');
      leaf.style.animationDuration = (13 + Math.random() * 12) + 's';
      leaf.style.animationDelay = (-Math.random() * 20) + 's';
      host.appendChild(leaf);
    }
  }

  /* ---------------------------------------------------------
     主程序
     --------------------------------------------------------- */
  function boot() {
    var $ = function (id) { return document.getElementById(id); };

    /* ---------- 元素 ---------- */
    var gridEl = $('grid');
    var progressEl = $('progress');
    var statusEl = $('status');
    var missesEl = $('misses');
    var timerEl = $('timer');
    var modalEl = $('modal');
    var soundBtn = $('soundBtn');
    var resetBtn = $('resetBtn');
    var againBtn = $('againBtn');
    var modalBoardBtn = $('modalBoardBtn');

    var playfieldEl = document.querySelector('.playfield');
    var signboardEl = document.querySelector('.signboard');

    var roleBtn = $('roleBtn');
    var roleAvatarEl = $('roleAvatar');
    var roleNameEl = $('roleName');

    var modalAvatarEl = $('modalAvatar');
    var modalRoleEl = $('modalRole');
    var modalTimeEl = $('modalTime');
    var modalMissEl = $('modalMiss');
    var modalRecordEl = $('modalRecord');

    var selectScreen = $('selectScreen');
    var rolesEl = $('roles');
    var modesEl = $('modes');
    var startBtn = $('startBtn');

    // 排行榜常驻在牌桌下方，不再需要展开/关闭
    var boardPanelEl = $('boardPanel');
    var boardModeEl = $('boardMode');
    var boardListEl = $('boardList');
    var boardEmptyEl = $('boardEmpty');
    var boardHintEl = $('boardHint');
    var tabsEl = document.querySelector('.tabs');
    var difficultyEl = $('difficulty');

    /* ---------- 角色 & 排行榜 ---------- */
    var characters = window.CHARACTERS || [];
    var board = window.Leaderboard;
    var charById = {};
    characters.forEach(function (c) { charById[c.id] = c; });

    var lastRole = readLastRole();
    /* 只有"记住的星球确实还在"才算数，否则视为第一次来 */
    var hasSavedRole = !!(lastRole && charById[lastRole]);
    var currentId = hasSavedRole ? lastRole : (characters[0] && characters[0].id);

    var PROB = window.Problems;
    var lastMode = readLastMode();
    var currentMode = PROB.isMode(lastMode) ? lastMode : 'easy';

    var boardType = 'time';

    /* ---------- 游戏实例 ---------- */
    var game = new MemoryGame({ total: 9, peekMs: 780, sweepMs: 72 });
    var TOTAL = game.options.total;

    var confetti = createConfetti($('confetti'));
    var cards = [];
    var progressDots = [];
    var sweepTimers = [];
    var timerId = null;
    var firstInteraction = true;

    spawnLeaves($('leaves'), 7);

    /* =======================================================
       角色
       ======================================================= */
    /* 角色卡上的「个人最佳」：跨难度取最优。
       这里只写用时 —— 角色卡那一行只有 ~63px 宽，再挂难度名会被省略号截断；
       难度标签统一放在榜单条目上（.board__diff）。 */
    function bestLabel(rec) {
      if (rec) return '最快 ' + formatTime(rec.ms, true);
      return '暂无成绩';   // 「还没挑战过」5 个字会被这一行的宽度截成「还没挑…」
    }

    function renderRoles() {
      rolesEl.innerHTML = '';

      characters.forEach(function (ch, i) {
        var rec = board.bestOf(ch.id).time;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'role' + (ch.id === currentId ? ' is-active' : '');
        btn.dataset.id = ch.id;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(ch.id === currentId));
        btn.style.setProperty('--i', String(i));
        btn.innerHTML =
          '<span class="role__avatar">' +
            '<img src="assets/avatars/' + ch.id + '.png" alt="" loading="lazy" />' +
          '</span>' +
          '<span class="role__meta">' +
            '<strong class="role__name">' + ch.name + '</strong>' +
            '<span class="role__best">' + bestLabel(rec) + '</span>' +
          '</span>';
        rolesEl.appendChild(btn);
      });
    }

    function selectRole(id) {
      if (!charById[id]) return;
      currentId = id;
      writeLastRole(id);
      applyRole();

      var nodes = rolesEl.querySelectorAll('.role');
      for (var i = 0; i < nodes.length; i++) {
        var on = nodes[i].dataset.id === id;
        nodes[i].classList.toggle('is-active', on);
        nodes[i].setAttribute('aria-checked', String(on));
      }

      // 顺手刷新卡片上的个人最佳
      characters.forEach(function (ch, idx) {
        var rec = board.bestOf(ch.id).time;
        var best = rolesEl.querySelectorAll('.role')[idx];
        if (best) best.querySelector('.role__best').textContent = bestLabel(rec);
      });

      // 榜单里的「你」标记要跟着换人
      renderBoard(boardType);
    }

    /* ---------- 难度模式 ---------- */
    /**
     * 两组难度控件（选角页的大卡、游戏页的分段控件）都**只建一次 DOM**，
     * 之后靠切 is-active 同步。
     * ⚠️ 不要每次切换都 innerHTML = '' 重建：正在按的那颗按钮会被换成新节点，
     * 键盘焦点直接掉回 body，鼠标按住的状态也会断。
     */
    function syncModeActive() {
      [[modesEl, '.mode'], [difficultyEl, '.diff']].forEach(function (pair) {
        var nodes = pair[0].querySelectorAll(pair[1]);
        for (var i = 0; i < nodes.length; i++) {
          var on = nodes[i].dataset.mode === currentMode;
          nodes[i].classList.toggle('is-active', on);
          nodes[i].setAttribute('aria-checked', String(on));
        }
      });
    }

    /* 选角页里的大号难度卡 */
    function renderModes() {
      if (modesEl.children.length !== PROB.MODES.length) {
        modesEl.innerHTML = '';

        PROB.MODES.forEach(function (m) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mode';
          btn.dataset.mode = m.id;
          btn.setAttribute('role', 'radio');
          btn.innerHTML =
            '<span class="mode__dot" style="--tone:' + m.tone + '"></span>' +
            '<span class="mode__name">' + m.name + '</span>' +
            '<span class="mode__desc">' + m.desc + '</span>';
          modesEl.appendChild(btn);
        });
      }
    }

    /* 游戏页里的紧凑分段控件（不打开选角页也能换难度） */
    function renderDifficulty() {
      if (difficultyEl.children.length !== PROB.MODES.length) {
        difficultyEl.innerHTML = '';

        PROB.MODES.forEach(function (m) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'diff';
          btn.dataset.mode = m.id;
          btn.setAttribute('role', 'radio');
          btn.title = m.name + ' · ' + m.desc;
          btn.innerHTML =
            '<span class="diff__dot" style="--tone:' + m.tone + '"></span>' +
            '<span>' + m.name + '</span>';
          difficultyEl.appendChild(btn);
        });
      }
    }

    /* 难度的所有「声明式」界面一次刷齐：
       卡牌背面配色（data-mode → CSS）、页内分段控件、选角页难度卡 */
    function syncModeUI() {
      document.documentElement.dataset.mode = currentMode;
      renderModes();
      renderDifficulty();
      syncModeActive();
    }

    /* 只改状态与界面；本局要不要重洗由调用方决定 */
    function selectMode(id) {
      if (!PROB.isMode(id) || id === currentMode) return;

      currentMode = id;
      writeLastMode(id);
      syncModeUI();

      // 存储里成绩仍按难度分开记，但角色卡上的最佳是跨难度取最优，可能因此变化
      renderRoles();
      renderBoard(boardType);
    }

    /** 把当前角色同步到头像 / 名字 / 弹窗 */
    function applyRole() {
      var ch = charById[currentId] || { name: '访客', id: 'earth' };
      var src = 'assets/avatars/' + ch.id + '.png';
      roleAvatarEl.src = src;
      roleAvatarEl.alt = '';
      roleNameEl.textContent = ch.name;
      modalAvatarEl.src = src;
      modalRoleEl.textContent = ch.name;
      roleBtn.title = '当前角色：' + ch.name + '（点击切换）';
    }

    /* =======================================================
       选角覆盖层（排行榜不再是覆盖层，它常驻在牌桌下方）
       ======================================================= */
    function openScreen(el) {
      el.hidden = false;
    }

    function closeScreen(el) {
      el.hidden = true;
    }

    function anyScreenOpen() {
      return !selectScreen.hidden;
    }

    function openSelect() {
      renderRoles();
      openScreen(selectScreen);
      startBtn.focus();
    }

    /** 把榜单纯粹滚到视野里（不改变显示状态） */
    function scrollToBoard() {
      if (!boardPanelEl) return;
      boardPanelEl.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center'
      });
    }

    /* =======================================================
       排行榜
       ======================================================= */
    function renderBoard(type) {
      boardType = (type === 'miss') ? 'miss' : 'time';

      // 榜单不再按难度分组：每个角色取三档里最优的一条，行上标出它来自哪档
      boardModeEl.textContent = '全部难度';

      var rows = (boardType === 'time')
        ? board.rankingTime()
        : board.rankingMiss();

      // tab 状态
      var tabs = tabsEl.querySelectorAll('.tab');
      for (var i = 0; i < tabs.length; i++) {
        var active = tabs[i].dataset.board === boardType;
        tabs[i].classList.toggle('is-active', active);
        tabs[i].setAttribute('aria-selected', String(active));
      }

      boardListEl.innerHTML = '';

      if (!rows.length) {
        boardEmptyEl.hidden = false;
        boardEmptyEl.textContent = '还没有成绩，先去挑战一次吧';
        boardHintEl.textContent = '';
        return;
      }

      boardEmptyEl.hidden = true;
      boardHintEl.textContent = (boardType === 'time')
        ? '三档难度混排，按每个星球的最快用时排序（难度见标签）'
        : '三档难度混排，按每个星球的最少失误排序（难度见标签）';

      rows.forEach(function (row, i) {
        var ch = charById[row.id];
        if (!ch) return;

        var isMe = (row.id === currentId);
        var rowMode = PROB.mode(row.mode);

        var li = document.createElement('li');
        li.className = 'board__row';
        if (i < 3) li.classList.add('board__row--' + (i + 1));
        if (isMe) li.classList.add('is-me');
        li.style.setProperty('--i', String(i));

        var value = (boardType === 'time')
          ? formatTime(row.ms, true)
          : row.misses + ' 次';
        var sub = (boardType === 'time')
          ? '失误 ' + row.misses + ' 次'
          : '用时 ' + formatTime(row.ms, true);

        li.innerHTML =
          '<span class="board__rank">' + (i + 1) + '</span>' +
          '<span class="board__avatar">' +
            '<img src="assets/avatars/' + ch.id + '.png" alt="" loading="lazy" />' +
          '</span>' +
          '<span class="board__meta">' +
            '<span class="board__nameline">' +
              '<strong class="board__name">' + ch.name + '</strong>' +
              '<span class="board__diff" data-mode="' + rowMode.id + '">' +
                rowMode.name +
              '</span>' +
              (isMe ? '<span class="board__you">你</span>' : '') +
            '</span>' +
            '<span class="board__sub">' + sub + '</span>' +
          '</span>' +
          '<span class="board__value">' + value + '</span>';

        boardListEl.appendChild(li);
      });
    }

    /* =======================================================
       计时器显示
       ======================================================= */
    function updateTimer() {
      timerEl.textContent = formatTime(game.elapsed());
    }

    function startTimer() {
      if (timerId !== null) return;
      timerId = setInterval(updateTimer, 100);
    }

    function stopTimer() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      updateTimer();
    }

    /* =======================================================
       骨架构建
       ======================================================= */
    function buildProgress() {
      progressEl.innerHTML = '';
      progressDots = [];
      for (var n = 1; n <= TOTAL; n++) {
        var li = document.createElement('li');
        li.className = 'progress__dot';
        li.textContent = String(n);
        progressEl.appendChild(li);
        progressDots.push(li);
      }
    }

    function buildGrid() {
      gridEl.innerHTML = '';
      cards = [];

      for (var i = 0; i < TOTAL; i++) {
        var card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.dataset.index = String(i);
        card.style.setProperty('--i', String(i));
        card.style.animationDelay = (i * 55) + 'ms';

        var faceTone = TONES[(game.numberAt(i) - 1) % TONES.length];
        var face = PROB.make(currentMode, game.numberAt(i));   // 数字，或按难度生成的算式
        var isExpr = currentMode !== 'easy';

        card.innerHTML =
          '<span class="card__inner">' +
            '<span class="card__face card__face--back"></span>' +
            '<span class="card__face card__face--front">' +
              '<span class="card__num' + (isExpr ? ' is-expr' : '') +
                '" style="--tone:' + faceTone +
                ';--fs:' + exprFontScale(face.length) + '"></span>' +
            '</span>' +
          '</span>';

        var numEl = card.querySelector('.card__num');
        numEl.textContent = face;

        refreshCardA11y(card, i);
        gridEl.appendChild(card);
        cards.push(card);
      }
    }

    function refreshCardA11y(card, index) {
      // 未翻开时不读出牌面内容（那等于剧透）
      var label = '卡片 ' + (index + 1) + '，未翻开';

      if (game.isOpenAt(index)) {
        var faceEl = card.querySelector('.card__num');
        var face = faceEl ? faceEl.textContent : '';
        label = '卡片 ' + (index + 1) + '，' +
                (currentMode === 'easy' ? '数字' : '算式') + ' ' + face +
                '，等于 ' + game.numberAt(index) + '，已翻开';
      }

      card.setAttribute('aria-label', label);
    }

    /* ---------- 进度 / 状态提示 ---------- */
    function renderProgress() {
      var done = game.sequence.length;
      for (var i = 0; i < progressDots.length; i++) {
        var dot = progressDots[i];
        dot.classList.toggle('is-done', i < done);
        dot.classList.toggle('is-current', i === done && !game.finished);
      }
    }

    function setStatus(html, isWrong) {
      statusEl.innerHTML = html;
      statusEl.classList.toggle('is-wrong', !!isWrong);
      statusEl.classList.remove('bump');
      void statusEl.offsetWidth; // 强制重排以重放动画
      statusEl.classList.add('bump');
    }

    function setMisses(value) {
      missesEl.textContent = String(value);
      missesEl.classList.remove('bump');
      void missesEl.offsetWidth;
      missesEl.classList.add('bump');
    }

    /* ---------- 音效封装 ---------- */
    function sfx(name, arg) {
      if (!window.AudioKit) return;
      var fn = window.AudioKit[name];
      if (typeof fn === 'function') fn.call(window.AudioKit, arg);
    }

    function onFirstInteraction() {
      if (!firstInteraction) return;
      firstInteraction = false;
      if (window.AudioKit && window.AudioKit.isEnabled()) window.AudioKit.unlock();
    }

    /* =======================================================
       游戏事件 → 界面
       ======================================================= */
    game.on('reset', function () {
      clearSweepTimers();
      confetti.stop();
      closeModal();
      stopTimer();
      buildProgress();
      buildGrid();
      renderProgress();
      missesEl.textContent = '0';
      timerEl.textContent = formatTime(0);
      setStatus(
        currentMode === 'easy'
          ? '卡片已洗好，从 <strong>1</strong> 开始吧。'
          : '卡片已洗好，先算出每张牌等于几，再从 <strong>1</strong> 开始。',
        false
      );
    });

    game.on('flip', function (res) {
      var card = cards[res.index];
      if (!card) return;

      // 玩家抢在展示结束前点了下一张：取消排队中的翻回动画，
      // 并把状态上"已经不该翻开"的卡片立刻翻回，保证画面与游戏状态永远一致
      clearSweepTimers();
      settleClosedCards();

      card.classList.add('is-open');
      refreshCardA11y(card, res.index);
      sfx('flip');
      startTimer();   // 首次点击才起表
    });

    game.on('correct', function (res) {
      var card = cards[res.index];
      if (card) {
        card.classList.add('is-done');
        card.style.zIndex = String(res.step);
        refreshCardA11y(card, res.index);
      }
      renderProgress();
      sfx('correct', res.step);

      if (res.step < TOTAL) {
        setStatus('对了！下一个是 <strong>' + (res.step + 1) + '</strong>。', false);
      }
    });

    game.on('wrong', function (res) {
      setMisses(game.misses);
      sfx('wrong');

      var card = cards[res.index];
      if (card) card.classList.add('is-wrong');

      playfieldEl.classList.remove('is-shaking');
      void playfieldEl.offsetWidth;
      playfieldEl.classList.add('is-shaking');

      setStatus(
        '这张是 <strong>' + res.number + '</strong>，我们要找的是 <strong>' + res.step + '</strong>。' +
        '卡片要翻回背面啦。',
        true
      );
    });

    game.on('sweep', function (res) {
      var instant = !!(res && res.instant);

      // 抢拍触发的翻回：不做错峰（要的就是"立刻"），也不刷新状态文案
      //（紧接着的 flip / correct / wrong 会给出这一张的结果，避免文案闪一下）
      if (instant) {
        sweepBack(true);
        renderProgress();
        return;
      }

      sfx('sweep');
      sweepBack(false);
      renderProgress();
      setStatus('全部翻回背面，重新从 <strong>1</strong> 开始。', true);
    });

    game.on('win', function (snap) {
      stopTimer();
      renderProgress();
      sfx('win');
      confetti.fire();

      // 记成绩，并立刻把下方榜单刷成最新
      // （少了这一步，就要等玩家切换榜单 tab 才会更新）
      var improved = board.submit(currentMode, currentId, snap.elapsedMs, snap.misses);
      renderBoard(boardType);

      setTimeout(function () {
        showResult(snap, improved);
        openModal();
      }, reduceMotion ? 120 : 620);

      setStatus(
        '太棒了，<strong>' + (charById[currentId] ? charById[currentId].name : '') +
        '</strong> 在' + PROB.mode(currentMode).name + '模式下通关！',
        false
      );
    });

    /* ---------- 结算 ---------- */
    function showResult(snap, improved) {
      modalTimeEl.textContent = formatTime(snap.elapsedMs, true);
      modalMissEl.textContent = String(snap.misses);

      var texts = [];
      if (improved && improved.time) texts.push('最快用时');
      if (improved && improved.miss) texts.push('最少失误');

      if (texts.length) {
        modalRecordEl.textContent = texts.join(' + ') + ' 纪录';
        modalRecordEl.hidden = false;
        sfx('record');
      } else {
        modalRecordEl.hidden = true;
      }
    }

    /* ---------- 翻回背面 ---------- */
    function clearSweepTimers() {
      for (var i = 0; i < sweepTimers.length; i++) clearTimeout(sweepTimers[i]);
      sweepTimers = [];
      playfieldEl.classList.remove('is-shaking');
    }

    /* 以游戏状态为准，把"已经不该翻开"的卡片立刻翻回背面（无过渡等待）。
       用于玩家抢拍时清掉上一张的画面，同时避免待执行的动画把刚点开的牌带回去 */
    function settleClosedCards() {
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (game.isOpenAt(i)) continue;
        if (!card.classList.contains('is-open') &&
            !card.classList.contains('is-wrong') &&
            !card.classList.contains('is-done')) continue;

        card.classList.remove('is-open', 'is-wrong', 'is-done');
        card.style.zIndex = '';
        refreshCardA11y(card, i);
      }
    }

    function sweepBack(instant) {
      var opened = cards.filter(function (c) {
        return c.classList.contains('is-open');
      });

      // 抢拍路径：一次性全部翻回，手感干脆
      if (instant) {
        opened.forEach(function (card) {
          card.classList.remove('is-open', 'is-wrong', 'is-done');
          card.style.zIndex = '';
          refreshCardA11y(card, Number(card.dataset.index));
        });
        return;
      }

      // 从最后翻开的往回收，视觉上像"倒带"
      opened.reverse();

      opened.forEach(function (card, i) {
        var t = setTimeout(function () {
          card.classList.remove('is-open', 'is-wrong', 'is-done');
          card.style.zIndex = '';
          refreshCardA11y(card, Number(card.dataset.index));
        }, i * game.options.sweepMs);
        sweepTimers.push(t);
      });

      // 收尾清理
      var tail = setTimeout(function () {
        cards.forEach(function (card) {
          card.classList.remove('is-open', 'is-wrong', 'is-done');
          card.style.zIndex = '';
          refreshCardA11y(card, Number(card.dataset.index));
        });
        sweepTimers = [];
      }, opened.length * game.options.sweepMs + 120);
      sweepTimers.push(tail);
    }

    /* ---------- 弹窗 ---------- */
    function openModal() {
      modalEl.hidden = false;
      modalEl.dataset.open = '1';
      againBtn.focus();
    }

    function closeModal() {
      if (modalEl.hidden) return;
      modalEl.hidden = true;
      delete modalEl.dataset.open;
    }

    modalEl.addEventListener('click', function (e) {
      if (e.target.dataset.close) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!modalEl.hidden) {
        closeModal();
      } else if (!selectScreen.hidden) {
        closeScreen(selectScreen);
      }
    });

    /* ---------- 输入 ---------- */
    function activate(card) {
      if (anyScreenOpen() || !modalEl.hidden) return;
      onFirstInteraction();
      game.pick(Number(card.dataset.index));
    }

    gridEl.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      activate(card);
    });

    gridEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var card = e.target.closest('.card');
      if (!card) return;
      e.preventDefault();
      activate(card);
    });

    /* =======================================================
       按钮
       ======================================================= */
    rolesEl.addEventListener('click', function (e) {
      var role = e.target.closest('.role');
      if (!role) return;
      onFirstInteraction();
      sfx('select');
      selectRole(role.dataset.id);
    });

    modesEl.addEventListener('click', function (e) {
      var mode = e.target.closest('.mode');
      if (!mode) return;
      onFirstInteraction();
      sfx('select');
      selectMode(mode.dataset.mode);
    });

    // 游戏页内的难度切换：换难度必须重洗本局，
    // 否则牌面还是按旧难度生成的，新旧算式会混在一局里
    difficultyEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.diff');
      if (!btn) return;
      if (!PROB.isMode(btn.dataset.mode) || btn.dataset.mode === currentMode) return;

      onFirstInteraction();
      sfx('select');
      selectMode(btn.dataset.mode);
      game.reset();
    });

    startBtn.addEventListener('click', function () {
      onFirstInteraction();
      sfx('tap');
      closeScreen(selectScreen);
      game.reset();
    });

    roleBtn.addEventListener('click', function () {
      onFirstInteraction();
      sfx('tap');
      closeModal();
      openSelect();
    });

    // 榜单就在下方，这个按钮只负责滚过去
    modalBoardBtn.addEventListener('click', function () {
      sfx('tap');
      closeModal();
      scrollToBoard();
    });

    tabsEl.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      sfx('tap');
      renderBoard(tab.dataset.board);
    });

    // 点遮罩关闭
    selectScreen.addEventListener('click', function (e) {
      if (e.target === selectScreen) closeScreen(selectScreen);
    });

    resetBtn.addEventListener('click', function () {
      onFirstInteraction();
      sfx('tap');
      game.reset();
      resetBtn.blur();
    });

    againBtn.addEventListener('click', function () {
      sfx('tap');
      closeModal();
      game.reset();
    });

    soundBtn.addEventListener('click', function () {
      var next = !(window.AudioKit && window.AudioKit.isEnabled());
      if (window.AudioKit) window.AudioKit.setEnabled(next);
      soundBtn.setAttribute('aria-pressed', String(next));
      soundBtn.setAttribute('aria-label', next ? '关闭音效' : '开启音效');
      firstInteraction = false;
      if (next) sfx('tap');
    });

    /* =======================================================
       启动
       ======================================================= */
    var params = new URLSearchParams(window.location.search);

    // 模式要在 game.reset() 之前定下来 —— 它决定牌面怎么生成
    if (params.has('mode') && PROB.isMode(params.get('mode'))) {
      currentMode = params.get('mode');
    }

    applyRole();
    syncModeUI();   // 难度相关的界面 + 卡牌背面配色，必须在建牌之前定下来
    game.reset();
    renderRoles();

    /* ---------------------------------------------------------
       URL 调试脚手架：一键进入某个状态，便于截图取证与回归
         ?role=mars        指定角色（视同已选好，跳过选角页）
         ?screen=select    强制打开选角页
         ?screen=board     打开排行榜
         ?screen=game      强制跳过选角页、直接开局
         ?board=miss       排行榜切到「最少失误」
         ?seed=1           注入示例成绩（三档难度都铺，用于全难度混排的截图/回归）
         ?open=0,4,8       只翻开指定位置的卡片（纯视觉）
         ?wrong=7          先正确翻 1、2，再故意点错
         ?win=1            按 1→9 直接通关
         ?dump=1           把几何与状态写进 title
         ?anim=off         冻结所有动画
       走的是和真实玩法同一条调用链，所以动画/音效都会被正常驱动。
       --------------------------------------------------------- */

    // ?anim=off 冻结所有动画：无头截图时动画时间不推进，会停在入场起始帧
    if (params.get('anim') === 'off') {
      document.documentElement.classList.add('no-anim');
    }

    if (params.has('seed')) {
      // 榜单现在是全难度混排，示例成绩也要铺满三档 ——
      // 而且刻意让「谁最强」随难度变化，这样榜首的难度标签才会出现三种，
      // 一眼就能看出标签是不是真的跟着数据在走（全塞简单档就会清一色「简单」）
      var SEED_ROWS = {
        easy: [
          { id: 'sun',     ms: 12000, misses: 0 },
          { id: 'mercury', ms: 9500,  misses: 1 },
          { id: 'venus',   ms: 14000, misses: 2 },
          { id: 'earth',   ms: 10500, misses: 1 },
          { id: 'mars',    ms: 12880, misses: 0 },
          { id: 'jupiter', ms: 21000, misses: 3 },
          { id: 'saturn',  ms: 16000, misses: 2 },
          { id: 'uranus',  ms: 11000, misses: 1 },
          { id: 'neptune', ms: 19900, misses: 2 },
          { id: 'moon',    ms: 23100, misses: 3 }
        ],
        hard: [
          { id: 'sun',     ms: 11500, misses: 1 },
          { id: 'mercury', ms: 13000, misses: 2 },
          { id: 'venus',   ms: 12200, misses: 1 },
          { id: 'earth',   ms: 16000, misses: 3 },
          { id: 'mars',    ms: 11100, misses: 0 },
          { id: 'jupiter', ms: 19800, misses: 2 },
          { id: 'saturn',  ms: 14500, misses: 1 },
          { id: 'uranus',  ms: 17200, misses: 2 },
          { id: 'neptune', ms: 16800, misses: 1 },
          { id: 'moon',    ms: 20500, misses: 3 }
        ],
        hell: [
          { id: 'sun',     ms: 10800, misses: 2 },
          { id: 'mercury', ms: 21000, misses: 4 },
          { id: 'venus',   ms: 19000, misses: 3 },
          { id: 'earth',   ms: 24000, misses: 4 },
          { id: 'mars',    ms: 17500, misses: 2 },
          { id: 'jupiter', ms: 15400, misses: 1 },
          { id: 'saturn',  ms: 13900, misses: 2 },
          { id: 'uranus',  ms: 26400, misses: 5 },
          { id: 'neptune', ms: 13200, misses: 1 },
          { id: 'moon',    ms: 12750, misses: 2 }
        ]
      };

      PROB.MODES.forEach(function (m) {
        board.seed(m.id, SEED_ROWS[m.id] || []);
      });

      // 角色卡的最佳成绩在启动时已经渲染过一轮，注入成绩后必须补刷一次，
      // 否则截图里的角色卡会显示成「暂无成绩」，看起来像功能没生效
      renderRoles();
    }

    var rolePinned = false;   // ?role=xxx 显式指定角色时，视同「已经选好了」

    if (params.has('role')) {
      var rid = params.get('role');
      if (charById[rid]) {
        currentId = rid;
        rolePinned = true;
        applyRole();
        renderRoles();
      }
    }

    if (params.has('open')) {
      params.get('open').split(',').forEach(function (raw) {
        var idx = parseInt(raw, 10);
        if (cards[idx]) cards[idx].classList.add('is-open');
      });
    }

    // 用真实的 DOM click 事件驱动，顺带验证「点击 → 事件委托 → 判定 → 渲染」整条链路
    function tapCard(number) {
      var pos = game.order.indexOf(number);
      if (cards[pos]) cards[pos].click();
    }

    if (params.has('wrong')) {
      game.options.peekMs = 600000; // 冻在"点错"这一帧，方便截图
      tapCard(1);
      tapCard(2);
      tapCard(Number(params.get('wrong')) || 5);
    }

    if (params.has('win')) {
      for (var step = 1; step <= TOTAL; step++) tapCard(step);
    }

    if (params.has('board')) {
      boardType = params.get('board') === 'miss' ? 'miss' : 'time';
    }

    // 榜单常驻在牌桌下方，开局先渲染一次
    renderBoard(boardType);

    // ?win / ?wrong 会自动出牌，这时不能再用选角页挡住点击
    var autoPlay = params.has('win') || params.has('wrong');
    var wantScreen = params.get('screen');

    /* 记住过星球的玩家：直接开局，不再每次刷新都挡一层选角页。
       只有"从没选过、或记录已失效"才引导选一次。
       想换星球随时点右上角头像 / ?screen=select。 */
    var roleRemembered = hasSavedRole || rolePinned;

    if (wantScreen === 'select') {
      openScreen(selectScreen);
    } else if (wantScreen === 'board') {
      scrollToBoard();   // ?screen=board：直接滚到榜单（截图用）
    } else if (!autoPlay && wantScreen !== 'game' && !roleRemembered) {
      openSelect();      // 第一次来：先选角色
    }

    /* ---------------------------------------------------------
       ?selftest=1 —— 走真实 DOM 事件跑完整流程，结果写进 title
       （选角色 → 开始挑战 → 通关 → 记成绩 → 看榜单）
       --------------------------------------------------------- */
    if (params.has('selftest')) {
      var log = [];

      var queue = [
        function () {
          log.push('roleCards=' + rolesEl.querySelectorAll('.role').length);
          var target = rolesEl.querySelector('.role[data-id="mars"]');
          log.push('marsCard=' + (target ? 'ok' : 'MISSING'));
          if (target) target.click();
          log.push('selected=' + currentId);
        },
        function () {
          startBtn.click();
          log.push('selectClosed=' + selectScreen.hidden);
        },
        function () {
          log.push('cardCount=' + cards.length);
          for (var n = 1; n <= TOTAL; n++) tapCard(n);
          log.push('finished=' + game.finished);
          log.push('elapsed=' + Math.round(game.elapsed()) + 'ms');
        },
        function () {
          var rec = board.get(currentMode, 'mars');
          log.push('savedTime=' + (rec.bestTime ? rec.bestTime.ms + 'ms' : 'none'));
          log.push('savedMiss=' + (rec.bestMiss ? rec.bestMiss.misses : 'none'));
          closeModal();
        },
        function () {
          // 关键：这里**不**手动刷新榜单，直接读 DOM，
          // 用来验证「通关提交成绩时榜单已自动更新」，而不是要等切换 tab
          var rows = boardListEl.querySelectorAll('.board__row');
          log.push('autoRows=' + rows.length);
          if (rows.length) {
            var img = rows[0].querySelector('img').getAttribute('src');
            log.push('autoTop1=' + rows[0].querySelector('.board__name').textContent +
                     '/' + rows[0].querySelector('.board__value').textContent +
                     '/avatar=' + (img.indexOf('mars') >= 0 ? 'mars.png' : img));
            log.push('isMe=' + (rows[0].classList.contains('is-me') ? 'yes' : 'no') +
                     '/' + (rows[0].querySelector('.board__you') ? 'hasBadge' : 'noBadge'));
          }
          scrollToBoard();
        },
        function () {
          // 再验一次切换榜单
          renderBoard('miss');
          var rows2 = boardListEl.querySelectorAll('.board__row');
          log.push('missRows=' + rows2.length);
          if (rows2.length) {
            log.push('missTop1=' + rows2[0].querySelector('.board__name').textContent +
                     '/' + rows2[0].querySelector('.board__value').textContent);
          }
        },
        function () {
          // 榜单已改为全难度混排：切到地狱后旧成绩**不该**变空，
          // 但难度标签、卡牌背色、牌面都要跟着切。这里全部走真实点击。
          log.push('diffBtns=' + difficultyEl.querySelectorAll('.diff').length);

          difficultyEl.querySelector('.diff[data-mode="hell"]').click();

          var rows = boardListEl.querySelectorAll('.board__row');
          var labels = [].map.call(rows, function (r) {
            var el = r.querySelector('.board__diff');
            return el ? el.textContent : '-';
          });
          var kinds = {};
          labels.forEach(function (k) { kinds[k] = 1; });

          log.push('hellRows=' + rows.length);
          log.push('modeLabel=' + boardModeEl.textContent);
          log.push('dataMode=' + document.documentElement.dataset.mode);
          log.push('hellBackTop=' + getComputedStyle(document.documentElement)
            .getPropertyValue('--back-top').trim());
          log.push('diffLabelKinds=' + Object.keys(kinds).join('/'));
          log.push('hellFaces=' + [].map.call(cards, function (c) {
            return c.querySelector('.card__num').textContent;
          }).join(' '));

          // 再切回简单模式：牌面恢复成数字，背色回到绿
          difficultyEl.querySelector('.diff[data-mode="easy"]').click();
          log.push('easyFaces=' + [].map.call(cards, function (c) {
            return c.querySelector('.card__num').textContent;
          }).join(' '));
          log.push('easyBackTop=' + getComputedStyle(document.documentElement)
            .getPropertyValue('--back-top').trim());

          document.title = 'SELFTEST ' + log.join(' | ');
        }
      ];

      queue.forEach(function (fn, i) {
        setTimeout(fn, 150 + i * 150);
      });
    }

    /* ---------- dump ---------- */
    if (params.has('dump')) {
      setTimeout(function () {
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        function box(el) {
          if (!el) return null;
          var r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height)
          };
        }

        var boxes = {
          signboard: box(signboardEl),
          hud: box(document.querySelector('.hud')),
          difficulty: box(difficultyEl),
          playfield: box(playfieldEl),
          status: box(statusEl),
          grid: box(gridEl)
        };

        // 榜单是正常页面内容，允许落在首屏之外（页面本来就要滚）
        var boardBox = box(boardPanelEl);
        var boardBelowFold = boardBox ? boardBox.y + boardBox.h > vh : null;

        // 进度圆点是否真的水平居中于游戏区
        var progressBox = box(document.querySelector('.progress'));
        var centering = null;
        if (progressBox && boxes.playfield) {
          var pc = progressBox.x + progressBox.w / 2;
          var fc = boxes.playfield.x + boxes.playfield.w / 2;
          centering = { progressCenter: Math.round(pc), playfieldCenter: Math.round(fc),
                        offset: Math.round(pc - fc) };
        }
        var boardOrder = null;
        if (boardBox && boxes.playfield) {
          boardOrder = { boardTop: boardBox.y, playfieldBottom: boxes.playfield.y + boxes.playfield.h,
                         gap: boardBox.y - (boxes.playfield.y + boxes.playfield.h) };
        }

        var cardData = cards.map(function (c, i) {
          var r = c.getBoundingClientRect();
          var inner = c.querySelector('.card__inner');
          var numEl = c.querySelector('.card__num');

          // 无头环境里 CSS transition 的时间不推进，直接读会拿到插值中途的值。
          // 临时摘掉 transition 读到的才是「该状态下的终值」，即翻转到底有没有生效。
          var keep = inner.style.transition;
          inner.style.transition = 'none';
          var rot = getComputedStyle(inner).transform;
          inner.style.transition = keep;

          var cs = getComputedStyle(inner);
          return {
            i: i,
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height),
            open: c.classList.contains('is-open'),
            done: c.classList.contains('is-done'),
            num: numEl.textContent,
            tone: getComputedStyle(numEl).getPropertyValue('--tone').trim(),
            bg: getComputedStyle(numEl).backgroundColor,
            rot: rot === 'none' ? 'none' : rot.split(',').slice(0, 3).join(','),
            ts: cs.transformStyle,
            bf: getComputedStyle(c.querySelector('.card__face--front')).backfaceVisibility
          };
        });

        function hit(a, b, an, bn) {
          if (!a || !b) return null;
          var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          var oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (ox > 0.5 && oy > 0.5) {
            return { a: an, b: bn, ox: Math.round(ox), oy: Math.round(oy) };
          }
          return null;
        }

        var keys = Object.keys(boxes);
        var overlaps = [];
        for (var i = 0; i < keys.length; i++) {
          for (var j = i + 1; j < keys.length; j++) {
            var o = hit(boxes[keys[i]], boxes[keys[j]], keys[i], keys[j]);
            if (o) overlaps.push(o);
          }
        }

        var cardOverlaps = [];
        for (var a = 0; a < cardData.length; a++) {
          for (var b = a + 1; b < cardData.length; b++) {
            var co = hit(cardData[a], cardData[b], 'c' + a, 'c' + b);
            if (co) cardOverlaps.push(co);
          }
        }

        var overflow = [];
        keys.forEach(function (k) {
          var r = boxes[k];
          if (r && (r.x < -0.5 || r.y < -0.5 || r.x + r.w > vw + 0.5 || r.y + r.h > vh + 0.5)) {
            overflow.push(k);
          }
        });
        cardData.forEach(function (c) {
          if (c.x < -0.5 || c.y < -0.5 || c.x + c.w > vw + 0.5 || c.y + c.h > vh + 0.5) {
            overflow.push('card' + c.i);
          }
        });

        // 面板内部是否溢出（选角 / 排行榜）
        function panelFit(el) {
          if (!el || el.hidden) return null;
          var panel = el.querySelector('.screen__panel');
          if (!panel) return null;
          var scroller = panel.querySelector('.roles, .board');
          return {
            screenClip: Math.round(el.scrollHeight - el.clientHeight),
            panelClip: Math.round(panel.scrollHeight - panel.clientHeight),
            listClip: scroller ? Math.round(scroller.scrollHeight - scroller.clientHeight) : 0
          };
        }

        var roleRows = rolesEl.querySelectorAll('.role').length;
        var boardRows = boardListEl.querySelectorAll('.board__row').length;

        // 头像图片是否真的加载成功（破图时 naturalWidth 为 0）
        var avatarImgs = document.querySelectorAll(
          '.role__avatar img, .board__avatar img, #roleAvatar, #modalAvatar'
        );
        var loaded = 0;
        var failed = [];
        for (var ai = 0; ai < avatarImgs.length; ai++) {
          if (avatarImgs[ai].naturalWidth > 0) {
            loaded += 1;
          } else {
            failed.push(avatarImgs[ai].getAttribute('src'));
          }
        }
        var avatarStat = {
          total: avatarImgs.length,
          loaded: loaded,
          failed: failed.slice(0, 3)
        };

        var gcs = getComputedStyle(gridEl);
        var rootStyle = getComputedStyle(document.documentElement);

        document.title = 'DUMP ' + JSON.stringify({
          css: {
            cardVar: rootStyle.getPropertyValue('--card').trim(),
            cardWidth: getComputedStyle(cards[0]).width,
            gridCols: gcs.gridTemplateColumns,
            colGap: gcs.columnGap,
            roleCols: getComputedStyle(rolesEl).gridTemplateColumns,
            dataMode: document.documentElement.dataset.mode,
            backTop: rootStyle.getPropertyValue('--back-top').trim(),
            // 卡牌背面真实渲染出来的渐变（用于确认难度换色真的生效，而不只是变量变了）
            backFace: (function () {
              var b = cards[0] && cards[0].querySelector('.card__face--back');
              if (!b) return '';
              return getComputedStyle(b).backgroundImage.replace(/\s+/g, ' ').slice(0, 96);
            })()
          },
          vp: vw + 'x' + vh,
          boxes: boxes,
          overlaps: overlaps,
          cardOverlaps: cardOverlaps,
          overflow: overflow,
          scrollOverflow: Math.round(document.documentElement.scrollHeight - vh),
          screens: {
            select: !selectScreen.hidden,
            modal: !modalEl.hidden,
            selectFit: panelFit(selectScreen)
          },
          boardBox: boardBox,
          boardBelowFold: boardBelowFold,
          boardOrder: boardOrder,
          progressBox: progressBox,
          centering: centering,
          pageHeight: document.documentElement.scrollHeight,
          avatars: avatarStat,
          role: currentId,
          roleRows: roleRows,
          mode: currentMode,
          modeLabel: boardModeEl.textContent,
          faces: cards.map(function (c) {
            var el = c.querySelector('.card__num');
            return el ? el.textContent : '';
          }),
          // 牌面文本溢出检测：横向或纵向超出底盘都算不合格
          faceOverflow: (function () {
            var bad = [];
            cards.forEach(function (c) {
              var el = c.querySelector('.card__num');
              if (!el) return;
              var ox = el.scrollWidth - el.clientWidth;
              var oy = el.scrollHeight - el.clientHeight;
              if (ox > 1 || oy > 1) {
                var cs = getComputedStyle(el);
                bad.push(el.textContent + '(x' + ox + ',y' + oy +
                         ',fs' + cs.fontSize + ',clientH' + el.clientHeight +
                         ',scrollH' + el.scrollHeight + ',lh' + cs.lineHeight + ')');
              }
            });
            return bad;
          })(),
          boardType: boardType,
          boardRows: boardRows,
          timer: timerEl.textContent,
          misses: game.misses,
          seq: game.sequence.join(','),
          elapsed: Math.round(game.elapsed()),
          locked: game.locked,
          finished: game.finished,
          progress: {
            done: progressDots.filter(function (d) { return d.classList.contains('is-done'); }).length,
            currentIndex: progressDots.findIndex(function (d) { return d.classList.contains('is-current'); }),
            total: progressDots.length
          },
          cards: cardData
        });
      }, 1500);
    }

    // 调试入口：控制台可手动触发效果
    window.__memoryCards = {
      game: game,
      confetti: confetti,
      cards: cards,
      board: board,
      characters: characters,
      params: params,
      get role() { return currentId; }
    };

    void signboardEl;
    void playfieldEl;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
