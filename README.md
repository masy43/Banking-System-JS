# Lab 5 — Banking System (JavaScript)

A small banking system implemented in plain JavaScript.

## Run

- Install dependencies: `npm install`
- Run (auto-restarts): `npm run app`

Or run directly with Node:

- `node script.js`

## Transaction Retrieval: Date Range + Type Filter

### Function

`retrieveTransactionsInRange(account, options)`

### Parameters

- `account`: An object that contains a `transactions` array.
- `options`:
  - `startDate` (optional): Start of the range.
  - `endDate` (optional): End of the range.
  - `type` (optional): Transaction type to filter by (e.g., `"DEPOSIT"`, `"WITHDRAWAL"`).

### Rules

- Filters transactions within the provided date range (inclusive).
- If `endDate` is provided as `YYYY-MM-DD`, it includes the entire day.
- Supports filtering by transaction `type`.
- Sorts results by `date` descending (newest first).

### Example

#### Input

```js
const results = retrieveTransactionsInRange(account, {
  startDate: "2023-11-01",
  endDate: "2023-11-30",
  type: "DEPOSIT",
});
```

Where `account` has:

```js
transactions: [
  { type: "DEPOSIT", amount: 200, date: "2023-11-15T10:00:00Z" },
  { type: "WITHDRAWAL", amount: 50, date: "2023-11-20T14:00:00Z" },
];
```

#### Output

```js
[
  {
    type: "DEPOSIT",
    amount: 200,
    date: "2023-11-15T10:00:00Z",
  },
];
```
