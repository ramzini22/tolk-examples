import { StateInitType } from '../../../../../blockchain/types/state-init.type';

export type JettonWalletInnMsgPayloadType = JettonWalletInnMsgSendPayloadType | JettonWalletInnMsgTransportPayloadType;

type JettonWalletInnMsgSendPayloadType = {
    method: 'send';
    amount: number;
    to: string;
    stateInit?: StateInitType;
};

type JettonWalletInnMsgTransportPayloadType = {
    method: 'transport';
    amount: number;
    from: string;
    to: string;
};
