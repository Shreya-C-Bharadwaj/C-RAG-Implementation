# API Integration Folder

This folder is prepared for your backend API integration.

## Structure

You can organize your API files here:

```
src/api/
├── README.md          # This file
├── endpoints/         # API endpoint definitions
├── models/           # Data models and types
├── services/         # API service classes
├── utils/            # Utility functions
└── config/           # Configuration files
```

## Getting Started

1. **Upload your API files** to the appropriate subfolders
2. **Update the imports** in your components to use the new API structure
3. **Configure endpoints** based on your backend setup

## Example Usage

```typescript
// Example API service
import { apiService } from './api/services/apiService';

// Use in components
const response = await apiService.uploadFiles(files);
```

## Notes

- The current project uses localStorage for file storage
- Replace localStorage calls with your actual API calls
- Update the FileData interface if needed to match your backend models