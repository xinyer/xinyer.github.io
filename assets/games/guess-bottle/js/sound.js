/**
 * sound.js —— WebAudio 合成音效（无任何音频文件）
 *
 * 使用 AudioContext + OscillatorNode / GainNode / BiquadFilter 合成。
 * 处理浏览器自动播放策略：在首次用户交互后再 resume()；静音时立即停止输出。
 */
var Sound = (function () {
  'use strict';

  var ctx = null;
  var master = null;
  var muted = false;
  var BASE_VOLUME = 0.85;

  /**
   * 浏览器是否支持 WebAudio。
   * @returns {boolean}
   */
  function supported() {
    return typeof window !== 'undefined' &&
      !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * 懒创建 AudioContext 与主增益节点。
   * @returns {AudioContext|null}
   */
  function ensure() {
    if (ctx) {
      return ctx;
    }
    if (!supported()) {
      return null;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    try {
      ctx = new AC();
    } catch (err) {
      ctx = null;
      return null;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : BASE_VOLUME;
    master.connect(ctx.destination);
    return ctx;
  }

  /**
   * 首次用户交互后调用，解锁（resume）音频。
   */
  function unlock() {
    var c = ensure();
    if (c && c.state === 'suspended' && typeof c.resume === 'function') {
      c.resume();
    }
  }

  /**
   * 播放一个带包络的音符。
   * @param {{freq:number,dur:number,type:string,vol:number,delay:number,glide:number}} opts
   */
  function tone(opts) {
    if (muted) {
      return;
    }
    var c = ensure();
    if (!c) {
      return;
    }
    opts = opts || {};
    var freq = opts.freq || 440;
    var dur = opts.dur || 0.15;
    var type = opts.type || 'sine';
    var vol = (opts.vol !== undefined) ? opts.vol : 0.3;
    var delay = opts.delay || 0;
    var glide = opts.glide;

    var t0 = c.currentTime + delay;
    var osc = c.createOscillator();
    var gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t0 + dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /**
   * 播放一段噪声音（用于「翻开 / 查看」这类动作的质感）。
   * @param {{dur:number,vol:number,cutoff:number}} opts
   */
  function noise(opts) {
    if (muted) {
      return;
    }
    var c = ensure();
    if (!c) {
      return;
    }
    opts = opts || {};
    var dur = opts.dur || 0.18;
    var vol = (opts.vol !== undefined) ? opts.vol : 0.25;
    var size = Math.max(1, Math.floor(c.sampleRate * dur));
    var buffer = c.createBuffer(1, size, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < size; i++) {
      var decay = Math.pow(1 - i / size, 2);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    var src = c.createBufferSource();
    src.buffer = buffer;

    var filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.cutoff || 800;

    var gain = c.createGain();
    gain.gain.value = vol;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  return {
    /** 首次交互解锁音频 */
    unlock: unlock,
    /** 当前是否静音 */
    muted: function () { return muted; },
    /** 静音（立即停止输出） */
    mute: function () {
      muted = true;
      if (master) {
        master.gain.value = 0;
      }
    },
    /** 取消静音 */
    unmute: function () {
      muted = false;
      if (master) {
        master.gain.value = BASE_VOLUME;
      }
    },
    /** 切换静音，返回切换后的静音状态 */
    toggle: function () {
      if (muted) {
        this.unmute();
      } else {
        this.mute();
      }
      return muted;
    },
    /** 拿起瓶子（短促上行） */
    pickup: function () {
      tone({ freq: 520, glide: 780, dur: 0.12, type: 'triangle', vol: 0.22 });
    },
    /** 放置瓶子（清脆「哒」） */
    place: function () {
      tone({ freq: 660, dur: 0.09, type: 'square', vol: 0.16 });
      tone({ freq: 990, dur: 0.08, type: 'sine', vol: 0.12, delay: 0.02 });
    },
    /** 轻点 */
    click: function () {
      tone({ freq: 420, dur: 0.06, type: 'triangle', vol: 0.14 });
    },
    /** 猜瓶子（轻快的「叮咚」查看音，替代原来的踩踏闷响） */
    guess: function () {
      noise({ dur: 0.13, vol: 0.16, cutoff: 1500 });
      tone({ freq: 880, dur: 0.12, type: 'triangle', vol: 0.24 });
      tone({ freq: 1320, dur: 0.16, type: 'sine', vol: 0.18, delay: 0.07 });
    },
    /**
     * 正确数递增音。
     * @param {number} count 当前猜中的个数
     */
    correctUp: function (count) {
      var base = 520;
      var n = Math.max(0, Math.min(12, count || 0));
      tone({ freq: base + n * 80, dur: 0.16, type: 'triangle', vol: 0.24 });
    },
    /** 胜利小旋律 */
    win: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) {
        tone({ freq: notes[i], dur: 0.22, type: 'triangle', vol: 0.26, delay: i * 0.16 });
      }
      tone({ freq: 1318, dur: 0.42, type: 'sine', vol: 0.22, delay: notes.length * 0.16 });
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sound;
}
if (typeof window !== 'undefined') {
  window.Sound = Sound;
}
