package com.vian.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.*
import com.vian.app.ui.VianViewModel
import com.vian.app.ui.components.*
import com.vian.app.ui.theme.VianAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val app = application as VianApplication
            val viewModel: VianViewModel = viewModel(
                factory = object : ViewModelProvider.Factory {
                    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                        return VianViewModel(app.repository) as T
                    }
                }
            )

            VianAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFFF5F5F5)
                ) {
                    MainNavigation(viewModel)
                }
            }
        }
    }
}

@Composable
fun MainNavigation(viewModel: VianViewModel) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen(viewModel, onNavigate = { route -> navController.navigate(route) }) }
        composable("notes") { /* Notes Screen */ }
        composable("expenses") { /* Expenses Screen */ }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: VianViewModel, onNavigate: (String) -> Unit) {
    val notes by viewModel.notes.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val habits by viewModel.habits.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "VIAN",
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp,
                        fontSize = 24.sp
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                ),
                modifier = Modifier.background(Color.White)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatusCard("Status", "READY", modifier = Modifier.weight(1f))
                    StatusCard("Sync", "LOCAL", modifier = Modifier.weight(1f))
                }
            }

            item {
                SummaryCard(
                    title = "Database Notes",
                    count = notes.size.toString().padStart(2, '0'),
                    icon = Icons.Default.StickyNote2,
                    color = Color(0xFFFBC02D),
                    onClick = { onNavigate("notes") }
                )
            }

            item {
                SummaryCard(
                    title = "Expense Records",
                    count = expenses.size.toString().padStart(2, '0'),
                    icon = Icons.Default.Wallet,
                    color = Color(0xFFF44336),
                    onClick = { onNavigate("expenses") }
                )
            }

            item {
                SummaryCard(
                    title = "Habit Tracks",
                    count = habits.size.toString().padStart(2, '0'),
                    icon = Icons.Default.CheckCircle,
                    color = Color(0xFF009688),
                    onClick = { onNavigate("habits") }
                )
            }
        }
    }
}
