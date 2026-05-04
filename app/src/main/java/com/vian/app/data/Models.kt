package com.vian.app.data

import androidx.room.*

enum class NoteType { TEXT, CHECKLIST }

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val body: String?,
    val type: NoteType,
    val color: String,
    val createdAt: Long,
    val modifiedAt: Long,
    val archived: Boolean = false,
    val deleted: Boolean = false,
    val deletedAt: Long? = null,
    val reminder: String? = null
)

@Entity(tableName = "checklist_items")
data class ChecklistItem(
    @PrimaryKey val id: String,
    val noteId: Long,
    val text: String,
    val done: Boolean
)

@Entity(tableName = "expenses")
data class Expense(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val instanceId: Long?,
    val item: String,
    val category: String,
    val subcategory: String,
    val price: Double,
    val weightLabel: String,
    val weightKg: Double,
    val shop: String,
    val date: String,
    val comments: String? = null,
    val createdAt: Long,
    val deleted: Boolean = false,
    val deletedAt: Long? = null
)

@Entity(tableName = "expense_instances")
data class ExpenseInstance(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val date: String,
    val shop: String? = null,
    val total: Double,
    val createdAt: Long,
    val deleted: Boolean = false,
    val deletedAt: Long? = null
)

@Entity(tableName = "habits")
data class Habit(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val icon: String,
    val color: String,
    val type: String, // yesno, measurable, combination
    val frequency: String, // daily, weekly
    val unit: String? = null,
    val target: Int? = null,
    val order: Int,
    val archived: Boolean = false,
    val createdAt: Long,
    val deleted: Boolean = false,
    val deletedAt: Long? = null
)

@Entity(tableName = "habit_records")
data class HabitRecord(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val habitId: Long,
    val date: String,
    val value: Int,
    val createdAt: Long
)

@Entity(tableName = "journal_entries")
data class JournalEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val body: String,
    val date: String,
    val emotion: String,
    val color: String,
    val createdAt: Long,
    val modifiedAt: Long,
    val lastOpenedAt: Long? = null,
    val deleted: Boolean = false,
    val deletedAt: Long? = null
)

@Entity(tableName = "events")
data class VianEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val date: String,
    val time: String,
    val endTime: String? = null,
    val location: String? = null,
    val color: String? = null,
    val body: String? = null,
    val icon: String? = null,
    val type: String? = null,
    val reminder: String? = null,
    val repeat: String,
    val archived: Boolean = false,
    val createdAt: Long,
    val deleted: Boolean = false,
    val deletedAt: Long? = null
)
