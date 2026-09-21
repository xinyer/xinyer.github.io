/**
 * bottle.js —— 瓶子 SVG 渲染器（动物森友会风格）
 *
 * 造型：住在岛上的「圆润玻璃罐 + 软木塞」。
 *   短颈 → 圆润外扩的瓶肩 → 微微鼓起的胖瓶身 → 圆底，顶上压一枚木质软木塞。
 *   与页面里其他动森物件的语言一致：圆润、矮胖、无尖角、木料收边。
 *
 * 三种形态共用同一套轮廓 path，保证「形状绝对统一」：
 *   - colored  : 彩色玻璃瓶（架上摆放与来源池使用），暖棕描边 + 奶油高光 + 同色暗部
 *   - back     : 背面剪影（统一的浅木色 + 「?」，空格与满格完全一致，绝不泄漏信息）
 *   - outline  : 虚线轮廓（玩家的放置目标槽位），浅木色虚线
 *
 * 色板与动森 UI 一致：描边用暖棕 #8B6A44、木塞用木色 #E8C089/#B47F3C
 * （与货架木搁板同色），高光用奶白 rgba(255,252,242,·)。
 */
var Bottle = (function () {
  'use strict';

  var VIEW_W = 60;
  var VIEW_H = 100;

  /** 动森风描边色（暖棕，与纸卡/木器描边同族）。 */
  var STROKE = '#8B6A44';
  /** 软木塞（木色，与货架木搁板同一套木料色）。 */
  var CAP_FILL = '#E8C089';
  var CAP_STROKE = '#B47F3C';
  /** 背面剪影的浅木色。 */
  var BACK_FILL = '#E3D2AC';
  var BACK_STROKE = '#B99C6B';
  var BACK_INK = '#A07F55';
  /** 虚线轮廓色。 */
  var DASH_STROKE = '#C9AE7C';

  /**
   * 玻璃瓶身轮廓（左右对称，顺时针自瓶颈左上角起笔，绘制顺序在木塞之前）。
   * 瓶颈 15 宽 → 圆润流出瓶肩 → 胖瓶身（最宽处 41）→ 圆底；底部落在 y=94。
   * @type {string}
   */
  var BODY_PATH =
    'M22.5 14 L22.5 24 ' +
    'C22.5 30.5 12.5 32 10.5 43.5 ' +
    'C8.5 54 9 68 13 85 ' +
    'C13 91.5 20.5 94 30 94 ' +
    'C39.5 94 47 91.5 47 85 ' +
    'C51 68 51.5 54 49.5 43.5 ' +
    'C47.5 32 37.5 30.5 37.5 24 ' +
    'L37.5 14 Z';

  /**
   * 软木塞轮廓（圆角木塞，盖住瓶颈口；盖住瓶身顶边，接缝自然）。
   * @type {string}
   */
  var CAP_PATH =
    'M22.4 5 L37.6 5 C39.6 5 41 6.4 41 8.4 L41 12.2 ' +
    'C41 14.2 39.6 15.6 37.6 15.6 L22.4 15.6 ' +
    'C20.4 15.6 19 14.2 19 12.2 L19 8.4 ' +
    'C19 6.4 20.4 5 22.4 5 Z';

  /**
   * 包裹一段 SVG 内容为完整的 <svg> 字符串。
   * @param {string} inner 内部图形
   * @param {string} extraClass 追加的 class
   * @returns {string}
   */
  function svgWrap(inner, extraClass) {
    return '<svg class="bottle-svg ' + (extraClass || '') + '" viewBox="0 0 ' +
      VIEW_W + ' ' + VIEW_H + '" xmlns="http://www.w3.org/2000/svg" ' +
      'preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  }

  /**
   * 木质软木塞 + 木料高光。
   * @param {string} fill 塞子填充色
   * @param {string} stroke 塞子描边色
   * @param {string} [hlAlpha] 高光透明度（背面剪影会弱化一点）
   * @returns {string}
   */
  function cork(fill, stroke, hlAlpha) {
    return '<path class="bottle-cap" d="' + CAP_PATH + '" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse class="bottle-cap-hl" cx="24.6" cy="9.4" rx="4.6" ry="2" ' +
      'fill="rgba(255,252,242,' + (hlAlpha === undefined ? 0.68 : hlAlpha) + ')"/>';
  }

  /**
   * 渲染彩色瓶子。
   * @param {{hex:string,dark:string}} color 颜色对象
   * @param {string} [extraClass] 追加 class（如 'bottle-ghost'）
   * @returns {string} SVG 字符串
   */
  function colored(color, extraClass) {
    color = color || { hex: '#CCCCCC', dark: '#999999' };
    var hex = color.hex || '#CCCCCC';
    var dark = color.dark || STROKE;

    var inner =
      // 落地投影（暖棕，像摆在木桌上）
      '<ellipse class="bottle-shadow" cx="30" cy="95" rx="17" ry="3.2" fill="rgba(122,90,56,0.22)"/>' +
      // 玻璃瓶身（fill 必须等于 color.hex，QA 依赖它解码答案）
      '<path class="bottle-body" d="' + BODY_PATH + '" fill="' + hex +
        '" stroke="' + STROKE + '" stroke-width="3.2" stroke-linejoin="round"/>' +
      // 瓶底内侧的同色暗部：玻璃的厚度与体积感
      '<path class="bottle-tint" d="M17 85.5 C23 88.6 37 88.6 43 85.5" fill="none" ' +
        'stroke="' + dark + '" stroke-opacity="0.24" stroke-width="4.6" stroke-linecap="round"/>' +
      // 横贯瓶肩的玻璃光泽带
      '<path class="bottle-gloss" d="M14.5 45 C22 49.4 38 49.4 45.5 45" fill="none" ' +
        'stroke="rgba(255,252,242,0.5)" stroke-width="2.4" stroke-linecap="round"/>' +
      // 瓶身竖向奶油高光
      '<ellipse class="bottle-hl" cx="17.6" cy="60" rx="3.4" ry="15" ' +
        'fill="rgba(255,252,242,0.38)" transform="rotate(6 17.6 60)"/>' +
      // 瓶肩高光
      '<ellipse class="bottle-hl2" cx="20.5" cy="36" rx="2.6" ry="4.6" ' +
        'fill="rgba(255,252,242,0.72)" transform="rotate(-26 20.5 36)"/>' +
      // 右侧反光弧
      '<path class="bottle-glint" d="M42.6 50 C46 62 45.6 74 42.2 82" fill="none" ' +
        'stroke="rgba(255,252,242,0.55)" stroke-width="2.8" stroke-linecap="round"/>' +
      // 木塞（最后绘制，盖住瓶身顶部接缝）
      cork(CAP_FILL, CAP_STROKE);

    return svgWrap(inner, 'bottle-colored ' + (extraClass || ''));
  }

  /**
   * 渲染背面剪影（无论槽位是空还是有瓶子，外观完全一致）。
   * 整体统一为浅木色调 + 问号，像盖着布不知内容的物件。
   * @returns {string} SVG 字符串
   */
  function back() {
    var inner =
      '<ellipse cx="30" cy="95" rx="17" ry="3.2" fill="rgba(122,90,56,0.18)"/>' +
      '<path d="' + BODY_PATH + '" fill="' + BACK_FILL + '" stroke="' + BACK_STROKE +
        '" stroke-width="3.2" stroke-linejoin="round"/>' +
      cork(BACK_FILL, BACK_STROKE, 0.45) +
      '<text x="30" y="59" text-anchor="middle" dominant-baseline="middle" ' +
        'font-size="34" font-weight="800" fill="' + BACK_INK + '" ' +
        'font-family="Arial, Helvetica, sans-serif">?</text>';

    return svgWrap(inner, 'bottle-back');
  }

  /**
   * 渲染虚线轮廓（放置目标槽位）。
   * 第一个 path 的 stroke-dasharray 固定为 "6 5"（QA 断言依赖）。
   * @returns {string} SVG 字符串
   */
  function outline() {
    var dash = '" fill="rgba(255,252,242,0.72)" stroke="' + DASH_STROKE +
      '" stroke-width="2.6" stroke-dasharray="6 5" stroke-linejoin="round"/>';
    var inner =
      '<path d="' + BODY_PATH + dash +
      '<path d="' + CAP_PATH + dash;
    return svgWrap(inner, 'bottle-outline');
  }

  return {
    VIEW_W: VIEW_W,
    VIEW_H: VIEW_H,
    BODY_PATH: BODY_PATH,
    CAP_PATH: CAP_PATH,
    colored: colored,
    back: back,
    outline: outline
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Bottle;
}
if (typeof window !== 'undefined') {
  window.Bottle = Bottle;
}
