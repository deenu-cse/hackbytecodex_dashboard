"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Building2, MapPin, Globe, Mail, 
  Phone, Upload, Check, Loader2, Sparkles,
  GraduationCap, AlertCircle, X
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const steps = [
  { id: "basic", label: "Basic Info", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "review", label: "Review", icon: Check }
];

export default function AddCollegePage() {
  const { isSuperAdmin, user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    website: "",
    address: { city: "", state: "", country: "India", zipCode: "" },
    logo: null,
    logoPreview: null
  });

  const [errors, setErrors] = useState({});

  // Generate college code automatically based on name
  const generateCollegeCode = (name) => {
    if (!name) return "";
    const words = name.split(" ").filter(w => w.length > 2);
    const prefix = words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `HBX-${prefix}-${randomNum}`;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === "basic") {
      if (!formData.name.trim()) newErrors.name = "College name is required";
      if (!formData.code.trim()) newErrors.code = "College code is required";
      else if (!/^HBX-[A-Z]+-\d{3}$/.test(formData.code)) 
        newErrors.code = "Format: HBX-XXX-000 (e.g., HBX-IIT-001)";
    }
    if (step === "location") {
      if (!formData.address.city.trim()) newErrors.city = "City is required";
      if (!formData.address.state.trim()) newErrors.state = "State is required";
    }
    if (step === "contact") {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Invalid email format";
      if (formData.website && !/^https?:\/\/.+/.test(formData.website))
        newErrors.website = "Website must start with http:// or https://";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (validateStep(currentStep) && currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: "File size must be less than 2MB" }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: "Only SVG, PNG, JPG files allowed" }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, logo: null }));
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null, logoPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    
    // Auto-generate code when name changes (only if code is empty or was auto-generated)
    if (field === "name" && (!formData.code || formData.code.startsWith("HBX-"))) {
      const newCode = generateCollegeCode(value);
      setFormData(prev => ({ ...prev, code: newCode }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep("contact")) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem("codexdashtoken");
      if (!token) throw new Error("Authentication required");

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("code", formData.code);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("website", formData.website);
      submitData.append("address", JSON.stringify(formData.address));
      
      if (formData.logo) {
        submitData.append("logo", formData.logo);
      }

      const response = await fetch(`${API_URL}/admin/college/addCollage`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create college");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/colleges");
      }, 2000);

    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only Super Admins can add colleges.</p>
          <Button 
            onClick={() => router.push("/dashboard")} 
            className="mt-4"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">College Added!</h2>
          <p className="text-gray-400">Redirecting to colleges list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/colleges">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add New College</h1>
          <p className="text-gray-400">Register a new institution to the network</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center ${idx !== steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : isCompleted 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/5 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium transition-colors ${
                    isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx !== steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500/50' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{submitError}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
        {/* Step 1: Basic Info */}
        {currentStep === "basic" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
                <p className="text-sm text-gray-500">Enter the college name and unique code</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">College Name <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="e.g., Indian Institute of Technology Delhi"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-gray-300">College Code <span className="text-red-400">*</span></Label>
                <div className="relative mt-2">
                  <Input
                    placeholder="HBX-IIT-001"
                    value={formData.code}
                    onChange={(e) => updateFormData("code", e.target.value.toUpperCase())}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500 font-mono tracking-wider"
                  />
                  <Badge 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/5 text-gray-400 border-0 cursor-pointer hover:bg-white/10"
                    onClick={() => updateFormData("code", generateCollegeCode(formData.name))}
                  >
                    Auto
                  </Badge>
                </div>
                {errors.code && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.code}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">Format: HBX-XXX-000 (e.g., HBX-IIT-001, HBX-BITS-002)</p>
              </div>

              <div>
                <Label className="text-gray-300">College Logo</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept=".svg,.png,.jpg,.jpeg"
                  className="hidden"
                />
                
                {formData.logoPreview ? (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={formData.logoPreview} 
                      alt="Logo preview" 
                      className="w-32 h-32 object-cover rounded-2xl border border-white/10"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer group"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-600 mt-1">SVG, PNG, JPG (max. 2MB)</p>
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
        )}

        {/* Step 2: Location */}
        {currentStep === "location" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Location Details</h3>
                <p className="text-sm text-gray-500">Where is the college located?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">City <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="e.g., New Delhi"
                  value={formData.address.city}
                  onChange={(e) => updateFormData("address", { ...formData.address, city: e.target.value })}
                  className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                />
                {errors.city && <p className="mt-2 text-sm text-red-400">{errors.city}</p>}
              </div>

              <div>
                <Label className="text-gray-300">State <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="e.g., Delhi"
                  value={formData.address.state}
                  onChange={(e) => updateFormData("address", { ...formData.address, state: e.target.value })}
                  className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                />
                {errors.state && <p className="mt-2 text-sm text-red-400">{errors.state}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">ZIP / Postal Code</Label>
                <Input
                  placeholder="e.g., 110016"
                  value={formData.address.zipCode}
                  onChange={(e) => updateFormData("address", { ...formData.address, zipCode: e.target.value })}
                  className="mt-2 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                />
              </div>

              <div>
                <Label className="text-gray-300">Country</Label>
                <Input
                  value={formData.address.country}
                  disabled
                  className="mt-2 h-12 bg-white/5 border-white/5 text-gray-400 rounded-xl cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {currentStep === "contact" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Contact Information</h3>
                <p className="text-sm text-gray-500">How can we reach the college administration?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Official Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="admin@college.edu"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-gray-300">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Website</Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="https://www.college.edu"
                    value={formData.website}
                    onChange={(e) => updateFormData("website", e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:border-blue-500"
                  />
                </div>
                {errors.website && <p className="mt-2 text-sm text-red-400">{errors.website}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Review & Confirm</h3>
                <p className="text-sm text-gray-500">Verify all details before creating</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
              <div className="flex items-start gap-4">
                {formData.logoPreview ? (
                  <img 
                    src={formData.logoPreview} 
                    alt="College logo" 
                    className="w-16 h-16 object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {formData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-white">{formData.name || "—"}</h4>
                  <p className="text-gray-400 font-mono">{formData.code || "—"}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">City</span>
                    <span className="text-white">{formData.address.city || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">State</span>
                    <span className="text-white">{formData.address.state || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">ZIP Code</span>
                    <span className="text-white">{formData.address.zipCode || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Country</span>
                    <span className="text-white">{formData.address.country}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Email</span>
                    <span className="text-white">{formData.email || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-white">{formData.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500">Website</span>
                    <span className="text-white">{formData.website || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-blue-400">
                  This college will be created with <strong>PENDING</strong> status. Assign a College Lead to activate.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === "basic"}
            className="h-12 px-6 border-white/10 text-white hover:bg-white/10 rounded-xl disabled:opacity-50"
          >
            Back
          </Button>
          
          {currentStep !== "review" ? (
            <Button
              onClick={handleNext}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Check className="w-5 h-5 mr-2" /> Create College</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}