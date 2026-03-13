import {UPIParsedData} from '../utils/upiParser';

export type RootStackParamList = {
  Payment:
    | {
        scannedData?: UPIParsedData;
      }
    | undefined;
  Scanner: undefined;
  Dashboard: undefined;
  History: undefined;
};
