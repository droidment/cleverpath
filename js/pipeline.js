(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Pixels of the element currently inside the viewport.
  function visiblePx(el) {
    var r = el.getBoundingClientRect();
    var winH = window.innerHeight || document.documentElement.clientHeight;
    return Math.min(r.bottom, winH) - Math.max(r.top, 0);
  }

  // "In view" by pixels, not ratio — a tall vertical pipeline in a short
  // viewport can never reach a large intersection ratio.
  function inView(el) {
    var r = el.getBoundingClientRect();
    if (!r.height) return false;
    return visiblePx(el) >= Math.min(140, r.height * 0.5);
  }

  // Call handler on anything that could change what's visible. IO alone is
  // not enough: embedded webviews defer IO callbacks while they (sometimes
  // wrongly) report the document as hidden, so a polling watchdog backstops it.
  function watchViewport(el, handler) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(handler, { threshold: [0, 0.1, 0.3] }).observe(el);
    }
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    window.setInterval(handler, 2000);
  }

  /* ----------------------------------------------------------
     Hero pipeline animation (Home)
     Default markup/CSS renders the finished pipeline; this adds
     the looping "issue travels to transport" show only when
     motion is allowed.
     ---------------------------------------------------------- */
  function initPipeline() {
    var pipe = document.querySelector("[data-pipe]");
    if (!pipe) return;

    var nodes = Array.prototype.slice.call(pipe.querySelectorAll(".pipe-node"));
    var links = Array.prototype.slice.call(pipe.querySelectorAll(".pipe-link"));
    var caption = document.querySelector("[data-pipe-caption]");
    var captions = [
      "Issue received from a functional user",
      "Branch created — AI worker dispatched",
      "Code, tests, and artifacts generated",
      "Senior engineer reviews the pull request",
      "Merged — abapGit pull, transport created",
      "Deployed to DEV. Transport released ✓"
    ];

    var STEP_MS = 1700;
    var HOLD_MS = 2200;
    var timer = null;
    var index = -1;

    function clearStates() {
      nodes.forEach(function (n) {
        n.classList.remove("is-active", "is-done");
      });
      links.forEach(function (l) {
        l.classList.remove("is-flowing", "is-filled");
      });
    }

    function step() {
      index += 1;

      if (index >= nodes.length) {
        // Success hold finished — reset and restart.
        index = -1;
        clearStates();
        timer = window.setTimeout(step, 600);
        return;
      }

      if (index > 0) {
        nodes[index - 1].classList.remove("is-active");
        nodes[index - 1].classList.add("is-done");
        if (links[index - 1]) {
          // fill + pulse animations run forwards and hold their end state
          links[index - 1].classList.add("is-flowing", "is-filled");
        }
      }

      nodes[index].classList.add("is-active");
      if (caption && captions[index]) {
        caption.textContent = captions[index];
      }

      var isLast = index === nodes.length - 1;
      timer = window.setTimeout(step, isLast ? HOLD_MS : STEP_MS);
    }

    function start() {
      if (timer !== null) return;
      pipe.classList.add("pipe--animated");
      index = -1;
      clearStates();
      timer = window.setTimeout(step, 400);
    }

    function stop() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      pipe.classList.remove("pipe--animated");
      clearStates();
      if (caption) caption.textContent = caption.getAttribute("data-default") || "";
    }

    function reconcile() {
      if (reduceMotion.matches) {
        stop();
        return;
      }
      if (inView(pipe)) {
        start();
      } else {
        stop();
      }
    }

    watchViewport(pipe, reconcile);
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", reconcile);
    }
    reconcile();
  }

  /* ----------------------------------------------------------
     Scroll reveals (How It Works step rows)
     Hidden state is applied only after JS confirms motion is OK,
     so no-JS and reduced-motion users always see full content.
     ---------------------------------------------------------- */
  function initReveals() {
    var container = document.querySelector("[data-reveal]");
    if (!container || reduceMotion.matches) return;

    container.classList.add("reveal-ready");
    var pending = Array.prototype.slice.call(container.querySelectorAll(".step-row"));

    function revealVisible() {
      pending = pending.filter(function (row) {
        if (visiblePx(row) > 40) {
          row.classList.add("is-revealed");
          return false;
        }
        return true;
      });
    }

    watchViewport(container, revealVisible);
    revealVisible();

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", function () {
        if (reduceMotion.matches) {
          container.classList.remove("reveal-ready");
          pending.forEach(function (row) {
            row.classList.add("is-revealed");
          });
          pending = [];
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPipeline();
    initReveals();
  });
})();
