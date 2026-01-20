import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'login_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({Key? key}) : super(key: key);

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  // Title
                  Text(
                    'ShareCare',
                    style: Theme.of(context).textTheme.displayLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Real people. Real solutions.',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.normal,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const Spacer(),

                  // Illustrations
                  Expanded(
                    flex: 4,
                    child: Stack(
                      children: [
                        // Background blobs
                        Positioned(
                          top: 0,
                          left: 0,
                          child: _buildBlob(200, 200, AppColors.accentLight.withOpacity(0.6)),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: _buildBlob(180, 180, AppColors.decorativeYellow.withOpacity(0.4)),
                        ),

                        // Illustration elements
                        Positioned(
                          top: 40,
                          left: 20,
                          child: _IllustrationCard(
                            icon: Icons.weekend_outlined,
                            color: AppColors.categorySnack,
                          ),
                        ),
                        Positioned(
                          top: 60,
                          right: 20,
                          child: _IllustrationCard(
                            icon: Icons.favorite,
                            color: AppColors.categoryRecipe,
                          ),
                        ),
                        Positioned(
                          bottom: 80,
                          left: 30,
                          child: _IllustrationCard(
                            icon: Icons.directions_walk,
                            color: AppColors.categoryExercise,
                          ),
                        ),
                        Positioned(
                          bottom: 100,
                          right: 40,
                          child: _IllustrationCard(
                            icon: Icons.spa_outlined,
                            color: AppColors.categoryTip,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // Get Started Button
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Get Started',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBlob(double width, double height, Color color) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(100),
      ),
    );
  }
}

class _IllustrationCard extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _IllustrationCard({
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
      ),
      child: Icon(
        icon,
        size: 32,
        color: color,
      ),
    );
  }
}