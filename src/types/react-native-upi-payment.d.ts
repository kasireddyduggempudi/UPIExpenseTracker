declare module 'react-native-upi-payment' {
  interface UpiPaymentParams {
    vpa: string;
    payeeName: string;
    amount: string;
    transactionRef: string;
    transactionNote?: string;
  }

  type UpiPaymentCallback = (response: {[key: string]: unknown}) => void;

  interface UpiPaymentModule {
    initializePayment(
      params: UpiPaymentParams,
      onSuccess: UpiPaymentCallback,
      onFailure: UpiPaymentCallback,
    ): void;
  }

  const RNUpiPayment: UpiPaymentModule;
  export default RNUpiPayment;
}
