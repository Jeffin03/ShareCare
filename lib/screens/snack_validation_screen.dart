import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class SnackValidationScreen extends StatelessWidget {
  const SnackValidationScreen({Key? key}) : super(key: key);

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
        title: Text(
          'Snack Validation',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontSize: 26,
          ),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Snack card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Image section
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(20),
                          ),
                          child: Container(
                            height: 200,
                            width: double.infinity,
                            color: AppColors.accentLight,
                            child: Image.network(
                              'https://images.unsplash.com/photo-1606312619070-d48b4cda6df4?w=500',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Center(
                                  child: Icon(
                                    Icons.image,
                                    size: 64,
                                    color: AppColors.textLight,
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        Positioned(
                          top: 16,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.favorite_border,
                              color: AppColors.primaryLight,
                              size: 24,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Content section
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dark Chocolate: ',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontSize: 20,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Satisfying, rich, and lower in sugar for a balanced treat.',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),

                          const SizedBox(height: 20),

                          // Community Rating
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.accentLight.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Row(
                                  children: List.generate(5, (index) {
                                    final filled = index < 4;
                                    final half = index == 4;

                                    return Icon(
                                      half ? Icons.star_half : Icons.star,
                                      size: 24,
                                      color: filled || half
                                          ? AppColors.categoryTip
                                          : AppColors.starInactive,
                                    );
                                  }),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Community Rating:',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        '4.5 (128 reviews)',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Tags
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _TagChip(
                                label: 'Occasional',
                                color: AppColors.categorySnack,
                              ),
                              _TagChip(
                                label: 'Festival-safe',
                                color: AppColors.categoryExercise,
                              ),
                              _TagChip(
                                label: 'Personal experience',
                                color: AppColors.primaryLight,
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          TextButton(
                            onPressed: () {},
                            child: const Text(
                              'See more tags',
                              style: TextStyle(
                                color: AppColors.primaryLight,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Comments section
              _CommentItem(
                name: 'SarahK 🌷',
                comment: 'Tastes great in moderation. I pair it with almonds.',
                timeAgo: '2h ago',
                avatar: 'https://i.pravatar.cc/150?img=5',
              ),

              const SizedBox(height: 12),

              _CommentItem(
                name: 'MikeD 🚴',
                comment: 'Great for holidays! I just track it.',
                timeAgo: '5h ago',
                avatar: 'https://i.pravatar.cc/150?img=12',
              ),

              const SizedBox(height: 12),

              _CommentItem(
                name: 'EmilyR 📚',
                comment: 'My favorite go-to when I need a boost.',
                timeAgo: '1d ago',
                avatar: 'https://i.pravatar.cc/150?img=9',
              ),

              const SizedBox(height: 16),

              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primaryLight, width: 2),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  'View all 128 comments',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),

              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavBar(context),
    );
  }

  Widget _buildBottomNavBar(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavBarIcon(Icons.home, isActive: true),
              _NavBarIcon(Icons.search),
              _NavBarIcon(Icons.person_outline),
              _NavBarIcon(Icons.settings_outlined),
            ],
          ),
        ),
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

class _CommentItem extends StatelessWidget {
  final String name;
  final String comment;
  final String timeAgo;
  final String avatar;

  const _CommentItem({
    required this.name,
    required this.comment,
    required this.timeAgo,
    required this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.decorativeBlue.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundImage: NetworkImage(avatar),
            backgroundColor: AppColors.accentLight,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  comment,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  '- $timeAgo',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textLight,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavBarIcon extends StatelessWidget {
  final IconData icon;
  final bool isActive;

  const _NavBarIcon(this.icon, {this.isActive = false});

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      color: isActive ? AppColors.primaryLight : AppColors.textLight,
      size: 28,
    );
  }
}