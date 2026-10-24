// src/admin/products/ImageUploader.jsx
// Cloudinary unsigned upload via the REST API.
// Accepts multiple files, shows previews, calls onImagesChange([url, ...]).

import { useState, useRef } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../lib/firebase';

async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const fd  = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('folder', 'denver/products');

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url;
}

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploadErr('');
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadToCloudinary));
      onChange([...images, ...urls]);
    } catch (err) {
      console.error(err);
      setUploadErr('Upload failed. Check Cloudinary config and try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="img-uploader">
      {/* Previews */}
      {images.length > 0 && (
        <div className="img-uploader-previews">
          {images.map((url, i) => (
            <div key={i} className="img-preview-wrap">
              <img src={url} alt={`Product image ${i + 1}`} className="img-preview" />
              <button
                type="button"
                className="img-remove-btn"
                onClick={() => removeImage(i)}
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`img-drop-zone ${uploading ? 'uploading' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader size={20} className="spin" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={20} />
            <span>Click or drag images here</span>
            <span className="img-drop-hint">PNG, JPG, WEBP · max 10 MB each</span>
          </>
        )}
      </div>

      {uploadErr && <div className="admin-error-banner" style={{ marginTop: '8px' }}>{uploadErr}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
