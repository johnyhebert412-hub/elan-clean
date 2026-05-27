import test from "node:test";
import assert from "node:assert/strict";
import {
  dayTypes,
  emptyState,
  getDay,
  chooseDayType,
  chooseFocus,
  chooseChallenge,
  rewardCoins,
  rewardDetails,
  safeRewardLabel,
  MAX_REWARD_MINUTES,
  MAX_REWARD_BREAK_MINUTES,
  addCoins,
  addRewardTime,
  useRewardTime,
  shouldSendNotification,
  coinsLastSevenDays,
  spendCoins,
  buyObjectiveSlot
} from "./logic.js";

test("the opening screen contains useful daily domains including health", () => {
  assert.deepEqual(Object.keys(dayTypes), [
    "travail", "conge", "menage", "finances", "productivite", "proches", "exterieur", "repos", "sante"
  ]);
});

test("work uses its own shift flow instead of a generic timer", () => {
  assert.equal(dayTypes.travail.flow, "work");
  assert.equal(dayTypes.menage.flow, "timer");
  assert.equal(dayTypes.finances.flow, "confirm");
  assert.equal(dayTypes.sante.flow, "confirm");
});

test("a new user starts without imposed reward preferences", () => {
  const state = emptyState();
  assert.equal(state.preferences.rewardsConfigured, false);
  assert.deepEqual(state.preferences.rewardChoices, []);
  assert.equal(state.activeSequence, null);
});

test("normal dishes challenge is a useful session, not one object", () => {
  const state = emptyState();
  chooseDayType(state, "menage");
  chooseFocus(state, "vaisselle");
  const challenge = chooseChallenge(state, "normal");
  assert.equal(challenge.minutes, "8 min");
  assert.equal(challenge.seconds, 480);
  assert.match(challenge.detail, /8 minutes|section/);
});

test("rescue challenge remains available for a blocked moment", () => {
  const state = emptyState();
  chooseDayType(state, "menage");
  chooseFocus(state, "vaisselle");
  const challenge = chooseChallenge(state, "rescue");
  assert.equal(challenge.minutes, "1 min");
  assert.equal(challenge.seconds, 60);
  assert.equal(challenge.coins, 5);
  assert.match(challenge.detail, /un objet/);
});

test("finance objectives lead to a concrete money action", () => {
  const state = emptyState();
  chooseDayType(state, "finances");
  chooseFocus(state, "facture");
  assert.match(chooseChallenge(state, "normal").detail, /Paie une facture|programme son paiement/);
  chooseFocus(state, "depense");
  assert.match(chooseChallenge(state, "light").detail, /dépense|montant/i);
  chooseFocus(state, "epargne");
  assert.match(chooseChallenge(state, "normal").detail, /Annule un abonnement|montant de côté/);
});

test("relationship and recovery objectives describe real small actions", () => {
  const state = emptyState();
  chooseDayType(state, "proches");
  chooseFocus(state, "message");
  assert.match(chooseChallenge(state, "light").detail, /message gentil/);
  chooseDayType(state, "repos");
  chooseFocus(state, "rideaux");
  assert.match(chooseChallenge(state, "rescue").detail, /rideau|lumière/);
});

test("health offers concrete care actions", () => {
  const state = emptyState();
  chooseDayType(state, "sante");
  chooseFocus(state, "hydratation");
  assert.match(chooseChallenge(state, "light").detail, /verre|bois/i);
  chooseFocus(state, "medicaments");
  assert.match(chooseChallenge(state, "normal").detail, /prévu|rappel/i);
});

test("notifications respect work focus and urgency-only mode", () => {
  const state = emptyState();
  state.notificationSettings.enabled = true;
  assert.equal(shouldSendNotification(state, "reminder", new Date("2026-05-26T12:00:00")), true);
  state.workPlan = { ...state.workPlan, active: true, mode: "focus" };
  assert.equal(shouldSendNotification(state, "reminder", new Date("2026-05-26T12:00:00")), false);
  assert.equal(shouldSendNotification(state, "urgent", new Date("2026-05-26T12:00:00")), true);
  state.workPlan.active = false;
  state.notificationSettings.urgentOnly = true;
  assert.equal(shouldSendNotification(state, "timer", new Date("2026-05-26T12:00:00")), false);
  state.notificationSettings.urgentOnly = false;
  state.notificationSettings.stress = "high";
  assert.equal(shouldSendNotification(state, "reminder", new Date("2026-05-26T12:00:00")), false);
  assert.equal(shouldSendNotification(state, "urgent", new Date("2026-05-26T12:00:00")), true);
});

