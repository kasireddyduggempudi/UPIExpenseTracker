export interface UPIParsedData {
  upiId: string;
  name?: string;
  amount?: number;
}

const toNumber = (value?: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const parseUpiQrData = (rawValue: string): UPIParsedData | null => {
  if (!rawValue || !rawValue.toLowerCase().startsWith('upi://pay')) {
    return null;
  }

  try {
    const url = new URL(rawValue);
    const upiId = url.searchParams.get('pa')?.trim();

    if (!upiId) {
      return null;
    }

    const name = url.searchParams.get('pn')?.trim() || undefined;
    const amount = toNumber(url.searchParams.get('am'));

    return {
      upiId,
      name,
      amount,
    };
  } catch {
    return null;
  }
};
