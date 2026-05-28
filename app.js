import {
  dayTypes,
  shopPrices,
  reminderMessages,
  todayKey,
  emptyState,
  getDay,
  chooseDayType,
  chooseFocus,
  currentSelection,
  chooseChallenge,
  addCoins,
  spendCoins,
  buyObjectiveSlot as purchaseObjectiveSlot,
  recordSkip,
  coinsLastSevenDays
} from "./logic.js";

const STORAGE_KEY = "elan-pilote-v1";
const DEVELOPER_MODE = new URLSearchParams(window.location.search).has("dev");
let state = loadState();
let currentMission = null;
let workerStatus = "initialisation";
let installPrompt = null;
let rewardDraft = [];
let timerInterval = null;
let rewardTimerInterval = null;
let dayTypesRevealed = false;
let dailyReviewOpen = false;
let simpleMode = false;
let simpleSuggestionIndex = -1;
let feedbackTimeout = null;

const simpleSuggestions = [
  { type: "repos", focus: "besoin", text: "Bois quelques gorgées d'eau.", seconds: 60, minutes: "1 min" },
  { type: "repos", focus: "calme", text: "Pose tes pieds au sol. Expire lentement 3 fois.", seconds: 60, minutes: "1 min" },
  { type: "menage", focus: "rangement", text: "Range un seul objet.", seconds: 60, minutes: "1 min" },
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
    return {
      ...defaults,
      ...stored,
      reminders: { ...defaults.reminders, ...stored.reminders },
      preferences: { ...defaults.preferences, ...stored.preferences },
      wallet: stored.wallet
        ? { ...defaults.wallet, ...stored.wallet }
        : { ...defaults.wallet, balance: migratedBalance, totalEarned: migratedBalance },
      activeTimer: stored.activeTimer
        ? {
            ...stored.activeTimer,
            mission: {
              ...stored.activeTimer.mission,
              coins: stored.activeTimer.mission.coins ?? stored.activeTimer.mission.points ?? 0
            }
          }
        : null,
      activeRewardTimer: stored.activeRewardTimer || null
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
  $("#reward-setup-card").classList.toggle("hidden", configured);
  if (!configured) {
    rewardDraft = [...(state.preferences.rewardChoices || [])];
    $$("#reward-choice-list [data-reward-choice]").forEach(button => {
      button.classList.toggle("selected", rewardDraft.includes(button.dataset.rewardChoice));
    });
  }
  return configured;
}

function toggleRewardChoice(value, button) {
  if (rewardDraft.includes(value)) rewardDraft = rewardDraft.filter(choice => choice !== value);
  else rewardDraft.push(value);
  button.classList.toggle("selected", rewardDraft.includes(value));
  $("#reward-setup-error").classList.add("hidden");
}

function saveRewards() {
  const custom = $("#custom-reward").value.trim();
  const choices = [...rewardDraft];
  if (custom && !choices.includes(custom)) choices.push(custom);
  if (!choices.length) {
    $("#reward-setup-error").classList.remove("hidden");
    return;
  }
  state.preferences.rewardChoices = choices.slice(0, 4);
  state.preferences.rewardsConfigured = true;
  saveState();
  renderDashboard();
  renderProgress();
  renderSettings();
}

function editRewards() {
  state.preferences.rewardsConfigured = false;
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
  const processVisible = ["#effort-card", "#mission-card", "#timer-done-card", "#simple-done-card", "#reward-card", "#reward-timer-card"]
    .some(selector => !$(selector).classList.contains("hidden"));
  if (simpleMode) {
    $(".app-shell").classList.add("emergency-active");
    $("#simple-mode-entry").classList.add("hidden");
    $("#reward-setup-card").classList.add("hidden");
    $("#day-type-card").classList.add("hidden");
    $("#focus-card").classList.add("hidden");
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
  $("#focus-card").classList.toggle("hidden", !rewardsReady || !hasType || processVisible);
  $("#daily-review-toggle").classList.toggle("hidden", !rewardsReady);
  $("#daily-review-panel").classList.toggle("hidden", !rewardsReady || !dailyReviewOpen);
  $("#daily-review-toggle").setAttribute("aria-expanded", String(dailyReviewOpen));
  $("#daily-review-label").textContent = dailyReviewOpen ? "Fermer le suivi" : "Suivi du jour";
  if (!rewardsReady) {
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
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
    $("#focus-list").innerHTML = visibleFocuses.map(focus => `
      <button class="focus-button" data-focus="${focus.id}">${focus.label}</button>
    `).join("");
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
  closeDailyReview();
  dayTypesRevealed = false;
  currentMission = null;
  $("#mission-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#timer-done-card").classList.add("hidden");
  $("#objective-status").classList.add("hidden");
  saveState();
  renderToday();
}

function selectFocus(focus) {
  chooseFocus(state, focus);
  closeDailyReview();
  saveState();
  $("#selected-focus").textContent = currentSelection(state).focus.label;
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.remove("hidden");
  $("#mission-card").classList.add("hidden");
  $("#objective-status").classList.add("hidden");
  $("#effort-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function showProposedMission() {
  if (!currentMission) return;
  closeDailyReview();
  const selection = currentSelection(state);
  $("#focus-card").classList.add("hidden");
  $("#effort-card").classList.add("hidden");
  $("#reward-card").classList.add("hidden");
  $("#mission-domain").textContent = currentMission.type;
  $("#mission-time").textContent = currentMission.minutes;
  $("#mission-goal").textContent = selection.focus.label;
  $("#mission-title").textContent = currentMission.title;
  $("#mission-detail").textContent = currentMission.detail;
  $("#mission-points").textContent = `+${currentMission.coins} jetons si terminé.`;
  $("#timer-step-label").textContent = simpleMode ? "Mini timer" : "En cours";
  $("#timer-help").textContent = simpleMode ? "Respire. Fais juste ça." : "Continue jusqu'à la sonnerie.";
  $("#stop-timer-label").textContent = "Arrêter";
  $("#timer-done-label").textContent = "Terminé";
  $("#timer-done-title").textContent = "Action faite?";
  $("#before-start-actions").classList.remove("hidden");
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

function showWinSummary(coins, balance) {
  const price = shopPrices.personalReward;
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
  const balance = addCoins(state, currentMission.coins, {
    kind: "completed",
    title: currentMission.focus,
    domain: currentMission.type
  });
  logDayEvent(`Fait: ${currentMission.focus}`, `${currentMission.type} · ${currentMission.minutes} · +${currentMission.coins} jetons`);
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
    showFeedback("✓ C'est fait.", "success", 24);
    animateFeedback("#simple-done-card");
    return;
  }
  $("#reward-title").textContent = getDay(state).completed === 1 ? "Premier pas fait." : "Bien joué.";
  $("#reward-message").textContent = "Jetons ajoutés.";
  showWinSummary(currentMission.coins, balance);
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
  showFeedback(`✓ +${currentMission.coins} jetons`, "success", [28, 36, 45]);
  animateFeedback("#reward-card");
  animateFeedback(".tracking-score");
}

function buyPersonalReward(label) {
  if (!spendCoins(state, shopPrices.personalReward, label)) {
    showFeedback("Pas assez de jetons.", "success", 18);
    return;
  }
  state.activeRewardTimer = {
    endsAt: Date.now() + 5 * 60 * 1000,
    title: label
  };
  logDayEvent("Achat", `${label} · -${shopPrices.personalReward} jetons`);
  saveState();
  showView("today");
  $("#reward-card").classList.add("hidden");
  runRewardTimer();
  renderDashboard();
  renderProgress();
  showFeedback(`Acheté: ${label}`, "reward-feedback", 28);
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
  showView("progress");
  renderProgress();
  if (notify && document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
    sendNotification("Pause terminée", "Ouvre Elan.");
  }
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
  showFeedback(notify ? "Terminé. Confirme." : "✓ Terminé. Confirme.", "success", timerVibration);
  animateFeedback("#timer-done-card");
  if (notify) sendCompletionAlert();
}

async function sendCompletionAlert() {
  if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
    await sendNotification("Terminé", "Ouvre Elan pour confirmer.");
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
  $("#focus-card").classList.add("hidden");
  $("#selected-focus").textContent = currentSelection(state).focus.label;
  $("#effort-card").classList.remove("hidden");
  $("#effort-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderDashboard() {
  const day = getDay(state);
  $("#wallet-balance").textContent = state.wallet.balance;
  $("#today-score").textContent = day.coins;
  $("#meter-fill").style.width = `${Math.min(day.coins / shopPrices.personalReward * 100, 100)}%`;
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
  const rewardChoices = state.preferences.rewardChoices || [];
  const rewardList = $("#reward-list");
  rewardList.replaceChildren();
  if (rewardChoices.length) {
    rewardChoices.forEach((choice, index) => {
      const button = document.createElement("button");
      const name = document.createElement("span");
      const price = document.createElement("strong");
      button.className = "shop-item";
      button.dataset.buyRewardIndex = String(index);
      name.textContent = choice;
      price.textContent = `${shopPrices.personalReward} jetons`;
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
    ? state.activity.slice(0, 8).map(event => `
      <div class="activity-item"><strong>+${event.coins ?? event.points ?? 0} jetons · ${event.title}</strong><span>${event.domain} - ${event.date}</span></div>
    `).join("")
    : "Rien encore.";
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    reportNotification("Notifications indisponibles.", true);
    return;
  }
  const permission = await Notification.requestPermission();
  renderSettings();
  reportNotification(permission === "granted" ? "Notifications activées." : "Notifications refusées.", permission !== "granted");
}

async function sendNotification(title, body, reportToUser = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    if (reportToUser) reportNotification("Active les notifications.", true);
    return false;
  }
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
    await registration.showNotification(title, {
      body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: `elan-${Date.now()}`,
      renotify: true,
      vibrate: [120, 80, 120]
    });
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
  const labels = { default: "Inactives.", denied: "Bloquées.", granted: "Actives.", unsupported: "Indisponibles." };
  $("#notification-status").textContent = labels[permission];
  $("#notification-button").disabled = permission === "granted" || permission === "unsupported";
  $("#notification-button").textContent = permission === "granted" ? "Activées" : "Activer";
  Object.entries(state.reminders).forEach(([key, reminder]) => {
    $(`[data-reminder-toggle="${key}"]`).checked = reminder.enabled;
    $(`[data-reminder-time="${key}"]`).value = reminder.time;
  });
  $("#settings-rewards").textContent = state.preferences.rewardChoices?.length
    ? state.preferences.rewardChoices.join(" · ")
    : "Aucune choisie.";
  renderInstallStatus();
}

async function renderInstallStatus() {
  const developerDetails = $("#developer-details");
  developerDetails.classList.toggle("hidden", !DEVELOPER_MODE);
  if (DEVELOPER_MODE) {
    developerDetails.textContent = `Build 31 | contexte sécurisé: ${window.isSecureContext ? "oui" : "non"} | module: ${navigator.serviceWorker?.controller ? "actif" : workerStatus}`;
  }
  if (window.matchMedia("(display-mode: standalone)").matches) {
    $("#install-status").textContent = "Elan est installé.";
    $("#install-button").classList.add("hidden");
    return;
  }
  $("#install-status").textContent = installPrompt ? "Prêt à installer." : "Raccourci Android disponible.";
  $("#install-button").classList.toggle("hidden", !installPrompt);
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

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const stamp = todayKey();
  const currentTime = new Date().toTimeString().slice(0, 5);
  Object.entries(state.reminders).forEach(([key, reminder]) => {
    if (reminder.enabled && reminder.time === currentTime && reminder.lastSent !== stamp) {
      sendNotification(reminderMessages[key].title, reminderMessages[key].body);
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
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "show-view") showView(event.target.closest("[data-view]").dataset.view);
  if (action === "save-rewards") saveRewards();
  if (action === "edit-rewards") editRewards();
  if (action === "open-simple-mode") openSimpleMode();
  if (action === "another-simple-suggestion") showSimpleSuggestion();
  if (action === "start-simple-timer") startSimpleTimer();
  if (action === "exit-simple-mode") exitSimpleMode();
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
    saveState();
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    $("#focus-card").classList.remove("hidden");
    $("#focus-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "start-timer") startTimer();
  if (action === "finish-early") finishTimer(false);
  if (action === "stop-timer") stopTimer();
  if (action === "confirm-complete") completeMission();
  if (action === "not-completed") notCompleted();
  if (action === "buy-objective-slot") buyObjectiveSlot();
  if (action === "finish-reward") finishReward(false);
  if (action === "change-day-type") {
    const day = getDay(state);
    day.type = "";
    day.focus = "";
    dayTypesRevealed = true;
    saveState();
    $("#effort-card").classList.add("hidden");
    $("#mission-card").classList.add("hidden");
    $("#reward-card").classList.add("hidden");
    $("#objective-status").classList.add("hidden");
    renderToday();
  }
  if (action === "complete-mission") completeMission();
  if (action === "swap-mission") {
    $("#mission-card").classList.add("hidden");
    $("#effort-card").classList.add("hidden");
    $("#focus-card").classList.remove("hidden");
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
    $("#focus-card").classList.remove("hidden");
    $("#focus-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "enable-notifications") enableNotifications();
  if (action === "test-notification") sendNotification("Elan", "Une action t'attend.", true);
  if (action === "install-app") installApp();
  if (action === "check-installation") renderInstallStatus();
  if (action === "reset-data") resetData();
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-reminder-toggle], [data-reminder-time]")) updateReminder(event.target);
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  renderInstallStatus();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(registration => {
    workerStatus = registration.active ? "actif" : "installation en cours";
    return navigator.serviceWorker.ready;
  }).then(() => {
    workerStatus = "actif";
    renderInstallStatus();
  }).catch(() => {
    workerStatus = "échec";
  });
}

renderDayTypes();
renderDomains();
renderDashboard();
renderProgress();
renderSettings();
if (state.activeTimer) runTimer();
if (state.activeRewardTimer) runRewardTimer();
setInterval(checkReminders, 30000);
