enum PostCategory {
  recipe,
  exercise,
  snack,
  tip,
}

class Post {
  final String id;
  final String userName;
  final String userImage;
  final PostCategory category;
  final String content;
  final double rating;
  final int likes;
  final int comments;
  final String? imageUrl;

  Post({
    required this.id,
    required this.userName,
    required this.userImage,
    required this.category,
    required this.content,
    required this.rating,
    required this.likes,
    required this.comments,
    this.imageUrl,
  });

  String get categoryLabel {
    switch (category) {
      case PostCategory.recipe:
        return 'Recipe';
      case PostCategory.exercise:
        return 'Exercise';
      case PostCategory.snack:
        return 'Snack';
      case PostCategory.tip:
        return 'Tip';
    }
  }
}