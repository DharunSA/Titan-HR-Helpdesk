# Employee Photo Management Features - Setup Guide

This document describes the three new features implemented for employee photo management:
1. **Remove/Change Photo Button** in the edit modal
2. **Image Size Validation** and **Crop/Preview UI**
3. **Cloudinary Cloud Storage** integration

## Features Implemented

### 1. Remove/Change Photo Button
- Added a dedicated "Remove Photo" button in the edit modal
- Users can easily remove an employee's profile photo
- Button appears only when a photo is currently set
- Smooth UI interaction with hover effects

### 2. Image Size Validation & Crop/Preview UI
- **Validation**:
  - Maximum file size: 5MB
  - Supported formats: JPG, PNG, GIF, and other image formats
  - Real-time error messages displayed in the form
  
- **Crop UI**:
  - Circular crop tool for profile photos (1:1 aspect ratio)
  - Zoom control (1x to 3x)
  - Preview of cropped result
  - Confirm or cancel crop option

- **Preview**:
  - Live preview of selected photo before upload
  - Displays current profile photo
  - Shows file size and format information

### 3. Cloudinary Cloud Storage Integration
- **Frontend**: Uploads cropped images directly to Cloudinary
- **Backend**: Accepts Cloudinary URLs and manages image lifecycle
- **Benefits**:
  - No local server storage needed
  - Automatic image optimization
  - CDN delivery for faster loading
  - Scalable solution for many employees

## Setup Instructions

### Step 1: Get Cloudinary Account & Credentials

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/)
2. Log in to your dashboard
3. Note down these credentials:
   - **Cloud Name**: Found at the top of the dashboard
   - **API Key**: Available in Account Settings
   - **API Secret**: Available in Account Settings (keep this secret!)

### Step 2: Create Cloudinary Upload Preset

For frontend to upload without exposing API keys:

1. Go to **Settings** → **Upload** in your Cloudinary dashboard
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. **Name**: `titan_employees` (or your preferred name)
5. **Signing Mode**: Unsigned
6. **Format**: Keep defaults
7. Click "Save"

### Step 3: Configure Environment Variables

#### Create `.env` file in the root directory:

```bash
# .env (root directory)
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Frontend Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=titan_employees
```

#### Create `.env` file in server directory:

```bash
# server/.env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Server Cloudinary (for image deletion)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Install Dependencies

#### Frontend:
```bash
cd Titan
npm install
```

#### Backend:
```bash
cd server
npm install
```

## File Changes Summary

### Frontend Files Created/Modified:

1. **New**: `src/Components/ImageCropModal.jsx`
   - Crop modal component with zoom functionality
   - Uses `react-easy-crop` library

2. **New**: `src/utils/cloudinaryUtils.js`
   - Image validation function
   - Cloudinary upload handler
   - File size validation (5MB limit)

3. **Modified**: `src/Components/EmployeeEditModal.jsx`
   - Added crop modal integration
   - Added remove photo button
   - Added validation error display
   - Integrated Cloudinary upload
   - Improved UI/UX with better photo preview

4. **Modified**: `Titan/package.json`
   - Added `react-easy-crop` (image cropping)
   - Added `cloudinary-react` (optional, for advanced features)

### Backend Files Created/Modified:

1. **New**: `server/utils/cloudinaryUtils.js`
   - Extract public ID from Cloudinary URLs
   - Delete images from Cloudinary
   - Validate Cloudinary URLs

2. **Modified**: `server/routes/employeeRoutes.js`
   - Removed Multer file upload logic
   - Now accepts Cloudinary URLs
   - Automatic cleanup of old images when updating
   - Image deletion when employee is deleted

3. **Modified**: `server/server.js`
   - Removed `/uploads` static file serving
   - Streamlined middleware setup

4. **Modified**: `server/package.json`
   - Added `cloudinary` library

### Configuration Files:

1. **New**: `.env.example`
   - Template for environment variables

## How to Use

### For End Users (Admin):

1. **Edit Employee Profile**:
   - Click "Edit" on an employee
   - Click photo upload area or "Click to change photo"

2. **Crop Photo**:
   - Select a photo file (must be under 5MB)
   - A crop modal appears automatically
   - Use zoom slider to adjust
   - Click "Confirm Crop" to proceed

3. **Remove Photo**:
   - Click "Remove Photo" button if a photo exists
   - Photo will be deleted from Cloudinary

4. **Save Changes**:
   - Click "Save" to upload to Cloudinary and update employee record

### For Developers:

#### Testing Upload:
```javascript
import { uploadToCloudinary } from '../utils/cloudinaryUtils';

// Upload a file
try {
  const url = await uploadToCloudinary(fileBlob, 'titan_employees');
  console.log('Uploaded to:', url);
} catch (error) {
  console.error('Upload failed:', error);
}
```

#### Validation:
```javascript
import { validateImageFile } from '../utils/cloudinaryUtils';

const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

## API Endpoints

### Employee Management (No changes to endpoints, just data format):

- `GET /api/employees` - Get all employees
- `GET /api/employees/me` - Get current user's profile  
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
  - Now expects `avatar` field as Cloudinary URL (string)
  - Previously expected file upload via `avatarFile`
- `DELETE /api/employees/:id` - Delete employee
  - Automatically deletes image from Cloudinary

## Error Handling

The system handles these error cases:

1. **File Size Exceeds Limit**
   - Message: "File size must be less than 5MB"
   - Shows actual file size

2. **Invalid File Type**
   - Message: "Only image files are allowed"

3. **Cloudinary Not Configured**
   - Message: "Cloudinary configuration is not set"
   - Check `.env` variables

4. **Upload Failure**
   - Displays error message to user
   - Doesn't save if upload fails

5. **Cleanup Failures**
   - Warns in console but doesn't fail main operation
   - Ensures user data is saved even if old image cleanup fails

## Migration from Local Storage

If you have existing employee photos in local storage:

1. **Backup** the `server/uploads` directory
2. **Manually upload** photos to Cloudinary (or write a migration script)
3. **Update** employee records with Cloudinary URLs
4. **Remove** the uploads directory once migration is complete

## Troubleshooting

### Photos not uploading?
- Check browser console for errors
- Verify Cloudinary credentials in `.env`
- Ensure upload preset exists and is unsigned
- Check network tab for failed requests

### Crop modal not appearing?
- Verify `react-easy-crop` is installed
- Check that file passes validation
- Clear browser cache

### Images not deleted from Cloudinary?
- Verify server-side Cloudinary credentials
- Check that API key and secret are correct
- Review server logs for errors

## Dependencies Added

### Frontend (`package.json`):
```json
{
  "react-easy-crop": "^4.9.2",
  "cloudinary-react": "^1.11.2"
}
```

### Backend (`package.json`):
```json
{
  "cloudinary": "^1.42.0"
}
```

## Security Notes

1. **API Secret**: Never expose this in frontend code
2. **Upload Preset**: Using unsigned presets limits abuse (no credentials needed in frontend)
3. **File Validation**: Validated on both frontend and backend
4. **URL Format**: Only Cloudinary URLs accepted for security
5. **Deletion**: Only backend can delete (requires API secret)

## Future Enhancements

Possible improvements:
- Batch image uploads
- Image filters and adjustments
- Automatic image optimization presets
- Image gallery for employees
- Backup/archive functionality

---

**Last Updated**: June 2026  
**Version**: 1.0
