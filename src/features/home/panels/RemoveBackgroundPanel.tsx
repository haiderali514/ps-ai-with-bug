import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import ImageUpload from '../../../components/ui/ImageUpload';
import * as geminiService from '../../../api/geminiService';
import { fileToBase64 } from '../../../utils/imageUtils';
import Icon from '../../../components/ui/Icon';

const RemoveBackgroundPanel: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setOriginalImage(file);
    setResultImage(null);
    setError(null);
    const base64 = await fileToBase64(file);
    setOriginalImageBase64(base64);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage || !originalImageBase64) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const imageUrl = await geminiService.removeBackground(originalImageBase64, originalImage.type);
      setResultImage(imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!originalImageBase64) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-indigo-400 mb-2">Remove Background</h2>
        <p className="text-gray-400 mb-6">Upload an image and the AI will automatically remove the background, leaving you with a clean, transparent result.</p>
        <ImageUpload onUpload={handleImageUpload} title="PNG, JPG, WEBP accepted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-indigo-400 mb-6">Remove Background</h2>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-300">Original Image</h3>
          <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center p-2 border border-gray-700/50">
            <img src={originalImageBase64} alt="Original" className="max-w-full max-h-full object-contain rounded-md" />
          </div>
           <div className="w-full flex flex-col space-y-2">
            <Button onClick={handleRemoveBackground} isLoading={isLoading} className="!py-3">
              Remove Background
            </Button>
            <Button onClick={() => setOriginalImageBase64(null)} variant="secondary" disabled={isLoading}>
              Upload Another Image
            </Button>
           </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-300">Result</h3>
          <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center p-2 border-2 border-dashed border-gray-700" style={{ backgroundImage: 'repeating-conic-gradient(#374151 0 25%, transparent 0 50%)', backgroundSize: '20px 20px'}}>
            {isLoading && <Spinner size="lg" />}
            {!isLoading && resultImage && (
              <img src={resultImage} alt="Background removed" className="max-w-full max-h-full object-contain" />
            )}
            {!isLoading && !resultImage && !error && (
                <p className="text-gray-500 font-semibold">Result will appear here</p>
            )}
            {error && (
              <div className="bg-red-900/40 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mx-4" role="alert">
                <div className="flex">
                  <div className="py-1">
                    <svg className="fill-current h-6 w-6 text-red-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.829a1 1 0 0 0-1.414-1.414L10 8.586 7.172 5.757a1 1 0 0 0-1.414 1.414L8.586 10l-2.829 2.829a1 1 0 1 0 1.414 1.414L10 11.414l2.829 2.829a1 1 0 0 0 1.414-1.414L11.414 10z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold">Operation Failed</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button onClick={handleDownload} disabled={!resultImage || isLoading} icon={<Icon type="download"/>} className="w-full" title="Download image with transparent background">
            Save Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RemoveBackgroundPanel;