import { TransactionStatus } from '../types/transaction-status.enum';
import { BlockchainTransactionInMsgEnum } from '../types/blockchain-transaction-in-msg.enum';
import { StateInitType } from '../types/state-init.type';

export interface BlockchainTransactionOutMsgInterface {
    type: BlockchainTransactionInMsgEnum.INTERNAL;
    address: string;
    status: TransactionStatus;
    bounce: boolean;
    bounced: boolean;
    amount: number;
    stateInit?: StateInitType;
    body?: unknown;
}
