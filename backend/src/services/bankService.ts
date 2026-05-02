import prisma from '../db/prisma';
import { TransactionType } from '@prisma/client';

export interface CreateTransactionData {
  amount: number;
  type: TransactionType;
  description: string;
  date?: Date;
  category?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Payroll: ['payroll', 'salary', 'wages', 'compensation'],
  Rent: ['rent', 'lease', 'office space'],
  Utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
  Software: ['software', 'saas', 'subscription', 'license', 'aws', 'azure', 'google cloud'],
  Marketing: ['marketing', 'advertising', 'ads', 'campaign', 'promotion'],
  Travel: ['travel', 'flight', 'hotel', 'uber', 'lyft', 'taxi', 'airbnb'],
  Meals: ['restaurant', 'food', 'lunch', 'dinner', 'coffee', 'catering'],
  Office: ['office', 'supplies', 'stationery', 'furniture'],
  Insurance: ['insurance', 'premium', 'coverage'],
  Tax: ['tax', 'irs', 'government', 'filing'],
  Revenue: ['payment received', 'invoice paid', 'client payment', 'deposit'],
  Refund: ['refund', 'return', 'credit'],
};

export function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}

export async function getTransactions(userId: string, limit = 20) {
  return prisma.bankTransaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

export async function addTransaction(userId: string, data: CreateTransactionData) {
  const category = data.category || categorizeTransaction(data.description);

  return prisma.bankTransaction.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date || new Date(),
      category,
    },
  });
}

export async function getBalance(userId: string): Promise<number> {
  const transactions = await prisma.bankTransaction.findMany({
    where: { userId },
    select: { amount: true, type: true },
  });

  return transactions.reduce((balance, tx) => {
    return tx.type === 'CREDIT' ? balance + tx.amount : balance - tx.amount;
  }, 0);
}

export async function getTransactionsByCategory(userId: string, startDate?: Date, endDate?: Date) {
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      userId,
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    },
  });

  const byCategory: Record<string, number> = {};

  for (const tx of transactions) {
    const cat = tx.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = 0;
    if (tx.type === 'DEBIT') {
      byCategory[cat] += tx.amount;
    }
  }

  return byCategory;
}
