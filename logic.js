export const effortLevels = {
  rescue: { label: "Déblocage", minutes: "1 min", seconds: 60, coins: 2 },
  light: { label: "Léger", minutes: "3 min", seconds: 180, coins: 3 },
  normal: { label: "Normal", minutes: "8 min", seconds: 480, coins: 6 },
  momentum: { label: "Gros élan", minutes: "15 min", seconds: 900, coins: 10 }
};
export const MIN_SUCCESS_COINS = 5;

export function rewardCoins(coins) {
  return Math.max(MIN_SUCCESS_COINS, Number(coins) || 0);
}

export const dayTypes = {
  travail: {
    label: "Travail", icon: "🏭", flow: "work",
    focuses: [
      focus("priorite", "Commencer la priorité", "Ouvre le fichier ou le message lié à ta priorité.", "Écris la première phrase ou fais la première petite action.", "Travaille 8 minutes sur ta priorité ouverte.", "Termine une étape claire de ta priorité pendant 15 minutes."),
      focus("organisation", "Choisir les 3 prochaines actions", "Écris la prochaine action sur une note.", "Liste trois actions concrètes à faire.", "Choisis tes 3 prochaines actions et commence la première.", "Trie tes tâches et prépare les trois prochaines étapes."),
      focus("transition", "Fermer la journée de travail", "Note où reprendre demain.", "Range un document et note la suite.", "Note la prochaine étape et ferme ce qui est terminé.", "Range ton espace de travail et prépare le premier départ de demain.")
    ]
  },
  conge: {
    label: "Congé", icon: "🏠", flow: "timer",
    focuses: [
      focus("utile", "Faire une tâche qui traîne", "Choisis une tâche visible et prends le matériel.", "Fais la première étape d'une tâche qui traîne.", "Fais avancer une tâche maison pendant 8 minutes.", "Termine une petite tâche ou une étape complète."),
      focus("libre", "Préparer un moment plaisant", "Sors ce qu'il faut pour une activité agréable.", "Commence une activité choisie sans téléphone.", "Profite d'une activité calme pendant 8 minutes.", "Fais une activité qui te recharge pendant 15 minutes."),
      focus("equilibre", "Préparer demain", "Mets un objet nécessaire près de la porte.", "Prépare vêtements, sac ou lunch.", "Prépare ce qu'il faut pour demain matin.", "Prépare demain et range un petit point de friction.")
    ]
  },
  menage: {
    label: "Maison", icon: "🧹", flow: "timer",
    focuses: [
      focus("vaisselle", "Faire la vaisselle", "Rince ou lave un objet.", "Lave cinq objets ou vide une partie de l'égouttoir.", "Lave la vaisselle pendant 8 minutes ou termine une section.", "Vide l'évier ou avance la vaisselle pendant 15 minutes."),
      focus("rangement", "Ramasser les objets", "Range trois objets visibles.", "Range tout ce qui traîne sur une petite surface.", "Dégage une zone utile: table, divan ou entrée.", "Remets en place les objets d'une pièce pendant 15 minutes."),
      focus("linge", "Avancer le linge", "Mets les vêtements sales au panier.", "Démarre une brassée ou plie cinq morceaux.", "Démarre, transfère ou plie une étape de linge.", "Plie et range une brassée ou avance deux étapes."),
      focus("dechets", "Vider une poubelle", "Jette trois déchets visibles.", "Vide une petite poubelle.", "Ramasse les déchets et sors un sac si nécessaire.", "Fais le tour des poubelles et porte les sacs à la sortie."),
      focus("nettoyage", "Nettoyer un comptoir", "Essuie une tache ou un coin du comptoir.", "Nettoie une surface utilisée.", "Nettoie le comptoir ou la table jusqu'à pouvoir l'utiliser.", "Nettoie les surfaces d'une zone pendant 15 minutes.")
    ]
  },
  finances: {
    label: "Finances", icon: "💰", flow: "confirm",
    focuses: [
      focus("solde", "Vérifier mon solde", "Ouvre ton application bancaire.", "Ouvre ton compte et regarde le solde disponible.", "Vérifie ton solde et les trois dernières transactions.", "Vérifie les transactions récentes et note une action nécessaire."),
      focus("depense", "Noter une dépense", "Note un achat récent.", "Ajoute une dépense récente avec son montant.", "Note tes dépenses du jour et vérifie le total.", "Note les dépenses récentes puis repère celle à ajuster."),
      focus("facture", "Payer une facture", "Ouvre une facture à payer.", "Vérifie le montant et la date limite d'une facture.", "Paie une facture ou programme son paiement.", "Paie les factures prêtes et confirme qu'elles sont réglées."),
      focus("epargne", "Réduire une dépense", "Ouvre la liste de tes paiements récurrents.", "Repère un abonnement ou une dépense à revoir.", "Annule un abonnement inutile ou mets un petit montant de côté.", "Vérifie tes abonnements et effectue une action d'économie concrète.")
    ]
  },
  productivite: {
    label: "Productivité", icon: "🎯", flow: "timer",
    focuses: [
      focus("tache", "Commencer une tâche précise", "Ouvre la tâche et écris la première étape.", "Fais la première étape concrète.", "Travaille sur une seule tâche pendant 8 minutes.", "Termine une étape mesurable de cette tâche."),
      focus("administratif", "Traiter une démarche", "Ouvre le courriel ou formulaire concerné.", "Réponds à un courriel ou remplis un premier champ.", "Termine une petite démarche administrative.", "Traite un formulaire, rendez-vous ou courriel jusqu'à l'étape suivante."),
      focus("organisation", "Dégager mon prochain pas", "Écris ce que tu dois faire ensuite.", "Découpe un projet en trois étapes.", "Choisis une étape et prépare tout pour la commencer.", "Découpe le projet puis termine sa première étape.")
    ]
  },
  proches: {
    label: "Temps couple/famille", icon: "❤️", flow: "confirm",
    focuses: [
      focus("message", "Envoyer un message gentil", "Envoie un cœur ou un merci sincère.", "Écris un message gentil à une personne importante.", "Écris ou appelle pour prendre des nouvelles.", "Prends un vrai moment pour échanger sans distraction."),
      focus("attention", "Faire un geste d'affection", "Offre un câlin ou dis quelque chose de doux.", "Apporte une attention simple: eau, café ou câlin.", "Fais un petit geste concret qui aide ou réconforte.", "Partage un moment calme ou rends un service apprécié."),
      focus("ecouter", "Demander comment ça va", "Demande: Comment ça va aujourd'hui?", "Pose la question et écoute la réponse.", "Discute 8 minutes en écoutant sans téléphone.", "Passe 15 minutes de présence réelle ensemble.")
    ]
  },
  exterieur: {
    label: "Activité / extérieur", icon: "🌲", flow: "timer",
    focuses: [
      focus("sortir", "Prendre l'air", "Mets tes souliers et ouvre la porte.", "Sors respirer trois minutes.", "Marche dehors pendant 8 minutes.", "Fais une marche calme de 15 minutes."),
      focus("bouger", "Marcher un peu", "Marche dans la maison pendant une minute.", "Marche ou étire-toi pendant trois minutes.", "Marche d'un pas confortable pendant 8 minutes.", "Bouge tranquillement pendant 15 minutes."),
      focus("activite", "Faire une activité dehors", "Prépare ce qu'il faut pour sortir.", "Va sur le balcon, dans la cour ou près d'une fenêtre.", "Fais une petite activité extérieure réalisable maintenant.", "Profite d'une activité dehors pendant 15 minutes.")
    ]
  },
  repos: {
    label: "Repos", icon: "🛌", flow: "confirm",
    focuses: [
      focus("rideaux", "Ouvrir les rideaux", "Ouvre un rideau ou allume une lumière douce.", "Ouvre les rideaux et bois quelques gorgées d'eau.", "Mets de la lumière, aère un peu et assieds-toi.", "Rends l'espace plus calme et lumineux pour récupérer."),
      focus("besoin", "Boire ou manger", "Bois quelques gorgées d'eau.", "Prends de l'eau ou une collation simple.", "Prépare et prends une boisson ou une collation.", "Prends le temps de manger ou boire tranquillement."),
      focus("calme", "Revenir au calme", "Expire lentement trois fois.", "Pose tes pieds au sol et respire trois minutes.", "Assieds-toi au calme sans écran pendant 8 minutes.", "Fais une pause calme de récupération pendant 15 minutes.")
    ]
  },
  sante: {
    label: "Santé", icon: "💧", flow: "confirm",
    focuses: [
      focus("hydratation", "Boire de l'eau", "Bois quelques gorgées d'eau.", "Remplis un verre et bois-le.", "Bois de l'eau puis garde une bouteille à portée.", "Prépare de l'eau pour le reste de la journée."),
      focus("medicaments", "Vérifier mes médicaments", "Regarde si ta prise prévue est faite.", "Vérifie ta prise prévue aujourd'hui.", "Prends uniquement ce qui est prévu ou programme ton rappel.", "Révise tes prises prévues et prépare ton prochain rappel."),
      focus("sommeil", "Préparer mon sommeil", "Baisse une lumière.", "Prépare un détail qui aidera ton coucher.", "Mets en place une routine courte pour dormir.", "Prépare un coucher plus calme sans te surcharger."),
      focus("energie", "Noter mon énergie", "Choisis: basse, moyenne ou bonne.", "Note ton énergie et un besoin immédiat.", "Note ton énergie et choisis une action adaptée.", "Observe ton énergie et ajuste doucement ta journée.")
    ]
  }
};

