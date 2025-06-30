import React, { useState } from 'react';
import { Upload, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Avatar = ({ session, size = 80, url, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(url);

  const downloadImage = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .download(path);
      
      if (error) {
        throw error;
      }
      
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  React.useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }

      // Call the onUpload callback
      if (onUpload) {
        onUpload(filePath);
      }

      // Download the new image
      downloadImage(filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div 
        className="relative rounded-full overflow-hidden border-4 border-white shadow-lg"
        style={{ 
          width: size, 
          height: size,
          borderColor: 'var(--color-border)'
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <User 
              className="w-1/2 h-1/2"
              style={{ color: 'var(--color-muted)' }}
            />
          </div>
        )}
        
        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <label
          htmlFor="avatar-upload"
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200
            ${uploading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer hover:scale-102'
            }
          `}
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)'
          }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {uploading ? 'Uploading...' : 'Upload'}
          </span>
        </label>
      </div>
    </div>
  );
};

export default Avatar;