test("a completed normal challenge earns spendable coins", () => {
  const state = emptyState();
  addCoins(state, 6, { kind: "completed", title: "Vaisselle", domain: "Ménage" });
  assert.equal(getDay(state).coins, 6);
  assert.equal(state.wallet.balance, 6);
  assert.deepEqual(getDay(state).timeline, []);
});

test("a completed action never rewards zero coins", () => {
  const state = emptyState();
  assert.equal(rewardCoins(0), 5);
  addCoins(state, 0, { kind: "completed", title: "Ancienne action", domain: "Maison" });
  assert.equal(getDay(state).coins, 5);
  assert.equal(state.wallet.balance, 5);
  assert.equal(state.activity[0].coins, 5);
});

test("reward preferences exist separately from day choices", () => {
  const state = emptyState();
  state.preferences.rewardChoices = ["Gaming"];
  state.preferences.rewardsConfigured = true;
  assert.deepEqual(state.preferences.rewardChoices, ["Gaming"]);
  assert.equal(state.activeRewardTimer, null);
});

test("shop rewards have clear costs and meaningful durations", () => {
  assert.deepEqual(rewardDetails("Pause calme"), { label: "Pause calme", cost: 20, minutes: 10 });
  assert.deepEqual(rewardDetails("Marche"), { label: "Marche", cost: 25, minutes: 15 });
  assert.deepEqual(rewardDetails("Podcast"), { label: "Podcast", cost: 35, minutes: 20 });
  assert.deepEqual(rewardDetails("Gaming modéré"), { label: "Gaming modéré", cost: 50, minutes: 30 });
  assert.deepEqual(rewardDetails("Ma récompense"), { label: "Ma récompense", cost: 20, minutes: 10 });
});

test("older or risky reward labels are replaced with calmer choices", () => {
  assert.equal(safeRewardLabel("Gaming"), "Gaming modéré");
  assert.equal(safeRewardLabel("Petit achat plaisir"), "Café ou boisson");
  assert.equal(safeRewardLabel("Achat impulsif"), "Pause calme");
});

test("reward time accumulates with a healthy storage limit", () => {
  const state = emptyState();
  assert.equal(addRewardTime(state, 20, "Podcast"), 20);
  assert.equal(addRewardTime(state, 50, "Gaming modéré"), 40);
  assert.equal(state.wallet.rewardMinutes, MAX_REWARD_MINUTES);
});

test("saved reward time is used in balanced breaks", () => {
  const state = emptyState();
  state.wallet.rewardMinutes = 45;
  assert.equal(useRewardTime(state), MAX_REWARD_BREAK_MINUTES);
  assert.equal(state.wallet.rewardMinutes, 15);
  assert.equal(useRewardTime(state), 15);
  assert.equal(state.wallet.rewardMinutes, 0);
});

test("weekly coins add only the last seven days and accept legacy scores", () => {
  const state = emptyState();
  state.days["2026-05-25"] = { coins: 6, completed: 1 };
  state.days["2026-05-20"] = { score: 2, completed: 1 };
  state.days["2026-05-01"] = { score: 50, completed: 4 };
  assert.equal(coinsLastSevenDays(state, new Date("2026-05-25T12:00:00")), 8);
});

test("a personal reward spends the single coin balance", () => {
  const state = emptyState();
  state.wallet.balance = 3;
  assert.equal(spendCoins(state, 3, "Gaming"), true);
  assert.equal(state.wallet.balance, 0);
  assert.equal(spendCoins(state, 3, "Gaming"), false);
});

test("objective slots are bought with coins and capped", () => {
  const state = emptyState();
  state.wallet.balance = 30;
  assert.equal(buyObjectiveSlot(state), true);
  assert.equal(buyObjectiveSlot(state), true);
  assert.equal(buyObjectiveSlot(state), false);
  assert.equal(state.wallet.extraObjectiveSlots, 2);
  assert.equal(state.wallet.balance, 10);
});
