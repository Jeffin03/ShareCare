# ShareCare | 
## Abstract
The Diabetes Peer Support Community App is a cross-platform application that enables diabetes patients and caregivers to share real-life experiences and practical coping strategies. The app focuses on peer support rather than medical tracking, helping users reduce restriction fatigue through community-validated content such as recipes, exercises, snack choices, and daily tips.

## Problem Definition
Diabetes management involves continuous lifestyle restrictions that often lead to mental and emotional fatigue. Existing applications primarily focus on clinical data and monitoring, offering limited support for everyday challenges. There is a need for a safe, non-clinical platform that promotes shared learning through lived experiences.

## Objectives
To build a peer-support platform for diabetes management  
To encourage sharing of practical, real-world solutions  
To provide community validation through ratings and discussions  
To ensure safety through disclaimers and content reporting

## Scope of the Project
The project includes user authentication, a community feed, user-generated posts, ratings, and basic moderation features. The application does not provide medical advice and does not include clinical tracking, sensors, or machine learning components.

## Technology Stack
Flutter for cross-platform frontend development  
Firebase Authentication for user management  
Cloud Firestore for database storage  
Firebase Storage for media uploads  
Firebase Cloud Messaging for notifications

## Development Methodology
The project follows Agile methodology with iterative development across multiple sprints. Each sprint delivers functional features that are incrementally improved based on testing and feedback.

## Setup and Deployment

### Prerequisites
Flutter SDK installed  
Android Studio or VS Code  
Firebase account  
Android emulator or physical device

### Flutter Setup
Clone the repository  
Run `flutter pub get` to install dependencies  
Ensure `flutter doctor` shows no critical issues

### Firebase Setup
Create a Firebase project using the Firebase Console  
Enable Email and Google authentication  
Create a Cloud Firestore database in test mode  
Enable Firebase Storage  
Download `google-services.json` for Android  
Download `GoogleService-Info.plist` for iOS  
Place configuration files in the respective platform folders

### Running the Application
Run `flutter run` to start the application  
Use test accounts for authentication during development

## Safety and Disclaimer
This application is intended only for peer support and experience sharing. It does not provide medical advice, diagnosis, or treatment. Users are encouraged to consult qualified healthcare professionals for medical decisions.

## Testing
Manual testing of core features  
UI testing across different screen sizes  
Validation of reporting and moderation flows

## Contributing
Contributions are welcome for educational and learning purposes.

To contribute:
Fork the repository  
Create a new feature branch  
Follow clean coding and naming conventions  
Test changes before committing  
Submit a pull request with a clear description

All contributions must respect the peer-support nature of the application and must not introduce medical advice features.

## Future Enhancements
Advanced content discovery and filtering  
Improved moderation tools  
Web deployment support  
Accessibility improvements

## Conclusion
The Diabetes Peer Support Community App is a feasible academic project that demonstrates cross-platform development, agile practices, and responsible handling of health-related community content. The project addresses a real-world problem while remaining suitable for implementation within a single academic semester.
