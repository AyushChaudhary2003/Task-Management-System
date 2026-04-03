import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

final apiServiceProvider = Provider((ref) => ApiService());
final storageServiceProvider = Provider((ref) => StorageService());

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final String? error;
  final String? username;

  AuthState({this.status = AuthStatus.initial, this.error, this.username});

  AuthState copyWith({AuthStatus? status, String? error, String? username}) {
    return AuthState(
      status: status ?? this.status,
      error: error ?? this.error,
      username: username ?? this.username,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Check initial auth status after construction if possible, or leave to manual check
    return AuthState();
  }

  Future<void> checkAuthStatus() async {
    final storage = ref.read(storageServiceProvider);
    final token = await storage.getAccessToken();
    if (token != null) {
      final username = await storage.getUsername() ?? 'User';
      state = state.copyWith(status: AuthStatus.authenticated, username: username);
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> register(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final api = ref.read(apiServiceProvider);
      await api.register(email, password);
      state = state.copyWith(status: AuthStatus.unauthenticated, error: null);
      return true;
    } catch (e) {
      final errorMsg = e.toString().contains('SocketException') || e.toString().contains('Connection')
          ? 'Cannot connect to server. Check your connection.'
          : 'Registration failed: ${e.toString()}';
      state = state.copyWith(status: AuthStatus.unauthenticated, error: errorMsg);
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final api = ref.read(apiServiceProvider);
      final storage = ref.read(storageServiceProvider);
      final response = await api.login(email, password);
      await storage.saveTokens(response.data['accessToken'], response.data['refreshToken']);
      
      final username = _extractName(email);
      await storage.saveUsername(username);

      state = state.copyWith(status: AuthStatus.authenticated, error: null, username: username);
      return true;
    } catch (e) {
      final errorMsg = e.toString().contains('SocketException') || e.toString().contains('Connection')
          ? 'Cannot connect to server. Check your connection.'
          : 'Login failed: ${e.toString()}';
      state = state.copyWith(status: AuthStatus.unauthenticated, error: errorMsg);
      return false;
    }
  }

  Future<void> logout() async {
    final api = ref.read(apiServiceProvider);
    final storage = ref.read(storageServiceProvider);
    try {
      await api.logout();
    } catch (_) {
      // Ignore API errors on logout (e.g., token already invalid on backend)
    } finally {
      await storage.clearTokens();
      state = state.copyWith(status: AuthStatus.unauthenticated, username: null);
    }
  }

  String _extractName(String email) {
    if (email.contains('@')) {
      final String namePart = email.split('@')[0];
      if (namePart.isEmpty) return 'User';
      // Capitalize first letter
      return namePart[0].toUpperCase() + namePart.substring(1);
    }
    return 'User';
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
