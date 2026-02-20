"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Shield, Sparkles, Check, Loader2,
  Upload, AlertCircle, Code2, Palette, Zap, X, ImageIcon
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function CreateClubPage() {
  const { user, isCollegeLead, isAuthenticated } = useAuth();
  const router = useRouter();
  const logoInputRef = useRef(null);
  const bannersInputRef = useRef(null);

  console.log('ussserrr', user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreviews, setBannerPreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    logo: null,
    banners: []
  });

  const [errors, setErrors] = useState({});

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (!isCollegeLead) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only College Leads can create clubs.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const generateCode = (name) => {
    if (!name) return "";
    const prefix = "CLB-HBX-";
    const words = name.split(" ");
    const letters = words.map(w => w[0]).join("").toUpperCase().slice(0, 3);
    const random = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${letters}-${random}`;
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      code: generateCode(name)
    }));
    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
  };

  // Handle single logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: "Logo must be less than 2MB" }));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: "Only JPG, PNG, WEBP, SVG files allowed" }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setFormData(prev => ({ ...prev, logo: file }));
    };
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, logo: null }));
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };
  const handleBannersUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxBanners = 5;
    const currentCount = formData.banners.length;

    if (currentCount + files.length > maxBanners) {
      setErrors(prev => ({ ...prev, banners: `Maximum ${maxBanners} banners allowed` }));
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, banners: "Each banner must be less than 5MB" }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, banners: "Only JPG, PNG, WEBP files allowed for banners" }));
        return;
      }
      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setBannerPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      banners: [...prev.banners, ...validFiles]
    }));
    setErrors(prev => ({ ...prev, banners: null }));
  };

  const removeBanner = (index) => {
    setFormData(prev => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index)
    }));
    setBannerPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Club name is required";
    if (!formData.code.trim()) newErrors.code = "Club code is required";
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("code", formData.code);
      submitData.append("description", formData.description);
      submitData.append("collegeId", user?.college?.collegeId._id);

      if (formData.logo) {
        submitData.append("logo", formData.logo);
      }

      formData.banners.forEach((file) => {
        submitData.append("banners", file);
      });

      const response = await fetch(`${API_URL}/clubs/add-club`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Note: Don't set Content-Type header when using FormData
          // Browser will set it automatically with boundary
        },
        body: submitData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create club");
      }

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/clubs");
        }, 2000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Club Created!</h2>
          <p className="text-gray-400">Redirecting to clubs list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/clubs">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Club</h1>
          <p className="text-gray-400">Start a new technical community in your college</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Info Card */}
        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Club Details</h3>
              <p className="text-sm text-gray-500">Basic information about your club</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-gray-300">Club Name <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g., AI/ML Research Club"
                value={formData.name}
                onChange={handleNameChange}
                className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label className="text-gray-300">Club Code <span className="text-red-400">*</span></Label>
              <div className="relative mt-2">
                <Input
                  value={formData.code}
                  readOnly
                  className="h-12 bg-white/5 border-white/10 text-white font-mono tracking-wider rounded-xl cursor-not-allowed"
                />
                <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 text-gray-400 border-0">
                  Auto-generated
                </Badge>
              </div>
              <p className="mt-2 text-xs text-gray-500">Format: CLB-HBX-XXX-000</p>
            </div>

            <div>
              <Label className="text-gray-300">Description <span className="text-red-400">*</span></Label>
              <Textarea
                placeholder="Describe your club's mission, activities, and what members can expect..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500 resize-none"
              />
              <div className="flex justify-between mt-2">
                {errors.description ? (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.description}
                  </p>
                ) : (
                  <span className="text-xs text-gray-500">Min 50 characters</span>
                )}
                <span className={`text-xs ${formData.description.length < 50 ? 'text-gray-500' : 'text-green-400'}`}>
                  {formData.description.length} chars
                </span>
              </div>
            </div>
          </div>
        </div>


        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Club Logo</h3>
              <p className="text-sm text-gray-500">Upload a main logo for your club (optional)</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-full h-full rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              <div className="w-16 h-16">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
            />

            {logoPreview ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Logo
                </Button>
                <Button
                  onClick={removeLogo}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/30 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Click to upload logo</p>
                <p className="text-xs text-gray-600">JPG, PNG, WEBP, SVG (max 2MB)</p>
              </div>
            )}
            {errors.logo && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.logo}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-pink-500/10">
            <ImageIcon className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Club Banners</h3>
            <p className="text-sm text-gray-500">Upload promotional banners (optional, max 5)</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="file"
            ref={bannersInputRef}
            onChange={handleBannersUpload}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />

          {formData.banners.length < 5 && (
            <div
              onClick={() => bannersInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-pink-500/30 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Click to upload banners</p>
              <p className="text-xs text-gray-600 mt-1">
                {formData.banners.length}/5 uploaded • JPG, PNG, WEBP (max 5MB each)
              </p>
            </div>
          )}

          {errors.banners && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.banners}
            </p>
          )}

          {/* Banner Previews Grid */}
          {bannerPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bannerPreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-video">
                  <img
                    src={preview}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <Button
                      onClick={() => removeBanner(index)}
                      variant="destructive"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0">
                    {index === 0 ? "Primary" : `#${index + 1}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formData.name && (
        <div className="rounded-3xl bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-white/10 p-8 animate-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Preview</h3>
          <div className="flex items-center gap-4">
            {/* <div className="w-full h-full rounded-2xl bg-[#0f0f0f] flex items-center justify-center text-xl font-bold text-white overflow-hidden"> */}
              <div className="w-20 h-20">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  formData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
            {/* </div> */}
            <div>
              <h4 className="text-lg font-bold text-white">{formData.name}</h4>
              <p className="text-sm text-gray-400 font-mono">{formData.code}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400 line-clamp-2">{formData.description}</p>

          {/* Banner preview in card */}
          {bannerPreviews.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {bannerPreviews.slice(0, 3).map((preview, idx) => (
                <img
                  key={idx}
                  src={preview}
                  alt={`Banner ${idx + 1}`}
                  className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                />
              ))}
              {bannerPreviews.length > 3 && (
                <div className="w-20 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm text-gray-400 flex-shrink-0">
                  +{bannerPreviews.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        <Link href="/dashboard/clubs" className="flex-1">
          <Button
            variant="outline"
            className="w-full h-12 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
          ) : (
            <><Sparkles className="w-5 h-5 mr-2" /> Create Club</>
          )}
        </Button>
      </div>
    </div>
  );
}