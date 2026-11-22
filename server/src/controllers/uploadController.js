import { uploadPropertyImage, deleteStoredImage } from '../services/imageService.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';

export const uploadPhotos = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    throw new AppError('Please select at least one image to upload (JPEG, PNG, or WEBP)', 400);
  }

  const uploaded = [];
  try {
    for (const file of files) {
      const result = await uploadPropertyImage(file);
      uploaded.push(result);
    }
  } catch (err) {
    // Roll back any already-uploaded images from this batch if one fails
    await Promise.all(uploaded.map((item) => deleteStoredImage(item.publicId)));
    throw err;
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: `${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded successfully`,
    data: { photos: uploaded },
  });
});

export const removeUploadedPhoto = asyncHandler(async (req, res) => {
  const { publicId } = req.body || {};
  if (!publicId || typeof publicId !== 'string') {
    throw new AppError('publicId is required', 400);
  }

  await deleteStoredImage(publicId);
  return sendSuccess(res, { message: 'Photo removed' });
});
