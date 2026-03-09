"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
 Plus,
 Trash2,
 GripVertical,
 Save,
 Eye,
 Edit,
 Check,
 Loader2,
 AlertCircle
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const fieldTypes = [
 { value: "TEXT", label: "Text Input" },
 { value: "EMAIL", label: "Email" },
 { value: "NUMBER", label: "Number" },
 { value: "SELECT", label: "Dropdown (Select)" },
 { value: "CHECKBOX", label: "Checkbox" },
 { value: "FILE", label: "File Upload" },
];

export default function RegistrationFormBuilder({ eventId, event, token }) {
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [formExists, setFormExists] = useState(false);
 const [fields, setFields] = useState([]);
 const [instructions, setInstructions] = useState([]);
 const [message, setMessage] = useState({ type: "", text: "" });
 const [isEditing, setIsEditing] = useState(true); // Toggle between edit/view mode

 // Load form data from backend or event prop
 useEffect(() => {
  if (event?.form) {
     setFormExists(true);
     setFields(event.form.fields || []);
     setInstructions(event.form.instructions || []);
   } else {
     setFormExists(false);
     setFields([]);
     setInstructions([]);
   }
 }, [event?.form]);

const addField = () => {
   setFields([
     ...fields,
     {
       label: "",
       name: "",
       type: "TEXT",
     required: false,
       options: [],
     placeholder: "",
     },
   ]);
 };

const removeField = (index) => {
   setFields(fields.filter((_, i) => i !== index));
 };

const updateField = (index, field, value) => {
  const newFields = [...fields];
   newFields[index] = { ...newFields[index], [field]: value };
   setFields(newFields);
 };

const addOption = (index) => {
  const newFields = [...fields];
  if (!newFields[index].options) {
     newFields[index].options = [];
   }
   newFields[index].options.push("");
   setFields(newFields);
 };

const removeOption = (fieldIndex, optionIndex) => {
  const newFields = [...fields];
   newFields[fieldIndex].options = newFields[fieldIndex].options.filter(
     (_, i) => i !== optionIndex
   );
   setFields(newFields);
 };

const updateOption= (fieldIndex, optionIndex, value) => {
  const newFields = [...fields];
   newFields[fieldIndex].options[optionIndex] = value;
   setFields(newFields);
 };

 // Instructions functions
 const addInstruction = () => {
   setInstructions([
     ...instructions,
     {
     heading: "",
       points: [],
     },
   ]);
 };

const removeInstruction= (index) => {
   setInstructions(instructions.filter((_, i) => i !== index));
 };

const updateInstruction= (index, field, value) => {
  const newInstructions = [...instructions];
   newInstructions[index] = { ...newInstructions[index], [field]: value };
   setInstructions(newInstructions);
 };

const addPoint = (instructionIndex) => {
  const newInstructions = [...instructions];
  if (!newInstructions[instructionIndex].points) {
     newInstructions[instructionIndex].points = [];
   }
   newInstructions[instructionIndex].points.push("");
   setInstructions(newInstructions);
 };

const removePoint = (instructionIndex, pointIndex) => {
  const newInstructions = [...instructions];
   newInstructions[instructionIndex].points = newInstructions[instructionIndex].points.filter(
     (_, i) => i !== pointIndex
   );
   setInstructions(newInstructions);
 };

const updatePoint = (instructionIndex, pointIndex, value) => {
  const newInstructions = [...instructions];
   newInstructions[instructionIndex].points[pointIndex] = value;
   setInstructions(newInstructions);
 };

const saveForm = async () => {
   setSaving(true);
   setMessage({ type: "", text: "" });

   // Validation for fields
   for (let i = 0; i < fields.length; i++) {
   const field = fields[i];
    if (!field.label.trim()) {
       setMessage({ type: "error", text: `Field ${i + 1} must have a label` });
       setSaving(false);
     return;
     }
    if (!field.name.trim()) {
       setMessage({ type: "error", text: `Field ${i + 1} must have a name` });
       setSaving(false);
     return;
     }
    if (field.type === "SELECT" && (!field.options || field.options.length === 0)) {
       setMessage({ type: "error", text: `Field "${field.label}" must have options` });
       setSaving(false);
     return;
     }
   }

   // Validation for instructions
   for (let i = 0; i < instructions.length; i++) {
   const instruction = instructions[i];
    if (!instruction.heading.trim()) {
       setMessage({ type: "error", text: `Instruction ${i + 1} must have a heading` });
       setSaving(false);
     return;
     }
    if (!instruction.points || instruction.points.length === 0) {
       setMessage({ type: "error", text: `Instruction "${instruction.heading}" must have at least one point` });
       setSaving(false);
     return;
     }
   }

  try {
   const response = await fetch(`${API_URL}/events/${eventId}/updateform`, {
     method: formExists ? "PUT" : "POST",
     headers: {
       Authorization: `Bearer ${token}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({ fields, instructions }),
     });

   const data = await response.json();

    if (response.ok && data.success) {
       setMessage({ type: "success", text: "Form saved successfully!" });
       setFormExists(true);
       setTimeout(() => setMessage({ type: "", text: "" }), 3000);
     } else {
       setMessage({ type: "error", text: data.message || "Failed to save form" });
     }
   } catch(err) {
   console.error("Save form error:", err);
     setMessage({ type: "error", text: "Server error while saving form" });
   } finally {
     setSaving(false);
   }
 };

const generateFieldName = (label) => {
 return label
     .toLowerCase()
     .replace(/[^a-z0-9]/g, "_")
     .replace(/_+/g, "_")
     .substring(0, 30);
 };

 return (
   <div className="space-y-6">
     {/* Header */}
     <div className="flex items-center justify-between">
       <div>
         <h3 className="text-2xl font-bold text-white">Registration Form Builder</h3>
         <p className="text-gray-400 mt-1">
           Create custom registration forms for {event?.title}
         </p>
       </div>
       {formExists && (
         <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
           <Check className="w-3 h-3 mr-1" />
           Form Active
         </Badge>
       )}
     </div>

     {/* Message */}
     {message.text && (
       <div
         className={`p-4 rounded-xl border ${
         message.type === "success"
             ? "bg-green-500/10 border-green-500/20 text-green-400"
             : "bg-red-500/10 border-red-500/20 text-red-400"
         }`}
       >
         {message.text}
       </div>
     )}

     {/* Fields List */}
     {loading ? (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
       </div>
     ) : fields.length === 0 ? (
       <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/10">
         <Edit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
         <h4 className="text-xl font-semibold text-white mb-2">No Form Fields Yet</h4>
         <p className="text-gray-500 mb-6">
           Add custom fields to collect information from participants
         </p>
         <Button onClick={addField} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
           <Plus className="w-4 h-4 mr-2" />
           Add First Field
         </Button>
       </div>
     ) : (
       <div className="space-y-4">
         {fields.map((field, index) => (
           <div
             key={index}
             className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6"
           >
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                 <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                 <div className="flex items-center gap-2">
                   <Badge variant="outline" className="border-white/20 text-gray-400">
                     Field {index +1}
                   </Badge>
                   <Badge
                     className={`${
                     field.required
                         ? "bg-red-500/20 text-red-400 border-red-500/30"
                         : "bg-green-500/20 text-green-400 border-green-500/30"
                     }`}
                   >
                     {field.required ? "Required" : "Optional"}
                   </Badge>
                 </div>
               </div>
               <Button
               variant="ghost"
                 size="sm"
                onClick={() => removeField(index)}
                 className="text-red-400 hover:bg-red-500/10"
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </div>

             <div className="grid md:grid-cols-2 gap-4 mb-4">
               <div>
                 <Label className="text-gray-300">Field Label *</Label>
                 <Input
                 placeholder="e.g., GitHub Profile URL"
                 value={field.label}
                  onChange={(e) => {
                     updateField(index, "label", e.target.value);
                    if (!field.name) {
                       updateField(index, "name", generateFieldName(e.target.value));
                     }
                   }}
                   className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                 />
               </div>

               <div>
                 <Label className="text-gray-300">Field Name (Internal) *</Label>
                 <Input
                 placeholder="e.g., github_url"
                 value={field.name}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                   className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                 />
               </div>

               <div>
                 <Label className="text-gray-300">Field Type *</Label>
                 <Select
                 value={field.type}
                  onValueChange={(v) => updateField(index, "type", v)}
                 >
                   <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl">
                     <SelectValue placeholder="Select type" />
                   </SelectTrigger>
                   <SelectContent className="bg-[#1a1a1a] border-white/10">
                     {fieldTypes.map((type) => (
                       <SelectItem key={type.value} value={type.value} className="text-white">
                         {type.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label className="text-gray-300">Placeholder</Label>
                 <Input
                 placeholder="e.g., https://github.com/username"
                 value={field.placeholder}
                  onChange={(e) => updateField(index, "placeholder", e.target.value)}
                   className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                 />
               </div>
             </div>

             <div className="flex items-center gap-4 mb-4">
               <div className="flex items-center gap-2">
                 <Switch
                   checked={field.required}
                  onCheckedChange={(c) => updateField(index, "required", c)}
                   className="data-[state=checked]:bg-blue-600"
                 />
                 <Label className="text-gray-300">Required Field</Label>
               </div>
             </div>

             {/* Options for SELECT type */}
             {field.type === "SELECT" && (
               <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                 <div className="flex items-center justify-between mb-3">
                   <Label className="text-gray-300">Dropdown Options</Label>
                   <Button
                     type="button"
                   variant="outline"
                     size="sm"
                    onClick={() => addOption(index)}
                     className="border-white/20 text-gray-300"
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add Option
                   </Button>
                 </div>
                 <div className="space-y-2">
                   {field.options?.map((option, optIndex) => (
                     <div key={optIndex} className="flex items-center gap-2">
                       <Input
                       placeholder={`Option ${optIndex +1}`}
                       value={option}
                        onChange={(e) =>
                           updateOption(index, optIndex, e.target.value)
                         }
                         className="h-10 bg-black/20 border-white/10 text-white rounded-xl"
                       />
                       <Button
                         type="button"
                       variant="ghost"
                         size="sm"
                        onClick={() => removeOption(index, optIndex)}
                         className="text-red-400 hover:bg-red-500/10 h-10 w-10 p-0"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         ))}
       </div>
     )}

     {/* Instructions Section - WITH EDIT/VIEW MODES */}
     <div className="mt-8">
       <div className="flex items-center justify-between mb-4">
         <div>
           <h3 className="text-xl font-bold text-white">Instructions & Guidelines</h3>
           <p className="text-gray-400 text-sm">Add headings with bullet points for instructions</p>
         </div>
         {formExists && (
           <Button
           onClick={() => setIsEditing(!isEditing)}
          variant="outline"
             className="border-white/20 text-gray-300"
           >
             {isEditing ? (
               <>
                 <Eye className="w-4 h-4 mr-1" />
                 View Mode
               </>
             ) : (
               <>
                 <Edit className="w-4 h-4 mr-1" />
                 Edit Mode
               </>
             )}
           </Button>
         )}
       </div>

       {instructions.length === 0 ? (
         <div className="text-center py-8 rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
           <p className="text-gray-400">No instructions added yet. Click "Add Instruction" to get started.</p>
         </div>
       ) : (
         <div className="space-y-4">
           {isEditing ? (
             // EDIT MODE - Editable inputs
             <>
               <Button
               onClick={addInstruction}
              variant="outline"
                 className="border-white/20 text-gray-300 mb-4"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 Add Instruction
               </Button>
               
               {instructions.map((instruction, instrIndex) => (
                 <div
                   key={instrIndex}
                   className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-6"
                 >
                   <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <GripVertical className="w-5 h-5 text-gray-500" />
                       <Badge variant="outline" className="border-white/20 text-gray-400">
                         Instruction {instrIndex +1}
                       </Badge>
                     </div>
                     <Button
                     variant="ghost"
                       size="sm"
                      onClick={() => removeInstruction(instrIndex)}
                       className="text-red-400 hover:bg-red-500/10"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>

                   <div className="mb-4">
                     <Label className="text-gray-300">Heading *</Label>
                     <Input
                     placeholder="e.g., Submission Guidelines"
                     value={instruction.heading}
                      onChange={(e) => updateInstruction(instrIndex, "heading", e.target.value)}
                       className="mt-2 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                     />
                   </div>

                   <div className="mb-4">
                     <div className="flex items-center justify-between mb-2">
                       <Label className="text-gray-300">Bullet Points *</Label>
                       <Button
                         type="button"
                       variant="outline"
                         size="sm"
                        onClick={() => addPoint(instrIndex)}
                         className="border-white/20 text-gray-300"
                       >
                         <Plus className="w-3 h-3 mr-1" />
                         Add Point
                       </Button>
                     </div>

                     {(!instruction.points || instruction.points.length === 0) ? (
                       <p className="text-sm text-gray-500 italic">No points added yet</p>
                     ) : (
                       <div className="space-y-2">
                         {instruction.points.map((point, pointIndex) => (
                           <div key={pointIndex} className="flex items-center gap-2">
                             <div className="flex items-center gap-2 flex-1">
                               <span className="text-gray-500 text-sm">•</span>
                               <Input
                               placeholder={`Point ${pointIndex + 1}`}
                               value={point}
                                onChange={(e) => updatePoint(instrIndex, pointIndex, e.target.value)}
                                 className="h-10 bg-black/20 border-white/10 text-white rounded-xl"
                               />
                             </div>
                             <Button
                               type="button"
                             variant="ghost"
                               size="sm"
                              onClick={() => removePoint(instrIndex, pointIndex)}
                               className="text-red-400 hover:bg-red-500/10 h-10 w-10 p-0"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </>
           ) : (
             // VIEW MODE - Beautiful display
             instructions.map((instruction, instrIndex) => (
               <div
                 key={instrIndex}
                 className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 p-8"
               >
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                     <Check className="w-5 h-5 text-white" />
                   </div>
                   <h4 className="text-2xl font-bold text-white">
                     {instruction.heading || 'Untitled Instruction'}
                   </h4>
                 </div>

                 {(!instruction.points || instruction.points.length === 0) ? (
                   <p className="text-gray-400 italic">No points specified</p>
                 ) : (
                   <div className="space-y-3">
                     {instruction.points.map((point, pointIndex) => (
                       <div key={pointIndex} className="flex items-start gap-3">
                         <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <span className="text-blue-400 text-sm font-semibold">{pointIndex + 1}</span>
                         </div>
                         <p className="text-gray-300 leading-relaxed flex-1">
                           {point || 'Empty point'}
                         </p>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             ))
           )}
         </div>
       )}
     </div>

     {/* Actions */}
     <div className="flex items-center gap-4">
       <Button
        onClick={addField}
         className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
       >
         <Plus className="w-4 h-4 mr-2" />
         Add Another Field
       </Button>

       <Button
        onClick={saveForm}
         disabled={saving || fields.length === 0}
         className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
       >
         {saving ? (
           <Loader2 className="w-5 h-5 animate-spin" />
         ) : (
           <>
             <Save className="w-5 h-5 mr-2" />
             {formExists ? "Update Form" : "Create Form"}
           </>
         )}
       </Button>
     </div>

     {formExists && fields.length > 0 && (
       <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
         <div className="flex items-start gap-3">
           <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
           <div>
             <p className="text-sm text-blue-400 font-medium">Form Preview Available</p>
             <p className="text-sm text-gray-400 mt-1">
               Participants will see these {fields.length} fields and {instructions.length} instruction sections when registering for this event.
             </p>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
