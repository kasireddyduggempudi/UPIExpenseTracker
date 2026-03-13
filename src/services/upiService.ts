import RNUpiPayment from 'react-native-upi-payment';

interface UpiCallbackPayload {
  Status?: string;
  status?: string;
  txnId?: string;
  txnRef?: string;
  [key: string]: unknown;
}

export interface UpiPaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SUBMITTED' | 'UNKNOWN';
  txnId?: string;
  rawResponse: UpiCallbackPayload;
}

const generateTransactionRef = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  return `UPIET-${timestamp}-${randomPart}`;
};

const normalizeStatus = (status?: string): UpiPaymentResult['status'] => {
  if (!status) {
    return 'UNKNOWN';
  }

  const value = status.trim().toUpperCase();

  if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED'].includes(value)) {
    return 'SUCCESS';
  }

  if (['SUBMITTED', 'INITIATED', 'PROCESSING'].includes(value)) {
    return 'SUBMITTED';
  }

  if (['PENDING', 'INCOMPLETE'].includes(value)) {
    return 'PENDING';
  }

  if (['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED'].includes(value)) {
    return 'FAILED';
  }

  return value.includes('SUCCESS') ? 'SUCCESS' : 'UNKNOWN';
};

const mapResult = (payload: UpiCallbackPayload): UpiPaymentResult => ({
  status: normalizeStatus(payload.Status ?? payload.status),
  txnId:
    (payload.txnId as string | undefined) ??
    (payload.txnRef as string | undefined),
  rawResponse: payload,
});

export const startUpiPayment = (
  upiId: string,
  amount: number,
): Promise<UpiPaymentResult> => {
  return new Promise(resolve => {
    RNUpiPayment.initializePayment(
      {
        vpa: upiId,
        payeeName: 'UPI Expense Tracker',
        amount: amount.toFixed(2),
        transactionRef: generateTransactionRef(),
        transactionNote: 'UPI Expense Tracker Payment',
      },
      (successData: UpiCallbackPayload) => {
        resolve(mapResult(successData));
      },
      (failureData: UpiCallbackPayload) => {
        resolve(mapResult(failureData));
      },
    );
  });
};
