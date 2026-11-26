(function () {
  "use strict";

  /* ===== Configuration ===== */
  var WA_NUMBER = "2250172392929"; // +225 01 72 39 29 29

  /* ===== Année dans le footer ===== */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ===== Menu mobile ===== */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ===== Filtres du catalogue ===== */
  var filters = document.querySelectorAll(".filter");
  var services = document.querySelectorAll(".service");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      services.forEach(function (s) {
        s.hidden = !(f === "all" || s.getAttribute("data-cat") === f);
      });
    });
  });

  /* ===== Formulaire de devis ===== */
  var form = document.getElementById("quote-form");
  if (!form) return;

  var success = document.getElementById("form-success");
  var waSend = document.getElementById("wa-send");
  var resetBtn = document.getElementById("form-reset");

  // Présélection du service via ?service=xxx
  var params = new URLSearchParams(window.location.search);
  var pre = params.get("service");
  if (pre && form.service) form.service.value = pre;

  function setError(id, msg) {
    var el = document.getElementById("err-" + id);
    if (el) el.textContent = msg || "";
    var field = form.elements[id];
    if (field && field.classList) field.classList.toggle("is-invalid", !!msg);
  }

  function validate() {
    var ok = true;
    var v = function (n) { return (form.elements[n].value || "").trim(); };

    if (!v("service")) { setError("service", "Choisissez une prestation."); ok = false; } else setError("service");
    if (!v("zone")) { setError("zone", "Choisissez votre commune."); ok = false; } else setError("zone");
    if (v("quartier").length < 2) { setError("quartier", "Indiquez votre quartier."); ok = false; } else setError("quartier");

    var urg = form.querySelector('input[name="urgence"]:checked');
    var eu = document.getElementById("err-urgence");
    if (!urg) { eu.textContent = "Sélectionnez un niveau d'urgence."; ok = false; } else eu.textContent = "";

    if (v("message").length < 10) { setError("message", "Décrivez votre besoin (10 caractères minimum)."); ok = false; } else setError("message");
    if (v("nom").length < 2) { setError("nom", "Indiquez votre nom."); ok = false; } else setError("nom");

    // Téléphone ivoirien : 10 chiffres (ou +225 / 00225 suivi de 10 chiffres)
    var digits = v("tel").replace(/[\s.\-()]/g, "").replace(/^(\+|00)225/, "");
    if (!/^\d{10}$/.test(digits)) { setError("tel", "Numéro invalide (10 chiffres, ex. 01 23 45 67 89)."); ok = false; } else setError("tel");

    var mail = v("email");
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { setError("email", "Adresse email invalide."); ok = false; } else setError("email");

    var ec = document.getElementById("err-consent");
    if (!form.consent.checked) { ec.textContent = "Veuillez accepter pour continuer."; ok = false; } else ec.textContent = "";

    return ok;
  }

  function label(select) {
    return select.options[select.selectedIndex].text;
  }

  function buildMessage() {
    var urg = form.querySelector('input[name="urgence"]:checked').value;
    var lines = [
      "Bonjour MYXAN Groupe, je souhaite un devis.",
      "Prestation : " + label(form.service),
      "Zone : " + form.zone.value + " (" + form.quartier.value.trim() + ")",
      "Urgence : " + urg,
      form.budget.value ? "Budget : " + form.budget.value : "",
      "Besoin : " + form.message.value.trim(),
      "Nom : " + form.nom.value.trim(),
      "Tél : " + form.tel.value.trim()
    ];
    return lines.filter(Boolean).join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Anti-spam : le champ piège doit rester vide
    if (form.website && form.website.value) return;
    if (!validate()) {
      var first = form.querySelector(".is-invalid");
      if (first) first.focus();
      return;
    }

    var text = buildMessage();
    waSend.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);

    // Envoi optionnel vers un service (Formspree, etc.) si data-endpoint est renseigné
    var endpoint = form.getAttribute("data-endpoint");
    if (endpoint) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      }).catch(function () { /* la demande reste envoyable via WhatsApp */ });
    }

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    form.scrollIntoView({ behavior: "smooth" });
  });

  // Validation à la volée une fois le champ quitté
  form.addEventListener("blur", function (e) {
    if (e.target.matches("input[type=text], input[type=tel], input[type=email], textarea, select")) validate();
  }, true);
})();