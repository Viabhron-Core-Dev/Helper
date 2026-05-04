package com.vian.app.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {
    // Notes
    @Query("SELECT * FROM notes WHERE deleted = 0 AND archived = 0 ORDER BY modifiedAt DESC")
    fun getAllNotes(): Flow<List<Note>>

    @Query("SELECT * FROM notes WHERE id = :id")
    suspend fun getNoteById(id: Long): Note?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: Note)

    @Update
    suspend fun updateNote(note: Note)

    @Query("UPDATE notes SET deleted = 1, deletedAt = :timestamp WHERE id = :id")
    suspend fun trashNote(id: Long, timestamp: Long)

    // Expenses
    @Query("SELECT * FROM expenses WHERE deleted = 0 ORDER BY createdAt DESC")
    fun getAllExpenses(): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE instanceId = :instanceId AND deleted = 0")
    fun getExpensesByInstance(instanceId: Long): Flow<List<Expense>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense)

    @Query("SELECT * FROM expense_instances WHERE deleted = 0 ORDER BY date DESC")
    fun getAllExpenseInstances(): Flow<List<ExpenseInstance>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpenseInstance(instance: ExpenseInstance)

    // Habits
    @Query("SELECT * FROM habits WHERE deleted = 0 AND archived = 0 ORDER BY `order` ASC")
    fun getAllHabits(): Flow<List<Habit>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: Habit)

    @Query("SELECT * FROM habit_records WHERE habitId = :habitId AND date = :date")
    suspend fun getHabitRecord(habitId: Long, date: String): HabitRecord?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabitRecord(record: HabitRecord)

    // Journal
    @Query("SELECT * FROM journal_entries WHERE deleted = 0 ORDER BY date DESC")
    fun getAllJournalEntries(): Flow<List<JournalEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJournalEntry(entry: JournalEntry)

    // Events
    @Query("SELECT * FROM events WHERE deleted = 0 AND archived = 0 ORDER BY date ASC, time ASC")
    fun getAllEvents(): Flow<List<VianEvent>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: VianEvent)
}

@Database(entities = [Note::class, ChecklistItem::class, Expense::class, ExpenseInstance::class, Habit::class, HabitRecord::class, JournalEntry::class, VianEvent::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dao(): AppDao
}

class Converters {
    @TypeConverter
    fun fromNoteType(value: NoteType) = value.name
    @TypeConverter
    fun toNoteType(value: String) = NoteType.valueOf(value)
}
