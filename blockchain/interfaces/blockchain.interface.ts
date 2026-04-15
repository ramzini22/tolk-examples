import { BlockchainTransactionInterface } from './blockchain-transaction.interface';
import { ContractInterface } from './contract.interface';
import { BlockchainOutMsgInterface } from './blockchain-out-msg.interface';
import { TransactionStatus } from '../types/transaction-status.enum';
import { InnerMessagesListType } from '../types/inner-messages-list.type';
import { BaseContract } from '../contracts/base-contract';

export interface BlockchainInterface {
    transactions: BlockchainTransactionInterface[];
    contracts: Map<string, ContractInterface>;
    innerMessagesList: InnerMessagesListType;

    sendOutMsg: (payload: BlockchainOutMsgInterface) => TransactionStatus;
    setContract: (contract: BaseContract) => void;
    updateStorage: () => void;
    loadFromStorage: () => void;
}
