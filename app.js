import {
  dayTypes,
  shopPrices,
  rewardDetails,
  safeRewardLabel,
  MAX_REWARD_MINUTES,
  MAX_REWARD_BREAK_MINUTES,
  reminderMessages,
  notificationDefaults,
  shouldSendNotification,
  todayKey,
  emptyState,
  getDay,
  chooseDayType,
  chooseFocus,
  currentSelection,
  chooseChallenge,
  rewardCoins,
  addCoins,
  spendCoins,
  addRewardTime,
  useRewardTime,
  buyObjectiveSlot as purchaseObjectiveSlot,
  recordSkip,
  coinsLastSevenDays
} from "./logic.js";

const STORAGE_KEY = "elan-pilote-v1";
let state = loadState();
let currentMission = null;
let installPrompt = null;
let rewardDraft = [];
let rewardSetupOpen = false;
let timerInterval = null;
let rewardTimerInterval = null;
let dayTypesRevealed = false;
let dailyReviewOpen = false;
let simpleMode = false;
let simpleSuggestionIndex = -1;
let feedbackTimeout = null;
let sequenceDraft = [];
let sequenceTransitionTimeout = null;
let sequenceHomeTimeout = null;
const MAX_SEQUENCE_ITEMS = 4;

const simpleSuggestions = [
  { type: "repos", focus: "besoin", text: "Bois quelques gorgées d'eau.", seconds: 60, minutes: "1 min" },
  { type: "repos", focus: "rideaux", text: "Ouvre les rideaux ou une lumière douce.", seconds: 60, minutes: "1 min" },
  { type: "repos", focus: "calme", text: "Pose tes pieds au sol. Expire lentement 3 fois.", seconds: 60, minutes: "1 min" },
  { type: "menage", focus: "rangement", text: "Range trois objets visibles.", seconds: 60, minutes: "1 min" },
  { type: "exterieur", focus: "bouger", text: "Marche doucement pendant 2 minutes.", seconds: 120, minutes: "2 min" },
  { type: "repos", focus: "calme", text: "Respire lentement. Seulement trois fois.", seconds: 60, minutes: "1 min" }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function vibrate(pattern = 24) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function animateFeedback(selector) {
  const element = $(selector);
  if (!element) return;
  element.classList.remove("feedback-pop");
  window.requestAnimationFrame(() => element.classList.add("feedback-pop"));
}

function showFeedback(message, style = "success", vibration = 24) {
  const toast = $("#feedback-toast");
  toast.textContent = message;
  toast.className = `feedback-toast show ${style}`;
  if (feedbackTimeout) window.clearTimeout(feedbackTimeout);
  feedbackTimeout = window.setTimeout(() => toast.classList.remove("show"), 2200);
  if (vibration) vibrate(vibration);
}

function closeDailyReview() {
  dailyReviewOpen = false;
  $("#daily-review-panel").classList.add("hidden");
  $("#daily-review-toggle").setAttribute("aria-expanded", "false");
  $("#daily-review-label").textContent = "Suivi du jour";
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const defaults = emptyState();
    const migratedBalance = Object.values(stored.days || {}).reduce((sum, day) => sum + (day.coins ?? day.score ?? 0), 0);
    const rewardChoices = [...new Set((stored.preferences?.rewardChoices || []).map(safeRewardLabel))];
    return {
      ...defaults,
      ...stored,
      reminders: { ...defaults.reminders, ...stored.reminders },
      notificationSettings: { ...notificationDefaults, ...stored.notificationSettings },
      workPlan: { ...defaults.workPlan, ...stored.workPlan },
      preferences: { ...defaults.preferences, ...stored.preferences, rewardChoices },
      wallet: stored.wallet
        ? { ...defaults.wallet, ...stored.wallet }
        : { ...defaults.wallet, balance: migratedBalance, totalEarned: migratedBalance },
      activeTimer: stored.activeTimer
        ? {
            ...stored.activeTimer,
            mission: {
              ...stored.activeTimer.mission,
              coins: rewardCoins(stored.activeTimer.mission.coins ?? stored.activeTimer.mission.points)
            }
          }
        : null,
      activeRewardTimer: stored.activeRewardTimer || null,
      activeSequence: stored.activeSequence
        ? { coinsEarned: 0, ...stored.activeSequence }
        : null
    };
  } catch {
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function logDayEvent(title, detail) {
  const day = getDay(state);
  if (!day.timeline) day.timeline = [];
  day.timeline.unshift({ title, detail, at: Date.now() });
  day.timeline = day.timeline.slice(0, 20);
}

function showView(viewName) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === viewName));
  $$(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === viewName));
  if (viewName === "progress") renderProgress();
  if (viewName === "settings") renderSettings();
}

function renderRewardSetup() {
  const configured = state.preferences.rewardsConfigured;
  $("#reward-setup-card").classList.toggle("hidden", configured || !rewardSetupOpen);
  if (!configured && rewardSetupOpen) {
    rewardDraft = [...(state.preferences.rewardChoices || [])];
    $$("#reward-choice-list [data-reward-choice]").forEach(button => {
      button.classList.toggle("selected", rewardDraft.includes(button.dataset.rewardChoice));
    });
  }
  return true;
}

function toggleRewardChoice(value, button) {
  if (rewardDraft.includes(value)) rewardDraft = rewardDraft.filter(choice => choice !== value);
  else rewardDraft.push(value);
  button.classList.toggle("selected", rewardDraft.includes(value));
  $("#reward-setup-error").classList.add("hidden");
}

function saveRewards() {
  const custom = $("#custom-reward").value.trim();
  if (custom && safeRewardLabel(custom) !== custom) {
    $("#reward-setup-error").textContent = "Choisis une récompense calme et sécuritaire.";
    $("#reward-setup-error").classList.remove("hidden");
    return;
  }
  const choices = rewardDraft.map(safeRewardLabel);
  if (custom && !choices.includes(safeRewardLabel(custom))) choices.push(safeRewardLabel(custom));
  if (!choices.length) {
    $("#reward-setup-error").textContent = "Choisis au moins une récompense.";
    $("#reward-setup-error").classList.remove("hidden");
    return;
  }
  state.preferences.rewardChoices = choices.slice(0, 4);
  state.preferences.rewardsConfigured = true;
  rewardSetupOpen = false;
  saveState();
  renderDashboard();
  renderProgress();
  renderSettings();
}

