import { BlockchainTransactionInterface } from '../interfaces/blockchain-transaction.interface';
import { BlockchainTransactionOutMsgInterface } from '../interfaces/blockchain-transaction-out-msg.interface';

export type InnerMessagesListType = BlockchainTransactionInterface<BlockchainTransactionOutMsgInterface>[];
