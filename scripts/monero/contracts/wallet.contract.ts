import { WalletContractStateInitType } from '../../../blockchain/types/wallet-contract-state-init.type';
import { BaseContract } from '../../../blockchain/contracts/base-contract';
import { StateInitType } from '../../../blockchain/types/state-init.type';
import { ContractInnMessageMethodsType } from '../../../blockchain/types/contract-inn-message-methods.type';
import { TransactionStatus } from '../../../blockchain/types/transaction-status.enum';
import { WalletOutPayloadInterface } from '../../../blockchain/interfaces/wallet-out-payload.interface';
import { ContractOutMessageMethodsType } from '../../../blockchain/types/contract-out-message-methods.type';
import { messageCommission } from '../../../blockchain/constants/message-commission';

export class WalletContract extends BaseContract<WalletContractStateInitType> {
    constructor(stateInit: StateInitType<WalletContractStateInitType>) {
        super(stateInit);
    }

    innMsg = (data: unknown, methods: ContractOutMessageMethodsType) => {
        return TransactionStatus.SUCCESS;
    };

    public outMsg = (payload: WalletOutPayloadInterface, methods: ContractOutMessageMethodsType) => {
        const { sendInnMsg, acceptMessage } = methods;

        if (this.storage.password !== payload.password) return TransactionStatus.FAILED;
        if (this.balance < payload.amount + messageCommission) return TransactionStatus.FAILED;
        acceptMessage();

        return sendInnMsg({
            address: payload.to,
            amount: payload.amount,
            bounce: false,
            body: payload.body,
        });
    };
}
