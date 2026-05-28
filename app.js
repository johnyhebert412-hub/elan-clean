(function () {
  "use strict";

  const STORAGE_KEY = "elan-clean-v0.5.0";
  const suggestedActions = {
    off: { title: "Choisir un petit départ", text: "Garde la journée légère avec une action simple.", action: "complete" },
    finance: { title: "Vérifier ton solde", text: "Ouvre ton compte et regarde le montant disponible.", action: "complete" },
    house: { title: "Faire la vaisselle", text: "Un geste simple pour remettre l'espace en ordre.", action: "complete" },
    health: { title: "Boire de l'eau", text: "Prends quelques gorgées maintenant.", action: "complete" },
    productivity: { title: "Ouvrir la tâche", text: "Commence par rendre la tâche visible.", action: "complete" },
    outside: { title: "Mettre tes souliers", text: "Prépare juste le départ.", action: "complete" },
    mental: { title: "Urgence mentale", text: "OK. Reviens au présent avec une action simple.", action: "complete" },
    couple: { title: "Envoyer un message gentil", text: "Un petit signe de connexion suffit.", action: "complete" }
  };
  const domainInfo = {
    off: { total: 3, reward: "Temps relax" },
    finance: { total: 4, reward: "Podcast" },
    house: { total: 3, reward: "Musique" },
    health: { total: 4, reward: "Repos doux" },
    productivity: { total: 3, reward: "Pause relax" },
    outside: { total: 3, reward: "Air frais" },
    mental: { total: 10, reward: "Temps calme" },
    couple: { total: 3, reward: "Moment ensemble" }
  };

  const COINS_PER_TASK = 5;
  const defaultShopRewards = [
    { name: "Gaming", cost: 35, duration: "20 min" },
    { name: "Film", cost: 70, duration: "1 film" },
    { name: "Série", cost: 45, duration: "1 épisode" },
    { name: "Pause relax", cost: 20, duration: "10 min" },
    { name: "Musique", cost: 15, duration: "15 min" },
    { name: "Temps calme", cost: 25, duration: "15 min" },
    { name: "Soirée chill", cost: 80, duration: "60 min" },
    { name: "Temps couple", cost: 50, duration: "30 min" }
  ];

  const agendaTypeColors = {
    Travail: "#dceee8",
    Tâche: "#f3e8d4",
    Pause: "#e7f0f3",
    "Rendez-vous": "#f3e4e7",
    Habitude: "#e8eddc",
    "Bloc de temps": "#ebe6f3"
  };

  const homeDomains = {
    off: { title: "Congé", subtitle: "Journée plus légère, sans pression.", missions: [{ label: "Choisir une petite chose" }, { label: "Préparer un coin calme" }, { label: "Faire 5 minutes utiles" }, { label: "Sortir prendre l'air" }, { label: "Ranger un petit espace" }, { label: "Planifier un moment relax" }] },
    house: { title: "Maison", subtitle: "Petits gestes pour avancer à la maison.", missions: [{ label: "Faire la vaisselle" }, { label: "Ranger une surface" }, { label: "Lancer une brassée" }, { label: "Ranger une pièce" }, { label: "Vider une poubelle" }, { label: "Essuyer un comptoir" }, { label: "Plier quelques vêtements" }, { label: "Nettoyer un coin rapide" }] },
    finance: { title: "Finances", subtitle: "Budget simple, anti impulsivité.", missions: [{ label: "Vérifier le solde" }, { label: "Attendre avant un achat" }, { label: "Payer une facture" }, { label: "Noter une dépense" }, { label: "Annuler un abonnement inutile" }, { label: "Mettre un petit montant de côté" }] },
    productivity: { title: "Productivité", subtitle: "Démarrer sans te noyer.", missions: [{ label: "Ouvrir la tâche" }, { label: "Écrire une phrase" }, { label: "Timer 2 minutes" }, { label: "Nommer la prochaine étape" }, { label: "Fermer une distraction" }, { label: "Préparer le matériel" }] },
    couple: { title: "Temps couple/famille", subtitle: "Connexion simple.", missions: [{ label: "Envoyer un message gentil" }, { label: "Faire une attention" }, { label: "Demander comment ça va" }, { label: "Faire un câlin" }, { label: "Proposer 10 minutes ensemble" }, { label: "Écouter sans interrompre" }] },
    outside: { title: "Activité / extérieur", subtitle: "Bouger doucement.", missions: [{ label: "Mettre tes souliers" }, { label: "Sortir 2 minutes" }, { label: "Marcher 30 secondes" }, { label: "Ouvrir la porte" }, { label: "Prendre l'air dehors" }, { label: "Faire un mini tour" }] },
    health: { title: "Santé", subtitle: "Énergie, sommeil, eau, médication.", missions: [{ label: "Boire de l'eau" }, { label: "Vérifier la médication" }, { label: "Bouger 2 minutes" }, { label: "Préparer le sommeil" }, { label: "Manger quelque chose simple" }, { label: "Étirer les épaules" }] },
    mental: { title: "Urgence mentale", subtitle: "OK. Tu reprends le contrôle.", missions: [{ label: "Prends 3 grandes respirations" }, { label: "Touche 3 objets" }, { label: "Mets les deux pieds au sol" }] }
  };

  const emergencyActions = [
    "Prends 3 grandes respirations",
    "Touche 3 objets différents",
    "Bois un verre d'eau",
    "Regarde autour de toi",
    "Relâche tes épaules",
    "Mets les deux pieds au sol",
    "Ferme les yeux 10 secondes",
    "Écoute un son autour de toi",
    "Marche un peu",
    "Fais une pause écran"
  ];

  const defaultState = {
    onboardingComplete: false,
    installInviteSeen: false,
    motivation: "",
    rewards: [],
    selectedDomain: "",
    currentHomeDomain: "",
    wins: 0,
    coins: 0,
    progress: {},
    customGoals: {},
    ideas: [],
    quickItems: [],
    agenda: [],
    agendaDate: "",
    notifications: { important: false, summary: false }
  };

  let state = loadState();
  let toastTimer;
  let quickType = "Tâche";
  let deferredInstallPrompt = null;
  let emergencyIndex = 0;
  let agendaReminderTimers = [];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return structuredClone(defaultState);
      const nextState = {
        ...structuredClone(defaultState),
        ...saved,
        progress: { ...defaultState.progress, ...saved.progress },
        customGoals: { ...defaultState.customGoals, ...saved.customGoals },
        ideas: Array.isArray(saved.ideas) ? saved.ideas : [],
        rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
        agenda: Array.isArray(saved.agenda) ? saved.agenda : [],
        agendaDate: typeof saved.agendaDate === "string" ? saved.agendaDate : "",
        coins: Number.isFinite(saved.coins) ? saved.coins : (Number.isFinite(saved.wins) ? saved.wins * COINS_PER_TASK : 0),
        notifications: { ...defaultState.notifications, ...saved.notifications }
      };
      if (nextState.selectedDomain && !suggestedActions[nextState.selectedDomain]) {
        nextState.selectedDomain = "";
      }
      return nextState;
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
    const quickButton = $("quick-add-button");
    if (quickButton) quickButton.classList.toggle("hidden", name !== "home");
    if (name !== "home") closeQuickAdd();
  }

  function openDomain(domain) {
    const panel = $(`domain-${domain}`);
    if (!panel) return;
    state.selectedDomain = domain;
    saveState();
    document.querySelectorAll(".domain-panel").forEach((panel) => panel.classList.add("hidden"));
    panel.classList.remove("hidden");
    renderHomeSuggestion();
    showView("domains");
    panel.setAttribute("tabindex", "-1");
    window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      panel.focus({ preventScroll: true });
    });
  }

  function closeDomain() {
    document.querySelectorAll(".domain-panel").forEach((panel) => panel.classList.add("hidden"));
  }

  function selectHomeDomain(domain) {
    if (!homeDomains[domain]) return;
    if (domain === "mental") {
      showEmergencyAction(false);
      return;
    }
    state.currentHomeDomain = domain;
    state.selectedDomain = domain;
    saveState();
    renderHomeSuggestion();
    renderSelectedDomain();
  }

  function renderSelectedDomain() {
    const card = $("selected-domain-card");
    if (!card) return;
    const domain = state.currentHomeDomain;
    const detail = homeDomains[domain];
    if (!detail) {
      card.classList.add("hidden");
      return;
    }
    $("selected-domain-title").textContent = detail.title;
    $("selected-domain-subtitle").textContent = detail.subtitle;
    const missions = $("selected-domain-missions");
    const customGoals = (state.customGoals[domain] || []).map((label) => ({ label }));
    const visibleMissions = rotateMissions([...detail.missions, ...customGoals], domain, 3);
    missions.replaceChildren(...visibleMissions.map((mission) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = mission.label;
      button.addEventListener("click", () => {
        if (mission.action === "open-domain") {
          openDomain(domain);
          return;
        }
        state.selectedDomain = domain;
        saveState();
        completeTask(mission.label);
      });
      return button;
    }));
    $("add-selected-goal").dataset.addGoal = domain;
    card.classList.remove("hidden");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function rotateMissions(missions, key, limit) {
    if (missions.length <= limit) return missions;
    const daySeed = Math.floor(Date.now() / 86400000);
    const progressSeed = state.progress[key] || 0;
    const start = (daySeed + progressSeed + key.length) % missions.length;
    const rotated = [...missions.slice(start), ...missions.slice(0, start)];
    return rotated.slice(0, limit);
  }

  function closeSelectedDomain() {
    state.currentHomeDomain = "";
    saveState();
    $("selected-domain-card")?.classList.add("hidden");
  }

  function renderHomeSuggestion() {
    const button = $("next-action");
    if (!button) return;
    button.textContent = "Urgence mentale";
    button.classList.remove("hidden");
  }

  function showEmergencyAction(next = false) {
    if (next) {
      emergencyIndex = (emergencyIndex + 1) % emergencyActions.length;
    } else {
      emergencyIndex = (Math.floor(Date.now() / 3600000) + (state.progress.mental || 0)) % emergencyActions.length;
    }
    state.selectedDomain = "mental";
    saveState();
    $("emergency-action").textContent = emergencyActions[emergencyIndex];
    $("emergency-card").classList.remove("hidden");
    $("emergency-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function completeEmergencyAction() {
    completeTask(emergencyActions[emergencyIndex]);
    $("emergency-card")?.classList.add("hidden");
  }

  function completeTask(label) {
    state.wins += 1;
    state.coins += COINS_PER_TASK;
    const domain = state.selectedDomain;
    if (domainInfo[domain]) {
      state.progress[domain] = (state.progress[domain] || 0) + 1;
    }
    saveState();
    renderDomainProgress();
    renderShop();
    const reward = pickReward(domain);
    showToast(`${label} : fait. +${COINS_PER_TASK} pièces. ${reward}`);
    showView("home");
  }

  function pickReward(domain) {
    if (state.rewards.length) {
      const index = state.wins % state.rewards.length;
      return `Récompense possible : ${state.rewards[index]}.`;
    }
    const reward = domainInfo[domain]?.reward;
    return reward ? `Pause suggérée : ${reward}.` : "Petite victoire.";
  }

  function renderDomainProgress() {
    Object.entries(domainInfo).forEach(([domain, info]) => {
      const meter = $(`progress-${domain}`);
      if (!meter) return;
      const completed = Math.min(state.progress[domain] || 0, info.total);
      $(`count-${domain}`).textContent = completed === 0
        ? "À commencer"
        : completed >= info.total
          ? "Complété"
          : "En cours";
      meter.style.width = `${Math.round((completed / info.total) * 100)}%`;
      meter.parentElement.setAttribute("aria-label", `${completed} sur ${info.total} objectifs faits`);
    });
  }

  function openQuickAdd() {
    if (!$("quick-add-panel") || !$("quick-add-button")) return;
    $("quick-add-panel").classList.remove("hidden");
    $("quick-add-button").setAttribute("aria-expanded", "true");
    $("quick-input").focus();
  }

  function closeQuickAdd() {
    if (!$("quick-add-panel") || !$("quick-add-button")) return;
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
    if (!list) return;
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

  function renderIdeas() {
    const list = $("ideas-list");
    const recentIdeas = state.ideas.slice(-3).reverse();
    if (!recentIdeas.length) {
      list.classList.add("hidden");
      list.replaceChildren();
      return;
    }
    list.replaceChildren(...recentIdeas.map((idea) => {
      const item = document.createElement("p");
      item.className = "idea-item";
      item.textContent = idea;
      return item;
    }));
    list.classList.remove("hidden");
  }

  function renderRewards() {
    const list = $("rewards-list");
    if (!list) return;
    if (!state.rewards.length) {
      list.classList.add("hidden");
      list.replaceChildren();
      return;
    }
    list.replaceChildren(...state.rewards.map((reward) => {
      const item = document.createElement("p");
      item.className = "idea-item";
      item.textContent = reward;
      return item;
    }));
    list.classList.remove("hidden");
  }

  function renderCustomGoals() {
    renderSelectedDomain();
  }

  function saveIdea() {
    const input = $("ideas-input");
    const text = input.value.trim();
    if (!text) {
      showToast("Écris une idée d'abord.");
      return;
    }
    state.ideas.push(text);
    state.ideas = state.ideas.slice(-20);
    saveState();
    input.value = "";
    renderIdeas();
    showToast("Idée gardée.");
  }

  function addCustomGoal(domain) {
    const text = window.prompt("Nouvel objectif");
    const goal = text?.trim();
    if (!goal) return;
    state.customGoals[domain] = [...(state.customGoals[domain] || []), goal].slice(-8);
    state.currentHomeDomain = domain;
    state.selectedDomain = domain;
    saveState();
    renderCustomGoals();
    showToast("Objectif ajouté.");
  }

  function saveReward() {
    const input = $("reward-input");
    const reward = input?.value.trim();
    if (!reward) {
      showToast("Écris une récompense.");
      return;
    }
    state.rewards = [...new Set([...state.rewards, reward])].slice(-12);
    saveState();
    input.value = "";
    renderRewards();
    renderShop();
    renderOnboarding();
    showToast("Récompense ajoutée.");
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

  function todayKey() {
    return dateKey(new Date());
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function selectedAgendaDate() {
    return state.agendaDate || todayKey();
  }

  function agendaItemsForSelectedDate() {
    const selectedDate = selectedAgendaDate();
    return state.agenda
      .filter((item) => item.date === selectedDate)
      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }

  function agendaItemsForDate(dateValue) {
    return state.agenda.filter((item) => item.date === dateValue);
  }

  function agendaDateLabel(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    const today = todayKey();
    if (dateValue === today) return "Aujourd'hui";
    return new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long" }).format(date);
  }

  function reminderLabel(reminder) {
    const labels = {
      none: "Aucun rappel",
      "0": "Rappel à l'heure",
      "5": "Rappel 5 min avant",
      "15": "Rappel 15 min avant",
      "30": "Rappel 30 min avant",
      "60": "Rappel 1 h avant"
    };
    return labels[`${reminder}`] || labels.none;
  }

  function agendaMonthLabel(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric" }).format(date);
  }

  function renderAgendaCalendar(selectedDate) {
    const calendar = $("agenda-calendar");
    if (!calendar) return;
    const selected = new Date(`${selectedDate}T12:00:00`);
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    const today = todayKey();
    const days = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKey(date);
      const items = agendaItemsForDate(key);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "agenda-day";
      if (date.getMonth() !== selected.getMonth()) button.classList.add("muted-day");
      if (key === today) button.classList.add("today");
      if (key === selectedDate) button.classList.add("selected");
      button.setAttribute("aria-label", `${key}, ${items.length} événement${items.length > 1 ? "s" : ""}`);

      const number = document.createElement("strong");
      number.textContent = date.getDate();
      const dots = document.createElement("span");
      dots.className = "agenda-dots";
      items.slice(0, 3).forEach((item) => {
        const dot = document.createElement("i");
        dot.style.background = agendaTypeColors[item.type] || "#e8eddc";
        dots.append(dot);
      });
      button.append(number, dots);
      button.addEventListener("click", () => setAgendaDate(key));
      days.push(button);
    }
    calendar.replaceChildren(...days);
  }

  function renderAgenda() {
    const list = $("agenda-list");
    if (!list) return;
    const selectedDate = selectedAgendaDate();
    state.agendaDate = selectedDate;
    $("agenda-date").value = selectedDate;
    $("agenda-day-label").textContent = agendaDateLabel(selectedDate);
    $("agenda-month-label").textContent = agendaMonthLabel(selectedDate);
    renderAgendaCalendar(selectedDate);
    const items = agendaItemsForSelectedDate();
    const count = $("agenda-count");
    if (count) count.textContent = `${items.length} item${items.length > 1 ? "s" : ""}`;
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "small-muted";
      empty.textContent = "Rien de prévu. Ajoute une petite chose si tu veux.";
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...items.map((item) => {
      const row = document.createElement("article");
      row.className = `agenda-item${item.done ? " done" : ""}`;
      row.style.borderLeftColor = agendaTypeColors[item.type] || "#e8eddc";
      const body = document.createElement("div");
      const meta = document.createElement("p");
      meta.className = "agenda-meta";
      const timeText = item.time ? `${item.time} · ` : "";
      meta.textContent = `${timeText}${item.type} · ${reminderLabel(item.reminder)}`;
      const title = document.createElement("strong");
      title.textContent = item.text;
      const tag = document.createElement("span");
      tag.className = "agenda-type-pill";
      tag.style.background = agendaTypeColors[item.type] || "#e8eddc";
      tag.textContent = item.type;
      body.append(meta, title, tag);

      const actions = document.createElement("div");
      actions.className = "agenda-actions";
      const done = document.createElement("button");
      done.type = "button";
      done.className = "secondary";
      done.textContent = item.done ? "Fait" : "Faire";
      done.addEventListener("click", () => toggleAgendaItem(item.id));
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "text-button";
      edit.textContent = "Modifier";
      edit.addEventListener("click", () => editAgendaItem(item.id));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", () => deleteAgendaItem(item.id));
      actions.append(done, edit, remove);
      row.append(body, actions);
      return row;
    }));
  }

  function saveAgendaItem() {
    const textInput = $("agenda-text");
    const text = textInput.value.trim();
    if (!text) {
      showToast("Écris une chose à faire.");
      return;
    }
    const reminder = $("agenda-reminder").value;
    if (reminder !== "none" && !$("agenda-time").value) {
      showToast("Choisis une heure pour activer un rappel.");
      return;
    }
    const item = {
      id: `${Date.now()}`,
      date: selectedAgendaDate(),
      type: $("agenda-type").value,
      text,
      time: $("agenda-time").value,
      reminder,
      notified: false,
      done: false
    };
    state.agenda = [...state.agenda, item].slice(-80);
    saveState();
    textInput.value = "";
    $("agenda-time").value = "";
    $("agenda-reminder").value = "none";
    closeAgendaForm();
    renderAgenda();
    scheduleAgendaReminders();
    if (reminder !== "none") requestAgendaNotificationPermission();
    showToast("Ajouté à l'agenda.");
  }

  function toggleAgendaItem(id) {
    state.agenda = state.agenda.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    ));
    saveState();
    renderAgenda();
    scheduleAgendaReminders();
    showToast("Agenda mis à jour.");
  }

  function editAgendaItem(id) {
    const item = state.agenda.find((entry) => entry.id === id);
    if (!item) return;
    const nextText = window.prompt("Modifier", item.text)?.trim();
    if (!nextText) return;
    const nextDate = window.prompt("Date", item.date)?.trim();
    if (!nextDate) return;
    const nextTime = window.prompt("Heure", item.time || "")?.trim() || "";
    const nextReminder = window.prompt("Rappel : none, 0, 5, 15, 30 ou 60", item.reminder || "none")?.trim() || "none";
    item.text = nextText;
    item.date = nextDate;
    item.time = nextTime;
    item.reminder = ["none", "0", "5", "15", "30", "60"].includes(nextReminder) ? nextReminder : "none";
    item.notified = false;
    saveState();
    renderAgenda();
    scheduleAgendaReminders();
    if (item.reminder !== "none") requestAgendaNotificationPermission();
    showToast("Item modifié.");
  }

  function deleteAgendaItem(id) {
    state.agenda = state.agenda.filter((item) => item.id !== id);
    saveState();
    renderAgenda();
    scheduleAgendaReminders();
    showToast("Item supprimé.");
  }

  function changeAgendaDate(offsetDays) {
    const date = new Date(`${selectedAgendaDate()}T12:00:00`);
    date.setDate(date.getDate() + offsetDays);
    state.agendaDate = dateKey(date);
    saveState();
    renderAgenda();
  }

  function changeAgendaMonth(offsetMonths) {
    const date = new Date(`${selectedAgendaDate()}T12:00:00`);
    date.setMonth(date.getMonth() + offsetMonths);
    state.agendaDate = dateKey(date);
    saveState();
    renderAgenda();
  }

  function setAgendaDate(value) {
    if (!value) return;
    state.agendaDate = value;
    saveState();
    renderAgenda();
  }

  function openAgendaForm() {
    $("agenda-form-card")?.classList.remove("hidden");
    $("agenda-text")?.focus();
  }

  function closeAgendaForm() {
    $("agenda-form-card")?.classList.add("hidden");
  }

  async function requestAgendaNotificationPermission() {
    if (!("Notification" in window)) {
      showToast("Notifications non disponibles ici.");
      return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      showToast("Notifications bloquées dans Android.");
      return false;
    }
    const permission = await Notification.requestPermission();
    renderSettings();
    if (permission !== "granted") {
      showToast("Rappel gardé, mais notifications non activées.");
      return false;
    }
    showToast("Notifications activées.");
    return true;
  }

  function agendaReminderTime(item) {
    if (!item.time || item.reminder === "none") return null;
    const [hours, minutes] = item.time.split(":").map(Number);
    const date = new Date(`${item.date}T00:00:00`);
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - Number(item.reminder || 0));
    return date;
  }

  function sendAgendaNotification(item) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("ÉLAN - Agenda", {
      body: `${item.time} · ${item.text}`,
      icon: "icons/icon-192.png"
    });
  }

  function scheduleAgendaReminders() {
    agendaReminderTimers.forEach((timer) => window.clearTimeout(timer));
    agendaReminderTimers = [];
    const now = Date.now();
    state.agenda.forEach((item) => {
      if (item.done || item.notified || item.reminder === "none") return;
      const reminderTime = agendaReminderTime(item);
      if (!reminderTime) return;
      const delay = reminderTime.getTime() - now;
      if (delay < 0 || delay > 2147483647) return;
      agendaReminderTimers.push(window.setTimeout(() => {
        sendAgendaNotification(item);
        item.notified = true;
        saveState();
      }, delay));
    });
  }

  function shopRewards() {
    const personal = state.rewards
      .filter((reward) => !defaultShopRewards.some((item) => item.name === reward))
      .map((reward) => ({ name: reward, cost: 25, duration: "10 min" }));
    return [...defaultShopRewards, ...personal];
  }

  function renderShop() {
    const list = $("shop-rewards");
    if (!list) return;
    $("coin-balance").textContent = `${state.coins} pièce${state.coins > 1 ? "s" : ""}`;
    list.replaceChildren(...shopRewards().map((reward) => {
      const item = document.createElement("article");
      item.className = "shop-item";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = reward.name;
      const detail = document.createElement("p");
      detail.className = "small-muted";
      detail.textContent = `${reward.cost} pièces · ${reward.duration}`;
      copy.append(title, detail);

      const button = document.createElement("button");
      button.type = "button";
      button.className = state.coins >= reward.cost ? "primary" : "secondary";
      button.textContent = state.coins >= reward.cost ? "Débloquer" : "Pas assez";
      button.disabled = state.coins < reward.cost;
      button.addEventListener("click", () => unlockReward(reward));
      item.append(copy, button);
      return item;
    }));
  }

  function unlockReward(reward) {
    if (state.coins < reward.cost) {
      showToast("Pas assez de pièces pour cette récompense.");
      return;
    }
    state.coins -= reward.cost;
    saveState();
    renderShop();
    showToast(`${reward.name} débloqué : ${reward.duration}.`);
  }

  function saveShopReward() {
    const input = $("shop-reward-input");
    const reward = input?.value.trim();
    if (!reward) {
      showToast("Écris une récompense.");
      return;
    }
    state.rewards = [...new Set([...state.rewards, reward])].slice(-12);
    saveState();
    input.value = "";
    renderRewards();
    renderShop();
    renderOnboarding();
    showToast("Récompense ajoutée à la boutique.");
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
    renderInstallState();
  }

  function isInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function renderInstallState() {
    const status = $("install-status");
    const button = $("settings-install-button");
    const help = $("install-help");
    if (!status || !button || !help) return;
    if (isInstalled()) {
      status.textContent = "ÉLAN est installé.";
      button.classList.add("hidden");
      help.classList.add("hidden");
      $("install-invite")?.classList.add("hidden");
      return;
    }
    status.textContent = deferredInstallPrompt
      ? "Installation disponible."
      : "Installation possible depuis le menu du navigateur.";
    button.classList.remove("hidden");
    help.classList.toggle("hidden", Boolean(deferredInstallPrompt));
  }

  function renderInstallInvite() {
    const invite = $("install-invite");
    if (!invite) return;
    const shouldShow = state.onboardingComplete && !state.installInviteSeen && !isInstalled();
    invite.classList.toggle("hidden", !shouldShow);
    renderInstallState();
  }

  async function startInstall() {
    state.installInviteSeen = true;
    saveState();
    $("install-invite")?.classList.add("hidden");
    if (isInstalled()) {
      renderInstallState();
      showToast("ÉLAN est déjà installé.");
      return;
    }
    if (!deferredInstallPrompt) {
      renderInstallState();
      showToast("Utilise le menu Chrome pour ajouter ÉLAN.");
      return;
    }
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      renderInstallState();
    } catch (error) {
      showToast("Installation non disponible ici.");
    }
  }

  function dismissInstallInvite() {
    state.installInviteSeen = true;
    saveState();
    $("install-invite")?.classList.add("hidden");
    renderInstallState();
  }

  function renderOnboarding() {
    const onboarding = $("onboarding");
    if (!onboarding) return;
    onboarding.classList.toggle("hidden", state.onboardingComplete);
    document.querySelectorAll("[data-motivation]").forEach((choice) => {
      choice.classList.toggle("selected", choice.dataset.motivation === state.motivation);
    });
    document.querySelectorAll("[data-reward]").forEach((choice) => {
      choice.classList.toggle("selected", state.rewards.includes(choice.dataset.reward));
    });
  }

  function toggleSelection(button, key, value) {
    if (key === "motivation") {
      state.motivation = value;
      document.querySelectorAll("[data-motivation]").forEach((choice) => {
        choice.classList.toggle("selected", choice === button);
      });
      return;
    }
    const values = new Set(state.rewards);
    if (values.has(value)) {
      values.delete(value);
      button.classList.remove("selected");
    } else {
      values.add(value);
      button.classList.add("selected");
    }
    state.rewards = [...values];
  }

  function finishOnboarding() {
    if (!state.motivation) {
      showToast("Choisis une motivation.");
      return;
    }
    if (!state.rewards.length) {
      showToast("Choisis au moins une récompense.");
      return;
    }
    state.onboardingComplete = true;
    saveState();
    renderOnboarding();
    renderInstallInvite();
    showToast("ÉLAN est prêt.");
  }

  async function renderVersionInfo() {
    if (!location.protocol.startsWith("http")) return;
    try {
      const response = await fetch(`./version.json?release=${Date.now()}`, { cache: "no-store" });
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
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || refreshing) return;
        refreshing = true;
        location.reload();
      });
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          showToast("Installation hors ligne indisponible pour le moment.");
        });
    }
  }

  function bindInstallEvents() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      renderInstallInvite();
    });
    window.addEventListener("appinstalled", () => {
      state.installInviteSeen = true;
      deferredInstallPrompt = null;
      saveState();
      renderInstallState();
      showToast("ÉLAN est installé.");
    });
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
    document.querySelectorAll("[data-select-domain]").forEach((button) => {
      button.addEventListener("click", () => selectHomeDomain(button.dataset.selectDomain));
    });
    $("close-selected-domain").addEventListener("click", closeSelectedDomain);
    $("add-selected-goal").addEventListener("click", () => addCustomGoal($("add-selected-goal").dataset.addGoal));
    document.querySelectorAll("[data-toggle-missions]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".home-domain-card");
        const extras = card?.querySelector(".extra-missions");
        if (!extras) return;
        const isOpening = extras.classList.contains("hidden");
        extras.classList.toggle("hidden", !isOpening);
        button.textContent = isOpening ? "Voir moins" : "Voir plus";
      });
    });
    document.querySelectorAll("[data-add-goal]").forEach((button) => {
      button.addEventListener("click", () => addCustomGoal(button.dataset.addGoal));
    });
    document.querySelectorAll("[data-complete]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.homeTask) {
          state.selectedDomain = button.dataset.homeTask;
          saveState();
          renderHomeSuggestion();
        }
        completeTask(button.dataset.complete);
      });
    });

    $("next-action").addEventListener("click", () => showEmergencyAction(false));
    $("emergency-done").addEventListener("click", completeEmergencyAction);
    $("emergency-other").addEventListener("click", () => showEmergencyAction(true));
    $("choose-domain-button").addEventListener("click", () => showView("domains"));
    $("quick-add-button")?.addEventListener("click", openQuickAdd);
    $("close-quick-add")?.addEventListener("click", closeQuickAdd);
    document.querySelectorAll("[data-quick-type]").forEach((button) => {
      button.addEventListener("click", () => selectQuickType(button.dataset.quickType));
    });
    $("save-quick-add")?.addEventListener("click", saveQuickItem);
    $("quick-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveQuickItem();
    });
    $("save-agenda-item")?.addEventListener("click", saveAgendaItem);
    $("agenda-text")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveAgendaItem();
    });
    $("agenda-date")?.addEventListener("change", (event) => setAgendaDate(event.target.value));
    $("agenda-today")?.addEventListener("click", () => setAgendaDate(todayKey()));
    $("agenda-prev-month")?.addEventListener("click", () => changeAgendaMonth(-1));
    $("agenda-next-month")?.addEventListener("click", () => changeAgendaMonth(1));
    $("open-agenda-form")?.addEventListener("click", openAgendaForm);
    $("close-agenda-form")?.addEventListener("click", closeAgendaForm);
    $("save-shop-reward")?.addEventListener("click", saveShopReward);
    $("shop-reward-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveShopReward();
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
    $("settings-install-button").addEventListener("click", startInstall);
    $("install-yes").addEventListener("click", startInstall);
    $("install-later").addEventListener("click", dismissInstallInvite);
    $("save-idea").addEventListener("click", saveIdea);
    $("save-reward").addEventListener("click", saveReward);
    $("reward-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveReward();
    });
    document.querySelectorAll("[data-motivation]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button, "motivation", button.dataset.motivation));
    });
    document.querySelectorAll("[data-reward]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button, "rewards", button.dataset.reward));
    });
    $("finish-onboarding").addEventListener("click", finishOnboarding);

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
    renderHomeSuggestion();
    renderQuickItems();
    renderAgenda();
    renderIdeas();
    renderRewards();
    renderShop();
    renderSelectedDomain();
    renderDomainProgress();
    renderSettings();
    renderOnboarding();
    renderInstallInvite();
    renderVersionInfo();
    scheduleAgendaReminders();
  }

  bindInstallEvents();
  bindEvents();
  render();
  registerServiceWorker();
}());
