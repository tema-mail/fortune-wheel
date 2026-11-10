/*!
 * Колесо фортуны – встраиваемый виджет (копия поведения и вида виджета «Колесо фортуны»).
 * Один файл, без зависимостей, стили изолированы в Shadow DOM.
 * Подключение:
 *   <script>window.FortuneWheelConfig = { ...настройки... }</script>
 *   <script src="fortune-wheel.js" defer></script>
 * Управление: FortuneWheel.open(), FortuneWheel.close(), FortuneWheel.reset()
 */
(function () {
  'use strict';
  if (window.FortuneWheel && window.FortuneWheel.__ready) return;

  var DEFAULTS = {
    title: 'Получите бонус сейчас!',
    subtitle: 'Крутите колесо и выигрывайте лучшие призы. Данный бонус доступен при покупке клубной карты.',
    nameLabel: 'Ваше имя*',
    namePlaceholder: 'Введите имя',
    phoneLabel: 'Ваш телефон*',
    phonePlaceholder: '+7 (000) 000-00-00',
    button: 'Крутить колесо',
    consentText: 'Вы даете согласие на ',
    consentLinkText: 'обработку персональных данных',
    privacyUrl: '/privacy-policy',
    consentCheckbox: true,          // пустая галочка, без неё заявка не уходит
    winSubtitle: 'Мы свяжемся с вами в ближайшее время и ответим на все вопросы!',
    prizes: [
      { name: 'Бонусная карта на 45 дней', code: 'BONUS45' },
      { name: '5 гостевых визитов', code: 'GUEST5' },
      { name: 'Скидка 15% на абонемент', code: 'SALE15' },
      { name: 'Скидка 10% на абонемент', code: 'SALE10' },
      { name: '30 дней фитнеса', code: 'FIT30' },
      { name: '30 дней заморозки', code: 'FREEZE30' }
    ],
    colors: {
      sector1: 'rgba(54,188,70,1)',
      sector2: 'rgba(1,205,196,1)',
      sectorText: '#ffffff',
      stroke: 'rgba(240,240,240,1)',
      button: 'rgba(54,188,70,1)',
      launcher: '#36bc46'
    },
    font: 'Manrope',                 // подгружается с Google Fonts; '' – не грузить
    fontStack: '"Manrope", Arial, Helvetica, sans-serif',
    autoOpen: [10, 100],            // секунды на сайте до 1-го и 2-го показа; [] – не показывать само
    launcher: true,                 // круглая кнопка в углу
    launcherPosition: 'right',      // right | left
    spinDuration: 7000,
    endpoint: '',                   // POST JSON заявки сюда
    onLead: null,                   // function(lead) {}
    metrika: null,                  // { id: 12345678, goal: 'wheel_spin' }
    storageKey: 'fortune-wheel-v1'
  };

  // ---------- геометрия колеса (500×500, 10 секторов по 36°) ----------
  var SECTORS = [
    'M500 250C500 302.795 483.286 354.234 452.254 396.946L290.451 279.389C296.657 270.847 300 260.559 300 250H500Z',
    'M452.254 396.946C421.222 439.658 377.465 471.45 327.254 487.764L265.451 297.553C275.493 294.29 284.244 287.932 290.451 279.389L452.254 396.946Z',
    'M327.254 487.764C277.043 504.079 222.957 504.079 172.746 487.764L234.549 297.553C244.591 300.816 255.409 300.816 265.451 297.553L327.254 487.764Z',
    'M172.746 487.764C122.535 471.45 78.7777 439.658 47.7457 396.946L209.549 279.389C215.756 287.932 224.507 294.29 234.549 297.553L172.746 487.764Z',
    'M47.7457 396.946C16.7137 354.234 0 302.795 0 250L200 250C200 260.559 203.343 270.847 209.549 279.389L47.7457 396.946Z',
    'M0 250C0 197.205 16.7137 145.766 47.7458 103.054L209.549 220.611C203.343 229.153 200 239.441 200 250L0 250Z',
    'M47.7458 103.054C78.7778 60.3418 122.535 28.5503 172.746 12.2358L234.549 202.447C224.507 205.71 215.756 212.068 209.549 220.611L47.7458 103.054Z',
    'M172.746 12.2359C222.957 -4.07861 277.043 -4.07863 327.254 12.2358L265.451 202.447C255.409 199.184 244.591 199.184 234.549 202.447L172.746 12.2359Z',
    'M327.254 12.2359C377.465 28.5504 421.222 60.3418 452.254 103.054L290.451 220.611C284.244 212.068 275.493 205.71 265.451 202.447L327.254 12.2359Z',
    'M452.254 103.054C483.286 145.766 500 197.205 500 250L300 250C300 239.441 296.657 229.153 290.451 220.611L452.254 103.054Z'
  ];
  var START_ANGLE = -72; // в покое видны первые 4 приза

  var ARROW = '<svg width="56" height="61" viewBox="0 0 56 61" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#fwArrowShadow)"><path d="M26.1659 5.2385C26.8617 3.63146 29.1407 3.63146 29.8365 5.2385L45.7618 42.0163C46.4403 43.5832 44.9697 45.2249 43.3378 44.7224L28.5905 40.1812C28.207 40.0631 27.7969 40.0631 27.4134 40.1812L12.6645 44.7225C11.0326 45.225 9.5621 43.5833 10.2406 42.0164L26.1659 5.2385Z" fill="white"/></g><defs><filter id="fwArrowShadow" x="-4.5" y="-3" width="65" height="80" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="b"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="a"/><feOffset dy="6"/><feGaussianBlur stdDeviation="5"/><feComposite in2="a" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend mode="normal" in2="b" result="s"/><feBlend mode="normal" in="SourceGraphic" in2="s" result="shape"/></filter></defs></svg>';
  var CROSS = '<svg width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.04795 3L8 6.95205L11.9521 3L13 4.04795L9.04795 8L13 11.9521L11.9521 13L8 9.04795L4.04795 13L3 11.9521L6.95205 8L3 4.04795L4.04795 3Z"/></svg>';
  var COPY = '<svg viewBox="0 0 20 20"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.95312 2.5H16.7969C17.1857 2.5 17.5 2.815 17.5 3.20312V13.0469C17.5 13.435 17.1857 13.75 16.7969 13.75H6.95312C6.5643 13.75 6.25 13.435 6.25 13.0469V3.20312C6.25 2.815 6.5643 2.5 6.95312 2.5ZM2.5 5H5V15H15V17.5H3C2.72386 17.5 2.5 17.2761 2.5 17V15V5Z"/></svg>';
  var DONE = '<svg viewBox="0 0 16 16"><path d="M6.021 13L2 9.355 3.428 8.06l2.443 2.215L12.437 3 14 4.16z"/></svg>';
  var WHEEL_ICON = '<svg viewBox="0 0 40 40" width="34" height="34" fill="none"><circle cx="20" cy="21" r="14" stroke="#fff" stroke-width="2.4"/><path d="M20 7v28M6 21h28M10.1 11.1l19.8 19.8M29.9 11.1L10.1 30.9" stroke="#fff" stroke-width="1.6"/><circle cx="20" cy="21" r="3.2" fill="#fff"/><path d="M20 3l3 5h-6l3-5z" fill="#fff"/></svg>';

  var DASH = "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='5' ry='5' stroke='rgba(177,179,181,1.00)' stroke-width='1' stroke-dasharray='5%2c 5' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")";

  function css(c) {
    return [
      ':host{all:initial}',
      '*{box-sizing:border-box}',
      '.ov{position:fixed;inset:0;z-index:2147483647;display:flex;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:' + c.fontStack + ';opacity:0;transition:opacity .2s ease}',
      '.ov.on{opacity:1}',
      '.bg{position:fixed;inset:0;background:rgba(0,0,0,.5)}',
      '.card{position:relative;z-index:2;margin:auto;width:400px;max-width:calc(100vw - 32px);padding:24px;background:#fff;border-radius:8px;isolation:isolate}',
      '@media (max-height:760px){.card{margin:16px auto}}',
      '.content{display:flex;flex-direction:column;width:100%}',
      '.x{position:absolute;top:12px;right:12px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;padding:0;border-radius:16px;background:rgba(31,40,44,.5);cursor:pointer;z-index:4;transition:150ms}',
      '.x:hover{background:rgba(31,40,44,.8)}',
      '.x:focus-visible{outline:3px solid currentColor;outline-offset:3px}',
      '.x svg{width:20px;height:20px}.x path{fill:rgba(255,255,255,.8)}',
      // колесо
      '.wm{position:relative;display:flex;justify-content:center;align-items:flex-end;height:286px;width:calc(100% + 48px);margin:-24px -24px 24px;padding-bottom:36px;border-radius:8px;overflow:hidden}',
      '.arrow{position:absolute;width:56px;height:61px;right:calc(50% - 28px);bottom:0;z-index:22}',
      '.wc{position:relative;flex-shrink:0;width:500px;min-width:500px;height:500px;min-height:500px;transform:rotate(90deg);z-index:2}',
      '.ww{position:relative;width:500px;height:500px;z-index:2;will-change:transform}',
      '.ww svg{display:block}',
      '.wt{position:absolute;top:250px;left:250px;width:500px;height:500px;border-radius:50%}',
      '.bt{position:absolute;width:50%;height:50%;overflow:hidden;transform-origin:top left;z-index:222}',
      '.bs{width:calc(100% - 40px);height:calc(100% - 40px);display:flex;justify-content:center;align-items:center;text-align:center;transform:rotate(45deg)}',
      '.bx{max-width:140px;color:' + c.colors.sectorText + ';font-size:12px;line-height:16px;font-weight:500}',
      '.hole{position:absolute;top:200px;left:200px;width:100px;height:100px;border-radius:50%;background:' + c.colors.stroke + '}',
      // тексты
      '.t{color:#1f282c;font-size:28px;line-height:32px;font-weight:500;padding-bottom:16px;white-space:pre-wrap}',
      '.s{color:#1f282c;font-size:14px;line-height:20px;font-weight:500;padding-bottom:8px;white-space:pre-wrap}',
      // поля
      '.f{padding-bottom:12px;display:flex;width:100%}',
      '.fld{display:flex;flex-direction:column;align-items:flex-start;width:100%;padding:8px 12px;background:rgba(212,212,212,.3);border-radius:4px;cursor:text}',
      '.lbl{color:rgba(31,40,44,.7);font-size:11px;line-height:14px;font-weight:500}',
      'input.in{display:block;width:100%;height:20px;margin:4px 0 0;padding:0;border:0;border-radius:0;background:transparent;outline:none;color:#1f282c;font:500 16px/20px ' + c.fontStack + ';-webkit-appearance:none;appearance:none}',
      'input.in::placeholder{color:#1f282c;opacity:.5}',
      'input.in:focus::placeholder{opacity:0}',
      '.f.err .fld{background:rgba(253,242,242,1)}',
      '.f.err .lbl{color:rgba(203,36,36,.7)}',
      '.f.err input.in,.f.err input.in::placeholder{color:rgba(203,36,36,1)}',
      // кнопка
      '.bw{padding-bottom:16px;display:flex;width:100%}',
      '.btn{position:relative;width:100%;height:44px;padding:0 16px;border:0;border-radius:4px;background:' + c.colors.button + ';color:#fff;font:500 14px ' + c.fontStack + ';cursor:pointer;display:flex;align-items:center;justify-content:center;isolation:isolate;transition:opacity .25s}',
      '.btn:focus-visible{outline:3px solid rgba(31,40,44,.4);outline-offset:2px}',
      '.btn[disabled]{opacity:.5;cursor:not-allowed}',
      '.btn.load{opacity:.5;pointer-events:none}',
      '.ld{position:absolute;inset:0;display:none;align-items:center;justify-content:center}',
      '.btn.load .ld{display:flex}',
      '.ld i{display:inline-block;width:8px;height:24px;margin:5px 2px;background:#fff;animation:fwbar 2.8s ease-in-out infinite both}',
      '.ld i:nth-child(1){animation-delay:-.64s}.ld i:nth-child(2){animation-delay:-.32s}',
      '@keyframes fwbar{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}',
      // согласие
      '.agr{display:flex;align-items:flex-start;gap:6px;font-size:9px;line-height:9px;color:rgba(0,0,0,.7)}',
      '.agr label{display:flex;align-items:flex-start;gap:6px;cursor:pointer}',
      '.agr input{width:12px;height:12px;margin:-1px 0 0;flex-shrink:0;accent-color:' + c.colors.button + ';cursor:pointer}',
      '.agr a{color:#000;text-decoration:none}.agr a:hover{text-decoration:underline}',
      '.agr.err,.agr.err a{color:rgba(203,36,36,1)}',
      '.agr.err input{outline:1px solid rgba(203,36,36,1);outline-offset:1px}',
      // выигрыш
      '.pc{display:flex;justify-content:flex-start;align-items:center;padding-bottom:8px}',
      '.pcb{position:relative;display:flex;align-items:center;justify-content:center;height:48px;padding:7px 20px;border:0;border-radius:5px;background-color:transparent;background-image:' + DASH + ';color:#1f282c;font:500 24px/34px ' + c.fontStack + ';cursor:pointer;outline:none;max-width:100%}',
      '.pcb:hover{background-color:rgba(177,179,181,.15)}',
      '.pct{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ic{position:relative;min-width:28px;height:20px}',
      '.sv{display:flex;width:20px;height:20px;margin-left:8px;transition:transform 300ms,opacity 300ms}',
      '.sv svg{width:20px;height:20px;fill:rgb(212,212,212)}',
      '.sv.done{position:absolute;top:0;left:0;opacity:0;transform:rotate(-90deg)}',
      '.pcb.copied .sv.copy{opacity:0;transform:rotate(90deg)}',
      '.pcb.copied .sv.done{opacity:1;transform:rotate(0)}',
      '.nb{color:#1f282c;font-size:20px;line-height:20px;font-weight:500;padding-bottom:8px}',
      '.ws{color:rgb(106,112,114);font-size:14px;line-height:20px;font-weight:500}',
      // кнопка в углу
      '.ln{position:fixed;bottom:10px;z-index:2147483646;width:64px;height:64px;border:0;border-radius:32px;background:' + c.colors.launcher + ';display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18);transition:transform .2s}',
      '.ln:hover{transform:scale(1.06)}',
      '.ln:focus-visible{outline:3px solid rgba(31,40,44,.5);outline-offset:3px}',
      '.ln.right{right:10px}.ln.left{left:10px}',
      '.ln[hidden]{display:none}',
      '.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}'
    ].join('\n');
  }

  // ---------- утилиты ----------
  function merge(a, b) {
    var o = {};
    Object.keys(a).forEach(function (k) { o[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) o[k] = merge(a[k], b[k]);
      else if (b[k] !== undefined) o[k] = b[k];
    });
    return o;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  function easeOutSine(t) { return Math.sin(t * Math.PI / 2); }

  function phoneDigits(v) {
    var s = String(v).trim(), d = s.replace(/\D/g, '');
    if (/^\+7/.test(s)) d = d.slice(1);                       // наш префикс +7
    if (d.length === 11 && /^[78]/.test(d)) d = d.slice(1);   // вставили 8 900… или 7 900…
    return d.slice(0, 10);
  }
  function phoneMask(d) {
    if (!d) return '';
    var s = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) s += ') ' + d.slice(3, 6);
    if (d.length >= 6) s += '-' + d.slice(6, 8);
    if (d.length >= 8) s += '-' + d.slice(8, 10);
    return s;
  }

  // источник заявки: метки первого захода + текущей страницы
  var SRC_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid', 'fbclid'];
  function source(key) {
    var cur = {}, q = new URLSearchParams(location.search);
    SRC_KEYS.forEach(function (k) { if (q.get(k)) cur[k] = q.get(k); });
    var st = load(key + ':src');
    if (!st.first) { st.first = { landing: location.href, referrer: document.referrer || '', params: cur, ts: Date.now() }; save(key + ':src', st); }
    return { first: st.first, current: { page: location.href, referrer: document.referrer || '', params: cur } };
  }

  // ---------- виджет ----------
  function Widget(userCfg) {
    var c = this.cfg = merge(DEFAULTS, userCfg || {});
    this.prizes = c.prizes.slice(0, 10);
    this.state = load(c.storageKey);
    this.spinning = false;
    this.angle = START_ANGLE;
    if (c.font) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(c.font) + ':wght@500&display=swap';
      document.head.appendChild(l);
    }
    var host = document.createElement('div');
    host.setAttribute('data-fortune-wheel', '');
    document.body.appendChild(host);
    this.root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var st = document.createElement('style');
    st.textContent = css(c);
    this.root.appendChild(st);
    source(c.storageKey);
    if (c.launcher) this.mountLauncher();
    this.schedule();
  }

  Widget.prototype.mountLauncher = function () {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ln ' + (this.cfg.launcherPosition === 'left' ? 'left' : 'right');
    b.setAttribute('aria-label', 'Колесо фортуны');
    b.title = 'Колесо фортуны';
    b.innerHTML = WHEEL_ICON;
    var self = this;
    b.onclick = function () { self.open(); };
    this.root.appendChild(b);
    this.launcherEl = b;
  };

  // авто-показ: 1-й раз через autoOpen[0] секунд, 2-й через autoOpen[1], дальше не навязываем
  Widget.prototype.schedule = function () {
    var self = this, c = this.cfg;
    if (this.state.won) return;
    var n = this.state.shows || 0;
    if (!c.autoOpen || n >= c.autoOpen.length) return;
    var started = Date.now();
    clearTimeout(this.timer);
    this.timer = setTimeout(function () {
      if (self.isOpen || self.state.won) return;
      self.state.shows = (self.state.shows || 0) + 1;
      save(c.storageKey, self.state);
      self.open(true);
    }, Math.max(0, c.autoOpen[n] * 1000 - (Date.now() - started)));
  };

  Widget.prototype.wheelHTML = function () {
    var c = this.cfg, p = this.prizes, i, sectors = '', texts = '';
    for (i = 0; i < 10; i++) {
      sectors += '<path d="' + SECTORS[i] + '" fill="' + (i % 2 ? c.colors.sector2 : c.colors.sector1) + '"/>';
      texts += '<div class="bt" style="transform:rotate(' + (36 * i - 27) + 'deg)"><div class="bs"><div class="bx">' + esc(p[i % p.length].name) + '</div></div></div>';
    }
    var ring = '<circle cx="250" cy="250" r="246" stroke="' + c.colors.stroke + '" stroke-width="9" fill="none"/>';
    return '<div class="wm" aria-hidden="true"><div class="arrow">' + ARROW + '</div><div class="wc">' +
      '<div class="ww" style="transform:rotate(' + this.angle + 'deg)"><svg width="500" height="500" viewBox="0 0 500 500" fill="none">' + sectors + ring + '</svg>' +
      '<div class="wt">' + texts + '</div></div><div class="hole"></div></div></div>';
  };

  Widget.prototype.formHTML = function () {
    var c = this.cfg;
    var consent = c.consentCheckbox
      ? '<div class="agr" data-agr><label><input type="checkbox" data-consent><span>' + esc(c.consentText) + '<a href="' + esc(c.privacyUrl) + '" target="_blank" rel="noopener">' + esc(c.consentLinkText) + '</a></span></label></div>'
      : '<div class="agr"><span>' + esc(c.consentText) + '<a href="' + esc(c.privacyUrl) + '" target="_blank" rel="noopener">' + esc(c.consentLinkText) + '</a></span></div>';
    return '<div class="t" id="fw-title">' + esc(c.title) + '</div>' +
      '<div class="s">' + esc(c.subtitle) + '</div>' +
      '<form novalidate data-form>' +
      '<div class="f" data-f="name"><label class="fld"><span class="lbl">' + esc(c.nameLabel) + '</span><input class="in" name="name" type="text" autocomplete="name" placeholder="' + esc(c.namePlaceholder) + '" maxlength="60"></label></div>' +
      '<div class="f" data-f="phone"><label class="fld"><span class="lbl">' + esc(c.phoneLabel) + '</span><input class="in" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="' + esc(c.phonePlaceholder) + '"></label></div>' +
      '<div class="bw"><button class="btn" type="submit"><span class="bl">' + esc(c.button) + '</span><span class="ld" aria-hidden="true"><i></i><i></i><i></i></span></button></div>' +
      consent + '</form>';
  };

  Widget.prototype.winHTML = function () {
    var w = this.state.won, c = this.cfg;
    return '<div class="pc"><button type="button" class="pcb" data-copy title="Скопировать промокод"><span class="pct">' + esc(w.code) + '</span>' +
      '<span class="ic"><span class="sv copy">' + COPY + '</span><span class="sv done">' + DONE + '</span></span></button></div>' +
      '<div class="nb" id="fw-title">' + esc(w.name) + '</div>' +
      '<div class="ws">' + esc(c.winSubtitle) + '</div>';
  };

  Widget.prototype.open = function (auto) {
    if (this.isOpen) return;
    this.isOpen = true;
    clearTimeout(this.timer);
    var self = this;
    if (this.state.won) this.angle = this.state.won.angle;
    var ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = '<div class="bg" data-close></div><div class="card" role="dialog" aria-modal="true" aria-labelledby="fw-title">' +
      '<button type="button" class="x" aria-label="Закрыть" data-close>' + CROSS + '</button>' +
      '<div class="content">' + this.wheelHTML() + '<div data-body>' + (this.state.won ? this.winHTML() : this.formHTML()) + '</div></div></div>';
    this.root.appendChild(ov);
    this.ov = ov;
    this.wheelEl = ov.querySelector('.ww');
    if (this.launcherEl) this.launcherEl.hidden = true;
    requestAnimationFrame(function () { ov.classList.add('on'); });
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) self.close();
    });
    this.onKey = function (e) { if (e.key === 'Escape') self.close(); };
    document.addEventListener('keydown', this.onKey);
    this.bind();
    var first = ov.querySelector('input.in, [data-copy]');
    if (first && !auto && !('ontouchstart' in window)) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
  };

  Widget.prototype.close = function () {
    if (!this.isOpen) return;
    var ov = this.ov;
    this.isOpen = false;
    document.removeEventListener('keydown', this.onKey);
    ov.classList.remove('on');
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200);
    if (this.launcherEl) this.launcherEl.hidden = false;
    if (!this.state.won && !this.spinning) this.schedule();
    if (this.spinning) { this.spinning = false; cancelAnimationFrame(this.raf); }
  };

  Widget.prototype.bind = function () {
    var self = this, ov = this.ov;
    var form = ov.querySelector('[data-form]');
    var copy = ov.querySelector('[data-copy]');
    if (copy) copy.onclick = function () { self.copyCode(copy); };
    if (!form) return;
    var name = form.elements.name, phone = form.elements.phone, btn = form.querySelector('.btn');
    var consent = form.querySelector('[data-consent]');
    function clearErr(e) { var f = e.target.closest('.f'); if (f) f.classList.remove('err'); }
    name.addEventListener('input', clearErr);
    var prev = '';
    phone.addEventListener('input', function (e) {
      var d = phoneDigits(phone.value);
      if (prev === '' && d === '8') d = '';                    // по привычке начали с 8
      if (e.inputType === 'deleteContentBackward' && d === prev) d = d.slice(0, -1); // стёрли скобку или дефис – стираем и цифру
      phone.value = d ? phoneMask(d) : '+7 (';
      prev = d;
      clearErr(e);
    });
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 ('; });
    phone.addEventListener('blur', function () { if (phoneDigits(phone.value).length === 0) phone.value = ''; });
    var agr = form.querySelector('[data-agr]');
    if (consent) consent.addEventListener('change', function () { if (consent.checked) agr.classList.remove('err'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (self.spinning) return;
      var okName = name.value.trim().length >= 2;
      var okPhone = phoneDigits(phone.value).length === 10;
      form.querySelector('[data-f="name"]').classList.toggle('err', !okName);
      form.querySelector('[data-f="phone"]').classList.toggle('err', !okPhone);
      var okConsent = !consent || consent.checked;
      if (agr) agr.classList.toggle('err', !okConsent);
      if (!okName || !okPhone || !okConsent) return;
      self.submit({ name: name.value.trim(), phone: '+7' + phoneDigits(phone.value) }, btn, form);
    });
  };

  Widget.prototype.pick = function () {
    var p = this.prizes, total = 0, i, r;
    for (i = 0; i < p.length; i++) total += (p[i].weight == null ? 1 : +p[i].weight);
    r = Math.random() * total;
    for (i = 0; i < p.length; i++) { r -= (p[i].weight == null ? 1 : +p[i].weight); if (r < 0) return i; }
    return 0;
  };

  Widget.prototype.submit = function (data, btn, form) {
    var self = this, c = this.cfg;
    var idx = this.pick();
    var prize = this.prizes[idx];
    var turn = Math.floor(34 * Math.random()) + 1;        // смещение внутри сектора, как у оригинала
    var target = -(360 * 4 + 36 * idx + turn);              // 4 полных оборота + сектор приза
    var lead = {
      name: data.name, phone: data.phone,
      prize: prize.name, code: prize.code,
      source: source(c.storageKey), ts: new Date().toISOString()
    };
    btn.classList.add('load');
    form.querySelectorAll('input').forEach(function (i) { i.disabled = true; });
    this.spinning = true;
    this.state.won = { index: idx, name: prize.name, code: prize.code, angle: target };
    save(c.storageKey, this.state);
    this.send(lead);
    var from = this.angle, start = 0;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / c.spinDuration, 1);
      self.angle = from + (target - from) * easeOutSine(t);
      self.wheelEl.style.transform = 'rotate(' + self.angle + 'deg)';
      if (t < 1) self.raf = requestAnimationFrame(step);
      else setTimeout(function () { self.spinning = false; self.showWin(); }, 300);
    }
    this.raf = requestAnimationFrame(step);
  };

  Widget.prototype.showWin = function () {
    if (!this.isOpen) return;
    var body = this.ov.querySelector('[data-body]');
    body.innerHTML = this.winHTML();
    var copy = body.querySelector('[data-copy]'), self = this;
    copy.onclick = function () { self.copyCode(copy); };
  };

  Widget.prototype.copyCode = function (btn) {
    var code = this.state.won && this.state.won.code;
    if (!code) return;
    function ok() { btn.classList.add('copied'); setTimeout(function () { btn.classList.remove('copied'); }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, ok);
    else {
      var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* нет буфера */ }
      document.body.removeChild(ta); ok();
    }
  };

  Widget.prototype.send = function (lead) {
    var c = this.cfg;
    try { if (typeof c.onLead === 'function') c.onLead(lead); } catch (e) { console.error('[fortune-wheel] onLead', e); }
    if (c.metrika && c.metrika.id && typeof window.ym === 'function') {
      try { window.ym(c.metrika.id, 'reachGoal', c.metrika.goal || 'wheel_spin', { prize: lead.prize }); } catch (e) { /* нет Метрики */ }
    }
    if (c.endpoint) {
      fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), keepalive: true })
        .then(function (r) { if (!r.ok) console.error('[fortune-wheel] заявка не принята, код', r.status); })
        .catch(function (e) { console.error('[fortune-wheel] заявка не ушла', e); });
    }
  };

  Widget.prototype.reset = function () {
    this.close();
    this.state = {};
    this.angle = START_ANGLE;
    save(this.cfg.storageKey, {});
    this.schedule();
  };

  var instance = null;
  var api = {
    __ready: true,
    init: function (cfg) { if (!instance) instance = new Widget(cfg); return api; },
    open: function () { if (instance) instance.open(); },
    close: function () { if (instance) instance.close(); },
    reset: function () { if (instance) instance.reset(); },
    state: function () { return instance ? JSON.parse(JSON.stringify(instance.state)) : null; }
  };
  window.FortuneWheel = api;

  function boot() { if (window.FortuneWheelConfig !== false) api.init(window.FortuneWheelConfig || {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
