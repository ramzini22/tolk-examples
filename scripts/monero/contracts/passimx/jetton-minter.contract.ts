import { BaseContract } from '../../../../blockchain/contracts/base-contract';
import { BlockchainInnMsgInterface } from '../../../../blockchain/interfaces/blockchain-inn-msg.interface';
import { TransactionStatus } from '../../../../blockchain/types/transaction-status.enum';
import { MinterStorageType } from './types/minter-storage.type';
import { MinterInnMsgPayloadType } from './types/minter-inn-msg-payload.type';
import { BlockchainUtils } from '../../../../blockchain/utils/blockchain.utils';
import { StateInitType } from '../../../../blockchain/types/state-init.type';
import { JettonWalletStorageType } from './types/jetton-wallet-storage.type';
import { storageCommission } from '../../../../blockchain/constants/storage-commission';
import { messageCommission } from '../../../../blockchain/constants/message-commission';
import { ContractInnMessageMethodsType } from '../../../../blockchain/types/contract-inn-message-methods.type';

export class JettonMinterContract extends BaseContract<MinterStorageType> {
    public innMsg = (
        data: BlockchainInnMsgInterface<MinterInnMsgPayloadType>,
        methods: ContractInnMessageMethodsType,
    ) => {
        const { sendInnMsg } = methods;

        const jettonContractAmount = data.amount - storageCommission - messageCommission * 4;
        const jettonContractStateInit: StateInitType<JettonWalletStorageType> = {
            code: this.storage.jettonContractCode,
            data: {
                jettonBalance: 0,
                minterAddress: this.address,
                ownerAddress: data.address,
            },
        };
        const jettonAddress = BlockchainUtils.getAddress(jettonContractStateInit);

        this.storage.totalSupply += jettonContractAmount;
        sendInnMsg({
            address: jettonAddress,
            amount: storageCommission + messageCommission * 2,
            bounce: false,
            stateInit: jettonContractStateInit,
            body: {
                method: 'transport',
                amount: jettonContractAmount,
                to: data.address,
            },
        });

        return TransactionStatus.SUCCESS;
    };
}
