
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:task_management_system/main.dart';

void main() {
  testWidgets('App starts and shows login page', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TaskManagerApp()));
    await tester.pump();
    expect(find.text('Welcome Back'), findsOneWidget);
  });
}
