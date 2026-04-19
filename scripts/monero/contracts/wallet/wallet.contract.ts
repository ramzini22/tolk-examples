import { WalletContractStateInitType } from './types/wallet-contract-state-init.type';
import { BaseContract } from '../../../../blockchain/contracts/base-contract';
import { TransactionStatus } from '../../../../blockchain/types/transaction-status.enum';
import { WalletOutPayloadInterface } from './types/wallet-out-payload.interface';
import { ContractOutMessageMethodsType } from '../../../../blockchain/types/contract-out-message-methods.type';
import { messageCommission } from '../../../../blockchain/constants/message-commission';
import { BlockchainInnMsgInterface } from '../../../../blockchain/interfaces/blockchain-inn-msg.interface';
import { ContractInnMessageMethodsType } from '../../../../blockchain/types/contract-inn-message-methods.type';

export class WalletContract extends BaseContract<WalletContractStateInitType> {
    public innMsg = (data: BlockchainInnMsgInterface, methods: ContractInnMessageMethodsType) => {
        return TransactionStatus.SUCCESS;
    };

    public outMsg = (payload: WalletOutPayloadInterface, methods: ContractOutMessageMethodsType) => {
        const { sendInnMsg, acceptMessage } = methods;

        if (!payload.to || !payload.amount) return TransactionStatus.FAILED;
        if (this.storage.password !== payload.password) return TransactionStatus.FAILED;
        if (this.balance < payload.amount + messageCommission) return TransactionStatus.FAILED;
        acceptMessage();

        return sendInnMsg({
            address: payload.to,
            amount: payload.amount,
            bounce: payload.bounce ?? false,
            stateInit: payload.stateInit,
            body: payload.body,
        });
    };
}
