/**
 * Goal Impact Calculator
 *
 * Calculates how a potential purchase impacts the user's financial goals.
 * Considers goal amounts, deadlines, and priorities.
 */

import type { FinancialGoal } from "../store/types"

export interface GoalImpactResult {
  goalId: string
  goalName: string
  delayDays: number
  newProgress: number
  currentProgress: number
  message: string
  severity: "low" | "medium" | "high"
}

/**
 * Calculate days remaining until goal deadline
 */
function getDaysRemaining(deadline: string): number {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerDay)
}

/**
 * Estimate daily savings rate based on goal progress and deadline
 */
function estimateDailySavingsRate(goal: FinancialGoal): number {
  const remaining = goal.targetAmount - goal.currentAmount
  const daysLeft = getDaysRemaining(goal.deadline)

  if (daysLeft <= 0 || remaining <= 0) {
    // Goal is past deadline or already met, use default rate
    return 50 // Default $50/day
  }

  // Required daily savings to meet goal
  return remaining / daysLeft
}

/**
 * Calculate impact of purchase on a single goal
 */
function calculateSingleGoalImpact(
  goal: FinancialGoal,
  purchasePrice: number
): GoalImpactResult {
  const currentProgress = (goal.currentAmount / goal.targetAmount) * 100
  const remaining = goal.targetAmount - goal.currentAmount
  const dailyRate = estimateDailySavingsRate(goal)
  const daysRemaining = getDaysRemaining(goal.deadline)

  // Calculate delay in days
  const delayDays = dailyRate > 0 ? Math.ceil(purchasePrice / dailyRate) : 0

  // Calculate new progress if purchase was made
  // (assuming the money would have gone toward the goal)
  const wouldHaveSaved = Math.min(purchasePrice, remaining)
  const newCurrentAmount = goal.currentAmount // No change - money went to purchase
  const newProgress = (newCurrentAmount / goal.targetAmount) * 100

  // Determine severity based on deadline impact
  let severity: "low" | "medium" | "high"
  if (daysRemaining <= 0) {
    // Past deadline - any delay is low impact
    severity = "low"
  } else if (delayDays > daysRemaining * 0.5) {
    // Delays goal by more than half remaining time
    severity = "high"
  } else if (delayDays > daysRemaining * 0.2) {
    // Delays by 20-50% of remaining time
    severity = "medium"
  } else {
    severity = "low"
  }

  // Generate contextual message
  let message: string
  if (daysRemaining <= 0) {
    message = `This purchase of $${purchasePrice.toFixed(0)} could have contributed to your "${goal.name}" goal.`
  } else if (delayDays >= daysRemaining) {
    message = `This purchase will likely push your "${goal.name}" deadline beyond ${new Date(goal.deadline).toLocaleDateString()}.`
  } else if (delayDays > 7) {
    message = `This purchase delays your "${goal.name}" goal by about ${delayDays} days.`
  } else if (delayDays > 1) {
    message = `This purchase delays your "${goal.name}" goal by ${delayDays} days.`
  } else {
    message = `This purchase has minimal impact on your "${goal.name}" goal.`
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    delayDays,
    currentProgress: Math.round(currentProgress),
    newProgress: Math.round(newProgress),
    message,
    severity
  }
}

/**
 * Priority weights for ranking goal importance
 */
const PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1
}

/**
 * Calculate impact on all goals and return the most relevant one
 *
 * Selection criteria:
 * 1. Highest severity impact
 * 2. Highest priority goal (if tie)
 * 3. Nearest deadline (if still tie)
 */
export function calculateGoalImpact(
  goals: FinancialGoal[],
  purchasePrice: number
): GoalImpactResult | null {
  if (!goals || goals.length === 0) {
    return null
  }

  // Filter to active goals (not yet completed)
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount)

  if (activeGoals.length === 0) {
    return null
  }

  // Calculate impact for each goal
  const impacts = activeGoals.map((goal) =>
    calculateSingleGoalImpact(goal, purchasePrice)
  )

  // Sort by: severity (desc), priority (desc), days remaining (asc)
  impacts.sort((a, b) => {
    // First by severity
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff

    // Then by goal priority
    const goalA = activeGoals.find((g) => g.id === a.goalId)!
    const goalB = activeGoals.find((g) => g.id === b.goalId)!
    const priorityDiff =
      PRIORITY_WEIGHTS[goalB.priority] - PRIORITY_WEIGHTS[goalA.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Finally by nearest deadline
    return getDaysRemaining(goalA.deadline) - getDaysRemaining(goalB.deadline)
  })

  return impacts[0]
}

/**
 * Calculate impacts on all goals (for detailed view)
 */
export function calculateAllGoalImpacts(
  goals: FinancialGoal[],
  purchasePrice: number
): GoalImpactResult[] {
  if (!goals || goals.length === 0) {
    return []
  }

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount)
  return activeGoals.map((goal) => calculateSingleGoalImpact(goal, purchasePrice))
}
