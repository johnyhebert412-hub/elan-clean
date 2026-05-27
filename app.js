(function () {
  "use strict";

  const STORAGE_KEY = "elan-clean-v0.5.0";
  const suggestedActions = {
    work: {
      title: "Préparer ton travail",
      text: "Configure ton horaire pour garder le focus plus calme.",
      action: "open-work"
    },
    finance: {
      title: "Vérifier ton solde",
      text: "Ouvre ton compte et regarde le montant disponible.",
      action: "complete"
    },
    house: {
      title: "Ramasser 3 objets",
      text: "Replace seulement trois choses a leur place.",
      action: "complete"
    },
    health: {
      title: "Boire de l'eau",
      text: "Prends quelques gorgées maintenant.",
      action: "complete"
    }
  };

  const defaultState = {
    selectedDomain: "",
    wins: 0,
    quickItems: [],
    work: { start: "", end: "", breaks: "none", energy: "steady", doNotDisturb: false, softReminders: false },
    notifications: { important: false, summary: false }
  };

  let state = loadState();
  let toastTimer;
  let quickType = "Tâche";

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return structuredClone(defaultState);
      return {
        ...structuredClone(defaultState),
        ...saved,
        work: { ...defaultState.work, ...saved.work },
        notifications: { ...defaultState.notifications, ...saved.notifications }
      };
    } catch (error) {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 2300);
    if ("vibrate" in navigator) navigator.vibrate(20);
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.id === `view-${name}`);
    });
    document.querySelectorAll("[data-view-button]").forEach((button) => {
      button.classList.toggle("active", button.dataset.viewButton === name);
    });
    $("quick-add-button").classList.toggle("hidden", name !== "home");
    if (name !== "home") closeQuickAdd();
  }

  function openDomain(domain) {
    state.selectedDomain = domain;
    saveState();
    document.querySelectorAll(".domain-panel").forEach((panel) => panel.classList.add("hidden"));
    $(`domain-${domain}`).classList.remove("hidden");
    renderHomeSuggestion();
    showView("domains");
  }

  function closeDomain() {
    document.querySelectorAll(".domain-panel").forEach((panel) => panel.classList.add("hidden"));
  }

  function renderHomeSuggestion() {
    const suggestion = suggestedActions[state.selectedDomain];
    const button = $("next-action");
    if (!suggestion) {
      $("next-title").textContent = "Choisis un domaine";
      $("next-text").textContent = "Une action claire apparaitra ici.";
      button.classList.add("hidden");
      return;
    }
    $("next-title").textContent = suggestion.title;
    $("next-text").textContent = suggestion.text;
    button.textContent = state.selectedDomain === "work" ? "Configurer Travail" : "J'ai termine";
    button.dataset.suggestionAction = suggestion.action;
    button.classList.remove("hidden");
  }

  function completeTask(label) {
    state.wins += 1;
    saveState();
    $("wins-count").textContent = String(state.wins);
    showToast(`${label} : fait. Bravo.`);
    showView("home");
  }

  function openQuickAdd() {
    $("quick-add-panel").classList.remove("hidden");
    $("quick-add-button").setAttribute("aria-expanded", "true");
    $("quick-input").focus();
  }

  function closeQuickAdd() {
    $("quick-add-panel").classList.add("hidden");
    $("quick-add-button").setAttribute("aria-expanded", "false");
  }

  function selectQuickType(type) {
    quickType = type;
    document.querySelectorAll(".quick-type").forEach((button) => {
      button.classList.toggle("active", button.dataset.quickType === type);
    });
    $("quick-label").textContent = type === "Note" ? "Note rapide" : `Nouveau ${type.toLowerCase()}`;
  }

  function renderQuickItems() {
    const list = $("quick-list");
    const visibleItems = state.quickItems.slice(-3).reverse();
    if (!visibleItems.length) {
      list.classList.add("hidden");
      list.replaceChildren();
      return;
    }
    list.replaceChildren(...visibleItems.map((item) => {
      const row = document.createElement("p");
      row.className = "quick-item";
      row.textContent = `${item.type} : ${item.text}`;
      return row;
    }));
    list.classList.remove("hidden");
  }

  function saveQuickItem() {
    const input = $("quick-input");
    const text = input.value.trim();
    if (!text) {
      showToast("Écris quelques mots d'abord.");
      return;
    }
    state.quickItems.push({ type: quickType, text });
    saveState();
    input.value = "";
    renderQuickItems();
    closeQuickAdd();
    showToast(`${quickType} ajouté.`);
  }

  function renderWork() {
    $("work-start").value = state.work.start;
    $("work-end").value = state.work.end;
    $("work-breaks").value = state.work.breaks;
    $("work-energy").value = state.work.energy;
    $("work-dnd").checked = state.work.doNotDisturb;
    $("work-soft-reminders").checked = state.work.softReminders;

    const summary = $("work-summary");
    if (!state.work.start || !state.work.end) {
      summary.classList.add("hidden");
      return;
    }
    const pauseLabel = {
      none: "pauses à déterminer",
      one: "1 pause",
      two: "2 pauses",
      meal: "pause repas et courte pause"
    }[state.work.breaks];
    const energyLabel = {
      low: "basse",
      steady: "correcte",
      high: "élevée"
    }[state.work.energy];
    const focus = state.work.doNotDisturb ? "Ne pas déranger actif." : "Alertes normales.";
    const reminders = state.work.softReminders ? "Rappels doux actifs." : "Sans rappel automatique.";
    summary.textContent = `${state.work.start} à ${state.work.end} - ${pauseLabel}. Énergie ${energyLabel}. ${focus} ${reminders}`;
    summary.classList.remove("hidden");
  }

  function notificationPermissionText() {
    if (!("Notification" in window)) return "Notifications non disponibles dans ce navigateur.";
    if (Notification.permission === "granted") return "Notifications activées.";
    if (Notification.permission === "denied") return "Notifications bloquées dans les réglages Android.";
    return "Autorisation nécessaire pour recevoir des notifications.";
  }

  function renderSettings() {
    $("notify-important").checked = state.notifications.important;
    $("notify-summary").checked = state.notifications.summary;
    $("notification-status").textContent = notificationPermissionText();
  }

  async function renderVersionInfo() {
    if (!location.protocol.startsWith("http")) return;
    try {
      const response = await fetch("./version.json", { cache: "no-store" });
      if (!response.ok) return;
      const release = await response.json();
      $("app-version").textContent = `Version : ${release.version}`;
      $("app-updated").textContent = `Dernière mise à jour : ${release.updated}`;
      $("app-changes").replaceChildren(...release.changes.map((change) => {
        const item = document.createElement("li");
        item.textContent = change;
        return item;
      }));
    } catch (error) {
      // The embedded summary remains visible when opened as a local file.
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      showToast("Notifications non disponibles ici.");
      renderSettings();
      return;
    }
    try {
      await Notification.requestPermission();
      renderSettings();
      showToast(notificationPermissionText());
    } catch (error) {
      showToast("Ouvre Élan en HTTPS pour autoriser les notifications.");
    }
  }

  function testNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      showToast("Autorise les notifications d'abord.");
      return;
    }
    new Notification("Élan", { body: "Notification test reçue.", icon: "icons/icon-192.png" });
    showToast("Notification envoyée.");
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        showToast("Installation hors ligne indisponible pour le moment.");
      });
    }
  }

  function bindEvents() {
    document.querySelectorAll("[data-view-button]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.viewButton));
    });
    document.querySelectorAll("[data-choose-domain], [data-open-domain]").forEach((button) => {
      button.addEventListener("click", () => {
        openDomain(button.dataset.chooseDomain || button.dataset.openDomain);
      });
    });
    document.querySelectorAll("[data-close-domain]").forEach((button) => {
      button.addEventListener("click", closeDomain);
    });
    document.querySelectorAll("[data-complete]").forEach((button) => {
      button.addEventListener("click", () => completeTask(button.dataset.complete));
    });

    $("next-action").addEventListener("click", () => {
      if (state.selectedDomain === "work") {
        openDomain("work");
      } else {
        completeTask(suggestedActions[state.selectedDomain].title);
      }
    });
    $("quick-add-button").addEventListener("click", openQuickAdd);
    $("close-quick-add").addEventListener("click", closeQuickAdd);
    document.querySelectorAll("[data-quick-type]").forEach((button) => {
      button.addEventListener("click", () => selectQuickType(button.dataset.quickType));
    });
    $("save-quick-add").addEventListener("click", saveQuickItem);
    $("quick-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveQuickItem();
    });

    $("work-form").addEventListener("submit", (event) => {
      event.preventDefault();
      state.work = {
        start: $("work-start").value,
        end: $("work-end").value,
        breaks: $("work-breaks").value,
        energy: $("work-energy").value,
        doNotDisturb: $("work-dnd").checked,
        softReminders: $("work-soft-reminders").checked
      };
      saveState();
      renderWork();
      showToast("Horaire enregistré.");
    });

    $("work-help").addEventListener("click", () => {
      const box = $("work-help-box");
      if (state.work.energy === "low") {
        box.textContent = "Ton énergie est basse. Choisis une action essentielle, puis prévois une pause.";
      } else {
        box.textContent = state.work.doNotDisturb
          ? "Prends 60 secondes. Choisis une seule priorité, puis reprends sans notification."
          : "Bloque une seule petite étape. Commence doucement, sans chercher la perfection.";
      }
      box.classList.remove("hidden");
    });

    $("notify-important").addEventListener("change", (event) => {
      state.notifications.important = event.target.checked;
      saveState();
      showToast("Réglage enregistré.");
    });
    $("notify-summary").addEventListener("change", (event) => {
      state.notifications.summary = event.target.checked;
      saveState();
      showToast("Réglage enregistré.");
    });
    $("enable-notifications").addEventListener("click", requestNotifications);
    $("test-notification").addEventListener("click", testNotification);

    $("reset-data").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = structuredClone(defaultState);
      render();
      closeDomain();
      showView("home");
      showToast("Données effacées.");
    });
  }

  function render() {
    $("wins-count").textContent = String(state.wins);
    renderHomeSuggestion();
    renderQuickItems();
    renderWork();
    renderSettings();
    renderVersionInfo();
  }

  bindEvents();
  render();
  registerServiceWorker();
}());
