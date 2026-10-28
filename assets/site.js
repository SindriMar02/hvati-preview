(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(G && ST) && !reduce;
  if (motion) { G.registerPlugin(ST); doc.classList.add('motion'); }

  // Pointer opens focus the container, keyboard opens focus the first control (focus-guard rule).
  function focusOpen(e, panel, first) { (e && e.detail === 0 && first ? first : panel).focus({ preventScroll: true }); }

  /* ---------- Header: solid after the hero, hides on scroll down ---------- */
  var hdr = document.querySelector('.hdr'), lastY = scrollY;
  if (hdr) {
    var onScroll = function () {
      var y = scrollY;
      if (!hdr.classList.contains('hdr--solid')) hdr.classList.toggle('is-solid', y > 40);
      if (!reduce) hdr.classList.toggle('is-hidden', y > 400 && y > lastY && !document.querySelector('.menu.is-open'));
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- Split headings into masked words ---------- */
  var splits = [].slice.call(document.querySelectorAll('[data-split]'));
  splits.forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span>' + w + '</span></span>'; }).join(' ');
  });

  if (motion) {
    // In-hero headings play on load; the rest on enter.
    splits.forEach(function (el) {
      var inner = el.querySelectorAll('.w > span');
      G.set(inner, { yPercent: 110 });
      var play = function () { G.to(inner, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.04 }); };
      if (el.closest('.hvs')) G.delayedCall(0.15, play);
      else ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: play });
    });
    var heroBits = document.querySelectorAll('.hvs__lead > :not(h1), .hvs__panel');
    G.from(heroBits, { y: 24, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.35 });

    G.set('[data-reveal]', { y: 40, autoAlpha: 0 });
    ST.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: function (b) { G.to(b, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }); } });

    document.querySelectorAll('[data-clip]').forEach(function (el) {
      var im = el.querySelector('img, svg');
      G.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
      if (im && im.tagName === 'IMG' && !el.hasAttribute('data-parallax')) G.set(im, { scale: 1.15 });
      ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
        G.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' });
        if (im && im.tagName === 'IMG' && !el.hasAttribute('data-parallax')) G.to(im, { scale: 1, duration: 1.6, ease: 'power3.out' });
      } });
    });

    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var im = el.querySelector('img');
      G.fromTo(im, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = +el.dataset.count, from = +(el.dataset.from || 0), o = { v: from };
      el.textContent = from;
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        G.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
    });

    var dim = document.querySelector('.door__dim');
    if (dim) { G.set(dim, { autoAlpha: 0 }); ST.create({ trigger: dim, start: 'top 80%', once: true, onEnter: function () { G.to(dim, { autoAlpha: 1, duration: 0.8, delay: 0.9 }); } }); }

    // Refresh trigger positions once fonts and late images settle.
    if (document.fonts) document.fonts.ready.then(function () { ST.refresh(); });
    addEventListener('load', function () { ST.refresh(); });
  }

  /* ---------- Hero slider ---------- */
  document.querySelectorAll('[data-hvs]').forEach(function (root) {
    var slides = [].slice.call(root.querySelectorAll('.hvs__slide'));
    var btns = [].slice.call(root.querySelectorAll('.hvs__index button'));
    var bars = btns.map(function (b) { return b.querySelector('.bar i'); });
    var count = root.querySelector('.hvs__count b'), cap = root.querySelector('.hvs__caption');
    var DUR = 6.5, cur = 0, busy = null, prog = null, paused = false;
    function label(i) {
      btns.forEach(function (b, j) { if (i === j) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      slides.forEach(function (s, j) { s.setAttribute('aria-hidden', i !== j); });
      if (count) count.textContent = String(i + 1).padStart(2, '0');
      if (cap) {
        var t = btns[i].querySelector('.t').textContent, d = btns[i].querySelector('.d').textContent;
        if (motion) G.fromTo(cap, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        cap.innerHTML = '<b>' + t + '</b><span>' + d + '</span>';
      }
    }
    function runProgress() {
      if (!motion) return;
      if (prog) prog.kill();
      bars.forEach(function (b, j) { G.set(b, { scaleX: j < cur ? 1 : 0 }); });
      if (innerWidth >= 1000) bars.forEach(function (b, j) { if (j !== cur) G.set(b, { scaleX: 0 }); });
      prog = G.fromTo(bars[cur], { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none', onComplete: function () { go(cur + 1); } });
      if (paused) prog.pause();
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      if (n === cur) { runProgress(); return; }
      var from = slides[cur], to = slides[n], fi = from.querySelector('img'), ti = to.querySelector('img');
      if (busy) busy.progress(1).kill();
      if (prog) prog.kill();
      cur = n; label(n);
      if (!motion) {
        slides.forEach(function (s) { s.classList.toggle('is-on', s === to); s.style.zIndex = s === to ? 2 : 1; });
        return;
      }
      G.set(to, { zIndex: 2, visibility: 'visible', clipPath: 'inset(0% 0% 0% 100%)' });
      G.set(from, { zIndex: 1 });
      busy = G.timeline({ onComplete: function () {
        from.classList.remove('is-on'); G.set(from, { visibility: 'hidden', clearProps: 'clipPath' }); G.set(fi, { xPercent: 0, scale: 1 });
        to.classList.add('is-on'); busy = null;
      } })
        .to(to, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut' }, 0)
        .fromTo(ti, { scale: 1.12, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 1.6, ease: 'power3.out' }, 0)
        .to(fi, { xPercent: -6, duration: 1.4, ease: 'power4.inOut' }, 0);
      runProgress();
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    // Swipe on the photo area
    var sx = null;
    root.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && !e.target.closest('a,button')) sx = e.clientX; });
    root.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); });
    // Pause on the index panel, when hidden, and when scrolled away
    var panel = root.querySelector('.hvs__panel');
    function pause(v) { paused = v; if (prog) v ? prog.pause() : prog.resume(); }
    panel.addEventListener('mouseenter', function () { pause(true); });
    panel.addEventListener('mouseleave', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { pause(!en[0].isIntersecting); }).observe(root);
    // Every photo is decoded before the first change, so a wipe never reveals an empty frame.
    var imgs = slides.map(function (s) { return s.querySelector('img'); });
    Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () {}) : Promise.resolve(); })).then(function () {
      if (motion) runProgress();
    });
  });

  /* ---------- Rotating photo stacks ---------- */
  document.querySelectorAll('[data-rotator]').forEach(function (root) {
    var figs = [].slice.call(root.querySelectorAll('.rot__f')), dots = [].slice.call(root.querySelectorAll('.rot__dots button'));
    var i = 0, timer = null, visible = false, hover = false;
    function show(n) {
      i = (n + figs.length) % figs.length;
      figs.forEach(function (f, j) { f.classList.toggle('is-on', j === i); });
      dots.forEach(function (d, j) { if (j === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    }
    function tick() { clearTimeout(timer); if (!reduce && visible && !hover && !document.hidden) timer = setTimeout(function () { show(i + 1); tick(); }, 4200); }
    dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j); tick(); }); });
    root.addEventListener('mouseenter', function () { hover = true; clearTimeout(timer); });
    root.addEventListener('mouseleave', function () { hover = false; tick(); });
    document.addEventListener('visibilitychange', tick);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; tick(); }, { threshold: 0.35 }).observe(root);
  });

  /* ---------- Carousels ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.car__track'), prev = root.querySelector('.car__btn.prev'), next = root.querySelector('.car__btn.next'), count = root.querySelector('.car__count');
    function items() { return [].slice.call(track.children).filter(function (c) { return !c.hidden; }); }
    function step() { var it = items(); return it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : track.clientWidth; }
    function update() {
      var it = items(), s = step(), idx = Math.round(track.scrollLeft / (s || 1));
      idx = Math.min(it.length - 1, Math.max(0, idx));
      if (count) count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(it.length).padStart(2, '0');
      if (prev) prev.disabled = track.scrollLeft < 8;
      if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next && next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev && prev.click(); }
    });
    root._update = update; addEventListener('resize', update); update();
  });

  /* ---------- Gallery filter + lightbox ---------- */
  document.querySelectorAll('[data-gallery]').forEach(function (wrap) {
    var grid = wrap.querySelector('.gal'), tabs = wrap.querySelectorAll('.tab'), items = [].slice.call(grid.children);
    var swap;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var cat = t.dataset.cat;
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        clearTimeout(swap); grid.classList.add('is-swapping');
        swap = setTimeout(function () {
          items.forEach(function (b) { b.hidden = cat !== 'all' && b.dataset.cat !== cat; });
          grid.scrollLeft = 0; grid.classList.remove('is-swapping');
          if (wrap._update) wrap._update();
        }, reduce ? 0 : 200);
      });
    });
    var lb = wrap.querySelector('.lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), cur = 0, opener;
    function visible() { return items.filter(function (b) { return !b.hidden; }); }
    function show(i) {
      var v = visible(); cur = (i + v.length) % v.length; var b = v[cur], im = b.querySelector('img');
      lbImg.src = b.dataset.full; lbImg.alt = im.alt; lbCap.textContent = im.alt + ' · ' + (cur + 1) + ' / ' + v.length;
    }
    items.forEach(function (b) {
      b.addEventListener('click', function (e) {
        opener = b; show(visible().indexOf(b)); lb.showModal();
        focusOpen(e, lb, lb.querySelector('.lb-x'));
      });
    });
    lb.querySelector('.lb-x').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { if (opener) opener.focus({ preventScroll: true }); });
  });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu'), closeMenuQuietly = function () {};
  if (burger && menu) {
    var closeBtn = menu.querySelector('.close');
    var setMenu = function (open, e) {
      menu.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
      menu.toggleAttribute('inert', !open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) focusOpen(e, menu, menu.querySelector('a')); else burger.focus({ preventScroll: true });
    };
    menu.setAttribute('inert', '');
    burger.addEventListener('click', function (e) { setMenu(true, e); });
    closeBtn.addEventListener('click', function (e) { setMenu(false, e); });
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    // A request opened from the menu replaces it: close without moving focus back to the burger.
    closeMenuQuietly = function () {
      if (!menu.classList.contains('is-open')) return;
      menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); menu.setAttribute('inert', '');
      document.body.style.overflow = '';
    };
  }

  /* ---------- Room selector ---------- */
  document.querySelectorAll('[data-rooms]').forEach(function (wrap) {
    var btns = [].slice.call(wrap.querySelectorAll('.roomtabs .tab')), imgs = wrap.querySelectorAll('.finish__photo img');
    var cap = wrap.querySelector('.finish__photo figcaption'), lists = wrap.querySelectorAll('.spec'), t;
    function pick(i) {
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', i === j); b.tabIndex = i === j ? 0 : -1; });
      imgs.forEach(function (im, j) { im.classList.toggle('on', i === j); });
      cap.textContent = imgs[i].alt;
      clearTimeout(t); var on = wrap.querySelector('.spec:not([hidden])');
      if (on) on.classList.add('is-swapping');
      t = setTimeout(function () {
        lists.forEach(function (l, j) { l.hidden = i !== j; l.classList.add('is-swapping'); });
        requestAnimationFrame(function () { lists[i].classList.remove('is-swapping'); });
      }, reduce ? 0 : 160);
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; e.preventDefault(); var n = (i + d + btns.length) % btns.length; pick(n); btns[n].focus();
      });
    });
  });

  /* ---------- Expanders: unit rows + FAQ ---------- */
  document.querySelectorAll('.unit > button, .acc__i > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open); b.parentNode.classList.toggle('is-open', open);
    });
  });

  /* ---------- Phone sticky bar: after the hero, gone at the closing band ---------- */
  var sbar = document.querySelector('.sbar'), hero = document.querySelector('.hvs'), endBand = document.querySelector('.band--ink');
  if (sbar && hero) {
    var sbtn = sbar.querySelector('button');
    var syncBar = function () {
      var past = hero.getBoundingClientRect().bottom < 0;
      var atEnd = endBand && endBand.getBoundingClientRect().top < innerHeight;
      var on = past && !atEnd;
      sbar.classList.toggle('is-on', on); sbar.setAttribute('aria-hidden', !on); sbtn.tabIndex = on ? 0 : -1;
    };
    addEventListener('scroll', syncBar, { passive: true }); syncBar();
  }

  /* ---------- Request sheet: "Óska eftir skoðun". Prototype only: nothing is sent. ---------- */
  var sheet = document.getElementById('sheet'), trigger;
  if (sheet) {
    var form = sheet.querySelector('form'), unitSel = sheet.querySelector('#rq-unit'), done = sheet.querySelector('.done');
    document.querySelectorAll('[data-request]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var fromMenu = !!b.closest('.menu'); closeMenuQuietly();
        trigger = fromMenu ? burger : b;
        if (unitSel) unitSel.value = b.dataset.request || 'lod';
        form.hidden = false; done.hidden = true;
        sheet.showModal(); document.body.style.overflow = 'hidden';
        focusOpen(e, sheet, sheet.querySelector('.x'));
      });
    });
    sheet.querySelector('.x').addEventListener('click', function () { sheet.close(); });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener('close', function () { document.body.style.overflow = ''; if (trigger) trigger.focus({ preventScroll: true }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!form.reportValidity()) return;
      form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
    });
  }

  /* ---------- Contact page branches ---------- */
  var branchForm = document.getElementById('enquiry');
  if (branchForm) {
    var sync = function () {
      var v = branchForm.querySelector('input[name="erindi"]:checked').value;
      branchForm.querySelectorAll('.branch').forEach(function (b) {
        var on = b.dataset.branch === v; b.hidden = !on;
        b.querySelectorAll('input,select,textarea').forEach(function (f) { f.disabled = !on; });
      });
    };
    branchForm.querySelectorAll('input[name="erindi"]').forEach(function (r) { r.addEventListener('change', sync); });
    var want = new URLSearchParams(location.search).get('erindi');
    if (want) { var r = branchForm.querySelector('input[name="erindi"][value="' + want + '"]'); if (r) r.checked = true; }
    sync();
    branchForm.addEventListener('submit', function (e) {
      e.preventDefault(); if (!branchForm.reportValidity()) return;
      var d = document.getElementById('enquiry-done'); branchForm.hidden = true; d.hidden = false; d.focus({ preventScroll: true });
    });
  }
})();
