# Security Policy

## Supported Versions

This project is developed for academic purposes. Only the latest version on the `prod` branch is actively maintained.

| Branch | Supported |
|--------|-----------|
| `prod` | ✅ Yes |
| `master` | ⚠️ Development only |

## Security Considerations

- ShareCare uses Firebase Authentication for user management — passwords are never stored directly
- All database access is governed by Firestore Security Rules — users can only read and write their own data
- Environment-specific Firebase configs are injected at build time and never committed to the repository
- This application does not store any medical records or personally identifiable health information

## Disclaimer

ShareCare is a peer support platform for academic demonstration purposes only. It is not a medical application and does not handle sensitive health data beyond user-generated community posts.
