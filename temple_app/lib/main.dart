<<<<<<< HEAD
import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const TempleAttendanceApp());
}

class TempleAttendanceApp extends StatelessWidget {
  const TempleAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Temple Attendance Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const LoginScreen(),
    );
  }
}
=======
import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/database_service.dart';
import 'services/location_service.dart';
import 'services/sync_service.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  await _initializeServices();
  
  runApp(const TempleAttendanceApp());
}

/// Initialize all required services
Future<void> _initializeServices() async {
  try {
    print('Initializing services...');
    
    // Initialize local database (Hive)
    final dbService = DatabaseService();
    await dbService.initialize();
    print('✅ Database initialized');
    
    // Load saved tokens
    final apiClient = ApiClient();
    await apiClient.loadTokens();
    if (apiClient.hasToken) {
      print('✅ Existing session found');
      // Try to restore user session
      final authService = AuthService();
      await authService.restoreSession();
    }
    
    // Initialize location service and fetch config
    final locationService = LocationService();
    try {
      await locationService.fetchLocationConfig();
      print('✅ Location config fetched');
    } catch (e) {
      print('⚠️ Failed to fetch location config (will use offline if available): $e');
    }
    
    // Initialize sync service
    final syncService = SyncService();
    await syncService.initialize();
    print('✅ Sync service initialized');
    
    // Trigger initial sync if connected
    syncService.syncPendingRecords().then((result) {
      if (result['success']) {
        print('✅ Initial sync completed: ${result['synced']} record(s)');
      }
    });
    
    print('✅ All services initialized successfully');
  } catch (e) {
    print('❌ Error initializing services: $e');
    // Continue app startup even if initialization fails
  }
}

class TempleAttendanceApp extends StatelessWidget {
  const TempleAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Temple Attendance Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const AuthCheck(),
    );
  }
}

/// Check if user is already logged in
class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final authService = AuthService();
    final user = authService.getCurrentUser();
    
    setState(() {
      _isAuthenticated = user != null;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isAuthenticated ? const HomeScreen() : const LoginScreen();
  }
}
>>>>>>> d021c7216f4acb36923366d2dd0e6b659f065c74