function editRewards() {
  state.preferences.rewardsConfigured = false;
  rewardSetupOpen = true;
  saveState();
  showView("today");
  renderDashboard();
  $("#reward-setup-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderDayTypes() {
  $("#day-type-list").innerHTML = Object.entries(dayTypes).map(([key, dayType]) => `
    <button class="day-type-button" data-day-type="${key}">
      <span class="day-type-icon">${dayType.icon}</span>
      <span>${dayType.label}</span>
    </button>
  `).join("");
}

function renderToday() {
  const selection = currentSelection(state);
  const rewardsReady = renderRewardSetup();
  const hasType = Boolean(selection.type);
  const isWork = selection.day.type === "travail";
  const hasWorkPlan = isWork && state.workPlan?.date === todayKey();
  const processVisible = ["#effort-card", "#mission-card", "#timer-done-card", "#simple-done-card", "#sequence-transition-card", "#sequence-finished-card", "#reward-card", "#reward-timer-card"]
    .some(selector => !$(selector).classList.contains("hidden"));
  if (simpleMode) {
    $(".app-shell").classList.add("emergency-active");
    $("#simple-mode-entry").classList.add("hidden");
    $("#reward-setup-card").classList.add("hidden");
    $("#day-type-card").classList.add("hidden");
    $("#focus-card").classList.add("hidden");
    $("#work-setup-card").classList.add("hidden");
    $("#work-coach-card").classList.add("hidden");
    $("#work-checkin-card").classList.add("hidden");
    $("#effort-card").classList.add("hidden");
    $("#daily-review-toggle").classList.add("hidden");
    $("#daily-review-panel").classList.add("hidden");
    $("#simple-mode-card").classList.toggle("hidden", processVisible);
    return;
  }
  $(".app-shell").classList.remove("emergency-active");
  $("#simple-mode-entry").classList.toggle("hidden", processVisible || hasType);
  $("#simple-mode-card").classList.add("hidden");
  $("#day-type-card").classList.toggle("hidden", !rewardsReady || hasType);
  $("#focus-card").classList.toggle("hidden", !rewardsReady || !hasType || isWork || processVisible);
  $("#work-setup-card").classList.toggle("hidden", !rewardsReady || !isWork || hasWorkPlan || processVisible);
  $("#work-coach-card").classList.toggle("hidden", !rewardsReady || !isWork || !hasWorkPlan || processVisible || !$("#work-checkin-card").classList.contains("hidden"));
  if (!isWork) $("#work-checkin-card").classList.add("hidden");
  $("#daily-review-toggle").classList.toggle("hidden", !rewardsReady);
  $("#daily-review-panel").classList.toggle("hidden", !rewardsReady || !dailyReviewOpen);
  $("#daily-review-toggle").setAttribute("aria-expanded", String(dailyReviewOpen));
  $("#daily-review-label").textContent = dailyReviewOpen ? "Fermer le suivi" : "Suivi du jour";
  if (!rewardsReady) {
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    return;
  }
  if (isWork) {
    renderWorkCoach();
    return;
  }
  if (!hasType) {
    $("#start-day-button").classList.toggle("hidden", dayTypesRevealed);
    $("#day-type-options").classList.toggle("hidden", !dayTypesRevealed);
  }
  if (hasType) {
    const visibleSlots = 3 + (state.wallet.extraObjectiveSlots || 0);
    const visibleFocuses = selection.type.focuses.slice(0, visibleSlots);
    const hiddenCount = selection.type.focuses.length - visibleFocuses.length;
    $("#selected-day-type").textContent = `${selection.type.icon} ${selection.type.label}`;
    const directFlow = selection.type.flow === "confirm";
    $("#focus-help").textContent = directFlow ? "Choisis une action. Confirme quand elle est faite." : "Coche tes actions.";
    $("#sequence-limit").textContent = directFlow ? "1 à 4 actions · sans chrono imposé" : "1 à 4 objectifs · 8 min chacun";
    $("#focus-list").innerHTML = visibleFocuses.map(focus => `
      <label class="sequence-option ${sequenceDraft.includes(focus.id) ? "selected" : ""}">
        <input type="checkbox" data-sequence-focus="${focus.id}" ${sequenceDraft.includes(focus.id) ? "checked" : ""}>
        <span>${focus.label}</span>
      </label>
    `).join("");
    renderSequenceStart();
    $("#locked-focus-note").classList.toggle("hidden", hiddenCount <= 0);
    if (hiddenCount > 0) $("#locked-focus-note").textContent = `+${hiddenCount} objectif${hiddenCount === 1 ? "" : "s"} à ouvrir · Boutique`;
  }
}

function showSimpleSuggestion() {
  const day = getDay(state);
  const nextIndex = simpleSuggestionIndex < 0 ? day.completed % simpleSuggestions.length : simpleSuggestionIndex + 1;
  simpleSuggestionIndex = nextIndex % simpleSuggestions.length;
  const suggestion = simpleSuggestions[simpleSuggestionIndex];
  chooseDayType(state, suggestion.type);
  chooseFocus(state, suggestion.focus);
  currentMission = chooseChallenge(state, "rescue");
  currentMission.detail = suggestion.text;
  currentMission.seconds = suggestion.seconds;
  currentMission.minutes = suggestion.minutes;
  saveState();
  $("#simple-action-text").textContent = currentMission.detail;
  $("#simple-time").textContent = currentMission.minutes;
  $("#simple-done-card").classList.add("hidden");
  $("#simple-mode-card").classList.remove("hidden");
}

function openSimpleMode() {
  simpleMode = true;
  closeDailyReview();
  $("#reward-card").classList.add("hidden");
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#simple-done-card").classList.add("hidden");
  $("#reward-timer-card").classList.add("hidden");
  showSimpleSuggestion();
  renderToday();
}

function exitSimpleMode() {
  const day = getDay(state);
  simpleMode = false;
  simpleSuggestionIndex = -1;
  day.type = "";
  day.focus = "";
  currentMission = null;
  saveState();
  $("#simple-mode-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#simple-done-card").classList.add("hidden");
  $("#reward-timer-card").classList.add("hidden");
  renderDashboard();
}

function selectDayType(type) {
  chooseDayType(state, type);
  state.activeSequence = null;
  sequenceDraft = [];
  closeDailyReview();
  dayTypesRevealed = false;
  currentMission = null;
  $("#mission-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#objective-status").classList.add("hidden");
  $("#work-checkin-card").classList.add("hidden");
  $("#work-help-panel").classList.add("hidden");
  saveState();
  renderToday();
}

function renderWorkCoach() {
  const plan = state.workPlan;
  $("#work-start").value = plan.start;
  $("#work-end").value = plan.end;
  $("#work-breaks").value = plan.breaks;
  $("#work-quiet-start").value = plan.quietStart;
  $("#work-quiet-end").value = plan.quietEnd;
  $("#work-energy").value = plan.energy;
  $("#work-type").value = plan.type;
  if (plan.date !== todayKey()) return;
  const time = new Date().toTimeString().slice(0, 5);
  const isAfter = time >= plan.end;
  const isBefore = time < plan.start;
  const energyText = { low: "énergie basse", medium: "énergie moyenne", good: "bonne énergie" }[plan.energy];
  const workTypeText = { focus: "concentration", service: "service", physical: "physique", mixte: "mixte" }[plan.type];
  const breakText = { normal: "pauses habituelles", extra: "pauses courtes utiles", few: "pauses limitées" }[plan.breaks];
  $("#work-summary").textContent = `${plan.start} à ${plan.end} · ${workTypeText} · ${energyText}`;
  $("#work-coach-title").textContent = plan.checkedIn ? "Shift terminé" : isAfter ? "Fin de shift" : isBefore ? "Avant ton shift" : "Ton shift";
  const guidance = plan.checkedIn
    ? "C'est noté. Récupère sans devoir en faire plus."
    : isAfter
    ? "Termine avec un mini check-in. Aucun rattrapage demandé."
    : isBefore
      ? "Prépare l'essentiel. Tu commenceras quand ton horaire commence."
      : plan.mode === "pause"
        ? "Pause protégée. Reviens quand tu es prêt."
        : "Une priorité à la fois. Les rappels attendent pendant le focus.";
  $("#work-guidance").textContent = `${guidance} ${breakText}.`;
  $("#work-focus-button").classList.toggle("selected", plan.mode === "focus");
  $("#work-pause-button").classList.toggle("selected", plan.mode === "pause");
}

function saveWorkPlan() {
  const start = $("#work-start").value;
  const end = $("#work-end").value;
  if (!start || !end || start === end) {
    showFeedback("Choisis un début et une fin.", "success", 18);
    return;
  }
  state.workPlan = {
    ...state.workPlan,
    active: true,
    date: todayKey(),
    start,
    end,
    breaks: $("#work-breaks").value,
    quietStart: $("#work-quiet-start").value,
    quietEnd: $("#work-quiet-end").value,
    energy: $("#work-energy").value,
    type: $("#work-type").value,
    mode: "focus",
    checkedIn: false
  };
  $("#work-checkin-result").classList.add("hidden");
  $("#work-home-button").classList.add("hidden");
  $$("#work-checkin-card [data-work-checkin]").forEach(button => { button.disabled = false; });
  logDayEvent("Shift préparé", `${start} à ${end}`);
  saveState();
  showFeedback("Shift prêt. Doucement.", "success", 24);
  renderDashboard();
}

function editWorkPlan() {
  state.workPlan.active = false;
  state.workPlan.date = "";
  $("#work-help-panel").classList.add("hidden");
  $("#work-checkin-card").classList.add("hidden");
  saveState();
  renderToday();
}

function setWorkMode(mode) {
  state.workPlan.mode = mode;
  state.workPlan.active = true;
  saveState();
  renderWorkCoach();
  showFeedback(mode === "focus" ? "Focus protégé." : "Pause douce.", "success", 18);
}

function showWorkHelp() {
  const byEnergy = {
    low: "Prends de l'eau. Choisis seulement la prochaine petite action.",
    medium: "Écris la prochaine action claire. Fais seulement celle-là.",
    good: "Choisis ta priorité. Avance jusqu'à une étape claire."
  };
  const byType = {
    focus: "Coupe une distraction visible.",
    service: "Prépare ta prochaine réponse simple.",
    physical: "Vérifie ton eau et ton rythme.",
    mixte: "Choisis ce qui est prioritaire maintenant."
  };
  $("#work-help-text").textContent = `${byEnergy[state.workPlan.energy]} ${byType[state.workPlan.type]}`;
  $("#work-help-panel").classList.remove("hidden");
  $("#work-help-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function completeWorkHelp() {
  const earnedCoins = rewardCoins(5);
  addCoins(state, earnedCoins, { kind: "completed", title: "Petit pas au travail", domain: "Travail" });
  logDayEvent("Fait: aide travail", `Travail · +${earnedCoins} jetons`);
  $("#work-help-panel").classList.add("hidden");
  saveState();
  renderDashboard();
  renderProgress();
  showFeedback(`✓ +${earnedCoins} jetons`, "success", 24);
}

function openWorkCheckin() {
  $("#work-coach-card").classList.add("hidden");
  $("#work-checkin-card").classList.remove("hidden");
}

function completeWorkCheckin(energy) {
  if (state.workPlan.checkedIn) return;
  const energyText = { low: "basse", medium: "moyenne", good: "bonne" }[energy];
  state.workPlan.checkedIn = true;
  state.workPlan.active = false;
  addCoins(state, 5, { kind: "completed", title: "Check-in après travail", domain: "Travail" });
  logDayEvent("Fait: fin de shift", `Énergie ${energyText} · +5 jetons`);
  saveState();
  $("#work-checkin-result").textContent = "Noté. Ton travail est terminé pour aujourd'hui. +5 jetons";
  $("#work-checkin-result").classList.remove("hidden");
  $("#work-home-button").classList.remove("hidden");
  $$("#work-checkin-card [data-work-checkin]").forEach(button => { button.disabled = true; });
  renderDashboard();
  renderProgress();
  showFeedback("✓ Shift terminé · +5 jetons", "success", [28, 36, 45]);
}

function finishWorkDay() {
  const day = getDay(state);
  day.type = "";
  day.focus = "";
  $("#work-checkin-card").classList.add("hidden");
  dayTypesRevealed = false;
  saveState();
  renderDashboard();
}

function selectFocus(focus) {
  chooseFocus(state, focus);
  closeDailyReview();
  saveState();
  const selection = currentSelection(state);
  $("#selected-focus").textContent = selection.focus.label;
  $("#focus-card").classList.add("hidden");
  $("#mission-card").classList.add("hidden");
  $("#objective-status").classList.add("hidden");
  if (selection.type.flow === "confirm") {
    currentMission = chooseChallenge(state, "light");
    showProposedMission();
  } else {
    $("#effort-card").classList.remove("hidden");
    $("#effort-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function renderSequenceStart() {
  const count = sequenceDraft.length;
  const directFlow = currentSelection(state).type?.flow === "confirm";
  $("#start-sequence-button").disabled = count === 0;
  $("#start-sequence-button").textContent = directFlow
    ? count ? `Commencer (${count})` : "Commencer"
    : count ? `Commencer la séquence (${count})` : "Commencer la séquence";
}

function toggleSequenceFocus(input) {
  const focus = input.dataset.sequenceFocus;
  if (input.checked && sequenceDraft.length >= MAX_SEQUENCE_ITEMS) {
    input.checked = false;
    $("#objective-status").textContent = "Garde 4 objectifs maximum.";
    $("#objective-status").classList.remove("hidden");
    showFeedback("Maximum 4 objectifs.", "success", 18);
    return;
  }
  if (input.checked) sequenceDraft.push(focus);
  else sequenceDraft = sequenceDraft.filter(item => item !== focus);
  input.closest(".sequence-option").classList.toggle("selected", input.checked);
  $("#objective-status").classList.add("hidden");
  renderSequenceStart();
}

function sequenceProgress() {
  const sequence = state.activeSequence;
  if (!sequence || !sequence.focuses.length) return "";
  return `${sequence.index + 1}/${sequence.focuses.length}`;
}

function renderSequenceProgress() {
  const progress = sequenceProgress();
  $("#sequence-progress").textContent = progress;
  $("#sequence-progress").classList.toggle("hidden", !progress || simpleMode);
}

function startSequenceStep() {
  const sequence = state.activeSequence;
  if (!sequence || !sequence.focuses[sequence.index]) return;
  chooseFocus(state, sequence.focuses[sequence.index]);
  currentMission = chooseChallenge(state, "normal");
  saveState();
  showProposedMission();
}

function startSequence() {
  const day = getDay(state);
  if (!day.type || !sequenceDraft.length) return;
  state.activeSequence = {
    type: day.type,
    focuses: [...sequenceDraft],
    index: 0,
    coinsEarned: 0
  };
  startSequenceStep();
}

function cancelSequence() {
  state.activeSequence = null;
  sequenceDraft = [];
  $("#sequence-transition-card").classList.add("hidden");
  $("#sequence-progress").classList.add("hidden");
  if (sequenceTransitionTimeout) window.clearTimeout(sequenceTransitionTimeout);
  sequenceTransitionTimeout = null;
}

function cancelSequenceHomeTimeout() {
  if (sequenceHomeTimeout) window.clearTimeout(sequenceHomeTimeout);
  sequenceHomeTimeout = null;
}

function returnSequenceHome() {
  cancelSequenceHomeTimeout();
  const day = getDay(state);
  day.type = "";
  day.focus = "";
  currentMission = null;
  dayTypesRevealed = false;
  $("#sequence-finished-card").classList.add("hidden");
  showView("today");
  saveState();
  renderDashboard();
}

function showSequenceFinished(totalCoins) {
  cancelSequence();
  saveState();
  $("#reward-card").classList.add("hidden");
  $("#sequence-total-coins").textContent = `+${totalCoins}`;
  $("#sequence-finished-card").classList.remove("hidden");
  renderDashboard();
  renderProgress();
  showFeedback(`✓ +${totalCoins} jetons`, "success", [28, 36, 45]);
  animateFeedback("#sequence-finished-card");
  animateFeedback(".wallet-pill");
  cancelSequenceHomeTimeout();
  sequenceHomeTimeout = window.setTimeout(returnSequenceHome, 6000);
}

function showSequenceTransition(done, total, earnedCoins) {
  const sequence = state.activeSequence;
  const type = sequence && dayTypes[sequence.type];
  const nextFocus = type && type.focuses.find(focus => focus.id === sequence.focuses[sequence.index]);
  if (!nextFocus) return;
  $("#sequence-transition-progress").textContent = `${done}/${total} fait · +${earnedCoins} jetons`;
  $("#sequence-next-label").textContent = nextFocus.label;
  $("#focus-card").classList.add("hidden");
  $("#sequence-transition-card").classList.remove("hidden");
  showFeedback(`✓ +${earnedCoins} jetons`, "success", [24, 32, 24]);
  animateFeedback("#sequence-transition-card");
  sequenceTransitionTimeout = window.setTimeout(() => {
    $("#sequence-transition-card").classList.add("hidden");
    sequenceTransitionTimeout = null;
    startSequenceStep();
  }, 1000);
}

function showProposedMission() {
  if (!currentMission) return;
  closeDailyReview();
  const selection = currentSelection(state);
  const usesTimer = simpleMode || selection.type.flow === "timer";
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#mission-domain").textContent = currentMission.type;
  $("#mission-time").textContent = usesTimer ? currentMission.minutes : "À faire";
  renderSequenceProgress();
  $("#mission-goal").textContent = selection.focus.label;
  $("#mission-title").textContent = currentMission.title;
  $("#mission-detail").textContent = currentMission.detail;
  $("#mission-points").textContent = `+${currentMission.coins} jetons si terminé.`;
  $("#timer-step-label").textContent = simpleMode ? "Mini timer" : "En cours";
  $("#timer-help").textContent = simpleMode ? "Respire. Fais juste ça." : "Continue jusqu'à la sonnerie.";
  $("#stop-timer-label").textContent = "Arrêter";
  $("#timer-done-label").textContent = "Timer";
  $("#timer-done-title").textContent = "Temps terminé";
  $("#before-start-actions").classList.toggle("hidden", !usesTimer);
  $("#direct-action-actions").classList.toggle("hidden", usesTimer);
  $("#timer-panel").classList.add("hidden");
  $("#mission-card").classList.toggle("simple-mission", simpleMode);
  $("#mission-card").classList.remove("hidden");
  $("#mission-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function proposeChallenge(effort = "normal") {
  currentMission = chooseChallenge(state, effort);
  showProposedMission();
}

function startSimpleTimer() {
  $("#simple-mode-card").classList.add("hidden");
  showProposedMission();
  startTimer();
}

function nearestRewardCost() {
  const choices = state.preferences.rewardChoices || [];
  return choices.length
    ? Math.min(...choices.map(choice => rewardDetails(choice).cost))
    : shopPrices.personalReward;
}

function showWinSummary(coins, balance) {
  const price = nearestRewardCost();
  const progress = Math.min(100, Math.round((balance / price) * 100));
  $("#win-points").textContent = `+${coins}`;
  $("#win-progress-label").textContent = balance >= price
    ? "Récompense disponible"
    : `${balance} / ${price} pour une récompense`;
  $("#win-summary").classList.remove("hidden");
  $("#win-meter-fill").style.width = "0%";
  window.requestAnimationFrame(() => {
    $("#win-meter-fill").style.width = `${progress}%`;
  });
}

function completeMission() {
  if (!currentMission) return;
  const selection = currentSelection(state);
  const earnedCoins = rewardCoins(currentMission.coins);
  const balance = addCoins(state, earnedCoins, {
    kind: "completed",
    title: currentMission.focus,
    domain: currentMission.type
  });
  logDayEvent(`Fait: ${currentMission.focus}`, `${currentMission.type} · ${currentMission.minutes} · +${earnedCoins} jetons`);
  saveState();
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#timer-panel").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  if (simpleMode) {
    $("#reward-card").classList.add("hidden");
    $("#simple-done-card").classList.remove("hidden");
    renderDashboard();
    renderProgress();
    showFeedback(`✓ +${earnedCoins} jetons`, "success", 24);
    animateFeedback("#simple-done-card");
    animateFeedback(".wallet-pill");
    return;
  }
  const sequence = state.activeSequence;
  if (sequence) sequence.coinsEarned = (sequence.coinsEarned || 0) + earnedCoins;
  if (sequence && sequence.index < sequence.focuses.length - 1) {
    const completedStep = sequence.index + 1;
    sequence.index += 1;
    saveState();
    renderDashboard();
    renderProgress();
    showSequenceTransition(completedStep, sequence.focuses.length, earnedCoins);
    animateFeedback(".tracking-score");
    animateFeedback(".wallet-pill");
    return;
  }
  const sequenceFinished = Boolean(sequence);
  if (sequenceFinished) {
    const totalCoins = sequence.coinsEarned || earnedCoins;
    saveState();
    showSequenceFinished(totalCoins);
    return;
  }
  saveState();
  $("#reward-title").textContent = getDay(state).completed === 1 ? "Premier pas fait." : "Bien joué.";
  $("#reward-message").textContent = "Jetons ajoutés.";
  showWinSummary(earnedCoins, balance);
  $("#continue-button").textContent = simpleMode ? "Autre suggestion" : `Continuer: ${selection.focus.label}`;
  $("#suggestion-list").innerHTML = simpleMode ? "" : selection.type.focuses
    .filter(focus => focus.id !== selection.focus.id)
    .slice(0, 3)
    .map(focus => `<button data-next-focus="${focus.id}">${focus.label}</button>`)
    .join("");
  $("#change-day-type-button").classList.toggle("hidden", simpleMode);
  $("#exit-simple-button").classList.toggle("hidden", !simpleMode);
  $("#next-step-panel").classList.remove("hidden");
  $("#return-button").classList.add("hidden");
  $("#reward-check").classList.remove("hidden");
  $("#reward-card").classList.remove("hidden");
  renderDashboard();
  renderProgress();
  showFeedback(`✓ +${earnedCoins} jetons`, "success", [28, 36, 45]);
  animateFeedback("#reward-card");
  animateFeedback(".tracking-score");
  animateFeedback(".wallet-pill");
}

function buyPersonalReward(label) {
  const reward = rewardDetails(label);
  const savedMinutes = state.wallet.rewardMinutes || 0;
  const room = MAX_REWARD_MINUTES - savedMinutes;
  if (reward.minutes > room) {
    const message = room
      ? `Utilise d'abord du temps. Place restante: ${room} min.`
      : "Ta réserve est pleine. Utilise du temps d'abord.";
    showFeedback(message, "reward-feedback", 18);
    return;
  }
  if (!spendCoins(state, reward.cost, label)) {
    showFeedback("Pas assez de jetons.", "success", 18);
    return;
  }
  addRewardTime(state, reward.minutes, reward.label);
  logDayEvent("Temps ajouté", `${reward.label} · -${reward.cost} jetons · +${reward.minutes} min`);
  saveState();
  renderDashboard();
  renderProgress();
  showFeedback(`+${reward.minutes} min · Total ${state.wallet.rewardMinutes} min`, "reward-feedback", 28);
  animateFeedback(".reward-bank");
}

function startSavedRewardTime() {
  const minutes = useRewardTime(state);
  if (!minutes) return;
  state.activeRewardTimer = {
    endsAt: Date.now() + minutes * 60 * 1000,
    title: "Pause récompense"
  };
  logDayEvent("Pause lancée", `${minutes} min utilisés`);
  saveState();
  showView("today");
  $("#reward-card").classList.add("hidden");
  runRewardTimer();
  renderDashboard();
  renderProgress();
  showFeedback(`Pause · ${minutes} min`, "reward-feedback", 28);
  animateFeedback("#reward-timer-card");
}

function buyObjectiveSlot() {
  if ((state.wallet.extraObjectiveSlots || 0) >= 2) return;
  if (!purchaseObjectiveSlot(state)) {
    showFeedback("Pas assez de jetons.", "success", 18);
    return;
  }
  saveState();
  renderDashboard();
  renderProgress();
  showFeedback("✓ Objectif débloqué", "success", [28, 36, 45]);
}

function runRewardTimer() {
  if (!state.activeRewardTimer) return;
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#active-reward-title").textContent = state.activeRewardTimer.title;
  $("#reward-timer-card").classList.remove("hidden");
  if (rewardTimerInterval) window.clearInterval(rewardTimerInterval);
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((state.activeRewardTimer.endsAt - Date.now()) / 1000));
    $("#reward-timer-display").textContent = formatTime(remaining);
    if (remaining <= 0) finishReward(true);
  };
  tick();
  rewardTimerInterval = window.setInterval(tick, 1000);
}

function finishReward(notify = false) {
  if (rewardTimerInterval) window.clearInterval(rewardTimerInterval);
  rewardTimerInterval = null;
  state.activeRewardTimer = null;
  logDayEvent("Pause terminée", "Retour");
  saveState();
  $("#reward-timer-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#reward-check").classList.add("hidden");
  $("#win-summary").classList.add("hidden");
  const rewardVibration = notify && document.visibilityState !== "visible" ? null : 28;
  showFeedback("✓ Pause terminée", "reward-feedback", rewardVibration);
  if (notify) sendRewardCompletionAlert();
  if (state.activeSequence) {
    showView("today");
    startSequenceStep();
    return;
  }
  showView("progress");
  renderProgress();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
  if (!currentMission) return;
  state.activeTimer = { endsAt: Date.now() + currentMission.seconds * 1000, mission: currentMission };
  saveState();
  runTimer();
  showFeedback("✓ Timer lancé", "success", 24);
  animateFeedback("#timer-panel");
}

function runTimer() {
  if (!state.activeTimer) return;
  currentMission = state.activeTimer.mission;
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#mission-card").classList.remove("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#simple-done-card").classList.add("hidden");
  renderSequenceProgress();
  $("#before-start-actions").classList.add("hidden");
  $("#timer-panel").classList.remove("hidden");
  if (timerInterval) window.clearInterval(timerInterval);
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((state.activeTimer.endsAt - Date.now()) / 1000));
    $("#timer-display").textContent = formatTime(remaining);
    if (remaining <= 0) finishTimer();
  };
  tick();
  timerInterval = window.setInterval(tick, 1000);
}

