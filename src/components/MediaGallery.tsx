import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UploadedImage {
  id: string | number;
  url: string;
  name: string;
  createdAt: number;
}

const MediaGallery: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        setImages(data.map(img => ({
          id: img.id,
          url: img.url,
          name: img.name,
          createdAt: new Date(img.created_at).getTime()
        })));
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      // Fallback to local storage if table doesn't exist yet
      const saved = localStorage.getItem('noor_design_gallery');
      if (saved) setImages(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('L\'image est trop volumineuse (max 10 Mo).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadToSupabase = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(uploadData.path);
      
      if (!publicUrl) throw new Error('Failed to get public URL');

      const { data: dbData, error: dbError } = await supabase
        .from('gallery_images')
        .insert([{ url: publicUrl, name: selectedFile.name }])
        .select();

      if (dbError) throw dbError;

      if (dbData && dbData[0]) {
        const newImage: UploadedImage = {
          id: dbData[0].id,
          url: dbData[0].url,
          name: dbData[0].name,
          createdAt: new Date(dbData[0].created_at).getTime(),
        };

        setImages(prev => [newImage, ...prev]);
        setPreview(null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Supabase Upload Error:', err);
      setError(`Erreur d'upload: ${err.message}.`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: string | number) => {
    if (!confirm('Supprimer cette image de la galerie ?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-noor-bronze/10 rounded-full mb-6"
        >
          <span className="w-2 h-2 bg-noor-bronze rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-noor-bronze uppercase tracking-[0.2em]">Media Showcase</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-light text-noor-bronze tracking-tight mb-4"
        >
          Noor <span className="italic font-medium">Design</span> Gallery
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-noor-bronze/60 text-sm max-w-lg mx-auto leading-relaxed"
        >
          Immortalisez vos créations. Notre système d'upload professionnel 
          vous permet de gérer votre catalogue visuel avec élégance et simplicité.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Upload Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-noor-bronze/5 blur-2xl rounded-[3rem] -z-10" />
            
            <div className="bg-white/80 backdrop-blur-xl border border-noor-bronze/10 rounded-[2.5rem] p-8 shadow-2xl shadow-noor-bronze/5">
              <h3 className="text-lg font-medium text-noor-bronze mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5" /> 
                Ajouter une Image
              </h3>

              {!preview ? (
                <div 
                  className={`relative group cursor-pointer transition-all duration-500 rounded-3xl border-2 border-dashed ${
                    dragActive ? 'border-noor-bronze bg-noor-bronze/5' : 'border-noor-bronze/20 hover:border-noor-bronze/40 hover:bg-noor-bronze/[0.02]'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input 
                    ref={inputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files[0])}
                  />
                  
                  <div className="py-16 flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 bg-noor-bronze/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon className="w-8 h-8 text-noor-bronze/40" />
                    </div>
                    <p className="text-sm font-medium text-noor-bronze/80 mb-2">Glissez une image ici</p>
                    <p className="text-[11px] text-noor-bronze/40 uppercase tracking-widest">Ou cliquez pour parcourir</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-3xl overflow-hidden aspect-video bg-gray-50 border border-noor-bronze/10 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={clearPreview}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={uploadToSupabase}
                      disabled={uploading}
                      className="flex-1 py-4 bg-noor-bronze text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-noor-gold transition-all duration-500 shadow-lg shadow-noor-bronze/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmer l'Upload
                        </>
                      )}
                    </button>
                    <button 
                      onClick={clearPreview}
                      disabled={uploading}
                      className="p-4 border border-noor-bronze/20 text-noor-bronze/40 rounded-2xl hover:text-noor-bronze hover:border-noor-bronze/40 transition-all disabled:opacity-30"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-noor-bronze/[0.03] border border-noor-bronze/5 rounded-3xl p-6">
            <h4 className="text-[10px] font-bold text-noor-bronze/40 uppercase tracking-[0.2em] mb-4">Informations Techniques</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-[10px] text-noor-bronze/60 uppercase tracking-wider">
                <span className="w-1 h-1 bg-noor-bronze/40 rounded-full" />
                Formats: JPG, PNG, WEBP, GIF
              </li>
              <li className="flex items-center gap-3 text-[10px] text-noor-bronze/60 uppercase tracking-wider">
                <span className="w-1 h-1 bg-noor-bronze/40 rounded-full" />
                Poids Max: 10 MB par fichier
              </li>
              <li className="flex items-center gap-3 text-[10px] text-noor-bronze/60 uppercase tracking-wider">
                <span className="w-1 h-1 bg-noor-bronze/40 rounded-full" />
                Hébergement: Supabase Storage
              </li>
            </ul>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-light text-noor-bronze">
              Ma Galerie <span className="text-sm text-noor-bronze/40 ml-2">({images.length})</span>
            </h3>
          </div>

          {loading ? (
             <div className="flex justify-center py-32">
                <Loader2 className="w-10 h-10 text-noor-gold animate-spin" />
             </div>
          ) : images.length === 0 ? (
            <div className="bg-white/50 border border-noor-bronze/5 rounded-[2.5rem] py-32 flex flex-col items-center text-center px-12">
              <div className="w-20 h-20 bg-noor-bronze/[0.03] rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-noor-bronze/10" />
              </div>
              <p className="text-noor-bronze/40 text-sm italic">Votre showcase est vide pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group relative bg-white rounded-[2rem] overflow-hidden border border-noor-bronze/10 shadow-lg hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="aspect-[4/5] relative">
                      <img 
                        src={img.url} 
                        alt={img.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between shadow-2xl">
                          <div className="flex flex-col">
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider truncate mb-1">{img.name}</span>
                            <span className="text-white/60 text-[8px] uppercase tracking-tighter">Ajouté le {new Date(img.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                             <a 
                              href={img.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-colors"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => removeImage(img.id)}
                              className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
