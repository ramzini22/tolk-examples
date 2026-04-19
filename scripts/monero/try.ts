import { WalletContract } from './contracts/wallet/wallet.contract';
import { BlockchainUtils } from '../../blockchain/utils/blockchain.utils';
import { blockchain } from '../../blockchain/blockchain';
import { JettonMinterContract } from './contracts/passimx/jetton-minter.contract';
import { JettonWalletContract } from './contracts/passimx/jetton-wallet.contract';
import { StateInitType } from '../../blockchain/types/state-init.type';
import { MinterStorageType } from './contracts/passimx/types/minter-storage.type';
import { messageCommission } from '../../blockchain/constants/message-commission';
import { JettonWalletStorageType } from './contracts/passimx/types/jetton-wallet-storage.type';
import { storageCommission } from '../../blockchain/constants/storage-commission';

export async function run(provider: unknown) {
    await blockchain.loadFromStorage();

    const user1Password = 'user1Password';
    const user2Password = 'user2Password';

    const wallet1StateInit = { code: WalletContract.toString(), data: { password: user1Password } };
    const wallet2StateInit = { code: WalletContract.toString(), data: { password: user2Password } };
    const minterStateInit: StateInitType<MinterStorageType> = {
        code: JettonMinterContract.toString(),
        data: { jettonContractCode: JettonWalletContract.toString(), content: {}, totalSupply: 0 },
    };

    const address1 = BlockchainUtils.getAddress(wallet1StateInit);
    const address2 = BlockchainUtils.getAddress(wallet2StateInit);
    const minterAddress = BlockchainUtils.getAddress(minterStateInit);

    const jettonWallet1StateInit: StateInitType<JettonWalletStorageType> = {
        code: JettonWalletContract.toString(),
        data: { jettonBalance: 0, minterAddress, ownerAddress: address1 },
    };
    const jettonWallet2StateInit: StateInitType<JettonWalletStorageType> = {
        code: JettonWalletContract.toString(),
        data: { jettonBalance: 0, minterAddress, ownerAddress: address2 },
    };

    const jettonWallet1Address = BlockchainUtils.getAddress(jettonWallet1StateInit);
    const jettonWallet2Address = BlockchainUtils.getAddress(jettonWallet2StateInit);

    BlockchainUtils.createUninitializedContract(address1, 10000);
    BlockchainUtils.createUninitializedContract(address2, 10000);
    BlockchainUtils.createUninitializedContract(minterAddress, storageCommission);

    BlockchainUtils.sendMoney({
        address: address1,
        stateInit: wallet1StateInit,
        body: { to: minterAddress, password: user1Password, amount: 200, stateInit: minterStateInit },
    });

    BlockchainUtils.sendMoney({
        address: address2,
        stateInit: wallet2StateInit,
        body: { to: minterAddress, password: user2Password, amount: 200, stateInit: minterStateInit },
    });
    await new Promise((r) => setTimeout(r, 1000));

    BlockchainUtils.sendMoney({
        address: address1,
        body: {
            to: jettonWallet1Address,
            password: user1Password,
            amount: messageCommission + messageCommission + messageCommission,
            body: {
                method: 'send',
                amount: 5,
                to: address2,
            },
        },
    });
    BlockchainUtils.sendMoney({
        address: address1,
        body: {
            to: jettonWallet1Address,
            password: user1Password,
            amount: messageCommission + messageCommission + messageCommission,
            body: {
                method: 'send',
                amount: 5,
                to: address2,
            },
        },
    });
    BlockchainUtils.sendMoney({
        address: address1,
        body: {
            to: jettonWallet1Address,
            password: user1Password,
            amount: messageCommission + messageCommission + messageCommission,
            body: {
                method: 'send',
                amount: 5,
                to: address2,
            },
        },
    });

    // await new Promise((r) => setTimeout(r, 1000));
    // let allContractsBalance = 0;
    // let allTransactionsBalance = 0;
    // Array.from(blockchain.contracts.values()).forEach((c) => (allContractsBalance += c.balance));
    // blockchain.transactions.forEach((transaction) => (allTransactionsBalance += transaction.totalFees));
    //
    // console.log([allContractsBalance + allTransactionsBalance, allContractsBalance, allTransactionsBalance]);
    await new Promise(() => {});
}
