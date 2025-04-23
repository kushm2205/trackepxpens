import {GroupBalances} from '../types/types';

export const calculateShares = (
  amount: number,
  splitBetween: string[],
  paidBy: string,
): Record<string, number> => {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (splitBetween.length === 0)
    throw new Error('Must split between at least one person');

  const share = amount / splitBetween.length;
  const shares: Record<string, number> = {};

  splitBetween.forEach(userId => {
    shares[userId] = userId === paidBy ? amount - share : -share;
  });

  return shares;
};

export const simplifyBalances = (
  balances: GroupBalances,
  groupId: string,
): Record<string, number> => {
  const groupBalances = balances[groupId] || {};
  const netBalances: Record<string, number> = {};

  Object.entries(groupBalances).forEach(([userId, userBalances]) => {
    netBalances[userId] = Object.values(userBalances).reduce(
      (sum, amount) => sum + amount,
      0,
    );
  });

  return netBalances;
};

export const formatBalances = (
  balances: Record<string, number>,
  memberNames: Record<string, string>,
): string[] => {
  return Object.entries(balances)
    .filter(([_, amount]) => Math.abs(amount) > 0.01)
    .map(([userId, amount]) => {
      const name = memberNames[userId] || 'Unknown';
      const action = amount > 0 ? 'gets back' : 'owes';
      return `${name} ${action} ₹${Math.abs(amount).toFixed(2)}`;
    });
};

export const calculateSettlements = (
  balances: Record<string, number>,
): Array<{from: string; to: string; amount: number}> => {
  const settlements = [];
  const balancesCopy = {...balances};

  Object.keys(balancesCopy).forEach(key => {
    if (Math.abs(balancesCopy[key]) < 0.01) {
      delete balancesCopy[key];
    }
  });

  const sortedEntries = Object.entries(balancesCopy).sort(
    (a, b) => a[1] - b[1],
  );

  let i = 0;
  let j = sortedEntries.length - 1;

  while (i < j) {
    const [debtor, debt] = sortedEntries[i];
    const [creditor, credit] = sortedEntries[j];

    if (debt >= 0) {
      i++;
      continue;
    }
    if (credit <= 0) {
      j--;
      continue;
    }

    const amount = Math.min(-debt, credit);
    if (amount > 0.01) {
      settlements.push({
        from: debtor,
        to: creditor,
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    sortedEntries[i][1] += amount;
    sortedEntries[j][1] -= amount;

    if (Math.abs(sortedEntries[i][1]) < 0.01) i++;
    if (Math.abs(sortedEntries[j][1]) < 0.01) j--;
  }

  return settlements;
};

export const getUserBalanceSummary = (
  balances: Record<string, number>,
  userId: string,
  memberNames: Record<string, string>,
) => {
  const userBalance = balances[userId] || 0;

  const settlements = calculateSettlements(balances);

  const userSettlements = settlements.filter(
    s => s.from === userId || s.to === userId,
  );

  const formattedTransactions = userSettlements.map(s => {
    const isReceiving = s.to === userId;
    const otherUser = isReceiving ? s.from : s.to;
    const otherUserName = memberNames[otherUser] || otherUser;

    return {
      otherUserId: otherUser,
      otherUserName: otherUserName,
      amount: s.amount,
      isReceiving: isReceiving,
    };
  });

  return {
    totalBalance: userBalance,
    transactions: formattedTransactions,
  };
};
