import { StateInitType } from '../types/state-init.type';

export interface SendMoneyType {
    address: string;
    stateInit?: StateInitType;
    body?: object;
}
