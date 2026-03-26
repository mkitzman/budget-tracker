import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useFireSync, useSyncStatus } from './useFireSync.js'

const income = useFireSync('bt-income', 0)
const bills = useFireSync('bt-bills', [])
const subscriptions = useFireSync('bt-subscriptions', [])
const expenses = useFireSync('bt-expenses', [])
const selectedMonth = ref(new Date().getMonth()) // 0-indexed, shared across all consumers
const selectedYear = ref(new Date().getFullYear())

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function useStore() {
  const totalBills = computed(() => {
    return bills.value.reduce((sum, bill) => {
      if (bill.seasonalRates && Object.keys(bill.seasonalRates).length > 0) {
        const rate = bill.seasonalRates[selectedMonth.value]
        return sum + (rate !== undefined && rate !== null ? Number(rate) : Number(bill.amount) || 0)
      }
      return sum + (Number(bill.amount) || 0)
    }, 0)
  })

  const totalSubscriptions = computed(() => {
    return subscriptions.value
      .reduce((sum, s) => sum + getSubscriptionCurrentAmount(s), 0)
  })

  const remaining = computed(() => {
    return (Number(income.value) || 0) - totalBills.value - totalSubscriptions.value
  })

  const categories = ['Needs', 'Wants', 'Savings']
  const categoryTargets = { Needs: 0.50, Wants: 0.30, Savings: 0.20 }

  const categoryBreakdown = computed(() => {
    const inc = Number(income.value) || 0
    const result = {}

    for (const cat of categories) {
      const target = categoryTargets[cat]
      const budgeted = inc * target

      const billItems = bills.value
        .filter(b => b.category === cat)
        .map(b => ({ name: b.name || 'Unnamed', amount: getBillCurrentAmount(b), type: 'bill' }))

      const subItems = subscriptions.value
        .filter(s => s.category === cat)
        .map(s => ({ name: s.name || 'Unnamed', amount: getSubscriptionCurrentAmount(s), type: 'subscription' }))

      const expItems = monthExpenses.value
        .filter(e => e.category === cat)
        .map(e => ({ name: e.name || 'Unnamed', amount: Number(e.amount) || 0, type: 'expense' }))

      const items = [...billItems, ...subItems, ...expItems]
      const spent = items.reduce((sum, i) => sum + i.amount, 0)
      const remaining = budgeted - spent
      const pctUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0

      result[cat] = { budgeted, spent, remaining, pctUsed, items, target }
    }

    return result
  })

  function monthlyAmount(sub) {
    const cost = Number(sub.cost) || 0
    if (sub.frequency === 'Yearly') return cost / 12
    if (sub.frequency === 'Quarterly') return cost / 3
    return cost
  }

  function yearlyAmount(sub) {
    const cost = Number(sub.cost) || 0
    if (sub.frequency === 'Yearly') return cost
    if (sub.frequency === 'Quarterly') return cost * 4
    return cost * 12
  }

  // Bills CRUD
  function addBill() {
    bills.value.push({
      id: uuidv4(),
      name: '',
      amount: 0,
      tags: [],
      dueDate: 1,
      notes: '',
      fixed: true,
      seasonalRates: {},
      category: 'Needs'
    })
  }

  function updateBill(id, field, value) {
    const bill = bills.value.find(b => b.id === id)
    if (bill) bill[field] = value
  }

  function deleteBill(id) {
    const idx = bills.value.findIndex(b => b.id === id)
    if (idx !== -1) bills.value.splice(idx, 1)
  }

  // Subscriptions CRUD
  function addSubscription() {
    subscriptions.value.push({
      id: uuidv4(),
      name: '',
      tags: [],
      frequency: 'Monthly',
      renewalDate: 1,
      cost: 0,
      notes: '',
      seasonalRates: {},
      category: 'Needs'
    })
  }

  function updateSubscription(id, field, value) {
    const sub = subscriptions.value.find(s => s.id === id)
    if (sub) sub[field] = value
  }

  function deleteSubscription(id) {
    const idx = subscriptions.value.findIndex(s => s.id === id)
    if (idx !== -1) subscriptions.value.splice(idx, 1)
  }

  // Expenses CRUD
  function addExpense() {
    expenses.value.push({
      id: uuidv4(),
      name: '',
      amount: 0,
      category: 'Needs',
      date: '',
      notes: '',
      month: selectedMonth.value,
      year: selectedYear.value
    })
  }

  function updateExpense(id, field, value) {
    const exp = expenses.value.find(e => e.id === id)
    if (exp) exp[field] = value
  }

  function deleteExpense(id) {
    const idx = expenses.value.findIndex(e => e.id === id)
    if (idx !== -1) expenses.value.splice(idx, 1)
  }

  const monthExpenses = computed(() => {
    return expenses.value.filter(e =>
      e.month === selectedMonth.value && e.year === selectedYear.value
    )
  })

  const totalExpenses = computed(() => {
    return monthExpenses.value.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  })

  const adjustedRemaining = computed(() => {
    return remaining.value - totalExpenses.value
  })

  // Expenses grouped by month for the Expenses tab
  const expensesByMonth = computed(() => {
    const groups = {}
    expenses.value.forEach(e => {
      const key = `${e.year}-${String(e.month).padStart(2, '0')}`
      if (!groups[key]) {
        groups[key] = { month: e.month, year: e.year, label: `${monthNames[e.month]} ${e.year}`, items: [], total: 0 }
      }
      groups[key].items.push(e)
      groups[key].total += Number(e.amount) || 0
    })
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  })

  function getSubscriptionCurrentAmount(sub) {
    if (sub.seasonalRates && Object.keys(sub.seasonalRates).length > 0) {
      const rate = sub.seasonalRates[selectedMonth.value]
      return rate !== undefined && rate !== null ? Number(rate) : Number(sub.cost) || 0
    }
    return monthlyAmount(sub)
  }

  function getBillCurrentAmount(bill) {
    if (bill.seasonalRates && Object.keys(bill.seasonalRates).length > 0) {
      const rate = bill.seasonalRates[selectedMonth.value]
      return rate !== undefined && rate !== null ? Number(rate) : Number(bill.amount) || 0
    }
    return Number(bill.amount) || 0
  }

  return {
    income,
    bills,
    subscriptions,
    totalBills,
    totalSubscriptions,
    remaining,
    monthlyAmount,
    yearlyAmount,
    addBill,
    updateBill,
    deleteBill,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    getSubscriptionCurrentAmount,
    getBillCurrentAmount,
    selectedMonth,
    selectedYear,
    monthNames,
    categories,
    categoryTargets,
    categoryBreakdown,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    monthExpenses,
    totalExpenses,
    adjustedRemaining,
    expensesByMonth,
    syncStatus: useSyncStatus()
  }
}