function finishTimer(notify = true) {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  if (rewardTimerInterval) window.clearInterval(rewardTimerInterval);
  rewardTimerInterval = null;
  state.activeTimer = null;
  saveState();
  $("#timer-panel").classList.add("hidden");
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.remove("hidden");
  const timerVibration = notify && document.visibilityState !== "visible" ? null : [30, 34, 30];
  showFeedback(notify ? "Temps terminé." : "✓ Temps terminé.", "success", timerVibration);
  animateFeedback("#timer-done-card");
  if (notify) sendCompletionAlert();
}

async function sendCompletionAlert() {
  if ("Notification" in window && Notification.permission === "granted" && shouldSendNotification(state, "timer")) {
    await sendNotification("Temps terminé", "Ouvre Elan pour confirmer.", false, {
      kind: "timer",
      tag: "elan-timer-finished",
      vibrate: [70, 50, 70],
      data: { kind: "timer-finished" }
    });
  }
}

async function sendRewardCompletionAlert() {
  if ("Notification" in window && Notification.permission === "granted" && shouldSendNotification(state, "reward")) {
    await sendNotification("Pause terminée", "Prêt pour la suite?", false, {
      kind: "reward",
      tag: "elan-reward-finished",
      vibrate: [60, 45, 60],
      data: { kind: "reward-finished" }
    });
  }
}

function stopTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  state.activeTimer = null;
  saveState();
  $("#timer-panel").classList.add("hidden");
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#reward-timer-card").classList.add("hidden");
  $("#reward-check").classList.add("hidden");
  $("#win-summary").classList.add("hidden");
  if (simpleMode) {
    showSimpleSuggestion();
    renderToday();
    showFeedback("Timer arrêté.", "success", 18);
    return;
  }
  cancelSequence();
  saveState();
  $("#reward-title").textContent = "Arrêté.";
  $("#reward-message").textContent = "Choisis une autre action.";
  $("#next-step-panel").classList.add("hidden");
  $("#return-button").classList.remove("hidden");
  $("#reward-card").classList.remove("hidden");
  showFeedback("Arrêté.", "success", 18);
}

function notCompleted() {
  $("#timer-done-card").classList.add("hidden");
  $("#reward-check").classList.add("hidden");
  $("#win-summary").classList.add("hidden");
  if (simpleMode) {
    showSimpleSuggestion();
    renderToday();
    showFeedback("Autre action prête.", "success", 18);
    return;
  }
  cancelSequence();
  saveState();
  $("#reward-title").textContent = "Pas compté.";
  $("#reward-message").textContent = "Essaie plus court.";
  $("#next-step-panel").classList.add("hidden");
  $("#return-button").classList.remove("hidden");
  $("#reward-card").classList.remove("hidden");
  showFeedback("Noté.", "success", 18);
}

