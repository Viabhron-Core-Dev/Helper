package com.vian.app

import android.app.Application
import androidx.room.Room
import com.vian.app.data.AppDatabase
import com.vian.app.data.AppRepository

class VianApplication : Application() {
    lateinit var database: AppDatabase
    lateinit var repository: AppRepository

    override fun onCreate() {
        super.onCreate()
        database = Room.databaseBuilder(
            this,
            AppDatabase::class.java,
            "vian_database"
        ).build()
        repository = AppRepository(database.dao())
    }
}
