import 'package:flutter/material.dart';

class CheckersPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const int boardSize = 8;

    return Scaffold(
      appBar: AppBar(title: Text('เกมหมากฮอต')),
      body: Center(
        child: AspectRatio(
          aspectRatio: 1,
          child: GridView.builder(
            itemCount: boardSize * boardSize,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: boardSize,
            ),
            itemBuilder: (context, index) {
              final row = index ~/ boardSize;
              final col = index % boardSize;
              final isDark = (row + col) % 2 == 1;

              return Container(
                color: isDark ? Colors.brown : Colors.white,
                child: Center(
                  child: _buildPiece(row, col),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildPiece(int row, int col) {
    // ตัวหมากเบื้องต้น: วางบน 3 แถวแรกและ 3 แถวล่าง
    if (row < 3 && (row + col) % 2 == 1) {
      return _piece(Colors.red);
    } else if (row >= 5 && (row + col) % 2 == 1) {
      return _piece(Colors.black);
    }
    return SizedBox.shrink();
  }

  Widget _piece(Color color) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}
