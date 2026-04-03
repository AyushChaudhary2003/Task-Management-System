import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import '../models/task_model.dart';
import '../providers/task_provider.dart';
import '../providers/auth_provider.dart';
import 'dart:ui';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(taskProvider.notifier).fetchTasks(refresh: true));
  }

  Future<void> _showAddTaskDialog() async {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    TaskPriority selectedPriority = TaskPriority.medium;
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                  top: 20, left: 24, right: 24
                ),
                decoration: const BoxDecoration(
                  color: Color(0xFF171717),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Create New Task", style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 20),
                    _buildModalInput(controller: titleController, label: "Task Title", icon: LucideIcons.checkSquare),
                    const SizedBox(height: 16),
                    _buildModalInput(controller: descController, label: "Description", icon: LucideIcons.alignLeft, maxLines: 3),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Priority:", style: TextStyle(color: Colors.white70)),
                        DropdownButton<TaskPriority>(
                          value: selectedPriority,
                          dropdownColor: const Color(0xFF171717),
                          items: TaskPriority.values.map((p) => DropdownMenuItem(
                            value: p,
                            child: Text(p.name.toUpperCase(), style: TextStyle(color: _getPriorityColor(p))),
                          )).toList(),
                          onChanged: (val) => setModalState(() => selectedPriority = val!),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Date Picker
                    GestureDetector(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
                          builder: (context, child) => Theme(
                            data: ThemeData.dark().copyWith(
                              colorScheme: const ColorScheme.dark(
                                primary: Color(0xFF8B5CF6),
                                surface: Color(0xFF171717),
                              ),
                            ),
                            child: child!,
                          ),
                        );
                        if (picked != null) setModalState(() => selectedDate = picked);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white10,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.calendar, size: 20, color: Colors.white38),
                            const SizedBox(width: 12),
                            Text(
                              "Due: ${selectedDate.day}/${selectedDate.month}/${selectedDate.year}",
                              style: const TextStyle(color: Colors.white70),
                            ),
                            const Spacer(),
                            const Icon(LucideIcons.chevronRight, size: 16, color: Colors.white38),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          ref.read(taskProvider.notifier).createTask(
                            titleController.text, descController.text, selectedDate, selectedPriority
                          );
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text("Add Task", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildModalInput({required TextEditingController controller, required String label, required IconData icon, int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20, color: Colors.white38),
        filled: true,
        fillColor: Colors.white10,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
    );
  }

  Color _getPriorityColor(TaskPriority p) {
    switch (p) {
      case TaskPriority.high: return const Color(0xFFEF4444);
      case TaskPriority.medium: return const Color(0xFFF59E0B);
      case TaskPriority.low: return const Color(0xFF10B981);
    }
  }

  @override
  Widget build(BuildContext context) {
    final taskState = ref.watch(taskProvider);
    final authState = ref.watch(authProvider);
    final username = authState.username ?? 'User';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Stack(
        children: [
          SafeArea(
            child: RefreshIndicator(
              onRefresh: () => ref.read(taskProvider.notifier).fetchTasks(refresh: true),
              color: const Color(0xFF8B5CF6),
              child: CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 180,
                    floating: false,
                    pinned: true,
                    backgroundColor: const Color(0xFF0A0A0A),
                    actions: [
                      IconButton(
                        icon: const Icon(LucideIcons.logOut, color: Colors.white54),
                        onPressed: () => ref.read(authProvider.notifier).logout(),
                      ),
                      const SizedBox(width: 8),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 20),
                            Text("Hi, $username 👋", style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold)),
                            Text("${taskState.tasks.length} active tasks", style: GoogleFonts.inter(color: Colors.white54)),
                          ],
                        ),
                      ),
                    ),
                    bottom: PreferredSize(
                      preferredSize: const Size.fromHeight(80),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white10),
                              ),
                              child: TextField(
                                controller: _searchController,
                                onChanged: (val) => ref.read(taskProvider.notifier).fetchTasks(search: val, refresh: true),
                                style: GoogleFonts.inter(color: Colors.white),
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(LucideIcons.search, color: Colors.white38, size: 20),
                                  hintText: "Search by ID or title...",
                                  hintStyle: TextStyle(color: Colors.white38),
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  if (taskState.isLoading && taskState.tasks.isEmpty)
                    const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
                  else if (taskState.tasks.isEmpty)
                    SliverFillRemaining(child: Center(child: Text("No tasks found", style: GoogleFonts.inter(color: Colors.white54))))
                  else
                    SliverPadding(
                      padding: const EdgeInsets.all(24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final task = taskState.tasks[index];
                            return _buildTaskCard(task);
                          },
                          childCount: taskState.tasks.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddTaskDialog,
        backgroundColor: const Color(0xFF8B5CF6),
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ),
    );
  }

  Widget _buildTaskCard(Task task) {
    final priorityColor = _getPriorityColor(task.priority);
    final isCompleted = task.status == TaskStatus.completed;

    return FadeInUp(
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isCompleted
                ? Colors.green.withOpacity(0.3)
                : Colors.white.withOpacity(0.05),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: checkbox + title + priority dot + delete
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 12, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Checkbox
                  Checkbox(
                    value: isCompleted,
                    activeColor: const Color(0xFF8B5CF6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    onChanged: (_) => ref.read(taskProvider.notifier).updateTaskStatus(
                      task.id,
                      isCompleted ? 'PENDING' : 'COMPLETED',
                    ),
                  ),
                  // Title + description
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            task.title,
                            style: GoogleFonts.outfit(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: isCompleted ? Colors.white38 : Colors.white,
                              decoration: isCompleted ? TextDecoration.lineThrough : null,
                              decorationColor: Colors.white38,
                            ),
                          ),
                          if (task.description.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              task.description,
                              style: GoogleFonts.inter(color: Colors.white38, fontSize: 13),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  // Priority dot
                  Padding(
                    padding: const EdgeInsets.only(top: 14, left: 8),
                    child: Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: priorityColor,
                        boxShadow: [BoxShadow(color: priorityColor.withOpacity(0.5), blurRadius: 8)],
                      ),
                    ),
                  ),
                  // Delete button
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, size: 16, color: Colors.redAccent),
                    onPressed: () => ref.read(taskProvider.notifier).deleteTask(task.id),
                  ),
                ],
              ),
            ),

            // Bottom row: ID + due date + status chips
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
              child: Row(
                children: [
                  // Task ID badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      "#${task.id}",
                      style: GoogleFonts.inter(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Due date
                  Row(
                    children: [
                      const Icon(LucideIcons.calendar, size: 12, color: Colors.white38),
                      const SizedBox(width: 4),
                      Text(
                        "${task.dueDate.day}/${task.dueDate.month}/${task.dueDate.year}",
                        style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Status selector chips
                  _buildStatusChips(task),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChips(Task task) {
    final statuses = [
      (TaskStatus.pending, 'Pending', Colors.orange),
      (TaskStatus.inProgress, 'In Progress', Colors.blue),
      (TaskStatus.completed, 'Done', Colors.green),
    ];

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: statuses.map((entry) {
        final (status, label, color) = entry;
        final isSelected = task.status == status;
        return GestureDetector(
          onTap: () {
            String apiStatus;
            switch (status) {
              case TaskStatus.pending: apiStatus = 'PENDING'; break;
              case TaskStatus.inProgress: apiStatus = 'IN_PROGRESS'; break;
              case TaskStatus.completed: apiStatus = 'COMPLETED'; break;
            }
            ref.read(taskProvider.notifier).updateTaskStatus(task.id, apiStatus);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(left: 4),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isSelected ? color.withOpacity(0.2) : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? color.withOpacity(0.6) : Colors.white12,
                width: 1,
              ),
            ),
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? color : Colors.white38,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
