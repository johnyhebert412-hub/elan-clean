export const effortLevels = {
  rescue: { label: "Déblocage", minutes: "1 min", seconds: 60, coins: 2 },
  light: { label: "Léger", minutes: "3 min", seconds: 180, coins: 3 },
  normal: { label: "Normal", minutes: "8 min", seconds: 480, coins: 6 },
  momentum: { label: "Gros élan", minutes: "15 min", seconds: 900, coins: 10 }
};

export const dayTypes = {
  travail: {
    label: "Travail", icon: "🏭",
    focuses: [
      focus("priorite", "Priorité", "Ouvre ta priorité.", "Avance sur ta priorité. 8 minutes.", "Avance sur ta priorité. 15 minutes."),
      focus("organisation", "Organiser", "Note une action.", "Liste tes actions. 8 minutes.", "Organise demain. 15 minutes."),
      focus("transition", "Fin de travail", "Note où reprendre.", "Ferme et prépare demain. 8 minutes.", "Prépare demain. 15 minutes.")
    ]
  },
  conge: {
    label: "Congé", icon: "🏠",
    focuses: [
      focus("utile", "Chose utile", "Choisis une action.", "Avance. 8 minutes.", "Avance. 15 minutes."),
      focus("libre", "Temps libre", "Choisis une activité.", "Commence ton activité. 8 minutes.", "Profite de ton activité. 15 minutes."),
      focus("equilibre", "Équilibre", "Choisis une action utile.", "Fais une action. Puis une pause.", "Fais un bloc utile. Puis une pause.")
    ]
  },
  menage: {
    label: "Ménage", icon: "🧹",
    focuses: [
      focus("vaisselle", "Vaisselle", "Rince un objet.", "Vaisselle: 8 minutes.", "Vaisselle: 15 minutes."),
      focus("rangement", "Rangement", "Range trois objets.", "Range une zone. 8 minutes.", "Range une pièce. 15 minutes."),
      focus("linge", "Linge", "Mets trois vêtements au panier.", "Avance le linge. 8 minutes.", "Plie ou range le linge. 15 minutes."),
      focus("dechets", "Déchets", "Jette trois déchets.", "Ramasse les déchets. 8 minutes.", "Sors les déchets. 15 minutes."),
      focus("nettoyage", "Nettoyage", "Essuie une surface.", "Nettoie une zone. 8 minutes.", "Nettoie une pièce. 15 minutes.")
    ]
  },
  finances: {
    label: "Finances", icon: "💰",
    focuses: [
      focus("facture", "Facture", "Ouvre une facture.", "Traite une facture. 8 minutes.", "Traite tes factures. 15 minutes."),
      focus("budget", "Budget", "Regarde une dépense.", "Vérifie ton budget. 8 minutes.", "Mets ton budget à jour. 15 minutes."),
      focus("papier", "Papiers", "Trouve un document.", "Classe tes papiers. 8 minutes.", "Traite tes papiers. 15 minutes.")
    ]
  },
  productivite: {
    label: "Productivité", icon: "🎯",
    focuses: [
      focus("tache", "Tâche importante", "Ouvre ta tâche.", "Avance. 8 minutes.", "Avance. 15 minutes."),
      focus("administratif", "Administration", "Ouvre un document.", "Traite un dossier. 8 minutes.", "Traite tes dossiers. 15 minutes."),
      focus("organisation", "Organiser", "Choisis une priorité.", "Liste les étapes. 8 minutes.", "Prépare ton action. 15 minutes.")
    ]
  },
  proches: {
    label: "Temps couple/famille", icon: "❤️",
    focuses: [
      focus("presence", "Présence", "Pose une question.", "Sois présent. 8 minutes.", "Passe un moment ensemble. 15 minutes."),
      focus("attention", "Attention", "Choisis un geste.", "Fais un petit geste.", "Prépare un moment ensemble."),
      focus("planifier", "Planifier", "Propose une idée.", "Planifie un moment.", "Prépare une activité.")
    ]
  },
  exterieur: {
    label: "Activité / extérieur", icon: "🌲",
    focuses: [
      focus("sortir", "Sortir", "Mets tes souliers.", "Sors. 8 minutes.", "Sors. 15 minutes."),
      focus("bouger", "Bouger", "Lève-toi.", "Bouge. 8 minutes.", "Bouge. 15 minutes."),
      focus("activite", "Activité", "Choisis une activité.", "Commence. 8 minutes.", "Continue. 15 minutes.")
    ]
  },
  repos: {
    label: "Repos", icon: "🛌",
    focuses: [
      focus("recuperer", "Repos", "Assieds-toi confortablement.", "Repose-toi. 8 minutes.", "Repose-toi. 15 minutes."),
      focus("besoin", "Besoin de base", "Bois de l'eau.", "Bois ou mange.", "Prends soin de toi."),
      focus("calme", "Calme", "Expire trois fois.", "Reste au calme. 8 minutes.", "Reste au calme. 15 minutes.")
    ]
  }
};

