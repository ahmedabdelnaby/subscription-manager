import { fetchPlans, fetchInitialSubscriptions } from "./data.js";
import { saveSubscriptions, loadSubscriptions } from "./storage.js";

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const app = document.getElementById("app");

const retryButton = document.getElementById("retryButton");

const subscriptionForm = document.getElementById("subscriptionForm");

const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const planInput = document.getElementById("plan");
const statusInput = document.getElementById("status");
const dateInput = document.getElementById("date");

const nameError = document.getElementById("nameError");
const amountError = document.getElementById("amountError");

const planFilters = document.getElementById("planFilters");
const statusFilters = document.getElementById("statusFilters");

const subscriptionList = document.getElementById("subscriptionList");

const subscriptionCount = document.getElementById("subscriptionCount");
const totalCost = document.getElementById("totalCost");
const activeCount = document.getElementById("activeCount");

let plans = [];
let initialSubscriptions = [];
let userSubscriptions = [];

let selectedPlan = "all";
let selectedStatus = "all";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

async function loadApp() {
  showLoading();

  try {
    const plansPromise = fetchPlans();
    const subscriptionsPromise = fetchInitialSubscriptions();

    const results = await Promise.all([plansPromise, subscriptionsPromise]);

    plans = results[0];
    initialSubscriptions = results[1];

    userSubscriptions = loadSubscriptions();

    setupPlanSelect();
    setupPlanFilters();

    showApp();

    render();
  } catch (error) {
    showError();
  }
}

function showLoading() {
  loadingState.hidden = false;
  errorState.hidden = true;
  app.hidden = true;
}

function showError() {
  loadingState.hidden = true;
  errorState.hidden = false;
  app.hidden = true;
}

function showApp() {
  loadingState.hidden = true;
  errorState.hidden = true;
  app.hidden = false;
}

function setupPlanSelect() {
  planInput.textContent = "";

  plans.forEach(function (plan) {
    const option = document.createElement("option");

    option.value = plan;
    option.textContent = plan;

    planInput.appendChild(option);
  });
}

function setupPlanFilters() {
  planFilters.textContent = "";

  const allButton = document.createElement("button");

  allButton.type = "button";
  allButton.textContent = "All";
  allButton.dataset.plan = "all";

  planFilters.appendChild(allButton);

  plans.forEach(function (plan) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = plan;
    button.dataset.plan = plan;

    planFilters.appendChild(button);
  });
}

function getAllSubscriptions() {
  return [...userSubscriptions, ...initialSubscriptions];
}

function getVisibleSubscriptions() {
  const allSubscriptions = getAllSubscriptions();

  return allSubscriptions.filter(function (subscription) {
    const matchesPlan =
      selectedPlan === "all" || subscription.plan === selectedPlan;

    const matchesStatus =
      selectedStatus === "all" || subscription.status === selectedStatus;

    return matchesPlan && matchesStatus;
  });
}

function render() {
  const visibleSubscriptions = getVisibleSubscriptions();

  renderSubscriptions(visibleSubscriptions);
  updateSummary(visibleSubscriptions);
}

function renderSubscriptions(subscriptions) {
  subscriptionList.textContent = "";

  if (subscriptions.length === 0) {
    const message = document.createElement("p");

    message.textContent = "No subscriptions found.";

    subscriptionList.appendChild(message);

    return;
  }

  subscriptions.forEach(function (subscription) {
    const container = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = subscription.name;

    const amount = document.createElement("p");
    amount.textContent =
      "Monthly Amount: " + moneyFormatter.format(subscription.amount);

    const plan = document.createElement("p");
    plan.textContent = "Plan: " + subscription.plan;

    const status = document.createElement("p");
    status.textContent = "Status: " + subscription.status;

    const date = document.createElement("p");
    date.textContent = "Date: " + subscription.date;

    const toggleButton = document.createElement("button");

    toggleButton.type = "button";
    toggleButton.textContent = "Toggle Status";
    toggleButton.dataset.action = "toggle";
    toggleButton.dataset.id = subscription.id;

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = subscription.id;

    container.appendChild(name);
    container.appendChild(amount);
    container.appendChild(plan);
    container.appendChild(status);
    container.appendChild(date);
    container.appendChild(toggleButton);
    container.appendChild(deleteButton);

    subscriptionList.appendChild(container);
  });
}

function updateSummary(subscriptions) {
  const count = subscriptions.length;

  const totalMonthlyCost = subscriptions.reduce(function (total, subscription) {
    return total + subscription.amount;
  }, 0);

  const activeSubscriptions = subscriptions.filter(function (subscription) {
    return subscription.status === "active";
  });

  subscriptionCount.textContent = count;

  totalCost.textContent = moneyFormatter.format(totalMonthlyCost);

  activeCount.textContent = activeSubscriptions.length;
}

function validateForm() {
  let isValid = true;

  nameError.textContent = "";
  amountError.textContent = "";

  if (nameInput.value.trim() === "") {
    nameError.textContent = "Name is required.";

    isValid = false;
  }

  const amount = Number(amountInput.value);

  if (amountInput.value === "" || Number.isNaN(amount) || amount <= 0) {
    amountError.textContent = "Amount must be a positive number.";

    isValid = false;
  }

  return isValid;
}

function addSubscription(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const newSubscription = {
    id: "user-" + Date.now(),
    name: nameInput.value.trim(),
    amount: Number(amountInput.value),
    plan: planInput.value,
    status: statusInput.value,
    date: dateInput.value,
  };

  userSubscriptions.unshift(newSubscription);

  saveSubscriptions(userSubscriptions);

  subscriptionForm.reset();

  render();
}

function handlePlanFilterClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  selectedPlan = button.dataset.plan;

  render();
}

function handleStatusFilterClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  selectedStatus = button.dataset.status;

  render();
}

function handleSubscriptionAction(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (!action) {
    return;
  }

  const subscriptionId = button.dataset.id;

  if (action === "toggle") {
    toggleSubscriptionStatus(subscriptionId);
  }

  if (action === "delete") {
    deleteSubscription(subscriptionId);
  }
}

function toggleSubscriptionStatus(subscriptionId) {
  const allSubscriptions = getAllSubscriptions();

  const subscription = allSubscriptions.find(function (item) {
    return item.id === subscriptionId;
  });

  if (!subscription) {
    return;
  }

  if (subscription.status === "active") {
    subscription.status = "paused";
  } else if (subscription.status === "paused") {
    subscription.status = "active";
  }

  saveSubscriptions(userSubscriptions);

  render();
}

function deleteSubscription(subscriptionId) {
  const userSubscription = userSubscriptions.find(function (subscription) {
    return subscription.id === subscriptionId;
  });

  if (userSubscription) {
    userSubscriptions = userSubscriptions.filter(function (subscription) {
      return subscription.id !== subscriptionId;
    });
  } else {
    initialSubscriptions = initialSubscriptions.filter(function (subscription) {
      return subscription.id !== subscriptionId;
    });
  }

  saveSubscriptions(userSubscriptions);

  render();
}

/*
Event listeners
*/

subscriptionForm.addEventListener("submit", addSubscription);

planFilters.addEventListener("click", handlePlanFilterClick);

statusFilters.addEventListener("click", handleStatusFilterClick);

subscriptionList.addEventListener("click", handleSubscriptionAction);

retryButton.addEventListener("click", loadApp);

loadApp();
