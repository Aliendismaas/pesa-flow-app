import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ContactItem,
  getContactsQueryFn,
  createContactMutationFn,
  updateContactMutationFn,
  deleteContactMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  BookUser,
  Plus,
  Search,
  User,
  Phone,
  CreditCard,
  Edit2,
  Trash2,
  ArrowLeft,
  Check,
  Tag,
  Sparkles,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { formatProperName } from "@/lib/utils";
import { usePrivacy } from "@/context/privacy-provider";

interface PhonebookModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialPhoneNumber?: string;
  initialAccountNumber?: string;
  initialName?: string;
  startInAddMode?: boolean;
}

const CATEGORIES = [
  "General",
  "Family",
  "Friends",
  "Business",
  "Services",
  "Utilities",
  "Work",
];

const PRESET_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
];

export const PhonebookModal: React.FC<PhonebookModalProps> = ({
  isOpen,
  setIsOpen,
  initialPhoneNumber = "",
  initialAccountNumber = "",
  initialName = "",
  startInAddMode = false,
}) => {
  const queryClient = useQueryClient();
  const { formatCurrency } = usePrivacy();

  const [mode, setMode] = useState<"LIST" | "ADD" | "EDIT">(
    startInAddMode ? "ADD" : "LIST"
  );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form states
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formName, setFormName] = useState(initialName);
  const [formPhone, setFormPhone] = useState(initialPhoneNumber);
  const [formAccount, setFormAccount] = useState(initialAccountNumber);
  const [formCategory, setFormCategory] = useState("General");
  const [formColor, setFormColor] = useState("#10b981");
  const [formNotes, setFormNotes] = useState("");

  // Sync initial values when opened
  React.useEffect(() => {
    if (isOpen) {
      if (startInAddMode || initialPhoneNumber || initialAccountNumber) {
        setMode("ADD");
        setFormName(initialName);
        setFormPhone(initialPhoneNumber);
        setFormAccount(initialAccountNumber);
      } else {
        setMode("LIST");
      }
    }
  }, [isOpen, startInAddMode, initialPhoneNumber, initialAccountNumber, initialName]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["financeContacts"],
    queryFn: getContactsQueryFn,
    enabled: isOpen,
  });

  const invalidateEverything = () => {
    queryClient.invalidateQueries({ queryKey: ["financeContacts"] });
    queryClient.invalidateQueries({ queryKey: ["financeTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["financePeople"] });
    queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: createContactMutationFn,
    onSuccess: (data) => {
      invalidateEverything();
      toast({
        title: "Contact Saved to Phonebook",
        description: `Transactions matching ${data.contact.name} will now display their name.`,
      });
      resetForm();
      setMode("LIST");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Save Contact",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContactMutationFn,
    onSuccess: (data) => {
      invalidateEverything();
      toast({
        title: "Contact Updated",
        description: `Updated details for ${data.contact.name}.`,
      });
      resetForm();
      setMode("LIST");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Update Contact",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContactMutationFn,
    onSuccess: () => {
      invalidateEverything();
      toast({
        title: "Contact Removed",
        description: "The contact has been removed from your phonebook.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Delete",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEditingContactId(null);
    setFormName("");
    setFormPhone("");
    setFormAccount("");
    setFormCategory("General");
    setFormColor("#10b981");
    setFormNotes("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode("ADD");
  };

  const handleOpenEdit = (contact: ContactItem) => {
    setEditingContactId(contact._id);
    setFormName(contact.name);
    setFormPhone(contact.phoneNumber || "");
    setFormAccount(contact.accountNumber || "");
    setFormCategory(contact.category || "General");
    setFormColor(contact.color || "#10b981");
    setFormNotes(contact.notes || "");
    setMode("EDIT");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!formPhone.trim() && !formAccount.trim()) {
      toast({
        title: "Phone or account number required",
        description: "Please provide either a phone number or an account number.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "EDIT" && editingContactId) {
      updateMutation.mutate({
        id: editingContactId,
        data: {
          name: formName.trim(),
          phoneNumber: formPhone.trim(),
          accountNumber: formAccount.trim(),
          category: formCategory,
          color: formColor,
          notes: formNotes.trim(),
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        phoneNumber: formPhone.trim(),
        accountNumber: formAccount.trim(),
        category: formCategory,
        color: formColor,
        notes: formNotes.trim(),
      });
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesCategory =
      selectedCategory === "All" || c.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phoneNumber && c.phoneNumber.includes(q)) ||
      (c.accountNumber && c.accountNumber.includes(q)) ||
      c.identifiers.some((id) => id.includes(q));
    return matchesCategory && matchesSearch;
  });

  const formatDisplayPhone = (phone?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("255")) {
      return `+255 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    if (digits.length === 10 && digits.startsWith("0")) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BookUser className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === "LIST"
                    ? "Phonebook & Contacts"
                    : mode === "ADD"
                    ? "Add New Contact"
                    : "Edit Contact"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {mode === "LIST"
                    ? "Associate names with phone and account numbers to automatically replace raw numbers."
                    : "Enter contact details. The app will remember this number across all transactions."}
                </DialogDescription>
              </div>
            </div>

            {mode === "LIST" && (
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Contact
              </Button>
            )}

            {mode !== "LIST" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  setMode("LIST");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Contacts
              </Button>
            )}
          </div>
        </DialogHeader>

        {mode === "LIST" ? (
          <div className="flex flex-col flex-1 overflow-hidden p-5 space-y-4">
            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contact name, phone, account..."
                  className="w-full text-xs h-8 pl-8 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2 min-h-[300px] max-h-[500px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                  <MacSpinner size="lg" className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs">Loading phonebook...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 space-y-3 border border-dashed rounded-xl dark:border-slate-800">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {search || selectedCategory !== "All"
                      ? "No matching contacts found"
                      : "No contacts in phonebook yet"}
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {search
                      ? "Try searching with a different name or number."
                      : "Add a contact or click 'Add Contact' next to any number in your transactions table."}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenAdd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: contact.color || "#10b981" }}
                      >
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {formatProperName(contact.name)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {contact.category || "General"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 truncate">
                          {contact.phoneNumber && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              {formatDisplayPhone(contact.phoneNumber)}
                            </span>
                          )}
                          {contact.accountNumber && (
                            <span className="flex items-center gap-1 font-mono">
                              <CreditCard className="w-3 h-3 text-blue-600 shrink-0" />
                              {contact.accountNumber}
                            </span>
                          )}
                          {contact.transfersCount !== undefined &&
                            contact.transfersCount > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                                • {contact.transfersCount} transfers (
                                {formatCurrency(contact.totalAmountSent || 0)})
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(contact)}
                        className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                        title="Edit contact"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete ${contact.name} from your phonebook?`
                            )
                          ) {
                            deleteMutation.mutate(contact._id);
                          }
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Add / Edit Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              {/* Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Contact Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Mama, John Doe, Fundi Alex"
                    required
                    className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number (Tigo, M-Pesa, Airtel, Halopesa)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 0755123456 or 255755123456"
                    className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Formats like 07XX, 2557XX, or +255 will automatically match all statement lines.
                </p>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Number (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formAccount}
                    onChange={(e) => setFormAccount(e.target.value)}
                    placeholder="e.g. 24510060282 or 01502444555"
                    className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs h-9 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Avatar Color
                  </label>
                  <div className="flex items-center gap-1.5 h-9">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          formColor === c ? "scale-125 ring-2 ring-emerald-500 ring-offset-2" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Mama mdogo, Electrician Sinza"
                  className="w-full text-xs h-9 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setMode("LIST");
                }}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold shadow-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <MacSpinner size="xs" className="mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    {mode === "EDIT" ? "Update Contact" : "Save to Phonebook"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
