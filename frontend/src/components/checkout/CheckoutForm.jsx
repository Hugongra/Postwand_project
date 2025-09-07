import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  AddressElement,
  useCheckout,

} from '@stripe/react-stripe-js';

const validateEmail = async (email, checkout) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";

  return { isValid, message: !isValid ? updateResult.error.message : null };
}

const EmailInput = ({ email, setEmail, error, setError }) => {
  const checkout = useCheckout();

  const handleBlur = async () => {
    if (!email) {
      return;
    }

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
    }
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <>
      <label className="block mb-2 text-sm font-medium">
        Email
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="you@example.com"
          className="bg-white w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 "
        />
      </label>
      {error && <div id="email-errors" className="mt-1 text-sm text-red-600">{error}</div>}
    </>
  );
};

// Updated Price Tier Selector component
const PriceTierSelector = ({ tiers, selectedTier, onSelectTier }) => {
  if (!tiers || tiers.length <= 1) return null;
  
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-medium">
        Select Plan
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            onClick={() => onSelectTier(tier)}
            className={`p-4 border rounded-md cursor-pointer ${
              selectedTier && selectedTier.id === tier.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold capitalize">{tier.name || tier.tier || 'Plan'}</div>
            <div className="text-lg font-bold mt-1">
              {(tier.unit_amount / 100).toFixed(2)} {tier.currency || 'USD'}
            </div>
            {tier.description && (
              <div className="text-sm text-gray-500 mt-2">{tier.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Updated CheckoutSummary component
const CheckoutSummary = ({ 
  companyName = "Your Company", 
  productName = "Premium Subscription", 
  basePrice = 20.00,
  taxRate = 21,
  taxAmount,
  taxLabel = "Tax",
  currency = "US$",
  billingInterval = "month",
  backUrl = "/",
  selectedTier = null,
  country = null
}) => {
  // Convert to numbers to ensure proper calculation
  const basePriceNum = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
  
  // Use provided taxAmount or calculate it
  const calculatedTaxAmount = taxAmount !== undefined ? 
    (typeof taxAmount === 'string' ? parseFloat(taxAmount) : taxAmount) : 
    ((basePriceNum * taxRate) / 100);
    
  const total = (basePriceNum + calculatedTaxAmount).toFixed(2);
  
  // Localize billing interval display based on language (default to English)
  const intervalDisplay = billingInterval === 'year' 
    ? (country === 'ES' ? 'año' : 'year')
    : (country === 'ES' ? 'mes' : 'month');
  
  // Format tax label based on country
  const formattedTaxLabel = country === 'ES' ? 'IVA' : taxLabel;
  
  // Format tier name if available
  const tierName = selectedTier?.name || selectedTier?.tier || '';
  const displayProductName = tierName ? `${productName} (${tierName})` : productName;
  
  return (
    <div className="w-3/4 px-16 py-10 mr-12">
      <a href={backUrl} className="flex items-center mb-8 text-gray-700 hover:text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">{companyName}</span>
      </a>
      
      <div className="mb-10">
        <p className="text-gray-600 mb-2">
          {country === 'ES' ? 'Suscribirse a' : 'Subscribe to'} {displayProductName}
        </p>
        <div className="flex items-baseline">
          <h1 className="text-3xl font-bold">{total} {currency}</h1>
          <span className="ml-2 text-gray-500">
            {country === 'ES' ? 'por' : 'per'} {intervalDisplay}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between py-2">
          <p>{displayProductName}</p>
          <p>{basePriceNum.toFixed(2)} {currency}</p>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {country === 'ES' 
            ? `facturación ${billingInterval === 'year' ? 'anual' : 'mensual'}`
            : `${billingInterval}ly billing`}
        </p>
        
        <div className="flex justify-between py-2 border-t border-gray-200">
          <p>Subtotal</p>
          <p>{basePriceNum.toFixed(2)} {currency}</p>
        </div>
        
        <div className="flex justify-between py-2">
          <div className="flex items-center">
            <p>{formattedTaxLabel} ({taxRate}%)</p>
            <span className="ml-1 text-gray-500 cursor-help">ⓘ</span>
          </div>
          <p>{calculatedTaxAmount.toFixed(2)} {currency}</p>
        </div>
        
        <div className="flex justify-between py-2 font-semibold border-t border-gray-200">
          <p>{country === 'ES' ? 'Total a pagar hoy' : 'Total to pay today'}</p>
          <p>{total} {currency}</p>
        </div>
      </div>
    </div>
  );
};

const CheckoutForm = () => {
  const checkout = useCheckout();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [productDetails, setProductDetails] = useState({
    productName: "Premium Subscription",
    basePrice: 20.00,
    taxAmount: 4.20,
    taxRate: 21,
    currencySymbol: "US$",
    interval: "month",
    country: null,
    availableTiers: [],
    selectedTier: null,
    companyName: "Your Company"
  });
  
  // Function to update the selected tier
  const handleSelectTier = async (tier) => {
    try {
      // Here you would update the Stripe checkout with the new price
      // This might involve calling a function like checkout.updatePrice(tier.id)
      console.log("Updating to tier:", tier);
      
      // Update local state
      setProductDetails(prev => ({
        ...prev,
        basePrice: tier.unit_amount / 100,
        selectedTier: tier
      }));
      
      // In a real implementation, you'd need to call the Stripe API
      // to update the checkout session with the new price
      // For example: await checkout.update({ priceId: tier.id });
    } catch (error) {
      console.error("Error updating price tier:", error);
      setMessage("Failed to update subscription tier. Please try again.");
    }
  };
  
  // Fetch and process checkout data when component mounts
  useEffect(() => {
    if (checkout) {
      try {
        console.log("Checkout object:", checkout); // For debugging
        
        // Extract product name from lineItems
        const productName = checkout?.lineItems?.[0]?.description || 
                           checkout?.lineItems?.[0]?.name || 
                           "Premium Subscription";
        
        // Handle customer location/country - not directly available in this object
        const country = null;
        
        // Extract available price tiers - not available in this object structure
        let availableTiers = [];
        
        // Determine currently selected tier and price
        let selectedTier = null;
        
        // Get base price from lineItems
        let basePrice = 20.00; // Default fallback
        if (checkout?.lineItems?.[0]?.subtotal?.minorUnitsAmount !== undefined) {
          basePrice = checkout.lineItems[0].subtotal.minorUnitsAmount / checkout.minorUnitsAmountDivisor;
          console.log("Found subtotal:", checkout.lineItems[0].subtotal.minorUnitsAmount, 
                     "divisor:", checkout.minorUnitsAmountDivisor,
                     "converted to:", basePrice);
        }
        
        // Handle currency
        const currencyCode = checkout?.currency || 'usd';
        
        const currencySymbol = currencyCode === 'eur' ? '€' : 
                              currencyCode === 'gbp' ? '£' : 'US$';
        
        // Handle tax - try to get dynamic tax rate from Stripe
        let taxRate = 21; // Default fallback
        let taxAmount = 0;
        
        // Try to get tax information from checkout session
        if (checkout?.taxAmounts && checkout.taxAmounts.length > 0) {
          // Sum up all tax amounts
          taxAmount = checkout.taxAmounts.reduce((sum, tax) => {
            return sum + (tax.minorUnitsAmount || 0);
          }, 0) / checkout.minorUnitsAmountDivisor;
          
          console.log("Found tax amount:", taxAmount);
        } else if (checkout?.total?.tax?.minorUnitsAmount !== undefined) {
          taxAmount = checkout.total.tax.minorUnitsAmount / checkout.minorUnitsAmountDivisor;
          console.log("Found tax amount from total:", taxAmount);
        } else {
          // Recalculate based on the determined tax rate
          taxAmount = basePrice * (taxRate / 100);
        }
        
        // Get billing interval from recurring information
        const interval = checkout?.recurring?.interval || 'month';
        
        // Get customer email if available
        if (checkout?.email) {
          setEmail(checkout.email);
        }
        
        // Get business name if available
        const companyName = checkout?.businessName || "Your Company";
        
        setProductDetails({
          productName,
          basePrice,
          taxAmount,
          taxRate,
          currencySymbol,
          interval,
          country,
          availableTiers,
          selectedTier,
          companyName
        });
        
        console.log("Product details set:", {
          productName,
          basePrice,
          taxAmount,
          taxRate,
          currencySymbol,
          interval,
          country,
          availableTiersCount: availableTiers.length,
          selectedTier,
          companyName
        });
      } catch (error) {
        console.error("Error processing checkout data:", error);
        // Keep default values if there's an error
      }
    }
  }, [checkout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await checkout.confirm();

    // This will only happen if there's an immediate error
    if (error) {
      setMessage(error.message);
      setIsLoading(false);
    }
    // Otherwise user is redirected to return_url
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Column - Summary */}
      <div className="flex-1 flex items-start justify-end bg-white">

        <CheckoutSummary 
          companyName={productDetails.companyName}
          productName={productDetails.productName}
          basePrice={productDetails.basePrice}
          taxRate={productDetails.taxRate}
          taxAmount={productDetails.taxAmount}
          currency={productDetails.currencySymbol}
          billingInterval={productDetails.interval}
          selectedTier={productDetails.selectedTier}
          country={productDetails.country}
        />
      </div>
      
      {/* Right Column - Payment Form */}
      <div className="flex-1 flex items-start bg-white py-10 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
        <div className="w-3/4 px-16 ml-12">
          <h2 className="text-lg font-semibold mb-4">
            {productDetails.country === 'ES' ? 'Información de contacto' : 'Contact Information'}
          </h2>
          
          <form id="payment-form" onSubmit={handleSubmit}>
            {/* Render price tier selector if multiple tiers are available */}
            {productDetails.availableTiers && productDetails.availableTiers.length > 1 && (
              <PriceTierSelector
                tiers={productDetails.availableTiers}
                selectedTier={productDetails.selectedTier}
                onSelectTier={handleSelectTier}
              />
            )}
            
            <div className="mb-4">
              <EmailInput
                email={email}
                setEmail={setEmail}
                error={emailError}
                setError={setEmailError}
              />
            </div>
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                {productDetails.country === 'ES' ? 'Método de pago' : 'Payment Method'}
              </h2>
              <div className="mb-4">
               
                <PaymentElement id="payment-element" />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {productDetails.country === 'ES' ? 'Dirección de facturación' : 'Billing Address'}
              </h2>
              <AddressElement 
                options={{
                  mode: 'billing'
                }}
              />
            </div>

            <button 
              disabled={isLoading} 
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                productDetails.country === 'ES' ? "Pagar y suscribirse" : "Pay and Subscribe"
              )}
            </button>
            
            {message && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;