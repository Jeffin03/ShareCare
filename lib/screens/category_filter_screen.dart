import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'medicine_insights_screen.dart';
import 'recipe_detail_screen.dart';
import 'exercise_detail_screen.dart';
import 'snack_validation_screen.dart';
import 'disclaimer_screen.dart';

class CategoryFilterScreen extends StatelessWidget {
  const CategoryFilterScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.accentLight,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 60),

              Text(
                'Explore Categories',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontSize: 36,
                ),
                textAlign: TextAlign.center,
              ),

              const Spacer(),

              // Categories
              _CategoryButton(
                icon: Icons.restaurant_outlined,
                label: 'Recipes',
                color: AppColors.categoryRecipe,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const RecipeDetailScreen()),
                ),
              ),

              const SizedBox(height: 16),

              _CategoryButton(
                icon: Icons.directions_run,
                label: 'Exercises',
                color: AppColors.categoryExercise,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ExerciseDetailScreen()),
                ),
              ),

              const SizedBox(height: 16),

              _CategoryButton(
                icon: Icons.apple_outlined,
                label: 'Snacks',
                color: AppColors.categorySnack,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SnackValidationScreen()),
                ),
              ),

              const SizedBox(height: 16),

              _CategoryButton(
                icon: Icons.lightbulb_outline,
                label: 'Tips',
                color: AppColors.categoryTip,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const DisclaimerScreen()),
                ),
              ),

              const Spacer(),

              Text(
                'One-tap interaction design',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _CategoryButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(100),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
          decoration: BoxDecoration(
            color: color.withOpacity(0.3),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: color.withOpacity(0.1), width: 2),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 28,
                  color: color,
                ),
              ),
              const SizedBox(width: 20),
              Text(
                label,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}