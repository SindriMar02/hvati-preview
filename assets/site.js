(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opening arrival: content is readable from the start; the class only adds the settle.
  function ready() { setTimeout(function () { doc.classList.add('is-ready'); }, 30); }
  var heroImg = document.querySelector('.hero__img img');
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', ready, { once: true }); setTimeout(ready, 900); } else ready();

  // Header turns solid after the hero starts to leave.
  var hdr = document.querySelector('.hdr');
  if (hdr && !hdr.classList.contains('hdr--solid')) {
    var onScroll = function () { hdr.classList.toggle('is-solid', scrollY > 40); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // Section reveals, played once. Children with [data-reveal] stagger by index within the parent.
  var els = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = [].filter.call(e.target.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); });
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 70 + 'ms';
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  // Pointer opens focus the container, keyboard opens focus the first control (focus-guard rule).
  function focusOpen(e, panel, first) { (e && e.detail === 0 && first ? first : panel).focus({ preventScroll: true }); }

  // Mobile menu
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

  // Gallery tabs + lightbox
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
          grid.classList.remove('is-swapping');
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

  // Room selector (signature): photo cross-fade + spec list swap; arrow keys move between rooms.
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

  // Unit rows expand/collapse
  document.querySelectorAll('.unit > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open); b.parentNode.classList.toggle('is-open', open);
    });
  });

  // Request sheet: "Óska eftir skoðun". Prototype only: nothing is sent.
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

  // Contact page branches
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