function skipMission() {
  recordSkip(state);
  saveState();
  $("#mission-card").classList.add("hidden");
  $("#win-summary").classList.add("hidden");
  $("#reward-title").textContent = "Changeons.";
  $("#reward-message").textContent = "Choisis autre chose.";
  $("#next-step-panel").classList.add("hidden");
  $("#return-button").classList.remove("hidden");
  $("#reward-card").classList.remove("hidden");
}

function continueObjective() {
  $("#reward-card").classList.add("hidden");
  if (simpleMode) {
    showSimpleSuggestion();
    renderToday();
    return;
  }
  const selection = currentSelection(state);
  $("#focus-card").classList.add("hidden");
  $("#selected-focus").textContent = selection.focus.label;
  if (selection.type.flow === "confirm") {
    currentMission = chooseChallenge(state, "light");
    showProposedMission();
  } else {
    $("#effort-card").classList.remove("hidden");
    $("#effort-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function renderDashboard() {
  const day = getDay(state);
  $("#wallet-balance").textContent = state.wallet.balance;
  $("#today-score").textContent = day.coins;
  $("#meter-fill").style.width = `${Math.min(day.coins / nearestRewardCost() * 100, 100)}%`;
  $("#daily-status").textContent = `${state.wallet.balance} jeton${state.wallet.balance === 1 ? "" : "s"} disponible${state.wallet.balance === 1 ? "" : "s"}.`;
  const hour = new Date().getHours();
  $("#greeting").textContent = hour < 12 ? "Bonjour" : hour < 18 ? "Cet après-midi" : "Ce soir";
  renderCheckin(day);
  renderToday();
}

function renderCheckin(day) {
  const timeline = day.timeline || [];
  const challenges = timeline.filter(item => item.title.startsWith("Fait:") || item.title.startsWith("Défi fait:")).length;
  const pauses = timeline.filter(item => item.title === "Pause terminée" || item.title === "Récompense terminée").length;
  $("#checkin-count").textContent = `${challenges} faite${challenges === 1 ? "" : "s"}`;
  $("#checkin-summary").textContent = challenges
    ? `${challenges} action${challenges === 1 ? "" : "s"}${pauses ? ` · ${pauses} pause${pauses === 1 ? "" : "s"}` : ""}.`
    : "Rien encore.";
  $("#checkin-list").innerHTML = timeline.length
    ? timeline.slice(0, 6).map(item => `
      <div class="checkin-item">
        <strong>${item.title}</strong>
        <span>${item.detail} · ${new Date(item.at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    `).join("")
    : "";
}

function renderDomains() {
  $("#domain-list").innerHTML = Object.values(dayTypes).map(dayType => `
    <article class="domain-card">
      <div>
        <h3>${dayType.icon} ${dayType.label}</h3>
        <p class="muted">${dayType.focuses.map(focus => focus.label).join(" · ")}</p>
      </div>
    </article>
  `).join("");
}

function renderProgress() {
  const day = getDay(state);
  $("#shop-balance").textContent = state.wallet.balance;
  $("#wallet-balance").textContent = state.wallet.balance;
  $("#stat-today").textContent = day.coins;
  $("#stat-week").textContent = coinsLastSevenDays(state);
  $("#stat-actions").textContent = Object.values(state.days).reduce((sum, item) => sum + (item.completed || 0), 0);
  const savedMinutes = state.wallet.rewardMinutes || 0;
  const usedNext = Math.min(savedMinutes, MAX_REWARD_BREAK_MINUTES);
  $("#reward-bank-minutes").textContent = `${savedMinutes} min`;
  $("#reward-bank-status").textContent = savedMinutes
    ? `Tu peux utiliser ${usedNext} min maintenant.`
    : "Achète une pause pour la garder ici.";
  $("#use-reward-time-button").disabled = savedMinutes === 0;
  $("#use-reward-time-button").textContent = savedMinutes
    ? `Utiliser ${usedNext} min`
    : "Utiliser mon temps";
  const rewardChoices = state.preferences.rewardChoices || [];
  const rewardList = $("#reward-list");
  rewardList.replaceChildren();
  if (rewardChoices.length) {
    rewardChoices.forEach((choice, index) => {
      const reward = rewardDetails(choice);
      const button = document.createElement("button");
      const name = document.createElement("span");
      const price = document.createElement("strong");
      button.className = "shop-item";
      button.dataset.buyRewardIndex = String(index);
      name.textContent = reward.label;
      price.textContent = `${reward.cost} jetons · ${reward.minutes} min`;
      button.append(name, price);
      rewardList.append(button);
    });
  } else {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Choisis tes récompenses dans les réglages.";
    rewardList.append(empty);
  }
  const unlockedSlots = state.wallet.extraObjectiveSlots || 0;
  $("#slot-status").textContent = unlockedSlots >= 2
    ? "Tous les objectifs sont ouverts."
    : `${3 + unlockedSlots} objectifs visibles par domaine.`;
  $("#buy-slot-button").classList.toggle("hidden", unlockedSlots >= 2);
  $("#activity-list").innerHTML = state.activity.length
    ? state.activity.slice(0, 8).map(event => {
      const eventCoins = Number(event.coins ?? event.points) || 0;
      const gain = eventCoins > 0 ? `+${eventCoins} jetons` : "Action terminée";
      return `<div class="activity-item"><strong>${gain} · ${event.title}</strong><span>${event.domain} - ${event.date}</span></div>`;
    }).join("")
    : "Rien encore.";
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    reportNotification("Notifications indisponibles.", true);
    return;
  }
  const permission = await Notification.requestPermission();
  state.notificationSettings.enabled = permission === "granted";
  saveState();
  renderSettings();
  reportNotification(permission === "granted" ? "Notifications activées." : "Notifications refusées.", permission !== "granted");
}

async function sendNotification(title, body, reportToUser = false, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    if (reportToUser) reportNotification("Active les notifications.", true);
    return false;
  }
  if (!reportToUser && !shouldSendNotification(state, options.kind || "reminder")) return false;
  if (reportToUser) reportNotification("Envoi...");
  try {
    const registration = await Promise.race([
      navigator.serviceWorker?.ready,
      new Promise(resolve => window.setTimeout(() => resolve(null), 4000))
    ]);
    if (!registration) {
      if (reportToUser) reportNotification("Envoi impossible.", true);
      return false;
    }
    const silent = Boolean(state.notificationSettings.silent);
    await registration.showNotification(title, {
      body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: options.tag || `elan-${Date.now()}`,
      renotify: true,
      silent,
      vibrate: silent ? [] : (options.vibrate || [70, 45, 70]),
      actions: options.actions || [],
      data: options.data || {}
    });
    if (!reportToUser && options.kind !== "timer" && options.kind !== "reward") {
      state.notificationSettings.lastSentAt = Date.now();
      saveState();
    }
    if (reportToUser) reportNotification("Notification envoyée.");
    return true;
  } catch {
    if (reportToUser) reportNotification("Affichage impossible.", true);
    return false;
  }
}

