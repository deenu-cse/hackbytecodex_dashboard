"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Plus, Trash2, GripVertical, Save, Loader2,
    Type, Mail, Hash, List, Upload, CheckSquare,
    AlertCircle, CheckCircle2, Edit3, Eye, FileText,
    X, RotateCcw
} from "lucide-react";

const FIELD_TYPES = [
    { id: "TEXT", label: "Text", icon: Type },
    { id: "EMAIL", label: "Email", icon: Mail },
    { id: "NUMBER", label: "Number", icon: Hash },
    { id: "SELECT", label: "Select", icon: List },
    { id: "FILE", label: "File Upload", icon: Upload },
    { id: "CHECKBOX", label: "Checkbox", icon: CheckSquare },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FormField {
    _id?: string;
    label: string;
    name: string;
    type: string;
    required: boolean;
    options: string[];
    placeholder: string;
}

interface RegistrationFormBuilderProps {
    eventId: string;
    token: string;
}

type ViewMode = "builder" | "preview" | "empty";

export default function RegistrationFormBuilder({ eventId, token }: RegistrationFormBuilderProps) {
    const [fields, setFields] = useState<FormField[]>([]);
    const [originalFields, setOriginalFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("empty");
    const [hasExistingForm, setHasExistingForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchForm();
    }, [eventId]);

    const fetchForm = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL}/events/single/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch event");

            const data = await response.json();

            if (data.data?.form && data.data.form.fields?.length > 0) {
                const formFields = data.data.form.fields;
                setFields(formFields);
                setOriginalFields(JSON.parse(JSON.stringify(formFields))); 
                setHasExistingForm(true);
                setViewMode("preview");
                setIsEditing(false);
            } else {
                setFields([]);
                setOriginalFields([]);
                setHasExistingForm(false);
                setViewMode("empty");
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Fetch form error:", err);
            setError("Failed to load existing form");
        } finally {
            setLoading(false);
        }
    };

    const checkForChanges = (current: FormField[], original: FormField[]) => {
        return JSON.stringify(current) !== JSON.stringify(original);
    };

    useEffect(() => {
        if (isEditing) {
            setHasChanges(checkForChanges(fields, originalFields));
        }
    }, [fields, originalFields, isEditing]);

    const generateFieldName = (label: string) => {
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    };

    const addField = (type: string) => {
        const newField: FormField = {
            label: type === "TEXT" ? "Full Name" :
                type === "EMAIL" ? "Email Address" :
                    type === "NUMBER" ? "Phone Number" :
                        type === "SELECT" ? "Select Option" :
                            type === "FILE" ? "Upload File" :
                                "Checkbox Option",
            name: "",
            type,
            required: type === "EMAIL",
            options: type === "SELECT" ? ["Option 1", "Option 2"] : [],
            placeholder: ""
        };

        newField.name = generateFieldName(newField.label);

        setFields([...fields, newField]);
        setSuccess(false);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };

        if (updates.label !== undefined) {
            updated[index].name = generateFieldName(updates.label);
        }

        setFields(updated);
        setSuccess(false);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
        setSuccess(false);
    };

    const addOption = (fieldIndex: number) => {
        const updated = [...fields];
        updated[fieldIndex].options = [...updated[fieldIndex].options, `Option ${updated[fieldIndex].options.length + 1}`];
        setFields(updated);
    };

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        const updated = [...fields];
        updated[fieldIndex].options[optionIndex] = value;
        setFields(updated);
    };

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const updated = [...fields];
        updated[fieldIndex].options = updated[fieldIndex].options.filter((_, i) => i !== optionIndex);
        setFields(updated);
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const response = await fetch(`${API_URL}/events/${eventId}/add-event-form`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fields }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to create form");
            }

            const data = await response.json();
            setOriginalFields(JSON.parse(JSON.stringify(fields)));
            setHasExistingForm(true);
            setViewMode("preview");
            setIsEditing(false);
            setHasChanges(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Create form error:", err);
            setError(err.message || "Failed to create form");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const response = await fetch(`${API_URL}/events/${eventId}/updateform`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fields }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to update form");
            }

            const data = await response.json();
            setOriginalFields(JSON.parse(JSON.stringify(fields)));
            setIsEditing(false);
            setHasChanges(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Update form error:", err);
            setError(err.message || "Failed to update form");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            setError(null);

            const response = await fetch(`${API_URL}/events/${eventId}/deleteform`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to delete form");
            }

            setFields([]);
            setOriginalFields([]);
            setHasExistingForm(false);
            setViewMode("empty");
            setIsEditing(false);
            setShowDeleteDialog(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Delete form error:", err);
            setError(err.message || "Failed to delete form");
        } finally {
            setDeleting(false);
        }
    };

    const validateForm = () => {
        if (fields.length === 0) {
            setError("Please add at least one field");
            return false;
        }

        for (const field of fields) {
            if (!field.label.trim()) {
                setError("All fields must have a label");
                return false;
            }
            if (field.type === "SELECT" && field.options.length === 0) {
                setError(`"${field.label}" must have at least one option`);
                return false;
            }
        }

        return true;
    };

    const handleEdit = () => {
        setIsEditing(true);
        setViewMode("builder");
    };

    const handleCancelEdit = () => {
        if (hasChanges) {
            if (!confirm("You have unsaved changes. Are you sure you want to cancel?")) {
                return;
            }
        }
        setFields(JSON.parse(JSON.stringify(originalFields)));
        setIsEditing(false);
        setViewMode("preview");
        setError(null);
        setHasChanges(false);
    };

    const handleCreateNew = () => {
        setFields([]);
        setIsEditing(true);
        setViewMode("builder");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (viewMode === "empty") {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-1">Registration Form</h3>
                        <p className="text-gray-400 text-sm">No registration form created yet</p>
                    </div>
                </div>

                <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-blue-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">No Registration Form</h4>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Create a custom registration form to collect information from participants. You can add text fields, file uploads, dropdowns, and more.
                    </p>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Registration Form
                    </Button>
                </div>
            </div>
        );
    }

    if (viewMode === "preview" && !isEditing) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-1">Registration Form</h3>
                        <p className="text-gray-400 text-sm">View and manage your existing form</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {success && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Operation successful
                            </div>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(true)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Form
                        </Button>
                        <Button
                            onClick={handleEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Form
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white">Active Registration Form</h4>
                            <p className="text-sm text-gray-500">{fields.length} field(s) configured</p>
                        </div>
                    </div>

                    <div className="space-y-6 max-w-2xl">
                        {fields.map((field, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-start justify-between mb-3">
                                    <label className="text-sm text-white flex items-center gap-2">
                                        {field.label}
                                        {field.required && <span className="text-red-400">*</span>}
                                        {!field.required && (
                                            <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">
                                                Optional
                                            </Badge>
                                        )}
                                    </label>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                                        {FIELD_TYPES.find(t => t.id === field.type)?.label || field.type}
                                    </Badge>
                                </div>

                                {field.type === "SELECT" ? (
                                    <div className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center text-gray-500 text-sm">
                                        Select: {field.options.join(", ")}
                                    </div>
                                ) : field.type === "CHECKBOX" ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5" />
                                        <span className="text-gray-500 text-sm">Checkbox option</span>
                                    </div>
                                ) : field.type === "FILE" ? (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                                        <Upload className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">File upload field</p>
                                    </div>
                                ) : (
                                    <div className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center text-gray-500 text-sm">
                                        {field.placeholder || `${field.type.toLowerCase()} input`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent className="bg-[#0f0f0f] border border-white/10 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                Delete Registration Form
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete this registration form? This action cannot be undone.
                                All existing registration data associated with this form will be lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel
                                onClick={() => setShowDeleteDialog(false)}
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                {deleting ? "Deleting..." : "Delete Form"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                        {hasExistingForm ? "Edit Registration Form" : "Create Registration Form"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {hasExistingForm ? "Modify your existing form fields" : "Build your custom registration form"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {success && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Saved successfully
                        </div>
                    )}
                    {hasChanges && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Unsaved changes
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-white/10 text-gray-400 hover:bg-white/5 rounded-xl"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={hasExistingForm ? handleUpdate : handleCreate}
                        disabled={saving || !hasChanges}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {saving ? "Saving..." : (hasExistingForm ? "Update Form" : "Create Form")}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 sticky top-24">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Add Fields</h4>
                        <div className="space-y-2">
                            {FIELD_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => addField(type.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                            <Icon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{type.label}</p>
                                            <p className="text-xs text-gray-500">Click to add</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {fields.length === 0 ? (
                        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 border-dashed p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <Plus className="w-8 h-8 text-gray-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Start Building Your Form</h4>
                            <p className="text-gray-500 text-sm mb-6">Select a field type from the sidebar to add your first question</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                    {FIELD_TYPES.find(t => t.id === field.type)?.label || field.type}
                                                </Badge>
                                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(index, { required: e.target.checked })}
                                                        className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                                                    />
                                                    Required
                                                </label>
                                            </div>

                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Field Label</label>
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                    placeholder="Enter question label"
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
                                                />
                                                <p className="text-xs text-gray-600 mt-1">Field name: <code className="text-blue-400">{field.name}</code></p>
                                            </div>

                                            {["TEXT", "EMAIL", "NUMBER"].includes(field.type) && (
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Placeholder</label>
                                                    <Input
                                                        value={field.placeholder}
                                                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                        placeholder="Enter placeholder text"
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl"
                                                    />
                                                </div>
                                            )}

                                            {field.type === "SELECT" && (
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Options</label>
                                                    <div className="space-y-2">
                                                        {field.options.map((option, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                <Input
                                                                    value={option}
                                                                    onChange={(e) => updateOption(index, optIdx, e.target.value)}
                                                                    className="flex-1 bg-white/5 border-white/10 text-white rounded-lg"
                                                                />
                                                                <button
                                                                    onClick={() => removeOption(index, optIdx)}
                                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => addOption(index)}
                                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Add Option
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {field.type === "FILE" && (
                                                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4" />
                                                        File uploads will accept images, PDFs, and documents up to 5MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => removeField(index)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {fields.length > 0 && (
                <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-8 mt-8">
                    <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-purple-400" />
                        </div>
                        Live Preview
                    </h4>
                    <div className="space-y-4 max-w-2xl">
                        {fields.map((field, idx) => (
                            <div key={idx} className="space-y-2">
                                <label className="text-sm text-white flex items-center gap-1">
                                    {field.label}
                                    {field.required && <span className="text-red-400">*</span>}
                                </label>
                                {field.type === "SELECT" ? (
                                    <select className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500 outline-none">
                                        <option value="">Select an option</option>
                                        {field.options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.type === "CHECKBOX" ? (
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-blue-500" />
                                        <span className="text-gray-400 text-sm">Check this option</span>
                                    </label>
                                ) : field.type === "FILE" ? (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                                    </div>
                                ) : (
                                    <input
                                        type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : "text"}
                                        placeholder={field.placeholder}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:border-blue-500 outline-none"
                                        disabled
                                    />
                                )}
                            </div>
                        ))}
                        <button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium mt-4 opacity-50 cursor-not-allowed">
                            Submit Registration
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}