// Developing a Banking System

const accounts = [];

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function requirePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  if (value <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
  return value;
}

function ensureTransactions(account) {
  if (!Array.isArray(account.transactions)) {
    account.transactions = [];
  }
  return account.transactions;
}

function generateUniqueAccountNumber() {
  let accountNumber;
  do {
    accountNumber = String(Math.floor(Math.random() * 9000000000) + 1000000000);
  } while (accounts.some((acc) => acc.accountNumber === accountNumber));
  return accountNumber;
}

//! 1- Function to Create a new bank account with validation for required fields.
function generateBankAccount(account) {
  if (!account || typeof account !== "object") {
    throw new Error("Account data is required.");
  }

  const firstName = requireNonEmptyString(account.firstName, "First name");
  const lastName = requireNonEmptyString(account.lastName, "Last name");

  if (
    typeof account.initialDeposit !== "number" ||
    Number.isNaN(account.initialDeposit)
  ) {
    throw new Error("Initial deposit must be a number.");
  }
  if (account.initialDeposit < 50) {
    throw new Error("The initial deposit must be at least $50.");
  }

  const newAccount = {
    accountNumber: generateUniqueAccountNumber(),
    firstName,
    lastName,
    balance: account.initialDeposit,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  return newAccount;
}

const account1 = generateBankAccount({
  firstName: "John",
  lastName: "Doe",
  initialDeposit: 100,
});

const account2 = generateBankAccount({
  firstName: "Jane",
  lastName: "Smith",
  initialDeposit: 200,
});

const account3 = generateBankAccount({
  firstName: "Alice",
  lastName: "Johnson",
  initialDeposit: 300,
});

// =======================================================================================

// 2- Function to Deposit money into an account with transaction recording.
function addDeposit(account, amount) {
  requirePositiveNumber(amount, "Deposit amount");

  const transactions = ensureTransactions(account);
  const transaction = {
    type: "DEPOSIT",
    amount,
    date: new Date().toISOString(),
    newBalance: account.balance + amount,
  };

  transactions.push(transaction);
  account.balance += amount;
  return account;
}

// ==============================================================================
// 3- Function to Process withdrawals with overdraft protection
function withdrawal(account, amount) {
  requirePositiveNumber(amount, "Withdrawal amount");

  const transactions = ensureTransactions(account);

  if (amount > account.balance) {
    const penalty = 5;
    account.balance -= penalty;

    transactions.push({
      type: "OVERDRAFT_ATTEMPT",
      amount,
      date: new Date().toISOString(),
      penalty,
      newBalance: account.balance,
    });

    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      transactions,
    };
  }

  account.balance -= amount;
  transactions.push({
    type: "WITHDRAWAL",
    amount,
    date: new Date().toISOString(),
    newBalance: account.balance,
  });

  return {
    accountNumber: account.accountNumber,
    balance: account.balance,
    transactions,
  };
}

// Backwards-compatible name
const withDrawal = withdrawal;

// =======================================================================================
// Function to Transfer money between accounts with validation.

function transferMoney(accountTransferFrom, accountTransferTo, amount) {
  if (
    !accountTransferFrom?.accountNumber ||
    !accountTransferTo?.accountNumber
  ) {
    throw new Error("Account must be available!");
  }
  requirePositiveNumber(amount, "Amount");
  if (amount > accountTransferFrom.balance) {
    throw new Error("Insufficient funds for transfer.");
  }

  ensureTransactions(accountTransferFrom);
  ensureTransactions(accountTransferTo);

  accountTransferFrom.balance -= amount;
  accountTransferFrom.transactions.push({
    type: "TRANSFER_OUT",
    to: accountTransferTo.accountNumber,
    amount,
    date: new Date().toISOString(),
    newBalance: accountTransferFrom.balance,
  });

  accountTransferTo.balance += amount;
  accountTransferTo.transactions.push({
    type: "TRANSFER_IN",
    from: accountTransferFrom.accountNumber,
    amount,
    date: new Date().toISOString(),
    newBalance: accountTransferTo.balance,
  });

  return [
    {
      accountNumber: accountTransferFrom.accountNumber,
      balance: accountTransferFrom.balance,
      transactions: accountTransferFrom.transactions,
    },
    {
      accountNumber: accountTransferTo.accountNumber,
      balance: accountTransferTo.balance,
      transactions: accountTransferTo.transactions,
    },
  ];
}

