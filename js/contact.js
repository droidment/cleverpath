(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form || typeof window.fetch !== "function") return;

    var errorBox = form.querySelector("[data-form-error]");
    var loadedAt = Date.now();

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (errorBox) errorBox.classList.remove("is-visible");

      // Spam guard: humans don't fill six fields in under three seconds.
      if (Date.now() - loadedAt < 3000) {
        if (errorBox) {
          errorBox.textContent =
            "That was quick! Please take a moment and press Send again.";
          errorBox.classList.add("is-visible");
        }
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      var data = new FormData(form);

      // FormSubmit AJAX endpoint mirrors the form action.
      var ajaxUrl = form.action.replace("formsubmit.co/", "formsubmit.co/ajax/");

      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }

      fetch(ajaxUrl, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function () {
          var success = document.createElement("div");
          success.className = "form-success";
          success.setAttribute("tabindex", "-1");
          success.innerHTML =
            "<h3>Thanks — your message is in.</h3>" +
            "<p>We reply within one business day. Want to skip the queue?</p>" +
            '<p style="margin-top:16px"><a class="btn btn-primary" href="https://cal.com/cleverpath-waftpa/fit-call">Book a 30-minute fit call</a></p>';
          form.replaceWith(success);
          success.focus();
        })
        .catch(function () {
          if (errorBox) {
            errorBox.classList.add("is-visible");
          }
          if (button) {
            button.disabled = false;
            button.textContent = "Send message";
          }
        });
    });
  });
})();
