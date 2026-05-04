package com.vian.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vian.app.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class VianViewModel(private val repository: AppRepository) : ViewModel() {
    val notes = repository.allNotes.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val expenses = repository.allExpenses.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val expenseInstances = repository.allExpenseInstances.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val habits = repository.allHabits.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val journals = repository.allJournalEntries.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val events = repository.allEvents.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addNote(title: String, body: String, type: NoteType) {
        viewModelScope.launch {
            repository.insertNote(Note(
                title = title,
                body = body,
                type = type,
                color = "#FFFFFF",
                createdAt = System.currentTimeMillis(),
                modifiedAt = System.currentTimeMillis()
            ))
        }
    }

    fun deleteNote(id: Long) {
        viewModelScope.launch {
            repository.trashNote(id)
        }
    }

    fun seedInitialData() {
        viewModelScope.launch {
            // Check if we already have data
            if (notes.value.isEmpty()) {
                addNote("Welcome to VIAN", "This is your new native dashboard.", NoteType.TEXT)
            }
            if (expenses.value.isEmpty()) {
                repository.insertExpense(Expense(
                    item = "Initial Item",
                    category = "System",
                    subcategory = "Setup",
                    price = 0.0,
                    weightLabel = "N/A",
                    weightKg = 0.0,
                    shop = "System",
                    date = "2026-05-04",
                    createdAt = System.currentTimeMillis(),
                    instanceId = null
                ))
            }
        }
    }
}
