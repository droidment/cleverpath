(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    var inView = false;

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

    var observer = new IntersectionObserver(
      function (entries) {
        inView = entries[0].isIntersecting;
        if (reduceMotion.matches) return;
        if (inView && !document.hidden) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(pipe);

    document.addEventListener("visibilitychange", function () {
      if (reduceMotion.matches) return;
      if (document.hidden) {
        stop();
      } else if (inView) {
        start();
      }
    });

    var onMotionChange = function () {
      if (reduceMotion.matches) {
        stop();
      } else if (inView && !document.hidden) {
        start();
      }
    };
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", onMotionChange);
    }
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
    var rows = container.querySelectorAll(".step-row");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    rows.forEach(function (row) {
      observer.observe(row);
    });

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", function () {
        if (reduceMotion.matches) {
          container.classList.remove("reveal-ready");
          rows.forEach(function (row) {
            row.classList.add("is-revealed");
          });
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPipeline();
    initReveals();
  });
})();
