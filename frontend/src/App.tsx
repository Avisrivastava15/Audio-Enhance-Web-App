import { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Waves,
  Upload,
  Play,
  Download,
  CheckCircle,
  Circle,
  Loader2,
  Volume2,
  Trash2,
  Zap,
  Shield,
  Clock,
  Headphones,
  Music,
  Mic,
  Radio,
  User,
  X,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
}

const initialSteps: ProcessingStep[] = [
  { id: '1', name: 'Audio Analysis', description: 'Analyzing audio waveform and frequency spectrum', status: 'pending', progress: 0 },
  { id: '2', name: 'Noise Reduction', description: 'Removing background noise using spectral gating', status: 'pending', progress: 0 },
  { id: '3', name: 'Echo Detection', description: 'Identifying echo patterns and delay signatures', status: 'pending', progress: 0 },
  { id: '4', name: 'Echo Removal', description: 'Applying adaptive filters to remove echo', status: 'pending', progress: 0 },
  { id: '5', name: 'Reverb Reduction', description: 'Separating reverb tail from source signal', status: 'pending', progress: 0 },
  { id: '6', name: 'Final Enhancement', description: 'Normalizing and optimizing output quality', status: 'pending', progress: 0 },
];

function AppContent() {
  const { user, profile, loading, signUp, signIn, signInAsGuest, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(initialSteps);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioInfo, setAudioInfo] = useState<{
    duration: number;
    sampleRate: number;
    fileSize: number;
    format: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = [heroRef, aboutRef, featuresRef, uploadRef, howItWorksRef];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const result = authMode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setAuthError(result.error.message);
    } else {
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    }
    setAuthLoading(false);
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const result = await signInAsGuest();
    if (result.error) {
      setAuthError(result.error.message);
    } else {
      setShowAuthModal(false);
    }
    setAuthLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload an MP3 or WAV file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setProcessedUrl(null);
    setProcessingSteps(initialSteps);
    setUploadProgress(0);
    setAudioInfo(null);
    setFileId(null);

    // Upload to Python backend
    try {
      const formData = new FormData();
      formData.append('audio', file);

      setUploadProgress(25);
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload file to processing server');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      setUploadProgress(100);
      setFileId(data.fileId);
      setAudioInfo({
        duration: data.duration,
        sampleRate: data.sampleRate,
        fileSize: data.fileSize,
        format: data.format,
      });

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the Python server is running.`);
      setUploadProgress(0);
    }
  };

  /*
  const processAudio = async () => {
    if (!fileId) {
      alert('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setProcessingSteps(initialSteps);

    try {
      // Simulate step progress while backend processes
      const stepDuration = 800;
      for (let i = 0; i < initialSteps.length; i++) {
        const stepId = initialSteps[i].id;

        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === stepId ? { ...step, status: 'processing' } : step
          )
        );

        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, stepDuration / 5));
          setProcessingSteps((prev) =>
            prev.map((step) =>
              step.id === stepId ? { ...step, progress } : step
            )
          );
        }

        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === stepId ? { ...step, status: 'completed', progress: 100 } : step
          )
        );
      }

      // Call Python backend to process
      const processResponse = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      // Set processed audio URL
      setProcessedUrl(`${API_URL}/api/stream/${fileId}`);

    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process audio. Please ensure the Python server is running.');
      setProcessingSteps(initialSteps);
    } finally {
      setIsProcessing(false);
    }
  };
  */


  //changes made to process audio function *******************************************************************************
  const processAudio = async () => {
  if (!fileId) {
    alert('Please upload a file first');
    return;
  }

  setIsProcessing(true);
  setProcessingSteps(initialSteps);

  try {
    // 🔥 STEP 1–5: simulate only first 5 steps
    for (let i = 0; i < initialSteps.length - 1; i++) {
      const stepId = initialSteps[i].id;

      // mark processing
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, status: 'processing' } : step
        )
      );

      // progress animation
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProcessingSteps((prev) =>
          prev.map((step) =>
            step.id === stepId ? { ...step, progress } : step
          )
        );
      }

      // mark completed
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, status: 'completed', progress: 100 }
            : step
        )
      );
    }

    // 🔥 STEP 6: start processing (REAL backend call)
    const finalStepId = initialSteps[initialSteps.length - 1].id;

    setProcessingSteps((prev) =>
      prev.map((step) =>
        step.id === finalStepId ? { ...step, status: 'processing' } : step
      )
    );

    // 👉 REAL processing starts here
    const processResponse = await fetch(`${API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });

    if (!processResponse.ok) {
      throw new Error('Processing failed');
    }

    // 🔥 ONLY NOW complete final step
    setProcessingSteps((prev) =>
      prev.map((step) =>
        step.id === finalStepId
          ? { ...step, status: 'completed', progress: 100 }
          : step
      )
    );

    // set audio
    setProcessedUrl(`${API_URL}/api/stream/${fileId}`);

  } catch (error) {
    console.error('Processing error:', error);
    alert('Failed to process audio.');
    setProcessingSteps(initialSteps);
  } finally {
    setIsProcessing(false);
  }
};

