import React, { useState } from 'react';
import { 
  RefreshCcw, 
  Camera, 
  AlertCircle, 
  Sparkles,
  ChevronLeft,
  Check,
  Download,
  ShoppingBag,
  Copy
} from 'lucide-react';
import { createGenerationTask, getTaskStatus } from '../services/apiService';
import { GenerationParams, TrendInsight, FeedItem, User, ViewState, Task } from '../types';

interface GenerateProps {
  currentUser: User | null;
  onNavigate: (view: ViewState) => void;
  onAddToFeed: (item: FeedItem) => void;
}

export const Generate: React.FC<GenerateProps> = ({ currentUser, onNavigate, onAddToFeed }) => {
  // --- Stages: 'input' | 'loading' | 'result' | 'error'
  const [stage, setStage] = useState<'input' | 'loading' | 'result' | 'error'>('input');
  
  // --- Form State ---
  const [gender, setGender] = useState<'male'|'female'>('female');
  const [height, setHeight] = useState(165);
  const [bodyType, setBodyType] = useState<'slim'|'average'|'chubby'>('average');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Result State ---
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [insight, setInsight] = useState<TrendInsight | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [generationResult, setGenerationResult] = useState<any | null>(null);

  // --- Constants ---
  const styles = ['Vintage', 'Classic', 'Casual', 'Street', 'Minimal', 'Sporty'];
  
  const colors = [
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Pink', value: 'bg-pink-400' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Brown', value: 'bg-amber-700' },
    { name: 'White', value: 'bg-white border border-gray-200' },
    { name: 'Grey', value: 'bg-gray-400' },
    { name: 'Black', value: 'bg-gray-900' },
  ];

  const placeholders = [
    "Recommended street look for rainy London days.",
    "Lovely pastel outfit for a first date.",
    "Comfortable yet hip style for a weekend picnic.",
    "Professional office look for an important presentation.",
    "Wedding guest look: stylish but not too flashy."
  ];

  // --- Handlers ---
  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    } else {
      if (selectedColors.length < 3) setSelectedColors([...selectedColors, colorName]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!currentUser) {
      alert("Please log in to generate.");
      onNavigate(ViewState.LOGIN);
      return;
    }
    if (!selectedStyle) {
        alert("Please select a style.");
        return;
    }
    
    setStage('loading');
    
    try {
      // Use the existing backend flow
      const { task_id } = await createGenerationTask({
        imageFile: selectedFile,
        prompt: userPrompt,
        gender,
        height,
        bodyType,
        style: selectedStyle,
        colors: selectedColors,
      });

      // Start polling for the result
      const intervalId = setInterval(async () => {
        try {
          const task: Task = await getTaskStatus(task_id);

          if (task.status === 'completed' && task.result?.creation) {
            clearInterval(intervalId);
            setGenerationResult(task.result);
            setGeneratedImage(task.result.creation.media_url);
            setInsight({
              title: "Style Analysis",
              content: task.result.creation.recommendation_text || 'AI analysis result.',
              tags: task.result.creation.tags_array || [],
            });
            setStage('result');
          } else if (task.status === 'failed') {
            clearInterval(intervalId);
            setErrorMsg(task.result?.error || "Generation failed. Please try again.");
            setStage('error');
          }
        } catch (pollError) {
          clearInterval(intervalId);
          console.error("Polling error:", pollError);
          setErrorMsg("An error occurred while checking the task status.");
          setStage('error');
        }
      }, 3000); // Poll every 3 seconds

    } catch (createError: any) {
      console.error("Create task error:", createError);
      setErrorMsg(createError.message || "Failed to start the generation task.");
      setStage('error');
    }
  };

  const handleAddToFeed = () => {
    if (!currentUser || !generationResult?.creation) return;
    
    // We need to transform the Creation object into a FeedItem
    const newItem: FeedItem = {
      id: generationResult.creation.id,
      imageUrl: generationResult.creation.media_url,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: generationResult.creation.created_at,
      likes: generationResult.creation.likes_count,
      isLiked: generationResult.creation.is_liked || false,
      tags: generationResult.creation.tags_array || [],
      description: generationResult.creation.prompt,
    };
    onAddToFeed(newItem);
    alert("Uploaded to Feed!");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- Render Functions ---

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold mb-2 animate-pulse">Designing your look...</h2>
        <p className="text-sm text-gray-500">Analzying style trends & colors</p>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Generation Failed</h2>
        <p className="text-sm text-gray-500 mb-8">{errorMsg}</p>
        <button 
          onClick={() => setStage('input')}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 pt-4">
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
           {/* Image Result */}
           <div className="relative">
             <img src={generatedImage} alt="Generated Fashion" className="w-full h-auto max-h-[60vh] object-contain bg-gray-100" />
             <button className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white" onClick={() => {
                 const link = document.createElement('a');
                 link.href = generatedImage;
                 link.download = `DOTD-${Date.now()}.png`;
                 link.click();
             }}>
               <Download size={20} />
             </button>
           </div>

           {/* Actions */}
           <div className="p-5 flex space-x-3 border-b border-gray-100">
             <button 
                onClick={handleAddToFeed}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
             >
               Upload to Feed
             </button>
             <button 
                onClick={() => setStage('input')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200"
             >
               Create Another
             </button>
           </div>

           {/* Trend Insight */}
           {insight && (
             <div className="p-5">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold flex items-center">
                   <Sparkles size={16} className="text-purple-600 mr-2" />
                   Trend Insight
                 </h3>
               </div>
               
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 relative">
                 <button 
                    onClick={() => copyToClipboard(insight.tags.join(' '), 'tags')}
                    className="absolute top-3 right-3 text-gray-400 hover:text-black"
                 >
                   {copiedSection === 'tags' ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                 </button>
                 <h4 className="font-bold text-sm mb-2">Style Tags</h4>
                 <div className="flex flex-wrap gap-2 pr-6">
                   {insight.tags.map(tag => (
                     <span key={tag} className="text-xs text-purple-700 font-medium">
                       {tag}
                     </span>
                   ))}
                 </div>
               </div>

               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 relative">
                 <button 
                   onClick={() => copyToClipboard(insight.content, 'insight')}
                   className="absolute top-3 right-3 text-gray-400 hover:text-black"
                 >
                   {copiedSection === 'insight' ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                 </button>
                 <h4 className="font-bold text-sm mb-2">{insight.title}</h4>
                 <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                   {insight.content}
                 </p>
               </div>

               <button className="w-full border border-gray-200 py-3 rounded-xl font-medium text-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                 <ShoppingBag size={16} className="mr-2 text-gray-500" />
                 Shop this style (Coming Soon)
               </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- Input Stage ---
  return (
    <div className="bg-gray-50 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-md bg-white shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center">
            <button onClick={() => onNavigate(ViewState.HOME)} className="flex items-center text-sm font-semibold text-gray-600 hover:text-black">
                <ChevronLeft size={20} className="mr-1" />
                Home
            </button>
        </div>
        <div className="px-5 py-6 pb-28"> {/* Added pb-28 for footer spacing */}
          
          {/* Body Info */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-5 flex items-center">
              <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
              Body Profile
            </h2>

            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-2 font-medium">Gender</label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button 
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${gender === 'male' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                >
                  ♂ Male
                </button>
                <button 
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${gender === 'female' ? 'bg-white shadow-sm text-pink-500' : 'text-gray-400'}`}
                >
                  ♀ Female
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm text-gray-500 font-medium">Height</label>
                <span className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                  {height} cm
                </span>
              </div>
              <input 
                type="range" 
                min="145" 
                max="190" 
                step="1" 
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2 font-medium">Body Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['slim', 'average', 'chubby'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setBodyType(type as any)}
                    className={`py-3 rounded-xl border transition-all text-sm font-medium capitalize ${
                      bodyType === type 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Style & Colors */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-5 flex items-center">
              <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
              Preferences
            </h2>

            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-3 font-medium">Style <span className="text-xs font-normal text-gray-400 ml-1">(Select 1)</span></label>
              <div className="grid grid-cols-3 gap-3">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`h-12 flex items-center justify-center rounded-xl border transition-all ${
                      selectedStyle === style 
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold ring-1 ring-purple-500' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm text-gray-500 font-medium">Colors</label>
                <span className="text-xs text-purple-600 font-medium">{selectedColors.length} / 3</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => {
                  const isSelected = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform active:scale-95 relative ${color.value} ${color.name === 'White' ? '' : 'border border-transparent'}`}
                      aria-label={color.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
                Details
              </div>
              <button 
                onClick={() => setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)}
                className="text-xs flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded-md"
              >
                <RefreshCcw className="w-3 h-3 mr-1" />
                Refresh Ex.
              </button>
            </h2>
            
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={placeholders[placeholderIndex]}
              className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm"
            />
          </section>

           {/* Upload */}
           <section className="">
            <h2 className="text-lg font-bold mb-4 flex items-center">
               <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
               Your Photo <span className="text-xs font-normal text-gray-400 ml-2">(Optional)</span>
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center bg-gray-50 text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all relative overflow-hidden">
               <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
               {uploadedImage ? (
                 <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
               ) : (
                 <>
                   <Camera className="w-6 h-6 mb-2" />
                   <span className="text-xs font-medium">Upload Reference Photo</span>
                 </>
               )}
            </div>
          </section>
        </div>

        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-5 py-4 z-10 shadow-lg rounded-t-2xl">
          <button 
            onClick={handleGenerate}
            disabled={!selectedStyle}
            className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center shadow-lg transition-all ${
              selectedStyle ? 'bg-black text-white active:scale-[0.98]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
            Generate Look
          </button>
        </footer>
      </div>
    </div>
  );
};
