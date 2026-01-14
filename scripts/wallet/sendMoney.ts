import { NetworkProvider } from '@ton/blueprint';
import { TonClient } from '@ton/ton';
import { Address, beginCell } from '@ton/core';
import { contractCustomAddress, WalletContract } from '../../wrappers/Wallet';
import { mnemonicToPrivateKey, sign } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const words = ['1', '2', '3'];
    const { secretKey } = await mnemonicToPrivateKey(words);

    const wallet = provider.open(new WalletContract(contractCustomAddress));
    const seqno = await wallet.getSeqno();
    const valid_until = Math.floor(Date.now() / 1000) + 60;
    const address = Address.parse('kQD9g_Wo1mw4np5h0POYXNxqAVGNACj29cJNTTvJguJQYSYk');
    const amount = 10000000n; // 0.01 TON

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: '6242c232523a7d109f8828e77dcc4b1a69154eccad82040a01336c2a3007e692',
    });

    const walletContract = provider.open(WalletContract.createFromAddress(contractCustomAddress));

    const payload = beginCell()
        .storeUint(seqno, 32)
        .storeUint(valid_until, 32)
        .storeAddress(address)
        .storeCoins(amount)
        .endCell();

    const signature = sign(payload.hash(), secretKey);

    const msg = beginCell()
        .storeBuffer(signature)
        .storeUint(seqno, 32)
        .storeUint(valid_until, 32)
        .storeAddress(address)
        .storeCoins(amount)
        .endCell();

    await client.sendExternalMessage(walletContract, msg);
}
