import 'dart:math';

enum TaskStatus { pending, inProgress, completed }
enum TaskPriority { low, medium, high }

class Task {
  final String id; // Unique 8-digit ID
  final String title;
  final String description;
  final DateTime dueDate;
  final TaskStatus status;
  final TaskPriority priority;

  Task({
    required this.id,
    required this.title,
    required this.description,
    required this.dueDate,
    this.status = TaskStatus.pending,
    this.priority = TaskPriority.medium,
  });

  // Factory to generate a task with a unique 8-digit numeric ID
  factory Task.create({
    required String title,
    required String description,
    required DateTime dueDate,
    TaskPriority priority = TaskPriority.medium,
  }) {
    final random = Random();
    final id = (10000000 + random.nextInt(90000000)).toString();
    return Task(
      id: id,
      title: title,
      description: description,
      dueDate: dueDate,
      priority: priority,
    );
  }

  Task copyWith({
    String? title,
    String? description,
    DateTime? dueDate,
    TaskStatus? status,
    TaskPriority? priority,
  }) {
    return Task(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      priority: priority ?? this.priority,
    );
  }
}
