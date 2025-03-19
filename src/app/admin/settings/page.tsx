'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RestaurantSettings {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  business_hours: string | null;
  delivery_fee: number | null;
  minimum_order_amount: number | null;
  tax_rate: number | null;
  accept_credit_cards: boolean;
  accept_cash: boolean;
  offer_takeout: boolean;
  offer_delivery: boolean;
  delivery_radius_km: number | null;
  currency: string;
  instagram_handle: string | null;
  facebook_handle: string | null;
  twitter_handle: string | null;
  website_url: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'delivery' | 'appearance' | 'social'>('general');

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('restaurant_settings')
          .select('*')
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        
        if (data) {
          setSettings(data as RestaurantSettings);
        } else {
          // Create default settings if none exist
          const defaultSettings: Omit<RestaurantSettings, 'id'> = {
            name: 'My Restaurant',
            description: 'Delicious food delivered to your doorstep',
            logo_url: null,
            phone: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
            business_hours: '',
            delivery_fee: 5,
            minimum_order_amount: 15,
            tax_rate: 10,
            accept_credit_cards: true,
            accept_cash: true,
            offer_takeout: true,
            offer_delivery: true,
            delivery_radius_km: 10,
            currency: 'USD',
            instagram_handle: '',
            facebook_handle: '',
            twitter_handle: '',
            website_url: '',
          };
          
          const { data: newSettings, error: insertError } = await supabase
            .from('restaurant_settings')
            .insert(defaultSettings)
            .select()
            .single();
            
          if (insertError) throw insertError;
          
          setSettings(newSettings as RestaurantSettings);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, []);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!settings) return;
    
    let updatedValue: any = value;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      updatedValue = (e.target as HTMLInputElement).checked;
    }
    
    // Handle number inputs
    if (type === 'number') {
      updatedValue = value === '' ? null : parseFloat(value);
    }
    
    setSettings({
      ...settings,
      [name]: updatedValue
    });
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('restaurant_settings')
        .update(settings)
        .eq('id', settings.id);
        
      if (updateError) throw updateError;
      
      setSuccess('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
      </div>
    );
  }
  
  // If no settings exist, show error
  if (!settings) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Failed to load restaurant settings
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Restaurant Settings</h1>
        <p className="text-gray-600">Configure your restaurant details and preferences</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        {/* Settings Tabs */}
        <div className="flex border-b overflow-x-auto">
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === 'general' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General Information
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === 'payment' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            Payment Options
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === 'delivery' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('delivery')}
          >
            Delivery & Pickup
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === 'appearance' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === 'social' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('social')}
          >
            Social Media
          </button>
        </div>
        
        <div className="p-6">
          {/* General Information Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={settings.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={settings.phone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={settings.email || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="business_hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Hours
                </label>
                <input
                  type="text"
                  id="business_hours"
                  name="business_hours"
                  value={settings.business_hours || ''}
                  onChange={handleChange}
                  placeholder="e.g. Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={settings.address || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={settings.city || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={settings.state || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    value={settings.zip_code || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={settings.country || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Options Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    id="tax_rate"
                    name="tax_rate"
                    value={settings.tax_rate === null ? '' : settings.tax_rate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Methods
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="accept_credit_cards"
                        name="accept_credit_cards"
                        checked={settings.accept_credit_cards}
                        onChange={handleChange}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="accept_credit_cards" className="ml-2 text-sm text-gray-700">
                        Accept Credit Cards
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="accept_cash"
                        name="accept_cash"
                        checked={settings.accept_cash}
                        onChange={handleChange}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="accept_cash" className="ml-2 text-sm text-gray-700">
                        Accept Cash on Delivery
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Additional Payment Settings</h3>
                <p className="text-sm text-gray-600 mb-6">
                  To configure payment gateways like Stripe, PayPal, or other providers, contact your platform administrator to set up the necessary API keys and configurations.
                </p>
              </div>
            </div>
          )}
          
          {/* Delivery & Pickup Tab */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Options
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="offer_delivery"
                        name="offer_delivery"
                        checked={settings.offer_delivery}
                        onChange={handleChange}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="offer_delivery" className="ml-2 text-sm text-gray-700">
                        Offer Delivery
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="offer_takeout"
                        name="offer_takeout"
                        checked={settings.offer_takeout}
                        onChange={handleChange}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="offer_takeout" className="ml-2 text-sm text-gray-700">
                        Offer Takeout/Pickup
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="delivery_radius_km" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    id="delivery_radius_km"
                    name="delivery_radius_km"
                    value={settings.delivery_radius_km === null ? '' : settings.delivery_radius_km}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee ({settings.currency})
                  </label>
                  <input
                    type="number"
                    id="delivery_fee"
                    name="delivery_fee"
                    value={settings.delivery_fee === null ? '' : settings.delivery_fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="minimum_order_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    id="minimum_order_amount"
                    name="minimum_order_amount"
                    value={settings.minimum_order_amount === null ? '' : settings.minimum_order_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  id="logo_url"
                  name="logo_url"
                  value={settings.logo_url || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the direct URL to your logo image. For best results, use a square image (1:1 ratio).
                </p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Logo Preview</h3>
                <div className="h-32 w-32 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {settings.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt="Restaurant Logo" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center p-2">
                      No logo uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <div className="mt-1 flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      https://
                    </span>
                    <input
                      type="text"
                      id="website_url"
                      name="website_url"
                      value={(settings.website_url || '').replace(/^https?:\/\//, '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChange({
                          ...e,
                          target: {
                            ...e.target,
                            name: 'website_url',
                            value: value ? `https://${value}` : ''
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      placeholder="example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="instagram_handle" className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram Handle
                  </label>
                  <div className="mt-1 flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      id="instagram_handle"
                      name="instagram_handle"
                      value={settings.instagram_handle || ''}
                      onChange={handleChange}
                      placeholder="username"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="facebook_handle" className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook Page Name
                  </label>
                  <div className="mt-1 flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      facebook.com/
                    </span>
                    <input
                      type="text"
                      id="facebook_handle"
                      name="facebook_handle"
                      value={settings.facebook_handle || ''}
                      onChange={handleChange}
                      placeholder="pagename"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="twitter_handle" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter/X Handle
                  </label>
                  <div className="mt-1 flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      id="twitter_handle"
                      name="twitter_handle"
                      value={settings.twitter_handle || ''}
                      onChange={handleChange}
                      placeholder="username"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save Settings'}
        </button>
      </div>
    </div>
  );
} 