import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task_model.dart';
import 'auth_provider.dart';

class TaskState {
  final List<Task> tasks;
  final bool isLoading;
  final String? error;
  final int page;
  final int totalPages;

  TaskState({
    this.tasks = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.totalPages = 1,
  });

  TaskState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    String? error,
    int? page,
    int? totalPages,
  }) {
    return TaskState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
    );
  }
}

class TaskNotifier extends Notifier<TaskState> {
  @override
  TaskState build() {
    return TaskState();
  }

  Future<void> fetchTasks({int page = 1, String search = '', bool refresh = false}) async {
    if (refresh) state = state.copyWith(tasks: [], page: 1, isLoading: true);
    else state = state.copyWith(isLoading: true);

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.getTasks(page: page, search: search);
      
      final dynamic rawTasks = response.data['tasks'];
      final List<Task> fetchedTasks = (rawTasks as List).map((t) {
        return Task(
          id: t['id'],
          title: t['title'],
          description: t['description'] ?? '',
          status: _parseStatus(t['status']),
          priority: TaskPriority.values.firstWhere((e) => e.name.toUpperCase() == t['priority']),
          dueDate: DateTime.parse(t['dueDate']),
        );
      }).toList();

      state = state.copyWith(
        tasks: refresh ? fetchedTasks : [...state.tasks, ...fetchedTasks],
        page: page,
        totalPages: response.data['totalPages'],
        isLoading: false,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load tasks');
    }
  }

  Future<void> createTask(String title, String description, DateTime dueDate, TaskPriority priority) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.createTask({
        'title': title,
        'description': description,
        'dueDate': dueDate.toIso8601String(),
        'priority': priority.name.toUpperCase(),
      });
      fetchTasks(refresh: true);
    } catch (e) {
      state = state.copyWith(error: 'Failed to create task');
    }
  }

  Future<void> toggleTask(String taskId) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.toggleTask(taskId);
      state = state.copyWith(
        tasks: state.tasks.map((t) => t.id == taskId 
          ? t.copyWith(status: t.status == TaskStatus.completed ? TaskStatus.pending : TaskStatus.completed) 
          : t).toList()
      );
    } catch (e) {
      state = state.copyWith(error: 'Failed to toggle task');
    }
  }

  Future<void> updateTaskStatus(String taskId, String status) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.updateTask(taskId, {'status': status});
      state = state.copyWith(
        tasks: state.tasks.map((t) => t.id == taskId
          ? t.copyWith(status: _parseStatus(status))
          : t).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: 'Failed to update task status');
    }
  }

  Future<void> deleteTask(String taskId) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.deleteTask(taskId);
      state = state.copyWith(tasks: state.tasks.where((t) => t.id != taskId).toList());
    } catch (e) {
      state = state.copyWith(error: 'Failed to delete task');
    }
  }

  TaskStatus _parseStatus(String s) {
    switch (s) {
      case 'COMPLETED': return TaskStatus.completed;
      case 'IN_PROGRESS': return TaskStatus.inProgress;
      default: return TaskStatus.pending;
    }
  }
}

final taskProvider = NotifierProvider<TaskNotifier, TaskState>(TaskNotifier.new);
