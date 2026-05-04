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
}
