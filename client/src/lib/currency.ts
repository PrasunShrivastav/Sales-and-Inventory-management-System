import { useEffect, useState } from "react";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

// Create a custom event type for currency changes
export type CurrencyChangeEvent = CustomEvent<{ currency: string }>;

// Create a custom event name constant
export const CURRENCY_CHANGE_EVENT = "currencyChange";

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    const savedCurrency = localStorage.getItem("currency");
    return currencies.find((c) => c.code === savedCurrency) || currencies[0];
  });

  useEffect(() => {
    const handleCurrencyChange = (event: CurrencyChangeEvent) => {
      const newCurrency = currencies.find(
        (c) => c.code === event.detail.currency
      );
      if (newCurrency) {
        setCurrency(newCurrency);
      }
    };

    window.addEventListener(
      CURRENCY_CHANGE_EVENT,
      handleCurrencyChange as EventListener
    );
    return () => {
      window.removeEventListener(
        CURRENCY_CHANGE_EVENT,
        handleCurrencyChange as EventListener
      );
    };
  }, []);

  return currency;
}

export function formatCurrency(
  amount: number,
  currency: Currency = currencies[0]
): string {
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export function updateCurrency(newCurrencyCode: string) {
  localStorage.setItem("currency", newCurrencyCode);

  const event = new CustomEvent(CURRENCY_CHANGE_EVENT, {
    detail: { currency: newCurrencyCode },
  });
  window.dispatchEvent(event);
}