function focus(id, label, rescue, light, normal, momentum) {
  return {
    id,
    label,
    challenges: {
      rescue,
      light,
      normal,
      momentum
    }
  };
}

const rewardCatalog = {
  "Pause calme": { cost: 20, minutes: 10 },
  "Musique": { cost: 20, minutes: 10 },
  "Café ou boisson": { cost: 20, minutes: 10 },
  "Marche": { cost: 25, minutes: 15 },
  "Podcast": { cost: 35, minutes: 20 },
  "Détente": { cost: 35, minutes: 20 },
  "Récupération": { cost: 20, minutes: 10 },
  "Gaming modéré": { cost: 50, minutes: 30 }
};

export const shopPrices = { personalReward: 20, objectiveSlot: 10 };
export const MAX_REWARD_MINUTES = 60;
export const MAX_REWARD_BREAK_MINUTES = 30;

export function rewardDetails(label) {
  return { label, ...(rewardCatalog[label] || { cost: shopPrices.personalReward, minutes: 10 }) };
}

export function safeRewardLabel(label) {
  const replacements = {
    "Téléphone": "Pause calme",
    "YouTube": "Podcast",
    "Netflix": "Détente",
    "Gaming": "Gaming modéré",
    "Série ou vidéo": "Podcast",
    "Petit achat plaisir": "Café ou boisson",
    "Sortie ou activité": "Marche",
    "Boisson ou collation": "Café ou boisson",
    "Temps tranquille": "Pause calme"
  };
  if (replacements[label]) return replacements[label];
  if (/(achat|casino|pari|condui|voiture|rush|alcool|drog)/i.test(label)) return "Pause calme";
  return label;
}