function reportNotification(message, isError = false) {
  const result = $("#notification-result");
  result.textContent = message;
  result.classList.remove("hidden");
  result.classList.toggle("error", isError);
}

function renderSettings() {
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  const labels = {
    default: "Non activées.",
    denied: "Non autorisées.",
    granted: state.notificationSettings.enabled ? "Activées." : "Autorisées, mais en pause.",
    unsupported: "Indisponibles."
  };
  const capabilityLabels = {
    default: "Active-les pour recevoir les fins de timers.",
    denied: "Dans Chrome, autorise les notifications pour Elan.",
    granted: state.notificationSettings.enabled ? "Fin d'action, pause et rappels choisis." : "Active Alertes Elan pour recevoir des rappels.",
    unsupported: "Les notifications ne sont pas disponibles ici."
  };
  const buttonLabels = {
    default: "Activer",
    denied: "Permission requise",
    granted: "Activées",
    unsupported: "Indisponible"
  };
  $("#notification-status").textContent = labels[permission];
  $("#notification-capability").textContent = capabilityLabels[permission];
  $("#notification-button").disabled = permission !== "default";
  $("#notification-button").textContent = buttonLabels[permission];
  $("#notification-test-button").disabled = permission !== "granted" || !state.notificationSettings.enabled;
  $("#notification-master").checked = state.notificationSettings.enabled;
  $("#notification-master").disabled = permission !== "granted";
  $("#notification-frequency").value = state.notificationSettings.frequency;
  $("#mental-load").value = state.notificationSettings.stress;
  $$("[data-notification-setting]").forEach(input => {
    if (input.dataset.notificationSetting !== "enabled" && input.type === "checkbox") {
      input.checked = Boolean(state.notificationSettings[input.dataset.notificationSetting]);
    }
  });
  Object.entries(state.reminders).forEach(([key, reminder]) => {
    $(`[data-reminder-toggle="${key}"]`).checked = reminder.enabled;
    $(`[data-reminder-time="${key}"]`).value = reminder.time;
  });
  $("#settings-rewards").textContent = state.preferences.rewardChoices?.length
    ? state.preferences.rewardChoices.join(" · ")
    : "Aucune choisie.";
  $("#edit-rewards-button").textContent = state.preferences.rewardChoices?.length
    ? "Modifier mes récompenses"
    : "Choisir mes récompenses";
  renderInstallStatus();
}

