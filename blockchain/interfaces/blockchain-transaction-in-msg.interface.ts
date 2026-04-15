import { TransactionStatus } from '../types/transaction-status.enum';
import { StateInitType } from '../types/state-init.type';
import { BlockchainTransactionInMsgEnum } from '../types/blockchain-transaction-in-msg.enum';

export interface BlockchainTransactionInMsgInterface {
    type: BlockchainTransactionInMsgEnum.EXTERNAL;
    address: string;
    status: TransactionStatus;
    stateInit?: StateInitType;
    body?: unknown;
}
