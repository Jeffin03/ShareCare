import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class ExerciseDetailScreen extends StatelessWidget {
  const ExerciseDetailScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.accentLight,
      appBar: AppBar(
        backgroundColor: AppColors.accentLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primaryLight),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Hero illustration
            Container(
              height: 250,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.accentLight,
                    AppColors.accentLight.withOpacity(0.5),
                  ],
                ),
              ),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: AppColors.categoryExercise.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.event_seat,
                    size: 100,
                    color: AppColors.categoryExercise,
                  ),
                ),
              ),
            ),

            // Content card
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(30),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chair Yoga Stretch',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        fontSize: 32,
                        color: AppColors.categoryExercise,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Info badges
                    Row(
                      children: [
                        _InfoBadge(
                          icon: Icons.access_time,
                          label: '10 minutes',
                        ),
                        const SizedBox(width: 12),
                        _InfoBadge(
                          icon: Icons.signal_cellular_alt,
                          label: 'Beginner',
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: const [
                        _TagChip(
                          label: 'Chair-friendly',
                          color: AppColors.categoryExercise,
                        ),
                        _TagChip(
                          label: 'Low impact',
                          color: AppColors.primaryLight,
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Instructions
                    _ExerciseStep(
                      number: 1,
                      instruction: 'Sit tall in a sturdy chair, feet flat.',
                    ),

                    const SizedBox(height: 16),

                    _ExerciseStep(
                      number: 2,
                      instruction: 'Inhale, lengthen your spine.',
                    ),

                    const SizedBox(height: 16),

                    _ExerciseStep(
                      number: 3,
                      instruction: 'Exhale, gently twist to the right, holding the chair back.',
                    ),

                    const SizedBox(height: 16),

                    _ExerciseStep(
                      number: 4,
                      instruction: 'Hold for 5 breaths, then repeat on the other side.',
                    ),

                    const SizedBox(height: 32),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.decorativeYellow.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            color: AppColors.categoryTip,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Remember to listen to your body and breathe.',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Start button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.categoryExercise,
                        ),
                        child: const Text(
                          'Start Routine',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBadge extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoBadge({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.accentLight.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: AppColors.textSecondary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  final String label;
  final Color color;

  const _TagChip({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _ExerciseStep extends StatelessWidget {
  final int number;
  final String instruction;

  const _ExerciseStep({
    required this.number,
    required this.instruction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: AppColors.categoryExercise,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number.',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              instruction,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontSize: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}