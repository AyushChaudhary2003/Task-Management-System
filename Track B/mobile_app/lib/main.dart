import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import 'screens/dashboard_screen.dart';
import 'providers/auth_provider.dart';

void main() {
  runApp(const ProviderScope(child: TaskManagerApp()));
}

class TaskManagerApp extends ConsumerWidget {
  const TaskManagerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    if (authState.status == AuthStatus.initial) {
      Future.microtask(() => ref.read(authProvider.notifier).checkAuthStatus());
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Codexia Task Manager',
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B5CF6),
          primary: const Color(0xFF8B5CF6),
          secondary: const Color(0xFFD946EF),
          surface: const Color(0xFF171717),
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
      ),
      home: _getHome(authState.status),
    );
  }

  Widget _getHome(AuthStatus status) {
    if (status == AuthStatus.authenticated) return const DashboardScreen();
    return const LoginPage();
  }
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  String? _emailError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _validateEmail(String value) {
    setState(() {
      if (value.isEmpty) {
        _emailError = null;
      } else if (!RegExp(r'^[a-zA-Z0-9._%+\-]+@gmail\.com$').hasMatch(value)) {
        _emailError = 'Please enter a valid Gmail address';
      } else {
        _emailError = null;
      }
    });
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      _showSnackbar('Please enter your email and password.');
      return;
    }
    if (_emailError != null) {
      _showSnackbar('Please enter a valid Gmail address.');
      return;
    }

    setState(() => _isLoading = true);
    final success = await ref.read(authProvider.notifier).login(email, password);
    if (mounted) setState(() => _isLoading = false);

    if (!success && mounted) {
      final error = ref.read(authProvider).error ?? 'Login failed. Check your credentials.';
      _showSnackbar(error);
    }
  }

  void _showSnackbar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background orb
          Positioned(
            top: -100, right: -50,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8B5CF6).withOpacity(0.12),
              ),
            ),
          ),
          Positioned(
            bottom: -80, left: -60,
            child: Container(
              width: 250, height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFD946EF).withOpacity(0.08),
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28.0),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 70),

                    FadeInDown(
                      duration: const Duration(milliseconds: 700),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo mark
                          Container(
                            width: 52, height: 52,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              gradient: const LinearGradient(
                                colors: [Color(0xFF8B5CF6), Color(0xFFD946EF)],
                              ),
                            ),
                            child: const Icon(LucideIcons.checkSquare, color: Colors.white, size: 26),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Welcome Back',
                            style: GoogleFonts.outfit(
                              fontSize: 34, fontWeight: FontWeight.bold, letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sign in to manage your tasks',
                            style: GoogleFonts.inter(fontSize: 15, color: Colors.white54),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 48),

                    FadeInUp(duration: const Duration(milliseconds: 600), child:
                      _buildField(
                        controller: _emailController,
                        label: 'Gmail Address',
                        icon: LucideIcons.mail,
                        errorText: _emailError,
                        onChanged: _validateEmail,
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ),
                    const SizedBox(height: 16),
                    FadeInUp(duration: const Duration(milliseconds: 650), child:
                      _buildField(
                        controller: _passwordController,
                        label: 'Password',
                        icon: LucideIcons.lock,
                        obscureText: !_isPasswordVisible,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible ? LucideIcons.eye : LucideIcons.eyeOff,
                            size: 20, color: Colors.white38,
                          ),
                          onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        child: Text('Forgot Password?',
                          style: GoogleFonts.inter(color: const Color(0xFF8B5CF6), fontSize: 13)),
                      ),
                    ),

                    const SizedBox(height: 28),

                    FadeInUp(duration: const Duration(milliseconds: 700), child:
                      _buildGradientButton(
                        label: _isLoading ? 'Signing In...' : 'Sign In',
                        onTap: _isLoading ? null : _handleLogin,
                        icon: LucideIcons.logIn,
                      ),
                    ),

                    const SizedBox(height: 28),

                    FadeInUp(duration: const Duration(milliseconds: 750), child:
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text("Don't have an account? ",
                            style: GoogleFonts.inter(color: Colors.white54, fontSize: 14)),
                          TextButton(
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const RegisterPage()),
                            ),

                            child: Text('Create One',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF8B5CF6),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradientButton({required String label, required VoidCallback? onTap, required IconData icon}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity, height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: onTap == null
                ? [Colors.grey.shade700, Colors.grey.shade600]
                : [const Color(0xFF8B5CF6), const Color(0xFFD946EF)],
          ),
          boxShadow: onTap == null ? [] : [
            BoxShadow(color: const Color(0xFF8B5CF6).withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Text(label, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    String? errorText,
    Function(String)? onChanged,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF171717),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: errorText != null ? Colors.redAccent.withOpacity(0.5) : Colors.white10,
              width: 1.5,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            onChanged: onChanged,
            keyboardType: keyboardType,
            style: GoogleFonts.inter(color: Colors.white),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: const TextStyle(color: Colors.white38),
              prefixIcon: Icon(icon, color: Colors.white38, size: 20),
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(errorText, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// REGISTER PAGE
// ─────────────────────────────────────────────
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;
  String? _emailError;
  String? _passwordError;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _validateEmail(String value) {
    setState(() {
      if (value.isEmpty) {
        _emailError = null;
      } else if (!RegExp(r'^[a-zA-Z0-9._%+\-]+@gmail\.com$').hasMatch(value)) {
        _emailError = 'Please enter a valid Gmail address';
      } else {
        _emailError = null;
      }
    });
  }

  void _validatePassword(String value) {
    setState(() {
      if (value.isEmpty) {
        _passwordError = null;
      } else if (value.length < 6) {
        _passwordError = 'Password must be at least 6 characters';
      } else {
        _passwordError = null;
      }
    });
  }

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      _showSnackbar('Please fill in all fields.');
      return;
    }
    if (_emailError != null) {
      _showSnackbar('Please enter a valid Gmail address.');
      return;
    }
    if (_passwordError != null) {
      _showSnackbar(_passwordError!);
      return;
    }
    if (password != confirm) {
      _showSnackbar('Passwords do not match.');
      return;
    }

    setState(() => _isLoading = true);
    final success = await ref.read(authProvider.notifier).register(email, password);
    if (mounted) setState(() => _isLoading = false);

    if (success && mounted) {
      _showSnackbar('✅ Account created! Please sign in.');
      await Future.delayed(const Duration(milliseconds: 800));
      if (mounted) Navigator.pop(context); // go back to login
    } else if (mounted) {
      final error = ref.read(authProvider).error ?? 'Registration failed.';
      _showSnackbar(error);
    }
  }

  void _showSnackbar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background orbs
          Positioned(
            top: -80, left: -60,
            child: Container(
              width: 280, height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFD946EF).withOpacity(0.10),
              ),
            ),
          ),
          Positioned(
            bottom: -60, right: -40,
            child: Container(
              width: 220, height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8B5CF6).withOpacity(0.10),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Back button header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.arrowLeft, color: Colors.white70),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Text('Back to Sign In',
                        style: GoogleFonts.inter(color: Colors.white54, fontSize: 14)),
                    ],
                  ),
                ),

                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28.0),
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 16),

                          FadeInDown(duration: const Duration(milliseconds: 600), child:
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 52, height: 52,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(14),
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFFD946EF), Color(0xFF8B5CF6)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: const Icon(LucideIcons.userPlus, color: Colors.white, size: 24),
                                ),
                                const SizedBox(height: 20),
                                Text('Create Account',
                                  style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: -0.5)),
                                const SizedBox(height: 8),
                                Text('Fill in your details to get started',
                                  style: GoogleFonts.inter(fontSize: 14, color: Colors.white54)),
                              ],
                            ),
                          ),

                          const SizedBox(height: 36),

                          FadeInUp(duration: const Duration(milliseconds: 550), child:
                            _buildField(controller: _nameController, label: 'Full Name', icon: LucideIcons.user),
                          ),
                          const SizedBox(height: 16),
                          FadeInUp(duration: const Duration(milliseconds: 600), child:
                            _buildField(
                              controller: _emailController,
                              label: 'Gmail Address',
                              icon: LucideIcons.mail,
                              errorText: _emailError,
                              onChanged: _validateEmail,
                              keyboardType: TextInputType.emailAddress,
                            ),
                          ),
                          const SizedBox(height: 16),
                          FadeInUp(duration: const Duration(milliseconds: 650), child:
                            _buildField(
                              controller: _passwordController,
                              label: 'Password',
                              icon: LucideIcons.lock,
                              obscureText: !_isPasswordVisible,
                              errorText: _passwordError,
                              onChanged: _validatePassword,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isPasswordVisible ? LucideIcons.eye : LucideIcons.eyeOff,
                                  size: 20, color: Colors.white38,
                                ),
                                onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          FadeInUp(duration: const Duration(milliseconds: 700), child:
                            _buildField(
                              controller: _confirmPasswordController,
                              label: 'Confirm Password',
                              icon: LucideIcons.lock,
                              obscureText: !_isConfirmPasswordVisible,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isConfirmPasswordVisible ? LucideIcons.eye : LucideIcons.eyeOff,
                                  size: 20, color: Colors.white38,
                                ),
                                onPressed: () => setState(() => _isConfirmPasswordVisible = !_isConfirmPasswordVisible),
                              ),
                            ),
                          ),

                          const SizedBox(height: 32),

                          FadeInUp(duration: const Duration(milliseconds: 750), child:
                            _buildGradientButton(
                              label: _isLoading ? 'Creating Account...' : 'Sign Up',
                              onTap: _isLoading ? null : _handleRegister,
                            ),
                          ),

                          const SizedBox(height: 24),
                          FadeInUp(duration: const Duration(milliseconds: 800), child:
                            Center(
                              child: GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: RichText(
                                  text: TextSpan(
                                    text: 'Already have an account? ',
                                    style: GoogleFonts.inter(color: Colors.white54, fontSize: 14),
                                    children: [
                                      TextSpan(
                                        text: 'Sign In',
                                        style: GoogleFonts.inter(
                                          color: const Color(0xFF8B5CF6),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradientButton({required String label, required VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity, height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: onTap == null
                ? [Colors.grey.shade700, Colors.grey.shade600]
                : [const Color(0xFFD946EF), const Color(0xFF8B5CF6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: onTap == null ? [] : [
            BoxShadow(color: const Color(0xFF8B5CF6).withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.userPlus, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Text(label, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    String? errorText,
    Function(String)? onChanged,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF171717),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: errorText != null ? Colors.redAccent.withOpacity(0.5) : Colors.white10,
              width: 1.5,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            onChanged: onChanged,
            keyboardType: keyboardType,
            style: GoogleFonts.inter(color: Colors.white),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: const TextStyle(color: Colors.white38),
              prefixIcon: Icon(icon, color: Colors.white38, size: 20),
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(errorText, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
          ),
      ],
    );
  }
}
