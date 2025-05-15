// import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ScP App',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('ScP Social')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            HomeButton(label: '📢 ฟีดโพสต์', onPressed: () {}),
            HomeButton(label: '🚨 รายชื่อคนโกง', onPressed: () {}),
            HomeButton(label: '🛒 ร้านค้า', onPressed: () {}),
            HomeButton(label: '👤 โปรไฟล์', onPressed: () {}),
          ],
        ),
      ),
    );
  }
}

class HomeButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  const HomeButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: ElevatedButton(
        onPressed: onPressed,
        child: Text(label, style: TextStyle(fontSize: 20)),
      ),
    );
  }
}