function renderInstallStatus() {
  const installCard = $("#install-card");
  const canInstall = Boolean(installPrompt) && !window.matchMedia("(display-mode: standalone)").matches;
  installCard.classList.toggle("hidden", !canInstall);
  $("#install-button").classList.toggle("hidden", !canInstall);
}

async function installApp() {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  renderInstallStatus();
}

function updateReminder(input) {
  const key = input.dataset.reminderToggle || input.dataset.reminderTime;
  if (input.dataset.reminderToggle) state.reminders[key].enabled = input.checked;
  if (input.dataset.reminderTime) state.reminders[key].time = input.value;
  saveState();
}

async function updateNotificationSetting(input) {
  const key = input.dataset.notificationSetting;
  state.notificationSettings[key] = input.type === "checkbox" ? input.checked : input.value;
  saveState();
  renderSettings();
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const stamp = todayKey();
  const currentTime = new Date().toTimeString().slice(0, 5);
  Object.entries(state.reminders).forEach(([key, reminder]) => {
    if (reminder.enabled && reminder.time === currentTime && reminder.lastSent !== stamp && shouldSendNotification(state, "reminder")) {
      sendNotification(reminderMessages[key].title, reminderMessages[key].body, false, { kind: "reminder" });
      reminder.lastSent = stamp;
      saveState();
    }
  });
}

