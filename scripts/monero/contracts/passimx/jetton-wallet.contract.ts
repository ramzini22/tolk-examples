import { BaseContract } from '../../../../blockchain/contracts/base-contract';
import { JettonWalletStorageType } from './types/jetton-wallet-storage.type';
import { BlockchainInnMsgInterface } from '../../../../blockchain/interfaces/blockchain-inn-msg.interface';
import { JettonWalletInnMsgPayloadType } from './types/jetton-wallet-inn-msg-payload.type';
import { TransactionStatus } from '../../../../blockchain/types/transaction-status.enum';
import { ContractInnMessageMethodsType } from '../../../../blockchain/types/contract-inn-message-methods.type';
import { messageCommission } from '../../../../blockchain/constants/message-commission';
import { BlockchainUtils } from '../../../../blockchain/utils/blockchain.utils';

export class JettonWalletContract extends BaseContract<JettonWalletStorageType> {
    public innMsg = (
        data: BlockchainInnMsgInterface<JettonWalletInnMsgPayloadType>,
        methods: ContractInnMessageMethodsType,
    ) => {
        const { address, body, stateInit } = data;
        const { sendInnMsg } = methods;
        if (!body) return TransactionStatus.FAILED;

        const { method, amount, to } = body;
        if (!amount || !to || !amount) return TransactionStatus.FAILED;

        if (method === 'send') {
            if (amount > this.storage.jettonBalance) return TransactionStatus.FAILED;

            const jettonWalletStateInit = {
                code: this.code,
                data: {
                    jettonBalance: 0,
                    minterAddress: this.storage.minterAddress,
                    ownerAddress: to,
                },
            };

            const jettonWalletAddress = BlockchainUtils.getAddress(jettonWalletStateInit);

            if (address !== this.storage.ownerAddress) return TransactionStatus.FAILED;

            sendInnMsg({
                address: jettonWalletAddress,
                bounce: true,
                stateInit,
                body: {
                    method: 'transport',
                    from: address,
                    amount: body.amount,
                    to: to,
                },
                amount: messageCommission,
            });
            this.storage.jettonBalance -= amount;
        }

        if (method === 'transport') {
            if (address !== this.storage.minterAddress) {
                const senderJettonAddress = BlockchainUtils.getAddress({
                    code: this.code,
                    data: {
                        jettonBalance: 0,
                        minterAddress: this.storage.minterAddress,
                        ownerAddress: body.from,
                    },
                });

                if (senderJettonAddress !== address) return TransactionStatus.FAILED;
            }

            this.storage.jettonBalance += amount;
        }
    };
}
