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
  const CHALLENGE_DURATIONS = [2, 5, 8, 12, 15];
  const checkInChoices = [
    "Je travaille",
    "Je procrastine",
    "Je me repose",
    "Je suis concentré",
    "Je suis perdu",
    "Je fais du ménage",
    "Je joue",
    "Je suis fatigué",
    "Je suis motivé"
  ];
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
    checkIns: [],
    goalQueue: { items: [], active: false, currentIndex: 0 },
    agenda: [],
    agendaDate: "",
    activeChallenge: null,
    purchasedRewards: [],
    activeReward: null,
    notifications: { important: false, summary: false }
  };

  let state = loadState();
  let toastTimer;
  let quickType = "Tâche";
  let selectedCheckIn = "Je travaille";
  let selectedEnergy = "moyenne";
  let deferredInstallPrompt = null;
  let emergencyIndex = 0;
  let agendaReminderTimers = [];
  let challengeTimerId = null;
  let challengeCountdownId = null;
  let isCompletingChallenge = false;
  let activeRewardTimerId = null;

  function cloneState(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return cloneState(defaultState);
      const nextState = {
        ...cloneState(defaultState),
        ...saved,
        progress: { ...defaultState.progress, ...saved.progress },
        customGoals: { ...defaultState.customGoals, ...saved.customGoals },
        ideas: Array.isArray(saved.ideas) ? saved.ideas : [],
        rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
        checkIns: Array.isArray(saved.checkIns) ? saved.checkIns : [],
        goalQueue: saved.goalQueue && typeof saved.goalQueue === "object"
          ? {
            items: Array.isArray(saved.goalQueue.items) ? saved.goalQueue.items : [],
            active: Boolean(saved.goalQueue.active),
            currentIndex: Number.isFinite(saved.goalQueue.currentIndex) ? saved.goalQueue.currentIndex : 0
          }
          : cloneState(defaultState.goalQueue),
        agenda: Array.isArray(saved.agenda) ? saved.agenda : [],
        agendaDate: typeof saved.agendaDate === "string" ? saved.agendaDate : "",
        activeChallenge: saved.activeChallenge && typeof saved.activeChallenge === "object" ? saved.activeChallenge : null,
        coins: Number.isFinite(saved.coins) ? saved.coins : (Number.isFinite(saved.wins) ? saved.wins * COINS_PER_TASK : 0),
        purchasedRewards: Array.isArray(saved.purchasedRewards) ? saved.purchasedRewards : [],
        activeReward: (saved.activeReward && typeof saved.activeReward === "object") ? saved.activeReward : null,
        notifications: { ...defaultState.notifications, ...saved.notifications }
      };
      if (nextState.selectedDomain && !suggestedActions[nextState.selectedDomain]) {
        nextState.selectedDomain = "";
      }
      return nextState;
    } catch (error) {
      return cloneState(defaultState);
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
      button.classList.toggle("selected", isGoalQueued(mission.label, domain));
      button.addEventListener("click", () => {
        if (mission.action === "open-domain") {
          openDomain(domain);
          return;
        }
        state.selectedDomain = domain;
        saveState();
        toggleGoalSelection(mission.label, domain);
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

  function goalKey(label, domain) {
    return `${domain || "general"}::${label}`;
  }

  function queuedItems() {
    const queue = state.goalQueue || { items: [], active: false, currentIndex: 0 };
    return Array.isArray(queue.items) ? queue.items : [];
  }

  function currentQueueItem() {
    const items = queuedItems();
    return items[state.goalQueue?.currentIndex || 0] || null;
  }

  function isGoalQueued(label, domain) {
    return queuedItems().some((item) => goalKey(item.label, item.domain) === goalKey(label, domain));
  }

  function toggleGoalSelection(label, domain = state.selectedDomain || state.currentHomeDomain || "") {
    if (!label) return;
    if (state.goalQueue?.active) {
      showToast("La série est déjà en cours.");
      renderGoalQueue();
      return;
    }
    const key = goalKey(label, domain);
    const items = queuedItems();
    const exists = items.some((item) => goalKey(item.label, item.domain) === key);
    state.goalQueue = {
      active: false,
      currentIndex: 0,
      items: exists
        ? items.filter((item) => goalKey(item.label, item.domain) !== key)
        : [...items, { label, domain, completed: false }]
    };
    state.selectedDomain = domain || state.selectedDomain;
    saveState();
    renderGoalQueue();
    renderSelectedDomain();
    showToast(exists ? "Objectif retiré." : "Objectif ajouté à la série.");
  }

  function removeQueuedGoal(index) {
    if (state.goalQueue?.active) return;
    state.goalQueue.items = queuedItems().filter((_, itemIndex) => itemIndex !== index);
    saveState();
    renderGoalQueue();
    renderSelectedDomain();
  }

  function startGoalQueue() {
    const items = queuedItems();
    if (!items.length || state.activeChallenge) return;
    state.goalQueue = { items, active: true, currentIndex: 0 };
    saveState();
    renderGoalQueue();
    launchCurrentQueueGoal();
  }

  function launchCurrentQueueGoal() {
    const item = currentQueueItem();
    if (!state.goalQueue?.active || !item) return;
    openChallengeSetup(item.label, item.domain, { fromQueue: true });
    showToast(`Étape ${state.goalQueue.currentIndex + 1} / ${queuedItems().length} : ${item.label}`);
  }

  function completeQueueGoal() {
    if (!state.goalQueue?.active) return false;
    const items = queuedItems();
    const currentIndex = state.goalQueue.currentIndex || 0;
    if (!items[currentIndex]) return false;
    items[currentIndex] = { ...items[currentIndex], completed: true };
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      state.goalQueue = { items: [], active: false, currentIndex: 0 };
      saveState();
      renderGoalQueue();
      showToast("Série terminée. Belle avancée.");
      return true;
    }
    state.goalQueue = { items, active: true, currentIndex: nextIndex };
    saveState();
    renderGoalQueue();
    const next = items[nextIndex];
    showToast(`Bravo. Prochaine étape : ${next.label}.`);
    window.setTimeout(() => {
      if (!state.activeChallenge && state.goalQueue?.active) launchCurrentQueueGoal();
    }, 900);
    return true;
  }

  function skipQueueGoal() {
    if (!state.goalQueue?.active || state.activeChallenge) return;
    const items = queuedItems();
    const nextIndex = (state.goalQueue.currentIndex || 0) + 1;
    if (nextIndex >= items.length) {
      stopGoalQueue("Correct. Série arrêtée.");
      return;
    }
    state.goalQueue.currentIndex = nextIndex;
    saveState();
    renderGoalQueue();
    launchCurrentQueueGoal();
  }

  function stopGoalQueue(message = "Correct. Tu peux reprendre plus tard.") {
    window.clearInterval(challengeCountdownId);
    window.clearInterval(challengeTimerId);
    state.activeChallenge = null;
    state.goalQueue = { items: [], active: false, currentIndex: 0 };
    saveState();
    renderGoalQueue();
    renderChallengeTimer();
    renderSelectedDomain();
    showToast(message);
  }

  function goalSelectionSummary(count) {
    if (!count) return "";
    return `${count} objectif${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}`;
  }

  function isSelectedDomainVisible() {
    const card = $("selected-domain-card");
    return Boolean(card && !card.classList.contains("hidden"));
  }

  function shouldShowChallengePanel() {
    if (!state.activeChallenge) return false;
    const items = queuedItems();
    if (items.length && !state.goalQueue?.active) return false;
    return true;
  }

  function renderGoalQueue() {
    const items = queuedItems();
    const isActive = Boolean(state.goalQueue?.active);
    const count = items.length;
    const summaryText = goalSelectionSummary(count);

    const showInlineSelection = count > 0 && !isActive && isSelectedDomainVisible();
    const showDockSelection = count > 0 && !isActive && !showInlineSelection;

    document.body.classList.toggle("goal-selecting-dock", showDockSelection);
    document.body.classList.toggle("goal-series-active", count > 0 && isActive);

    const inline = $("goal-selection-inline");
    const inlineSummary = $("goal-selection-inline-summary");
    const inlineStart = $("start-goal-queue-inline");
    const dock = $("goal-selection-dock");
    const dockSummary = $("goal-selection-dock-summary");
    const dockStart = $("start-goal-queue");

    if (inline) inline.classList.toggle("hidden", !showInlineSelection);
    if (dock) dock.classList.toggle("hidden", !showDockSelection);
    if (inlineSummary) inlineSummary.textContent = summaryText;
    if (dockSummary) dockSummary.textContent = summaryText;
    if (inlineStart) inlineStart.disabled = count === 0;
    if (dockStart) dockStart.disabled = count === 0;

    const activeBar = $("goal-queue-active-bar");
    const activeStep = $("goal-queue-active-step");
    const activeLabel = $("goal-queue-active-label");
    const skipButton = $("skip-goal");
    const showActiveBar = isActive && count > 0;

    if (activeBar) activeBar.classList.toggle("hidden", !showActiveBar);
    if (showActiveBar) {
      const currentIndex = state.goalQueue.currentIndex || 0;
      const current = items[currentIndex];
      if (activeStep) activeStep.textContent = `Étape ${currentIndex + 1} / ${count}`;
      if (activeLabel) activeLabel.textContent = current?.label || "";
      if (skipButton) skipButton.classList.toggle("hidden", Boolean(state.activeChallenge));
    }

    updateGoalSelectionButtons();
    renderChallengeTimer();
  }

  function updateGoalSelectionButtons() {
    document.querySelectorAll("[data-complete]").forEach((button) => {
      const domainPanel = button.closest(".domain-panel");
      const domain = button.dataset.goalDomain || button.dataset.homeTask || domainPanel?.id?.replace("domain-", "") || state.selectedDomain;
      const selected = isGoalQueued(button.dataset.complete, domain);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    document.querySelectorAll("#selected-domain-missions button").forEach((button) => {
      const selected = button.classList.contains("selected");
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function openChallengeSetup(label, domain = state.selectedDomain || state.currentHomeDomain || "", options = {}) {
    if (!label) return;
    if (state.activeChallenge && !state.activeChallenge.rewardedAt) {
      showToast("Un défi est déjà en cours.");
      renderChallengeTimer();
      return;
    }
    state.selectedDomain = domain || state.selectedDomain;
    state.activeChallenge = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label,
      domain: state.selectedDomain,
      durationMinutes: 8,
      durationMs: 8 * 60000,
      startedAt: null,
      endsAt: null,
      status: "setup",
      fromQueue: Boolean(options.fromQueue),
      rewardedAt: null
    };
    saveState();
    renderChallengeTimer();
    if (shouldShowChallengePanel()) {
      $("challenge-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function setChallengeDuration(minutes) {
    const duration = Number(minutes);
    if (!state.activeChallenge || !Number.isFinite(duration)) return;
    state.activeChallenge.durationMinutes = duration;
    state.activeChallenge.durationMs = duration * 60000;
    saveState();
    renderChallengeTimer();
  }

  function startChallenge() {
    const challenge = state.activeChallenge;
    if (!challenge || challenge.status !== "setup") return;
    window.clearInterval(challengeCountdownId);
    playStartTone();
    const now = Date.now();
    let count = 3;
    state.activeChallenge = {
      ...challenge,
      startedAt: now,
      endsAt: now + challenge.durationMs,
      status: "countdown"
    };
    saveState();
    renderChallengeTimer(count);
    challengeCountdownId = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        window.clearInterval(challengeCountdownId);
        state.activeChallenge = {
          ...state.activeChallenge,
          status: "running"
        };
        saveState();
        startChallengeTicker();
        renderChallengeTimer();
        showToast("GO. Une chose à la fois.");
        return;
      }
      renderChallengeTimer(count);
    }, 700);
  }

  function cancelChallenge() {
    if (!state.activeChallenge) return;
    window.clearInterval(challengeCountdownId);
    window.clearInterval(challengeTimerId);
    state.activeChallenge = null;
    saveState();
    renderChallengeTimer();
    renderGoalQueue();
  }

  function startChallengeTicker() {
    window.clearInterval(challengeTimerId);
    challengeTimerId = window.setInterval(updateChallengeTime, 1000);
    updateChallengeTime();
  }

  function resumeChallengeTimer() {
    if (state.activeChallenge?.status === "countdown") {
      state.activeChallenge.status = "running";
      saveState();
    }
    if (state.activeChallenge?.status === "running") startChallengeTicker();
  }

  function updateChallengeTime() {
    const challenge = state.activeChallenge;
    if (!challenge) {
      window.clearInterval(challengeTimerId);
      return;
    }
    if (challenge.status === "running" && Date.now() >= challenge.endsAt) {
      state.activeChallenge.status = "done";
      window.clearInterval(challengeTimerId);
      saveState();
      notifyChallengeDone();
    }
    renderChallengeTimer();
  }

  function notifyChallengeDone() {
    if ("vibrate" in navigator) navigator.vibrate([25, 40, 25]);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Défi terminé", { body: "Belle présence. Tu peux valider quand c'est fait." });
    }
    showToast("Défi terminé. Tu as tenu le cap.");
  }

  function completeActiveChallenge() {
    const challenge = state.activeChallenge;
    if (!challenge || !["running", "done"].includes(challenge.status) || challenge.rewardedAt || isCompletingChallenge) return;
    isCompletingChallenge = true;
    const button = $("finish-challenge");
    if (button) button.disabled = true;
    window.clearInterval(challengeCountdownId);
    window.clearInterval(challengeTimerId);
    const remainingMs = Math.max(0, (challenge.endsAt || Date.now()) - Date.now());
    const successMessage = remainingMs > 0
      ? `Bravo ! Tu as terminé avec encore ${formatRemainingText(remainingMs)}.`
      : "Bravo ! Défi terminé avec calme.";
    state.activeChallenge.rewardedAt = Date.now();
    state.activeChallenge.status = "completed";
    state.selectedDomain = challenge.domain;
    saveState();
    completeTask(challenge.label, successMessage);
    state.activeChallenge = null;
    isCompletingChallenge = false;
    saveState();
    renderChallengeTimer();
    renderGoalQueue();
    if (challenge.fromQueue) completeQueueGoal();
  }

  function formatRemaining(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatRemainingText(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes && seconds) return `${minutes} min ${seconds} s`;
    if (minutes) return `${minutes} min`;
    return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
  }

  function renderChallengeTimer(countdownValue = null) {
    const panel = $("challenge-panel");
    const title = $("challenge-title");
    const durationGroup = $("challenge-durations");
    const readyButton = $("start-challenge");
    const cancelButton = $("cancel-challenge");
    const finishButton = $("finish-challenge");
    const time = $("challenge-time");
    const progress = $("challenge-progress");
    const message = $("challenge-message");
    const challenge = state.activeChallenge;

    const challengeVisible = Boolean(panel && challenge && shouldShowChallengePanel());
    document.body.classList.toggle("challenge-open", challengeVisible);

    if (!challengeVisible) {
      panel?.classList.add("hidden");
      return;
    }

    panel.classList.remove("hidden");
    panel.dataset.status = challenge.status;
    if (title) title.textContent = challenge.label;
    if (durationGroup) {
      durationGroup.classList.toggle("hidden", challenge.status !== "setup");
      durationGroup.replaceChildren(...CHALLENGE_DURATIONS.map((duration) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${duration} min`;
        button.className = duration === challenge.durationMinutes ? "selected" : "";
        button.addEventListener("click", () => setChallengeDuration(duration));
        return button;
      }));
    }

    const remaining = challenge.endsAt ? challenge.endsAt - Date.now() : challenge.durationMs;
    const ratio = challenge.status === "running" || challenge.status === "done"
      ? Math.max(0, Math.min(1, remaining / challenge.durationMs))
      : 1;
    if (progress) progress.style.setProperty("--progress", `${ratio * 360}deg`);
    if (time) {
      time.textContent = countdownValue
        ? (countdownValue > 0 ? String(countdownValue) : "GO")
        : formatRemaining(remaining);
    }
    if (message) {
      message.textContent = challenge.status === "setup"
        ? "Choisis ta durée, puis démarre doucement."
        : challenge.status === "countdown"
          ? "On y va."
          : challenge.status === "done"
            ? "Réussi. Respire, puis valide ton défi."
            : "Reste avec cette action. C'est suffisant.";
    }
    if (readyButton) readyButton.classList.toggle("hidden", challenge.status !== "setup");
    if (cancelButton) cancelButton.classList.toggle("hidden", challenge.status === "done");
    if (finishButton) {
      finishButton.classList.toggle("hidden", !["running", "done"].includes(challenge.status));
      finishButton.disabled = Boolean(challenge.rewardedAt) || isCompletingChallenge;
    }
  }

  function playStartTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 540;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
      window.setTimeout(() => context.close(), 300);
    } catch (error) {
      // Le son est bonus; le défi démarre même si le navigateur bloque l'audio.
    }
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
    openChallengeSetup(emergencyActions[emergencyIndex], "mental");
    $("emergency-card")?.classList.add("hidden");
  }

  function completeTask(label, successMessage = "") {
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
    showToast(successMessage
      ? `${successMessage} +${COINS_PER_TASK} pièces. ${reward}`
      : `${label} : fait. +${COINS_PER_TASK} pièces. ${reward}`);
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

  function openCheckIn() {
    const panel = $("checkin-panel");
    const button = $("checkin-button");
    if (!panel || !button) return;
    panel.classList.remove("hidden");
    button.setAttribute("aria-expanded", "true");
    renderCheckInChoices();
    $("checkin-note")?.focus();
  }

  function closeCheckIn() {
    const panel = $("checkin-panel");
    const button = $("checkin-button");
    if (!panel || !button) return;
    panel.classList.add("hidden");
    button.setAttribute("aria-expanded", "false");
  }

  function selectCheckIn(value) {
    selectedCheckIn = value;
    renderCheckInChoices();
  }

  function selectEnergy(value) {
    selectedEnergy = value;
    renderCheckInChoices();
  }

  function renderCheckInChoices() {
    const choices = $("checkin-choices");
    const energy = $("checkin-energy");
    if (choices) {
      choices.replaceChildren(...checkInChoices.map((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice;
        button.className = choice === selectedCheckIn ? "selected" : "";
        button.addEventListener("click", () => selectCheckIn(choice));
        return button;
      }));
    }
    if (energy) {
      energy.replaceChildren(...["basse", "moyenne", "haute"].map((level) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = level;
        button.className = level === selectedEnergy ? "selected" : "";
        button.addEventListener("click", () => selectEnergy(level));
        return button;
      }));
    }
  }

  function saveCheckIn() {
    const noteInput = $("checkin-note");
    const note = noteInput?.value.trim() || "";
    const checkIn = {
      status: selectedCheckIn,
      energy: selectedEnergy,
      note,
      createdAt: Date.now()
    };
    state.checkIns = [...state.checkIns, checkIn].slice(-40);
    saveState();
    if (noteInput) noteInput.value = "";
    renderCheckInHistory();
    closeCheckIn();
    showToast(checkInMessage(checkIn));
  }

  function checkInMessage(checkIn) {
    if (checkIn.status === "Je suis fatigué" || checkIn.energy === "basse") {
      return "Tu sembles fatigué aujourd'hui. On garde ça doux.";
    }
    if (checkIn.status === "Je procrastine" || checkIn.status === "Je suis perdu") {
      return "C'est noté. Une petite mission peut aider à revenir.";
    }
    if (checkIn.status === "Je suis concentré" || checkIn.status === "Je suis motivé") {
      return "Belle clarté. Continue une action à la fois.";
    }
    return "Check-in gardé. Tu viens de reprendre le fil.";
  }

  function renderCheckInHistory() {
    const card = $("checkin-history-card");
    const list = $("checkin-history");
    const stats = $("checkin-stats");
    if (!card || !list || !stats) return;
    const recent = state.checkIns.slice(-4).reverse();
    if (!recent.length) {
      card.classList.add("hidden");
      list.replaceChildren();
      return;
    }
    const today = todayKey();
    const todayItems = state.checkIns.filter((item) => dateKey(new Date(item.createdAt)) === today);
    const lowEnergy = todayItems.filter((item) => item.energy === "basse").length;
    stats.textContent = lowEnergy
      ? `${todayItems.length} aujourd'hui · énergie basse ${lowEnergy} fois`
      : `${todayItems.length} aujourd'hui`;
    list.replaceChildren(...recent.map((item) => {
      const row = document.createElement("p");
      row.className = "checkin-item";
      const time = new Date(item.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
      row.textContent = `${time} · ${item.status} · énergie ${item.energy}${item.note ? ` · ${item.note}` : ""}`;
      return row;
    }));
    card.classList.remove("hidden");
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
    const agendaDateInput = $("agenda-date");
    const dayLabel = $("agenda-day-label");
    const monthLabel = $("agenda-month-label");
    if (agendaDateInput) agendaDateInput.value = selectedDate;
    if (dayLabel) dayLabel.textContent = agendaDateLabel(selectedDate);
    if (monthLabel) monthLabel.textContent = agendaMonthLabel(selectedDate);
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
    const nextDate = window.prompt("Date (AAAA-MM-JJ)", item.date)?.trim();
    if (!nextDate) return;
    const nextTime = window.prompt("Heure", item.time || "")?.trim() || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      showToast("Date invalide. Format attendu : AAAA-MM-JJ.");
      return;
    }
    if (nextTime && !/^\d{2}:\d{2}$/.test(nextTime)) {
      showToast("Heure invalide. Format attendu : HH:MM.");
      return;
    }
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
    const coinText = `🪙 ${state.coins}`;
    const coinEl = $("coin-balance");
    if (coinEl) coinEl.textContent = `${state.coins} pièce${state.coins > 1 ? "s" : ""}`;
    const headerBadge = $("header-coin-balance");
    if (headerBadge) headerBadge.textContent = coinText;

    // Panel récompense active
    const panel = $("active-reward-panel");
    if (panel) {
      if (state.activeReward) {
        panel.classList.remove("hidden");
        const remaining = Math.max(0, state.activeReward.endsAt - Date.now());
        const nameEl = $("active-reward-name");
        const timeEl = $("active-reward-time");
        if (nameEl) nameEl.textContent = state.activeReward.name;
        if (timeEl) timeEl.textContent = formatRemaining(remaining);
      } else {
        panel.classList.add("hidden");
      }
    }

    // Mes récompenses achetées
    const purchasedSection = $("purchased-rewards-section");
    const purchasedList = $("purchased-rewards-list");
    if (purchasedSection && purchasedList) {
      if (state.purchasedRewards.length > 0) {
        purchasedSection.classList.remove("hidden");
        purchasedList.replaceChildren(...state.purchasedRewards.map(function(pr) {
          var item = document.createElement("article");
          item.className = "shop-item";
          var copy = document.createElement("div");
          var title = document.createElement("strong");
          title.textContent = pr.name;
          var detail = document.createElement("p");
          detail.className = "small-muted";
          detail.textContent = pr.duration;
          copy.append(title, detail);
          var useBtn = document.createElement("button");
          useBtn.type = "button";
          useBtn.className = "primary";
          useBtn.textContent = "Utiliser";
          useBtn.disabled = Boolean(state.activeReward);
          useBtn.addEventListener("click", function() { useReward(pr); });
          item.append(copy, useBtn);
          return item;
        }));
      } else {
        purchasedSection.classList.add("hidden");
      }
    }

    // Catalogue boutique
    list.replaceChildren(...shopRewards().map(function(reward) {
      var item = document.createElement("article");
      item.className = "shop-item";
      var copy = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = reward.name;
      var detail = document.createElement("p");
      detail.className = "small-muted";
      detail.textContent = `${reward.cost} pièces · ${reward.duration}`;
      copy.append(title, detail);
      var canAfford = state.coins >= reward.cost;
      var button = document.createElement("button");
      button.type = "button";
      button.className = canAfford ? "primary" : "secondary";
      button.textContent = canAfford ? "Acheter" : "Pas assez";
      button.disabled = !canAfford;
      (function(r, btn) {
        btn.addEventListener("click", function() { unlockReward(r, btn); });
      }(reward, button));
      item.append(copy, button);
      return item;
    }));
  }

  function parseDurationMs(durationStr) {
    var match = durationStr.match(/(\d+)\s*min/);
    if (match) return parseInt(match[1], 10) * 60000;
    if (/film|épisode/i.test(durationStr)) return 90 * 60000;
    return 10 * 60000;
  }

  function unlockReward(reward, btn) {
    if (state.coins < reward.cost) {
      showToast("Pas assez de pièces pour cette récompense.");
      return;
    }
    if (btn) btn.disabled = true;
    state.coins -= reward.cost;
    var purchased = {
      id: Date.now() + "_" + Math.floor(Math.random() * 10000),
      name: reward.name,
      duration: reward.duration,
      durationMs: parseDurationMs(reward.duration)
    };
    state.purchasedRewards = state.purchasedRewards.concat([purchased]);
    saveState();
    renderShop();
    showToast(reward.name + " ajouté à tes récompenses !");
  }

  function useReward(purchased) {
    if (state.activeReward) {
      showToast("Une récompense est déjà en cours. Termine-la d'abord.");
      return;
    }
    state.activeReward = {
      id: purchased.id,
      name: purchased.name,
      duration: purchased.duration,
      durationMs: purchased.durationMs,
      endsAt: Date.now() + purchased.durationMs
    };
    state.purchasedRewards = state.purchasedRewards.filter(function(r) { return r.id !== purchased.id; });
    saveState();
    startActiveRewardTimer();
    renderShop();
  }

  function stopActiveReward() {
    window.clearInterval(activeRewardTimerId);
    activeRewardTimerId = null;
    state.activeReward = null;
    saveState();
    renderShop();
    showToast("Récompense arrêtée.");
  }

  function startActiveRewardTimer() {
    window.clearInterval(activeRewardTimerId);
    activeRewardTimerId = window.setInterval(function() {
      if (!state.activeReward) {
        window.clearInterval(activeRewardTimerId);
        activeRewardTimerId = null;
        return;
      }
      var remaining = state.activeReward.endsAt - Date.now();
      if (remaining <= 0) {
        window.clearInterval(activeRewardTimerId);
        activeRewardTimerId = null;
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
        state.activeReward = null;
        saveState();
        renderShop();
        showToast("Récompense terminée. Beau retour.");
      } else {
        var timeEl = $("active-reward-time");
        if (timeEl) timeEl.textContent = formatRemaining(remaining);
      }
    }, 1000);
  }

  function resumeActiveRewardTimer() {
    if (!state.activeReward) return;
    var remaining = state.activeReward.endsAt - Date.now();
    if (remaining <= 0) {
      state.activeReward = null;
      saveState();
      renderShop();
      return;
    }
    startActiveRewardTimer();
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
    const notifyImportant = $("notify-important");
    const notifySummary = $("notify-summary");
    const notificationStatus = $("notification-status");
    if (notifyImportant) notifyImportant.checked = state.notifications.important;
    if (notifySummary) notifySummary.checked = state.notifications.summary;
    if (notificationStatus) notificationStatus.textContent = notificationPermissionText();
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
    const bindById = (id, eventName, handler) => {
      const element = $(id);
      if (!element) return;
      element.addEventListener(eventName, handler);
    };

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
    bindById("close-selected-domain", "click", closeSelectedDomain);
    bindById("add-selected-goal", "click", () => addCustomGoal($("add-selected-goal").dataset.addGoal));
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
        const domainPanel = button.closest(".domain-panel");
        const panelDomain = domainPanel?.id?.replace("domain-", "") || "";
        if (button.dataset.homeTask) {
          state.selectedDomain = button.dataset.homeTask;
          saveState();
          renderHomeSuggestion();
        } else if (panelDomain) {
          state.selectedDomain = panelDomain;
          saveState();
        }
        button.dataset.goalDomain = state.selectedDomain;
        toggleGoalSelection(button.dataset.complete, state.selectedDomain);
      });
    });

    bindById("next-action", "click", () => showEmergencyAction(false));
    bindById("emergency-done", "click", completeEmergencyAction);
    bindById("emergency-other", "click", () => showEmergencyAction(true));
    bindById("start-challenge", "click", startChallenge);
    bindById("cancel-challenge", "click", cancelChallenge);
    bindById("finish-challenge", "click", completeActiveChallenge);
    bindById("start-goal-queue", "click", startGoalQueue);
    bindById("start-goal-queue-inline", "click", startGoalQueue);
    bindById("skip-goal", "click", skipQueueGoal);
    bindById("stop-goal-queue", "click", () => stopGoalQueue());
    bindById("choose-domain-button", "click", () => showView("domains"));
    $("quick-add-button")?.addEventListener("click", openQuickAdd);
    $("close-quick-add")?.addEventListener("click", closeQuickAdd);
    $("checkin-button")?.addEventListener("click", openCheckIn);
    $("close-checkin")?.addEventListener("click", closeCheckIn);
    $("save-checkin")?.addEventListener("click", saveCheckIn);
    $("checkin-note")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveCheckIn();
    });
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
    $("stop-active-reward")?.addEventListener("click", stopActiveReward);

    bindById("notify-important", "change", (event) => {
      state.notifications.important = event.target.checked;
      saveState();
      showToast("Réglage enregistré.");
    });
    bindById("notify-summary", "change", (event) => {
      state.notifications.summary = event.target.checked;
      saveState();
      showToast("Réglage enregistré.");
    });
    bindById("enable-notifications", "click", requestNotifications);
    bindById("test-notification", "click", testNotification);
    bindById("settings-install-button", "click", startInstall);
    bindById("install-yes", "click", startInstall);
    bindById("install-later", "click", dismissInstallInvite);
    bindById("save-idea", "click", saveIdea);
    bindById("save-reward", "click", saveReward);
    bindById("reward-input", "keydown", (event) => {
      if (event.key === "Enter") saveReward();
    });
    document.querySelectorAll("[data-motivation]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button, "motivation", button.dataset.motivation));
    });
    document.querySelectorAll("[data-reward]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button, "rewards", button.dataset.reward));
    });
    bindById("finish-onboarding", "click", finishOnboarding);

    bindById("reset-data", "click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = cloneState(defaultState);
      render();
      closeDomain();
      closeCheckIn();
      showView("home");
      showToast("Données effacées.");
    });
  }

  function render() {
    renderHomeSuggestion();
    renderCheckInChoices();
    renderCheckInHistory();
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
    renderGoalQueue();
    renderChallengeTimer();
    resumeChallengeTimer();
    resumeActiveRewardTimer();
    scheduleAgendaReminders();
  }

  bindInstallEvents();
  bindEvents();
  render();
  registerServiceWorker();
}());