//changes ended to process audio function **************************************************************************************

  const handleDownload = async () => {
    if (!user || profile?.is_guest) {
      setShowAuthModal(true);
      return;
    }

    if (!fileId) return;

    try {
      const response = await fetch(`${API_URL}/api/download/${fileId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced_${audioFile?.name || 'audio'}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleReset = () => {
    setAudioFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setProcessingSteps(initialSteps);
    setFileId(null);
    setAudioInfo(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const features = [
    {
      icon: Zap,
      title: 'Echo Removal',
      description: 'Advanced algorithms detect and remove echo patterns from your recordings',
    },
    {
      icon: Radio,
      title: 'Reverb Reduction',
      description: 'Intelligently separates reverb from the original audio signal',
    },
    {
      icon: Shield,
      title: 'Noise Reduction',
      description: 'Adaptive noise reduction preserves voice clarity while removing artifacts',
    },
    {
      icon: Headphones,
      title: 'Crystal Clear',
      description: 'Enhanced audio with improved presence and intelligibility',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Optimized processing pipeline delivers results in seconds',
    },
    {
      icon: Music,
      title: 'Format Support',
      description: 'Support for MP3 and WAV formats with high fidelity output',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Waves className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                AudioEnhance
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { id: 'home', label: 'Home', ref: heroRef },
                { id: 'about', label: 'About', ref: aboutRef },
                { id: 'features', label: 'Features', ref: featuresRef },
                { id: 'upload', label: 'Enhance', ref: uploadRef },
                { id: 'how-it-works', label: 'How It Works', ref: howItWorksRef },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.ref)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">
                      {profile?.is_guest ? 'Guest User' : user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setAuthMode('signin');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-medium text-sm hover:from-cyan-400 hover:to-teal-400 transition-all transform hover:scale-105"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        ref={heroRef}
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-transparent to-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full mb-8 border border-slate-700">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">AI-Powered Audio Enhancement</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Remove Echo & Reverb
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              From Your Audio
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Real audio enhancement powered by advanced signal processing.
            Remove unwanted echo and reverb using Python-based algorithms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection(uploadRef)}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold text-lg hover:from-cyan-400 hover:to-teal-400 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              Start Enhancing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-[bounce_1.5s_infinite]" />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div
        ref={aboutRef}
        id="about"
        className="py-24 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Real Audio
                <br />
                <span className="text-cyan-400">Enhancement</span>
              </h2>
              <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                AudioEnhance uses Python-based signal processing with librosa, scipy, and advanced
                noise reduction algorithms. Our backend performs real echo detection, reverb
                separation, and spectral processing to deliver studio-quality results.
              </p>
              <p className="text-slate-400 text-lg leading-relaxed">
                Unlike simple web apps, we process your audio using professional-grade techniques:
                Wiener adaptive filtering for echo, spectral gating for reverb, and noise reduction
                for crystal-clear output.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">100K+</div>
                  <div className="text-slate-400">Audio Files Processed</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-teal-400 mb-2">50K+</div>
                  <div className="text-slate-400">Happy Users</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-3xl border border-slate-800 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_70%)]" />
                <div className="relative z-10 text-center">
                  <div className="relative inline-block mb-6">
                    <Mic className="w-32 h-32 text-cyan-400 animate-pulse" />
                    <div className="absolute -inset-4 border-2 border-cyan-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <p className="text-slate-400 text-lg">
                    Python-powered signal processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        ref={featuresRef}
        id="features"
        className="py-24 bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful{' '}
              <span className="text-cyan-400">Features</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Professional audio processing powered by Python and scipy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div
        ref={uploadRef}
        id="upload"
        className="py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Enhance Your{' '}
              <span className="text-cyan-400">Audio</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Upload your audio file, watch the processing steps, and download the enhanced result
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  audioFile
                    ? 'border-cyan-500/50 bg-cyan-500/5'
                    : 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50'
                }`}
                onClick={() => !isProcessing && !uploadProgress && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={isProcessing || (uploadProgress > 0 && uploadProgress < 100)}
                />

                {!audioFile ? (
                  <>
                    <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-xl text-slate-300 mb-2">Drop your audio file here</p>
                    <p className="text-slate-500">or click to browse</p>
                    <p className="text-sm text-slate-600 mt-4">Supports MP3 and WAV formats (Max 100MB)</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-4">
                      <Music className="w-8 h-8 text-cyan-400" />
                      <div className="text-left">
                        <p className="text-lg font-medium text-white">{audioFile.name}</p>
                        <p className="text-sm text-slate-400">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          {audioInfo && ` • ${audioInfo.duration.toFixed(1)}s`}
                        </p>
                      </div>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full max-w-md">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                          <span>Uploading to server...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadProgress === 100 && fileId && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Uploaded successfully</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Processing Steps */}
              {audioFile && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Processing Steps</h3>
                    {fileId && !isProcessing && !processedUrl && (
                      <button
                        onClick={processAudio}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-medium hover:from-cyan-400 hover:to-teal-400 transition-all flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Start Processing
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {processingSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          step.status === 'processing'
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : step.status === 'completed'
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-slate-800/50 border border-slate-700'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          ) : step.status === 'processing' ? (
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-300">
                              Step {index + 1}:
                            </span>
                            <span className={`font-medium ${
                              step.status === 'completed'
                                ? 'text-emerald-400'
                                : step.status === 'processing'
                                ? 'text-cyan-400'
                                : 'text-slate-400'
                            }`}>
                              {step.name}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{step.description}</p>

                          {step.status === 'processing' && (
                            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-200"
                                style={{ width: `${step.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Players */}
              {(originalUrl || processedUrl) && (
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                  {originalUrl && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Volume2 className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-300">Original Audio</span>
                      </div>
                      <audio
                        controls
                        src={originalUrl}
                        className="w-full h-12"
                      />
                    </div>
                  )}

                  {processedUrl && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <span className="font-medium text-white">Enhanced Audio</span>
                      </div>
                      <audio
                        controls
                        src={processedUrl}
                        className="w-full h-12"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {audioFile && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {processedUrl && (
                    <button
                      onClick={handleDownload}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Enhanced Audio (WAV)
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    Reset
                  </button>
                </div>
              )}

              {/* Download notice for guests */}
              {profile?.is_guest && processedUrl && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 text-sm text-center">
                    Sign up for a free account to download your enhanced audio
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        ref={howItWorksRef}
        id="how-it-works"
        className="py-24 bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It{' '}
              <span className="text-cyan-400">Works</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Deep learning and signal processing techniques for professional audio enhancement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Upload Your Audio',
                description: 'Upload MP3 or WAV files up to 100MB. Files are securely processed on our server.',
                icon: Upload,
              },
              {
                step: 2,
                title: 'Spectral Analysis',
                description: 'We perform STFT (Short-Time Fourier Transform) to analyze frequency content and identify noise.',
                icon: Waves,
              },
              {
                step: 3,
                title: 'Noise Reduction',
                description: 'Adaptive stationary and non-stationary noise reduction using spectral gating algorithms.',
                icon: Shield,
              },
              {
                step: 4,
                title: 'Echo Detection',
                description: 'Autocorrelation analysis identifies echo delays and reflection patterns.',
                icon: Radio,
              },
              {
                step: 5,
                title: 'Echo & Reverb Removal',
                description: 'Wiener filtering and spectral masking remove reverberant tails and echo artifacts.',
                icon: Music,
              },
              {
                step: 6,
                title: 'Download Enhanced',
                description: 'Get your enhanced audio as a high-quality WAV file with improved clarity.',
                icon: Download,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-lg font-bold">
                  {item.step}
                </div>
                <div className="pt-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-8 h-8 text-cyan-400" />
                <span className="text-xl font-bold">AudioEnhance</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Professional audio enhancement powered by Python signal processing. Real echo
                removal and reverb reduction for creators, podcasters, and musicians.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection(aboutRef)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(uploadRef)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Enhance Audio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(howItWorksRef)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500">
              Created with precision by Developer Team - AudioEnhance
            </p>
            <p className="text-sm text-slate-600 mt-2">
              All rights reserved - 2024
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <Waves className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400 mt-2">
                {authMode === 'signup'
                  ? 'Sign up to download your enhanced audio'
                  : 'Sign in to access your account'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                    placeholder="Your password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-semibold hover:from-cyan-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  authMode === 'signup' ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">or</span>
              </div>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={authLoading}
              className="w-full py-3 bg-slate-800 border border-slate-700 rounded-lg font-semibold text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <User className="w-5 h-5" />
              Continue as Guest
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              {authMode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Need an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