// =================================================================================
// Function to Calculate monthly interest (compound) for savings accounts.

function calculateSaving(account) {
  ensureTransactions(account);

  if (account.balance <= 500) {
    console.log(
      `Your Balance Now is ${account.balance} and it is lower than 500$ so you don't have any interests yet `
    );
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      transactions: account.transactions,
    };
  }

  const interestAmount = account.balance * 0.00167;

  const newTrans = {
    type: "INTEREST",
    amount: interestAmount,
    date: new Date().toISOString(),
    newBalance: account.balance + interestAmount,
  };

  account.transactions.push(newTrans);

  return {
    accountNumber: account.accountNumber,
    balance: account.balance + interestAmount,
    transactions: account.transactions,
  };
}

// =================================================================================

// 6) Retrieve transactions within a date range (optional type) + sort by date desc
function retrieveTransactionsInRange(account, options = {}) {
  ensureTransactions(account);

  const { startDate, endDate, type } = options;

  const start = startDate ? new Date(startDate).getTime() : null;

  let end = null;
  if (endDate) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endDate);
    const endMs = new Date(endDate).getTime();
    end = isDateOnly ? endMs + 24 * 60 * 60 * 1000 - 1 : endMs;
  }

  if (!account || typeof account !== "object") {
    throw new Error("Account is required.");
  }

  const transactions = ensureTransactions(account);
  const isDateOnly = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const parseBoundaryMs = (value, isEndOfDay) => {
    if (!value) return null;

    if (isDateOnly(value)) {
      const [yearText, monthText, dayText] = value.split("-");
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const day = Number(dayText);

      const ms = Date.UTC(
        year,
        monthIndex,
        day,
        isEndOfDay ? 23 : 0,
        isEndOfDay ? 59 : 0,
        isEndOfDay ? 59 : 0,
        isEndOfDay ? 999 : 0
      );

      if (Number.isNaN(ms)) {
        throw new Error(`Invalid date: ${value}`);
      }

      return ms;
    }

    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) {
      throw new Error(`Invalid date: ${value}`);
    }
    return ms;
  };

  const startMs = parseBoundaryMs(startDate, false);
  const endMs = parseBoundaryMs(endDate, true);

  if (startMs !== null && endMs !== null && startMs > endMs) {
    throw new Error("startDate must be on/before endDate.");
  }

  const normalizedType =
    type === undefined || type === null
      ? null
      : requireNonEmptyString(String(type), "Type").toUpperCase();

  return transactions
    .filter((t) => {
      if (normalizedType && String(t.type).toUpperCase() !== normalizedType) {
        return false;
      }

      const time = new Date(t.date).getTime();
      if (Number.isNaN(time)) return false;
      if (startMs !== null && time < startMs) return false;
      if (endMs !== null && time > endMs) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 7) Freeze/Unfreeze account (manager approval required for FREEZE) + history
function updateAccountStatus(account, action, managerId) {
  if (!account || typeof account !== "object") {
    throw new Error("Account is required.");
  }

  if (!account.status) account.status = "ACTIVE";
  if (!Array.isArray(account.statusHistory)) account.statusHistory = [];

  const normalizedAction = requireNonEmptyString(
    action,
    "Action"
  ).toUpperCase();

  const hasManagerApproval =
    typeof managerId === "string" && managerId.trim().length > 0;

  if (normalizedAction === "FREEZE" && !hasManagerApproval) {
    throw new Error("Manager approval is required to freeze an account.");
  }

  if (normalizedAction !== "FREEZE" && normalizedAction !== "UNFREEZE") {
    throw new Error('Action must be "FREEZE" or "UNFREEZE".');
  }

  const nextStatus = normalizedAction === "FREEZE" ? "FROZEN" : "ACTIVE";

  if (account.status !== nextStatus) {
    account.status = nextStatus;
    account.statusHistory.push({
      action: normalizedAction,
      by: hasManagerApproval ? managerId.trim() : "system",
      date: new Date().toISOString(),
    });
  }

  return {
    accountNumber: account.accountNumber,
    status: account.status,
    statusHistory: account.statusHistory,
  };
}

function assertAccountNotFrozen(account) {
  if (!account.status) account.status = "ACTIVE";
  if (account.status === "FROZEN") {
    throw new Error("Account is frozen. Transactions are not allowed.");
  }
}

// 8) Enforce $500 daily withdrawal limit (wrapper around existing `withdrawal`)
function withdrawalWithDailyLimit(account, amount) {
  assertAccountNotFrozen(account);
  requirePositiveNumber(amount, "Withdrawal amount");
  ensureTransactions(account);

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  const withdrawnToday = account.transactions
    .filter(
      (t) =>
        t.type === "WITHDRAWAL" &&
        typeof t.amount === "number" &&
        String(t.date).slice(0, 10) === todayKey
    )
    .reduce((sum, t) => sum + t.amount, 0);

  if (withdrawnToday + amount > 500) {
    throw new Error("Daily withdrawal limit exceeded ($500 max)");
  }

  // Use your existing overdraft-protected withdrawal logic
  return withdrawal(account, amount);
}

// 9) Validate password
function validatePassword(password) {
  const reasons = [];

  if (typeof password !== "string") {
    return { valid: false, reasons: ["Password must be a string"] };
  }

  if (password.length < 12)
    reasons.push("Password must be at least 12 characters");
  if (!/[A-Z]/.test(password))
    reasons.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password))
    reasons.push("Password must contain a lowercase letter");
  if (!/[0-9]/.test(password)) reasons.push("Password must contain a number");
  if (!/[^A-Za-z0-9]/.test(password))
    reasons.push("Password must contain a special character");

  const commonPasswords = new Set([
    "password",
    "password123",
    "123456789012",
    "qwertyuiop12",
    "letmein123456",
    "adminadmin123",
    "iloveyou12345",
    "welcome123456",
  ]);

  const lowered = password.toLowerCase();
  if (commonPasswords.has(lowered) || lowered.includes("password")) {
    reasons.push("Password is too common");
  }

  return reasons.length ? { valid: false, reasons } : { valid: true };
}

