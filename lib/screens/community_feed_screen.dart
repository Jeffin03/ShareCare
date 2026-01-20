import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/post_model.dart';
import '../widgets/post_card.dart';
import 'create_post_screen.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({Key? key}) : super(key: key);

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  final List<Post> _posts = [
    Post(
      id: '1',
      userName: 'Maria S.',
      userImage: 'https://i.pravatar.cc/150?img=1',
      category: PostCategory.recipe,
      content: 'Made this low-carb zucchini lasagna, whole family loved it! 😊 #diabetesfriendly #lowcarb',
      rating: 4.5,
      likes: 24,
      comments: 8,
    ),
    Post(
      id: '2',
      userName: 'David L.',
      userImage: 'https://i.pravatar.cc/150?img=12',
      category: PostCategory.exercise,
      content: 'Morning jog felt great, kept my blood sugar stable. Start slow! 🏃, #diabetestips #fitness',
      rating: 4.5,
      likes: 38,
      comments: 15,
    ),
    Post(
      id: '3',
      userName: 'Sarah K.',
      userImage: 'https://i.pravatar.cc/150?img=5',
      category: PostCategory.snack,
      content: 'My go-to afternoon snack: apple slices with almond butter. Simple and satisfying! 🍎🥜',
      rating: 4.0,
      likes: 19,
      comments: 5,
    ),
    Post(
      id: '4',
      userName: 'Tom B.',
      userImage: 'https://i.pravatar.cc/150?img=14',
      category: PostCategory.tip,
      content: 'Always check your feet daily. Simple habit, big impact. Take care everyone! 👣 #diabetesawareness',
      rating: 5.0,
      likes: 45,
      comments: 12,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.accentLight,
        elevation: 0,
        title: Text(
          'Community Feed',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontSize: 26,
          ),
        ),
        centerTitle: false,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _posts.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: PostCard(post: _posts[index]),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreatePostScreen()),
          );
        },
        backgroundColor: AppColors.primaryLight,
        icon: const Icon(Icons.add),
        label: const Text(
          'Create Post',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}