function resetData() {
  if (!window.confirm("Effacer tes jetons et tes rappels?")) return;
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  state = emptyState();
  rewardDraft = [];
  sequenceDraft = [];
  cancelSequenceHomeTimeout();
  currentMission = null;
  saveState();
  $("#mission-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  renderDashboard();
  renderProgress();
  renderSettings();
}

document.addEventListener("click", event => {
  const rewardChoice = event.target.closest("[data-reward-choice]");
  if (rewardChoice) toggleRewardChoice(rewardChoice.dataset.rewardChoice, rewardChoice);
  const type = event.target.closest("[data-day-type]");
  if (type) selectDayType(type.dataset.dayType);
  const focus = event.target.closest("[data-focus]");
  if (focus) selectFocus(focus.dataset.focus);
  const nextFocus = event.target.closest("[data-next-focus]");
  if (nextFocus) {
    $("#reward-card").classList.add("hidden");
    selectFocus(nextFocus.dataset.nextFocus);
  }
  const effort = event.target.closest("[data-effort]");
  if (effort) proposeChallenge(effort.dataset.effort);
  const buyReward = event.target.closest("[data-buy-reward-index]");
  if (buyReward) buyPersonalReward(state.preferences.rewardChoices[Number(buyReward.dataset.buyRewardIndex)]);
  const workCheckin = event.target.closest("[data-work-checkin]");
  if (workCheckin) completeWorkCheckin(workCheckin.dataset.workCheckin);
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "show-view") showView(event.target.closest("[data-view]").dataset.view);
  if (action === "save-rewards") saveRewards();
  if (action === "edit-rewards") editRewards();
  if (action === "open-simple-mode") openSimpleMode();
  if (action === "another-simple-suggestion") showSimpleSuggestion();
  if (action === "start-simple-timer") startSimpleTimer();
  if (action === "exit-simple-mode") exitSimpleMode();
  if (action === "save-work-plan") saveWorkPlan();
  if (action === "edit-work-plan") editWorkPlan();
  if (action === "work-focus") setWorkMode("focus");
  if (action === "work-pause") setWorkMode("pause");
  if (action === "work-help") showWorkHelp();
  if (action === "complete-work-help") completeWorkHelp();
  if (action === "open-work-checkin") openWorkCheckin();
  if (action === "finish-work-day") finishWorkDay();
  if (action === "toggle-daily-review") {
    dailyReviewOpen = !dailyReviewOpen;
    $("#daily-review-panel").classList.toggle("hidden", !dailyReviewOpen);
    $("#daily-review-toggle").setAttribute("aria-expanded", String(dailyReviewOpen));
    $("#daily-review-label").textContent = dailyReviewOpen ? "Fermer le suivi" : "Suivi du jour";
  }
  if (action === "reveal-day-types") {
    dayTypesRevealed = true;
    $("#start-day-button").classList.add("hidden");
    $("#day-type-options").classList.remove("hidden");
  }
  if (action === "back-to-day-types") {
    const day = getDay(state);
    day.type = "";
    day.focus = "";
    dayTypesRevealed = true;
    currentMission = null;
    cancelSequence();
    saveState();
    $("#focus-card").classList.add("hidden");
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    renderToday();
  }
  if (action === "back-to-focus") {
    const day = getDay(state);
    day.focus = "";
    currentMission = null;
    cancelSequence();
    saveState();
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    renderToday();
    $("#focus-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "start-timer") startTimer();
  if (action === "start-sequence") startSequence();
  if (action === "sequence-home") returnSequenceHome();
  if (action === "sequence-reward") {
    cancelSequenceHomeTimeout();
    const day = getDay(state);
    day.type = "";
    day.focus = "";
    currentMission = null;
    dayTypesRevealed = false;
    $("#sequence-finished-card").classList.add("hidden");
    saveState();
    renderDashboard();
    showView("progress");
  }
  if (action === "finish-early") finishTimer(false);
  if (action === "stop-timer") stopTimer();
  if (action === "confirm-complete") completeMission();
  if (action === "not-completed") notCompleted();
  if (action === "buy-objective-slot") buyObjectiveSlot();
  if (action === "use-reward-time") startSavedRewardTime();
  if (action === "finish-reward") finishReward(false);
  if (action === "change-day-type") {
    const day = getDay(state);
    day.type = "";
    day.focus = "";
    dayTypesRevealed = true;
    cancelSequence();
    saveState();
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    $("#reward-card").classList.add("hidden");
    $("#objective-status").classList.add("hidden");
    renderToday();
  }
  if (action === "complete-mission") completeMission();
  if (action === "swap-mission") {
    cancelSequence();
    saveState();
    $("#mission-card").classList.add("hidden");
    $("#effort-card").classList.add("hidden");
    renderToday();
    $("#focus-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "easier-mission") proposeChallenge("rescue");
  if (action === "skip-mission") skipMission();
  if (action === "continue-objective") continueObjective();
  if (action === "return-to-objectives") {
    $("#reward-card").classList.add("hidden");
    if (simpleMode) {
      showSimpleSuggestion();
      renderToday();
      return;
    }
    renderToday();
    $("#focus-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "enable-notifications") enableNotifications();
  if (action === "test-notification") sendNotification("Elan", "Une action t'attend.", true);
  if (action === "install-app") installApp();
  if (action === "reset-data") resetData();
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-sequence-focus]")) toggleSequenceFocus(event.target);
  if (event.target.matches("[data-reminder-toggle], [data-reminder-time]")) updateReminder(event.target);
  if (event.target.matches("[data-notification-setting]")) updateNotificationSetting(event.target);
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  renderInstallStatus();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(() => navigator.serviceWorker.ready).then(() => {
    renderInstallStatus();
  }).catch(() => {});
}

renderDayTypes();
renderDomains();
renderDashboard();
renderProgress();
renderSettings();
if (state.activeTimer) runTimer();
else if (state.activeSequence) startSequenceStep();
if (state.activeRewardTimer) runRewardTimer();
setInterval(checkReminders, 30000);