export const reminderMessages = {
  arrival: { title: "Rappel", body: "Commence une action dans Elan." },
  evening: { title: "Fin de journée", body: "Voir mon bilan." }
};

export const notificationDefaults = {
  enabled: false,
  frequency: "balanced",
  stress: "normal",
  silent: false,
  protectWork: true,
  urgentOnly: false,
  lastSentAt: 0
};

function inTimeWindow(time, start, end) {
  if (!start || !end || start === end) return false;
  if (start < end) return time >= start && time < end;
  return time >= start || time < end;
}

export function shouldSendNotification(state, kind, now = new Date()) {
  const settings = { ...notificationDefaults, ...state.notificationSettings };
  if (!settings.enabled) return false;
  if (settings.urgentOnly && kind !== "urgent") return false;
  if (settings.stress === "high" && kind !== "urgent" && kind !== "timer" && kind !== "reward") return false;
  const currentTime = now.toTimeString().slice(0, 5);
  const work = state.workPlan;
  if (kind !== "urgent" && work?.active && settings.protectWork) {
    if (work.mode === "focus" || inTimeWindow(currentTime, work.quietStart, work.quietEnd)) return false;
  }
  if (kind === "timer" || kind === "reward") return true;
  const waitMinutes = settings.frequency === "minimal" ? 240 : settings.frequency === "gentle" ? 120 : 45;
  return !settings.lastSentAt || now.getTime() - settings.lastSentAt >= waitMinutes * 60000;
}

