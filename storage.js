const STORAGE_KEY = "userSubscriptions";

export function saveSubscriptions(subscriptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

export function loadSubscriptions() {
  try {
    const savedSubscriptions = localStorage.getItem(STORAGE_KEY);

    if (!savedSubscriptions) {
      return [];
    }

    return JSON.parse(savedSubscriptions);
  } catch (error) {
    return [];
  }
}
