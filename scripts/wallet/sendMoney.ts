import { NetworkProvider } from '@ton/blueprint';
import { TonClient } from '@ton/ton';
import { Address, beginCell } from '@ton/core';
import { contractCustomAddress, WalletContract } from '../../wrappers/wallet/Wallet';
import { mnemonicToPrivateKey, sign } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const words = ['1', '2', '3'];
    const { secretKey } = await mnemonicToPrivateKey(words);
    const wallet_id = Number(process.env.WALLET_ID ?? 0);

    const wallet = provider.open(new WalletContract(contractCustomAddress, wallet_id));
    const seqno = await wallet.getSeqno();
    const valid_until = Math.floor(Date.now() / 1000) + 60;
    const address = Address.parse('kQD9g_Wo1mw4np5h0POYXNxqAVGNACj29cJNTTvJguJQYSYk');
    const amount = 10000000n; // 0.01 TON

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: '6242c232523a7d109f8828e77dcc4b1a69154eccad82040a01336c2a3007e692',
    });

    const body = beginCell().storeUint(0x3a752f01, 32).storeAddress(address).storeCoins(amount).endCell();
    const payload = beginCell()
        .storeUint(wallet_id, 32)
        .storeUint(seqno, 32)
        .storeUint(valid_until, 32)
        .storeRef(body)
        .endCell();

    const signature = sign(payload.hash(), secretKey);
    const msg = beginCell().storeBuffer(signature).storeSlice(payload.beginParse()).endCell();

    await client.sendExternalMessage(wallet, msg);
}