export function todayKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function emptyState() {
  return {
    days: {},
    activity: [],
    reminders: { arrival: { enabled: false, time: "18:00", lastSent: null }, evening: { enabled: false, time: "21:00", lastSent: null } },
    notificationSettings: { ...notificationDefaults },
    workPlan: { active: false, date: "", start: "08:00", end: "16:00", breaks: "normal", quietStart: "", quietEnd: "", energy: "medium", type: "mixte", mode: "prepare", checkedIn: false },
    preferences: { rewardsConfigured: false, rewardChoices: [] },
    wallet: { balance: 0, totalEarned: 0, extraObjectiveSlots: 0, purchases: [], rewardMinutes: 0 },
    activeTimer: null,
    activeRewardTimer: null,
    activeSequence: null
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
  return { title: level.label, detail: selectedFocus.challenges[effort], minutes: level.minutes, seconds: level.seconds, coins: rewardCoins(level.coins), effort, type: type.label, focus: selectedFocus.label };
}

export function addCoins(state, coins, event) {
  const day = getDay(state);
  const earnedCoins = rewardCoins(coins);
  if (!state.wallet) state.wallet = { balance: 0, totalEarned: 0, extraObjectiveSlots: 0, purchases: [], rewardMinutes: 0 };
  day.coins += earnedCoins;
  state.wallet.balance += earnedCoins;
  state.wallet.totalEarned += earnedCoins;
  if (event.kind === "completed") day.completed += 1;
  state.activity.unshift({ ...event, coins: earnedCoins, date: todayKey(), at: Date.now() });
  state.activity = state.activity.slice(0, 40);
  return state.wallet.balance;
}

export function spendCoins(state, cost, label) {
  if (!state.wallet || state.wallet.balance < cost) return false;
  state.wallet.balance -= cost;
  state.wallet.purchases.unshift({ label, cost, at: Date.now() });
  return true;
}

export function addRewardTime(state, minutes, label) {
  if (!state.wallet) state.wallet = { balance: 0, totalEarned: 0, extraObjectiveSlots: 0, purchases: [], rewardMinutes: 0 };
  const availableSpace = MAX_REWARD_MINUTES - (state.wallet.rewardMinutes || 0);
  const addedMinutes = Math.max(0, Math.min(minutes, availableSpace));
  state.wallet.rewardMinutes = (state.wallet.rewardMinutes || 0) + addedMinutes;
  return addedMinutes;
}

export function useRewardTime(state) {
  const savedMinutes = state.wallet?.rewardMinutes || 0;
  const usedMinutes = Math.min(savedMinutes, MAX_REWARD_BREAK_MINUTES);
  if (usedMinutes) state.wallet.rewardMinutes -= usedMinutes;
  return usedMinutes;
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
