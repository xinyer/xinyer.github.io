/* =========================================================
   audio.js — 用 Web Audio 实时合成音效，不依赖任何外部音频文件
   ========================================================= */
window.AudioKit = (function () {
  'use strict';

  var ctx = null;
  var master = null;
  var enabled = true;

  /* C 大调五声音阶，听起来更"治愈"，贴合动森气质 */
  var PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5 D5 E5 G5 A5

  function ensureContext() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /* 解锁：必须在用户手势中调用一次 */
  function unlock() {
    var c = ensureContext();
    if (c && c.state === 'suspended') c.resume();
  }

  /* 单个音符 */
  function tone(freq, opt) {
    if (!enabled) return;
    var c = ensureContext();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    opt = opt || {};
    var delay = opt.delay || 0;
    var dur = opt.dur || 0.18;
    var peak = opt.gain == null ? 0.85 : opt.gain;
    var t0 = c.currentTime + delay;

    var osc = c.createOscillator();
    var gain = c.createGain();

    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opt.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(opt.glideTo, t0 + dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
  }

  /* 噪声脉冲：模拟纸张/卡牌摩擦 */
  function whisper(opt) {
    if (!enabled) return;
    var c = ensureContext();
    if (!c) return;

    opt = opt || {};
    var dur = opt.dur || 0.12;
    var t0 = c.currentTime + (opt.delay || 0);
    var frames = Math.floor(c.sampleRate * dur);
    var buffer = c.createBuffer(1, frames, c.sampleRate);
    var data = buffer.getChannelData(0);

    for (var i = 0; i < frames; i++) {
      var decay = Math.pow(1 - i / frames, 2.6);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    var src = c.createBufferSource();
    src.buffer = buffer;

    var filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = opt.freq || 2600;
    filter.Q.value = 0.9;

    var gain = c.createGain();
    gain.gain.value = opt.gain == null ? 0.5 : opt.gain;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  var api = {
    /** 全局解锁，绑定到第一次交互 */
    unlock: unlock,

    setEnabled: function (on) {
      enabled = !!on;
      if (enabled) unlock();
    },

    isEnabled: function () {
      return enabled;
    },

    /** 翻牌：短促上扬的"纸片"声 */
    flip: function () {
      whisper({ freq: 2400, dur: 0.1, gain: 0.42 });
      tone(880, { type: 'sine', dur: 0.09, gain: 0.35 });
    },

    /** 翻对了：音高随进度上行 */
    correct: function (step) {
      var idx = Math.max(0, Math.min(4, (step - 1) % 5));
      var octave = step > 5 ? 2 : 1;
      tone(PENTATONIC[idx] * octave, { type: 'sine', dur: 0.26, gain: 0.7 });
      tone(PENTATONIC[idx] * octave * 2, {
        type: 'sine', dur: 0.16, gain: 0.22, delay: 0.02
      });
    },

    /** 翻错了：下行的两声闷响 */
    wrong: function () {
      tone(330, { type: 'triangle', dur: 0.16, gain: 0.55, glideTo: 262 });
      tone(262, { type: 'triangle', dur: 0.24, gain: 0.5, delay: 0.13, glideTo: 196 });
    },

    /** 全部翻回：一串下滑音，像卡牌哗啦收回 */
    sweep: function () {
      for (var i = 0; i < 4; i++) {
        whisper({ freq: 3000 - i * 420, dur: 0.08, gain: 0.26, delay: i * 0.055 });
      }
    },

    /** 胜利：琶音 */
    win: function () {
      var notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], { type: 'sine', dur: 0.42, gain: 0.7, delay: i * 0.085 });
        tone(notes[i] * 2, { type: 'sine', dur: 0.24, gain: 0.16, delay: i * 0.085 + 0.01 });
      }
      tone(523.25 / 2, { type: 'triangle', dur: 0.9, gain: 0.3, delay: 0.02 });
    },

    /** 轻点 UI */
    tap: function () {
      tone(660, { type: 'sine', dur: 0.07, gain: 0.35 });
    },

    /** 选中星球角色：清亮的上行两音 */
    select: function () {
      tone(659.25, { type: 'sine', dur: 0.13, gain: 0.5 });
      tone(987.77, { type: 'sine', dur: 0.22, gain: 0.42, delay: 0.07 });
    },

    /** 刷新纪录：一串明亮的小琶音 */
    record: function () {
      var notes = [783.99, 1046.5, 1318.5];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], { type: 'sine', dur: 0.34, gain: 0.55, delay: i * 0.09 });
      }
    }
  };

  return api;
})();
