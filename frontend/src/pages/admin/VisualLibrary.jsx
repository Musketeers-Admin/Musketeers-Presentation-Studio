import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

function VisualLibrary() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ description: '', tags: '' });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages(q) {
    setLoading(true);
    const params = q ? { q } : {};
    const res = await axios.get('/api/visual-library', { params });
    setImages(res.data);
    setLoading(false);
  }

  function handleSearch(e) {
    const q = e.target.value;
    setSearchQuery(q);
    const timeout = setTimeout(() => fetchImages(q), 300);
    return () => clearTimeout(timeout);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      const res = await axios.post('/api/visual-library', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(imgs => [res.data, ...imgs]);
      setUploadForm({ description: '', tags: '' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  }

  async function deleteImage(id) {
    if (!window.confirm('Delete this image?')) return;
    await axios.delete(`/api/visual-library/${id}`);
    setImages(imgs => imgs.filter(img => img.id !== id));
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visual Library</h1>
          <p className="page-subtitle">General work samples and reference images. {images.length} image{images.length !== 1 ? 's' : ''} uploaded.</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Upload Image</div>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">File *</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="form-input"
                onChange={e => setSelectedFile(e.target.files[0])}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input
                className="form-input"
                value={uploadForm.tags}
                onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="branding, logo, social, ad..."
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              value={uploadForm.description}
              onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the image..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? <><span className="spinner"></span> Uploading...</> : 'Upload Image'}
          </button>
        </form>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <span className="search-bar-icon">🔍</span>
          <input
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by description or tags..."
          />
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Loading images...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <div className="empty-state-title">{searchQuery ? 'No results found' : 'No work samples yet'}</div>
          <div className="empty-state-text">{searchQuery ? 'Try a different search.' : 'Add general work samples here. For case study specific images, add them directly inside each case study.'}</div>
        </div>
      ) : (
        <div className="image-grid">
          {images.map(img => (
            <div key={img.id} className="image-card">
              <img
                src={`${API_BASE}${img.file_path}`}
                alt={img.description || img.original_name}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', height: 160, alignItems: 'center', justifyContent: 'center', background: 'var(--color-gray-bg)', fontSize: 40 }}>
                🖼️
              </div>
              <div className="image-card-body">
                <div className="image-card-name">{img.original_name || img.filename}</div>
                {img.description && (
                  <div className="image-card-tags" style={{ marginBottom: 4 }}>{img.description}</div>
                )}
                {img.tags && (
                  <div className="image-card-tags">{img.tags}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => deleteImage(img.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VisualLibrary;
