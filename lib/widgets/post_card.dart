import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/post_model.dart';

class PostCard extends StatelessWidget {
  final Post post;

  const PostCard({
    Key? key,
    required this.post,
  }) : super(key: key);

  Color _getCategoryColor() {
    switch (post.category) {
      case PostCategory.recipe:
        return AppColors.categoryRecipe;
      case PostCategory.exercise:
        return AppColors.categoryExercise;
      case PostCategory.snack:
        return AppColors.categorySnack;
      case PostCategory.tip:
        return AppColors.categoryTip;
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoryColor = _getCategoryColor();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // User avatar
              CircleAvatar(
                radius: 24,
                backgroundImage: NetworkImage(post.userImage),
                backgroundColor: AppColors.accentLight,
              ),
              const SizedBox(width: 12),

              // User name
              Expanded(
                child: Text(
                  post.userName,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),

              // Category badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: categoryColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  post.categoryLabel,
                  style: TextStyle(
                    color: categoryColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Content
          Text(
            post.content,
            style: Theme.of(context).textTheme.bodyLarge,
          ),

          const SizedBox(height: 12),

          // Rating
          Row(
            children: List.generate(5, (index) {
              final filled = index < post.rating.floor();
              final half = index < post.rating && index >= post.rating.floor();

              return Icon(
                half ? Icons.star_half : Icons.star,
                size: 20,
                color: filled || half ? AppColors.starActive : AppColors.starInactive,
              );
            }),
          ),

          const SizedBox(height: 12),

          // Likes and Comments
          Row(
            children: [
              Icon(
                Icons.favorite_border,
                size: 20,
                color: AppColors.textLight,
              ),
              const SizedBox(width: 4),
              Text(
                '${post.likes}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 20),
              Icon(
                Icons.chat_bubble_outline,
                size: 20,
                color: AppColors.textLight,
              ),
              const SizedBox(width: 4),
              Text(
                '${post.comments}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}