import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class MedicineInsightsScreen extends StatelessWidget {
  const MedicineInsightsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.accentLight,
      appBar: AppBar(
        backgroundColor: AppColors.accentLight,
        elevation: 0,
        title: Text(
          'Community Medicine Insights',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontSize: 20,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text(
              'Filter',
              style: TextStyle(
                color: AppColors.primaryLight,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Disclaimer banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.warning.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  color: AppColors.warning,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'This is not medical advice. Always consult your healthcare provider.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Experience filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.textPrimary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'PERSONAL EXPERIENCE',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Insights list
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: const [
                _InsightCard(
                  userName: 'Sarah K.',
                  userAvatar: 'https://i.pravatar.cc/150?img=5',
                  insight: 'Cinnamon capsules helped me manage my morning spikes, but I feel more energetic. My doctor is okay with it!',
                  likes: 24,
                  comments: 8,
                ),

                SizedBox(height: 12),

                _InsightCard(
                  userName: 'David M.',
                  userAvatar: 'https://i.pravatar.cc/150?img=12',
                  insight: 'Berberine was a game-changer for my post-meal levels, but it took a few weeks to notice a difference. Worth it for me.',
                  likes: 31,
                  comments: 12,
                ),

                SizedBox(height: 12),

                _InsightCard(
                  userName: 'Alex R.',
                  userAvatar: 'https://i.pravatar.cc/150?img=8',
                  insight: 'I tried chromium picolinate, and it didn\'t do much for my numbers. Everyone is different, I guess.',
                  likes: 15,
                  comments: 5,
                ),

                SizedBox(height: 80),
              ],
            ),
          ),
        ],
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
              _NavBarIcon(Icons.home),
              _NavBarIcon(Icons.insights, isActive: true),
              _NavBarIcon(Icons.person_outline),
              _NavBarIcon(Icons.settings_outlined),
            ],
          ),
        ),
      ),
    );
  }
}

class _InsightCard extends StatelessWidget {
  final String userName;
  final String userAvatar;
  final String insight;
  final int likes;
  final int comments;

  const _InsightCard({
    required this.userName,
    required this.userAvatar,
    required this.insight,
    required this.likes,
    required this.comments,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: NetworkImage(userAvatar),
                backgroundColor: AppColors.accentLight,
              ),
              const SizedBox(width: 12),
              Text(
                userName,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Text(
            insight,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontSize: 15,
              height: 1.5,
            ),
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Icon(
                Icons.thumb_up_outlined,
                size: 18,
                color: AppColors.textLight,
              ),
              const SizedBox(width: 4),
              Text(
                '$likes Likes',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 20),
              Icon(
                Icons.chat_bubble_outline,
                size: 18,
                color: AppColors.textLight,
              ),
              const SizedBox(width: 4),
              Text(
                '$comments Comments',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
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