function focus(id, label, rescue, normal, momentum) {
  return {
    id,
    label,
    challenges: {
      rescue,
      light: normal.replace(/8|10/g, "3").replace(/20|15/g, "3"),
      normal,
      momentum
    }
  };
}

export const shopPrices = { personalReward: 3, objectiveSlot: 10 };

export const reminderMessages = {
  arrival: { title: "Une action t'attend", body: "Ouvre Elan." },
  evening: { title: "Bilan du soir", body: "Voir tes actions du jour." }
};

export function todayKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function emptyState() {
  return {
    days: {},
    activity: [],
    reminders: { arrival: { enabled: false, time: "18:00", lastSent: null }, evening: { enabled: false, time: "21:00", lastSent: null } },
    preferences: { rewardsConfigured: false, rewardChoices: [] },
    wallet: { balance: 0, totalEarned: 0, extraObjectiveSlots: 0, purchases: [] },
    activeTimer: null,
    activeRewardTimer: null
  };
}

export function getDay(state, key = todayKey()) {
  if (!state.days[key]) state.days[key] = { coins: 0, completed: 0, skips: 0, type: "", focus: "", timeline: [] };
  if (state.days[key].coins == null) state.days[key].coins = state.days[key].score || 0;
  if (!state.days[key].timeline) state.days[key].timeline = [];
  return state.days[key];
}

export function chooseDayType(state, type) {
  const day = getDay(state);
  day.type = type;
  day.focus = "";
  return day;
}

export function chooseFocus(state, selectedFocus) {
  const day = getDay(state);
  day.focus = selectedFocus;
  return day;
}

export function currentSelection(state) {
  const day = getDay(state);
  const type = dayTypes[day.type];
  const selectedFocus = type?.focuses.find(item => item.id === day.focus);
  return { day, type, focus: selectedFocus };
}

export function chooseChallenge(state, effort = "normal") {
  const { type, focus: selectedFocus } = currentSelection(state);
  if (!type || !selectedFocus || !effortLevels[effort]) return null;
  const level = effortLevels[effort];
  return { title: level.label, detail: selectedFocus.challenges[effort], minutes: level.minutes, seconds: level.seconds, coins: level.coins, effort, type: type.label, focus: selectedFocus.label };
}

export function addCoins(state, coins, event) {
  const day = getDay(state);
  if (!state.wallet) state.wallet = { balance: 0, totalEarned: 0, extraObjectiveSlots: 0, purchases: [] };
  day.coins += coins;
  state.wallet.balance += coins;
  state.wallet.totalEarned += coins;
  if (event.kind === "completed") day.completed += 1;
  state.activity.unshift({ ...event, coins, date: todayKey(), at: Date.now() });
  state.activity = state.activity.slice(0, 40);
  return state.wallet.balance;
}

export function spendCoins(state, cost, label) {
  if (!state.wallet || state.wallet.balance < cost) return false;
  state.wallet.balance -= cost;
  state.wallet.purchases.unshift({ label, cost, at: Date.now() });
  return true;
}

export function buyObjectiveSlot(state) {
  if (!state.wallet || state.wallet.extraObjectiveSlots >= 2) return false;
  if (!spendCoins(state, shopPrices.objectiveSlot, "+1 objectif")) return false;
  state.wallet.extraObjectiveSlots += 1;
  return true;
}

export function recordSkip(state) { getDay(state).skips += 1; }

export function coinsLastSevenDays(state, now = new Date()) {
  let total = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const day = state.days[todayKey(date)];
    total += day?.coins ?? day?.score ?? 0;
  }
  return total;
}