// 10) Detect suspicious activity
function checkForSuspiciousActivity(account) {
  ensureTransactions(account);

  const alerts = [];

  // Alert on transactions > $10,000
  for (const t of account.transactions) {
    if (typeof t.amount === "number" && t.amount > 10000) {
      const kind =
        t.type === "TRANSFER_OUT"
          ? "transfer"
          : t.type === "TRANSFER_IN"
          ? "transfer"
          : t.type === "WITHDRAWAL"
          ? "withdrawal"
          : t.type === "DEPOSIT"
          ? "deposit"
          : "transaction";

      alerts.push(`High-value transaction: $${t.amount} ${kind}`);
    }
  }

  // Alert on rapid sequence of small withdrawals (3+ within 5 minutes)
  const smallWithdrawals = account.transactions
    .filter(
      (t) =>
        t.type === "WITHDRAWAL" &&
        typeof t.amount === "number" &&
        t.amount <= 500
    )
    .map((t) => ({ ...t, _ms: new Date(t.date).getTime() }))
    .sort((a, b) => a._ms - b._ms);

  const windowMs = 5 * 60 * 1000;
  let flaggedRapid = false;

  for (let i = 0; i < smallWithdrawals.length && !flaggedRapid; i++) {
    for (let j = i + 2; j < smallWithdrawals.length; j++) {
      const span = smallWithdrawals[j]._ms - smallWithdrawals[i]._ms;
      if (span <= windowMs) {
        const count = j - i + 1;
        const minutes = Math.max(1, Math.round(span / 60000));
        alerts.push(
          `Rapid withdrawals: ${count} transactions within ${minutes} minutes`
        );
        flaggedRapid = true;
        break;
      }
      if (span > windowMs) break;
    }
  }

  return { isSuspicious: alerts.length > 0, alerts };
}

// Optional "safe" wrappers to prevent transactions on frozen accounts
function addDepositSafe(account, amount) {
  assertAccountNotFrozen(account);
  return addDeposit(account, amount);
}

function transferMoneySafe(fromAccount, toAccount, amount) {
  assertAccountNotFrozen(fromAccount);
  assertAccountNotFrozen(toAccount);
  return transferMoney(fromAccount, toAccount, amount);
}
