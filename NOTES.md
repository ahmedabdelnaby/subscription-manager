# NOTES

## 1. How did I make the two requests run at the same time?

I started both asynchronous functions before waiting for either result:

```javascript
const plansPromise = fetchPlans();
const subscriptionsPromise = fetchInitialSubscriptions();

const results = await Promise.all([plansPromise, subscriptionsPromise]);
```

Both functions start immediately. `Promise.all()` waits until both requests are finished.

The sequential version would look like this:

```javascript
const plans = await fetchPlans();
const subscriptions = await fetchInitialSubscriptions();
```

This is slower because `fetchInitialSubscriptions()` does not start until `fetchPlans()` has finished.

In this task, the first request takes approximately 300 ms and the second request takes approximately 500 ms.

Sequential loading takes approximately:

300 ms + 500 ms = 800 ms

Concurrent loading takes approximately:

500 ms

because both requests run at the same time and we only need to wait for the slower request.

---

## 2. Why is event delegation better for the filter buttons?

Event delegation means adding one click listener to the parent container instead of adding a separate listener to every button.

For example:

```javascript
planFilters.addEventListener("click", handlePlanFilterClick);
```

The click event from a button reaches the parent container, and the event handler can identify which button was clicked.

This is useful because:

- It uses fewer event listeners.
- The code is simpler.
- It works with buttons that are created dynamically.
- We do not need to add a new event listener every time a new button is added.
