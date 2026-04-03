import 'package:dio/dio.dart';
import 'storage_service.dart';

class ApiService {
  final Dio _dio = Dio();
  final StorageService _storage = StorageService();

  // Change this to your local machine IP (e.g., http://192.168.1.10:3000) for real tablet testing
  static const String baseUrl = 'http://localhost:3000'; 

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    _dio.options.sendTimeout = const Duration(seconds: 10);
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 403 || e.response?.statusCode == 401) {
            // Attempt to refresh token
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null) {
              try {
                final response = await _dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
                final newAccessToken = response.data['accessToken'];
                await _storage.saveAccessToken(newAccessToken);

                // Retry the original request
                e.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final retryResponse = await _dio.request(
                  e.requestOptions.path,
                  options: Options(
                    method: e.requestOptions.method,
                    headers: e.requestOptions.headers,
                  ),
                  data: e.requestOptions.data,
                  queryParameters: e.requestOptions.queryParameters,
                );
                return handler.resolve(retryResponse);
              } catch (refreshError) {
                await _storage.clearTokens();
                // Optionally trigger a logout event here
              }
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  // Auth Endpoints
  Future<Response> register(String email, String password) => _dio.post('/auth/register', data: {'email': email, 'password': password});
  Future<Response> login(String email, String password) => _dio.post('/auth/login', data: {'email': email, 'password': password});
  Future<void> logout() async {
    await _dio.post('/auth/logout');
    await _storage.clearTokens();
  }

  // Task Endpoints
  Future<Response> getTasks({int page = 1, int limit = 10, String search = ''}) => 
      _dio.get('/tasks', queryParameters: {'page': page, 'limit': limit, 'search': search});
  Future<Response> createTask(Map<String, dynamic> data) => _dio.post('/tasks', data: data);
  Future<Response> updateTask(String id, Map<String, dynamic> data) => _dio.patch('/tasks/$id', data: data);
  Future<Response> deleteTask(String id) => _dio.delete('/tasks/$id');
  Future<Response> toggleTask(String id) => _dio.patch('/tasks/$id/toggle');
}
