import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/user_model.dart';
import '../config/api_config.dart';
import 'api_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiClient _apiClient = ApiClient();
  User? _currentUser;

  /// Decode JWT token to extract user information
  Map<String, dynamic>? _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      return json.decode(decoded);
    } catch (e) {
      print('Error decoding JWT: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      // Call backend login API
      final response = await _apiClient.post(
        ApiConfig.loginEndpoint,
        body: {
          'username': username,
          'password': password,
        },
        requiresAuth: false,
      );

      // Extract tokens from response
      final accessToken = response['access_token'];
      final refreshToken = response['refresh_token'];
      
      // Decode JWT to get user information
      final tokenData = _decodeJwt(accessToken);
      if (tokenData == null) {
        return {
          'success': false,
          'message': 'Failed to decode authentication token',
        };
      }
      
      // Save tokens
      await _apiClient.saveTokens(accessToken, refreshToken);

      // Create user object from JWT token data
      _currentUser = User(
        id: tokenData['user_id'] ?? username,  // MongoDB ObjectId from token
        name: tokenData['sub'] ?? username,     // Username from token
        email: '$username@temple.com',
        role: tokenData['role'] ?? 'Priest',
        phone: null,
      );

      // Save user data to shared preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userId', _currentUser!.id);
      await prefs.setString('userName', _currentUser!.name);
      await prefs.setString('userEmail', _currentUser!.email);
      await prefs.setString('userRole', _currentUser!.role);

      return {
        'success': true,
        'message': 'Login successful',
        'user': _currentUser,
      };
    } on UnauthorizedException {
      return {
        'success': false,
        'message': 'Invalid username or password',
      };
    } catch (e) {
      print('Login error: $e');
      return {
        'success': false,
        'message': 'Connection error. Please check your network.',
      };
    }
  }

  Future<void> logout() async {
    try {
      // Call backend logout endpoint
      await _apiClient.post(ApiConfig.logoutEndpoint);
    } catch (e) {
      print('Logout error: $e');
    } finally {
      // Clear tokens and user data
      await _apiClient.clearTokens();
      _currentUser = null;
      
      // Clear shared preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('userId');
      await prefs.remove('userName');
      await prefs.remove('userEmail');
      await prefs.remove('userRole');
    }
  }

  User? getCurrentUser() {
    return _currentUser;
  }

  bool isLoggedIn() {
    return _currentUser != null && _apiClient.hasToken;
  }

  Future<void> loadUserFromPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('userId');
    
    if (userId != null) {
      _currentUser = User(
        id: userId,
        name: prefs.getString('userName') ?? '',
        email: prefs.getString('userEmail') ?? '',
        role: prefs.getString('userRole') ?? 'Priest',
        phone: prefs.getString('userPhone'),
      );
      
      // Load tokens
      await _apiClient.loadTokens();
    }
  }

  /// Restore user session from saved data
  Future<bool> restoreSession() async {
    try {
      await loadUserFromPreferences();
      return _currentUser != null && _apiClient.hasToken;
    } catch (e) {
      print('Error restoring session: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> updateProfile(User updatedUser) async {
    try {
      // Update local user object
      _currentUser = updatedUser;
      
      // Save to shared preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userId', updatedUser.id);
      await prefs.setString('userName', updatedUser.name);
      await prefs.setString('userEmail', updatedUser.email);
      await prefs.setString('userRole', updatedUser.role);
      if (updatedUser.phone != null && updatedUser.phone!.isNotEmpty) {
        await prefs.setString('userPhone', updatedUser.phone!);
      }
      
      return {
        'success': true,
        'message': 'Profile updated successfully',
        'user': _currentUser,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to update profile',
      };
    }
  }
}
