package com.vian.app.data

import kotlinx.coroutines.flow.Flow

class AppRepository(private val dao: AppDao) {
    // Notes
    val allNotes: Flow<List<Note>> = dao.getAllNotes()
    suspend fun insertNote(note: Note) = dao.insertNote(note)
    suspend fun trashNote(id: Long) = dao.trashNote(id, System.currentTimeMillis())

    // Expenses
    val allExpenses: Flow<List<Expense>> = dao.getAllExpenses()
    val allExpenseInstances: Flow<List<ExpenseInstance>> = dao.getAllExpenseInstances()
    suspend fun insertExpense(expense: Expense) = dao.insertExpense(expense)
    suspend fun insertExpenseInstance(instance: ExpenseInstance) = dao.insertExpenseInstance(instance)

    // Habits
    val allHabits: Flow<List<Habit>> = dao.getAllHabits()
    suspend fun insertHabit(habit: Habit) = dao.insertHabit(habit)
    suspend fun toggleHabit(habitId: Long, date: String, value: Int) {
        val record = dao.getHabitRecord(habitId, date)
        if (record != null) {
            dao.insertHabitRecord(record.copy(value = value))
        } else {
            dao.insertHabitRecord(HabitRecord(habitId = habitId, date = date, value = value, createdAt = System.currentTimeMillis()))
        }
    }

    // Journal
    val allJournalEntries: Flow<List<JournalEntry>> = dao.getAllJournalEntries()
    suspend fun insertJournalEntry(entry: JournalEntry) = dao.insertJournalEntry(entry)

    // Events
    val allEvents: Flow<List<VianEvent>> = dao.getAllEvents()
    suspend fun insertEvent(event: VianEvent) = dao.insertEvent(event)
}
