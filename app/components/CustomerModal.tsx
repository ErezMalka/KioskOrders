// שמור קובץ זה בתיקייה: components/CustomerModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Building2, User, Mail, Phone, MapPin, 
  Globe, Hash, Briefcase, CreditCard, Calendar,
  FileText, Star, Check, AlertCircle, Sparkles,
  Building, Users, Trophy, Zap, Heart, Shield,
  TrendingUp, Target, Smartphone, Home, Package
} from 'lucide-react';

interface CustomerData {
  businessName: string;
  businessType: string;
  taxId: string;
  website: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  zipCode: string;
  products: string;
  notes: string;
  status: string;
  creditLimit: string;
  paymentTerms: string;
  rating: number;
}

interface CustomerModalProps {
  onSave?: (data: CustomerData) => void;
}

export default function CustomerModal({ onSave }: CustomerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState(new Set());
  
  const [formData, setFormData] = useState<CustomerData>({
    businessName: '',
    businessType: '',
    taxId: '',
    website: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    zipCode: '',
    products: '',
    notes: '',
    status: 'active',
    creditLimit: '',
    paymentTerms: '30',
    rating: 0
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch(name) {
      case 'businessName':
        if (!value) newErrors.businessName = 'חובה להזין שם עסק';
        else delete newErrors.businessName;
        break;
      case 'contactName':
        if (!value) newErrors.contactName = 'חובה להזין שם איש קשר';
        else delete newErrors.contactName;
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'כתובת אימייל לא תקינה';
        } else delete newErrors.email;
        break;
      case 'phone':
        if (value && !/^[0-9-+()]*$/.test(value)) {
          newErrors.phone = 'מספר טלפון לא תקין';
        } else delete newErrors.phone;
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touchedFields.has(name)) {
      validateField(name, value);
    }
  };

  const handleSubmit = () => {
    if (!formData.businessName || !formData.contactName) {
      setErrors({
        ...(!formData.businessName && { businessName: 'חובה להזין שם עסק' }),
        ...(!formData.contactName && { contactName: 'חובה להזין שם איש קשר' })
      });
      return;
    }

    // Save the customer data
    const customerData = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    existingCustomers.push(customerData);
    localStorage.setItem('customers', JSON.stringify(existingCustomers));

    // Call parent callback if provided
    if (onSave) {
      onSave(formData);
    }

    // Show success animation
    setIsSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsSuccess(false);
      setCurrentStep(1);
      setFormData({
        businessName: '',
        businessType: '',
        taxId: '',
        website: '',
        contactName: '',
        contactTitle: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        zipCode: '',
        products: '',
        notes: '',
        status: 'active',
        creditLimit: '',
        paymentTerms: '30',
        rating: 0
      });
      setErrors({});
      setTouchedFields(new Set());
      
      // Reload the page to show the new customer
      window.location.reload();
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.businessName) {
      setErrors({ businessName: 'חובה להזין שם עסק' });
      setTouchedFields(new Set(['businessName']));
      return;
    }
    if (currentStep === 2 && !formData.contactName) {
      setErrors({ contactName: 'חובה להזין שם איש קשר' });
      setTouchedFields(new Set(['contactName']));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const businessTypes = [
    { value: 'tech', label: 'טכנולוגיה', icon: Zap, color: 'from-blue-500 to-cyan-500' },
    { value: 'retail', label: 'קמעונאות', icon: Package, color: 'from-purple-500 to-pink-500' },
    { value: 'services', label: 'שירותים', icon: Users, color: 'from-green-500 to-emerald-500' },
    { value: 'manufacturing', label: 'ייצור', icon: Building2, color: 'from-orange-500 to-red-500' },
    { value: 'finance', label: 'פיננסים', icon: TrendingUp, color: 'from-indigo-500 to-purple-500' },
    { value: 'other', label: 'אחר', icon: Briefcase, color: 'from-gray-500 to-gray-600' }
  ];

  const statusOptions = [
    { value: 'active', label: 'פעיל', icon: Check, color: 'bg-green-500' },
    { value: 'potential', label: 'פוטנציאלי', icon: Target, color: 'bg-yellow-500' },
    { value: 'inactive', label: 'לא פעיל', icon: X, color: 'bg-gray-400' }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-medium text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span>הוסף לקוח חדש</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSuccess && setIsOpen(false)}
          />

          <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            {isSuccess && (
              <div className="absolute inset-0 bg-white rounded-3xl z-50 flex flex-col items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mt-6">מעולה!</h3>
                <p className="text-gray-600 mt-2">הלקוח נוסף בהצלחה למערכת</p>
              </div>
            )}

            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 p-8 rounded-t-3xl">
              <button
                onClick={() => !isSuccess && setIsOpen(false)}
                className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">לקוח חדש</h2>
                <p className="text-white/80">מלא את הפרטים כדי להוסיף לקוח חדש למערכת</p>
              </div>

              <div className="flex items-center justify-center mt-8 gap-3">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        currentStep >= step 
                          ? 'bg-white text-indigo-600 scale-110' 
                          : 'bg-white/20 text-white/60 scale-100'
                      }`}
                    >
                      {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-20 h-1 mx-2 rounded-full transition-all duration-300 ${
                        currentStep > step ? 'bg-white' : 'bg-white/30'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center mt-4">
                <p className="text-white/90 font-medium">
                  {currentStep === 1 && 'פרטי העסק'}
                  {currentStep === 2 && 'איש קשר'}
                  {currentStep === 3 && 'פרטים נוספים'}
                </p>
              </div>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {/* Step 1: Business Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      שם העסק *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      onBlur={() => handleFieldTouch('businessName')}
                      className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                        errors.businessName && touchedFields.has('businessName')
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                      }`}
                      placeholder="לדוגמה: חברת הייטק בע״מ"
                    />
                    {errors.businessName && touchedFields.has('businessName') && (
                      <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      סוג העסק
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {businessTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({...formData, businessType: type.value})}
                            className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                              formData.businessType === type.value
                                ? 'border-indigo-500 bg-gradient-to-br ' + type.color + ' text-white shadow-lg scale-105'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                            }`}
                          >
                            <Icon className={`w-6 h-6 mx-auto mb-2 ${
                              formData.businessType === type.value ? 'text-white' : 'text-gray-600'
                            }`} />
                            <p className={`text-sm font-medium ${
                              formData.businessType === type.value ? 'text-white' : 'text-gray-700'
                            }`}>
                              {type.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        ח.פ / ע.מ
                      </label>
                      <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                        placeholder="514234567"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        אתר אינטרנט
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                        placeholder="www.example.com"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <User className="w-4 h-4 text-indigo-600" />
                        שם מלא *
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        onBlur={() => handleFieldTouch('contactName')}
                        className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                          errors.contactName && touchedFields.has('contactName')
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                        }`}
                        placeholder="ישראל ישראלי"
                      />
                      {errors.contactName && touchedFields.has('contactName') && (
                        <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.contactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        תפקיד
                      </label>
                      <input
                        type="text"
                        name="contactTitle"
                        value={formData.contactTitle}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                        placeholder="מנכ״ל / סמנכ״ל מכירות"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      כתובת אימייל
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleFieldTouch('email')}
                      className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                        errors.email && touchedFields.has('email')
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                      }`}
                      placeholder="israel@company.com"
                      dir="ltr"
                    />
                    {errors.email && touchedFields.has('email') && (
                      <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Phone className="w-4 h-4 text-indigo-600" />
                        טלפון משרד
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={() => handleFieldTouch('phone')}
                        className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                          errors.phone && touchedFields.has('phone')
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                        }`}
                        placeholder="03-1234567"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        טלפון נייד
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                        placeholder="050-1234567"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      כתובת
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="md:col-span-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                        placeholder="רחוב ומספר"
                      />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                        placeholder="עיר"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      סטטוס לקוח
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {statusOptions.map((status) => {
                        const Icon = status.icon;
                        return (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => setFormData({...formData, status: status.value})}
                            className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                              formData.status === status.value
                                ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                            }`}
                          >
                            <div className={`w-8 h-8 ${status.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{status.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Star className="w-4 h-4 text-indigo-600" />
                      דירוג לקוח
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({...formData, rating: star})}
                          className="transition-all duration-300 transform hover:scale-110"
                        >
                          <Star 
                            className={`w-10 h-10 ${
                              formData.rating >= star 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        תנאי תשלום
                      </label>
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
                      >
                        <option value="0">מזומן</option>
                        <option value="30">שוטף + 30</option>
                        <option value="45">שוטף + 45</option>
                        <option value="60">שוטף + 60</option>
                        <option value="90">שוטף + 90</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        מסגרת אשראי
                      </label>
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                        placeholder="50,000 ₪"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      הערות
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300 resize-none"
                      placeholder="הערות נוספות על הלקוח..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-8 border-t border-gray-100">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md transform hover:scale-105'
                }`}
              >
                הקודם
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`transition-all duration-300 ${
                      currentStep === dot
                        ? 'w-8 h-2 bg-indigo-600 rounded-full'
                        : 'w-2 h-2 bg-gray-300 rounded-full'
                    }`}
                  />
                ))}
              </div>

              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  הבא
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  סיים והוסף
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
