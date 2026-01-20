import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class RecipeDetailScreen extends StatelessWidget {
  const RecipeDetailScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Image header with back button and share
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: AppColors.categoryRecipe,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.share, color: AppColors.textPrimary),
                    onPressed: () {},
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage(
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.3),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(30),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Quinoa Bowl',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        fontSize: 32,
                        color: AppColors.categoryRecipe,
                      ),
                    ),

                    const SizedBox(height: 8),

                    Text(
                      '@healthycooking',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textLight,
                        fontSize: 14,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Community ratings
                    Text(
                      'Community ratings',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 18,
                      ),
                    ),

                    const SizedBox(height: 12),

                    _RatingBar(
                      label: 'Taste',
                      rating: 3.0,
                    ),

                    const SizedBox(height: 8),

                    _RatingBar(
                      label: 'Practicality',
                      rating: 3.5,
                    ),

                    const SizedBox(height: 8),

                    _RatingBar(
                      label: 'BG Impact',
                      rating: 3.0,
                    ),

                    const SizedBox(height: 32),

                    // Instructions
                    Text(
                      'Step-by-step instructions',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 18,
                      ),
                    ),

                    const SizedBox(height: 16),

                    _RecipeStep(
                      number: 1,
                      icon: Icons.fireplace,
                      instruction: 'Hock then, fred on, head vegetable llow and polinon from torrato bowl.',
                    ),

                    const SizedBox(height: 16),

                    _RecipeStep(
                      number: 2,
                      icon: Icons.restaurant,
                      instruction: 'Run and allar to negomake alon, soco, taste and add guta quinoa bowl.',
                    ),

                    const SizedBox(height: 16),

                    _RecipeStep(
                      number: 3,
                      icon: Icons.local_cafe,
                      instruction: 'Add thin and definity to saltru,getrom with sticking and tomatoes.',
                    ),

                    const SizedBox(height: 32),

                    // Comments section
                    Text(
                      'Comment Section',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 18,
                      ),
                    ),

                    const SizedBox(height: 16),

                    _CommentItem(
                      userName: 'healthy cooking',
                      userAvatar: 'https://i.pravatar.cc/150?img=25',
                      comment: 'Fhread-Quick quinoa bowl 😍',
                    ),

                    const SizedBox(height: 12),

                    _CommentItem(
                      userName: 'Irania Joetha',
                      userAvatar: 'https://i.pravatar.cc/150?img=16',
                      comment: 'I neally love mtraded that, cover andl. 😊',
                    ),

                    const SizedBox(height: 20),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.textLight.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'User experiences may vary',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                          fontStyle: FontStyle.italic,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingBar extends StatelessWidget {
  final String label;
  final double rating;

  const _RatingBar({
    required this.label,
    required this.rating,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Stack(
            children: [
              Container(
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.categorySnack.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              FractionallySizedBox(
                widthFactor: rating / 5,
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.categorySnack,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Row(
          children: List.generate(4, (index) {
            final filled = index < rating.floor();
            final half = index < rating && index >= rating.floor();

            return Icon(
              half ? Icons.star_half : Icons.star,
              size: 18,
              color: filled || half
                  ? AppColors.categorySnack
                  : AppColors.starInactive,
            );
          }),
        ),
      ],
    );
  }
}

class _RecipeStep extends StatelessWidget {
  final int number;
  final IconData icon;
  final String instruction;

  const _RecipeStep({
    required this.number,
    required this.icon,
    required this.instruction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: const BoxDecoration(
            color: AppColors.categorySnack,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.accentLight.withOpacity(0.3),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 24,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              instruction,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontSize: 15,
                height: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CommentItem extends StatelessWidget {
  final String userName;
  final String userAvatar;
  final String comment;

  const _CommentItem({
    required this.userName,
    required this.userAvatar,
    required this.comment,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.decorativeYellow.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundImage: NetworkImage(userAvatar),
            backgroundColor: AppColors.accentLight,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  comment,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}