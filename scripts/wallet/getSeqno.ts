import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { contractCustomAddress, WalletContract } from '../../wrappers/Wallet';

export async function run(provider: NetworkProvider) {
    const wallet = provider.open(new WalletContract(contractCustomAddress));
    const seqno = await wallet.getSeqno();
    console.log('Seqno: ', seqno);
}
